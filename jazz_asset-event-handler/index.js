// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

"use strict";

const config = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const errorHandlerModule = require("./components/error-handler.js");
const request = require("request");
var errorHandler = errorHandlerModule(logger);
const rp = require('request-promise-native');
const _ = require("lodash");
const fcodes = require('./utils/failure-codes.js');
var failureCodes = fcodes();
var processedEvents = [];
var failedEvents = [];

var handler = (event, context, cb) => {
    var configData = config(context);
    var authToken;

    rp(getTokenRequest(configData))
        .then(result => {
            return getAuthResponse(result);
        })
        .then(authToken => {
            return processEvents(event, configData, authToken);
        })
        .then(result => {
            var records = getEventProcessStatus();
            logger.info("Successfully processed events. " + JSON.stringify(records));
            return cb(null, records);
        })
        .catch(err => {
            var records = getEventProcessStatus();
            logger.error("Error processing events. " + JSON.stringify(err));
            return cb(null, records);
        });

}

var getTokenRequest = function (configData) {
    return {
        uri: configData.BASE_API_URL + configData.TOKEN_URL,
        method: 'post',
        json: {
            "username": configData.SERVICE_USER,
            "password": configData.TOKEN_CREDS
        },
        rejectUnauthorized: false,
        transform: function (body, response, resolveWithFullResponse) {
            return response;
        }
    };
};

var getAuthResponse = function (result) {
    logger.info("result.statusCode" + result.statusCode)
    return new Promise((resolve, reject) => {
        if (result.statusCode === 200 && result.body && result.body.data) {
            return resolve(result.body.data.token);
        } else {
            logger.error("getAuthResponse failed");
            return reject(errorHandler.throwInternalServerError("Invalid token response from API"));
        }
    })
}

var processEvents = function (event, configData, authToken) {
    return new Promise((resolve, reject) => {
        var processEachEventPromises = [];
        for (var i = 0; i < event.Records.length; i++) {
            processEachEventPromises.push(processEachEvent(event.Records[i], configData, authToken));
        }
        Promise.all(processEachEventPromises)
            .then((result) => {
                return resolve(result);
            })
            .catch((error) => {
                logger.error("processEvents failed" + JSON.stringify(error));
                return reject(error);
            });
    });
}

var processEachEvent = function (record, configData, authToken) {
    return new Promise((resolve, reject) => {
        var sequenceNumber = record.kinesis.sequenceNumber;
        var encodedPayload = record.kinesis.data;
        var payload;
        return checkForInterestedEvents(encodedPayload, sequenceNumber, configData)
            .then(result => {
                payload = result.payload;
                if (result.interested_event) {
                    return processItem(payload, configData, authToken);
                } else {
                    return new Promise((resolve, reject) => {
                        resolve({ "message": "Not an interesting event" });
                    });
                }
            })
            .then(result => {
                handleProcessedEvents(sequenceNumber, payload);
                return resolve(result);
            })
            .catch(err => {
                logger.error("processEachEvent failed for " + JSON.stringify(record));
                handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
                return reject(err);
            });
    });
}

var checkForInterestedEvents = function (encodedPayload, sequenceNumber, config) {
    return new Promise((resolve, reject) => {
        var kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
        if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
            if (_.includes(config.EVENTS.EVENT_TYPE, kinesisPayload.Item.EVENT_TYPE.S) &&
                _.includes(config.EVENTS.EVENT_NAMES, kinesisPayload.Item.EVENT_NAME.S)) {
                logger.info("found " + kinesisPayload.Item.EVENT_TYPE.S + " event with sequence number: " + sequenceNumber);
                return resolve({
                    "interested_event": true,
                    "payload": kinesisPayload.Item
                });
            } else {
                logger.error("Not an interested event or event type");
                return resolve({
                    "interested_event": false,
                    "payload": kinesisPayload.Item
                });
            }
        }
    });
}

var processItem = function (eventPayload, configData, authToken) {
    return new Promise((resolve, reject) => {

        if (eventPayload.EVENT_NAME.S === configData.EVENTS.CREATE_ASSET) {
            checkIfAssetExists(eventPayload, configData, authToken)
                .then(record => {
                    logger.info("Asset already existing. Updating assets records");
                    processUpdateAsset(record, eventPayload, configData, authToken)
                        .then(result => { return resolve(result) })
                        .catch(err => {
                            logger.error("processCreateAsset Failed" + err);
                            return reject(err)
                        })
                })
                .catch(error => {
                    logger.info("Creating new asset records");
                    processCreateAsset(eventPayload, configData, authToken)
                        .then(result => { return resolve(result) })
                        .catch(err => {
                            logger.error("processCreateAsset Failed" + err);
                            return reject(err)
                        })
                })

        } else if (eventPayload.EVENT_NAME.S === configData.EVENTS.UPDATE_ASSET) {
            checkIfAssetExists(eventPayload, configData, authToken)
                .then(record => {
                    processUpdateAsset(record, eventPayload, configData, authToken)
                        .then(result => { return resolve(result) })
                        .catch(err => {
                            logger.error("processUpdateAsset Failed" + err);
                            return reject(err)
                        })
                })
                .catch(error => {
                    logger.error("No records found for updating. Asset needs to be created first");
                    return reject(error);
                })
        }
    });
}

var processCreateAsset = function (eventPayload, configData, authToken) {
    return new Promise((resolve, reject) => {
        var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
        logger.debug("svcContext: " + JSON.stringify(svcContext));

        var assetApiPayload = {
            "environment": svcContext.environment,
            "service": eventPayload.SERVICE_NAME.S,
            "created_by": svcContext.created_by,
            "provider": svcContext.provider,
            "provider_id": svcContext.provider_id,
            "tags": svcContext.tags,
            "domain": svcContext.domain,
            "type": svcContext.type
        };
        if (_.includes(Object.keys(configData.EVENTS.EVENT_STATUS), eventPayload.EVENT_STATUS.S)) {
            assetApiPayload["status"] = configData.EVENTS.EVENT_STATUS[eventPayload.EVENT_STATUS.S]
        } else {
            logger.error("Error in creating assets. Invalid status value in the payload");
            return reject({
                "error": "Error in creating assets. Invalid status value in the payload",
                "details": eventPayload.EVENT_STATUS.S
            });
        }
        logger.debug("assetApiPayload" + JSON.stringify(assetApiPayload));
        var svcPayload = {
            uri: configData.BASE_API_URL + configData.ASSETS_API_RESOURCE,
            method: "POST",
            headers: { Authorization: authToken },
            json: assetApiPayload,
            rejectUnauthorized: false
        };

        logger.debug("svcPayload" + JSON.stringify(svcPayload));
        request(svcPayload, function (error, response, body) {
            if (response.statusCode && response.statusCode === 200 && body && body.data) {
                logger.debug("Success: " + JSON.stringify(body));
                return resolve(body);
            } else {
                logger.error("Error in creating assets. " + JSON.stringify(response));
                return reject({
                    "error": "Error in creating assets. " + JSON.stringify(response),
                    "details": response.body.message
                });
            }
        });
    });
}

var processUpdateAsset = function (record, eventPayload, configData, authToken) {
    return new Promise((resolve, reject) => {
        var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
        logger.debug("svcContext: " + JSON.stringify(svcContext));
        var assetApiPayload = {
            "tags": svcContext.tags,
            "type": svcContext.type
        };
        if (_.includes(Object.keys(configData.EVENTS.EVENT_STATUS), eventPayload.EVENT_STATUS.S)) {
            assetApiPayload["status"] = configData.EVENTS.EVENT_STATUS[eventPayload.EVENT_STATUS.S]
        } else {
            logger.error("Error in creating assets. Invalid status value in the payload");
            return reject({
                "error": "Error in updating assets. Invalid status value in the payload",
                "details": eventPayload.EVENT_STATUS.S
            });
        }
        logger.debug("assetApiPayload" + JSON.stringify(assetApiPayload));
        var svcPayload = {
            uri: configData.BASE_API_URL + configData.ASSETS_API_RESOURCE + "/" + record.id,
            method: "PUT",
            headers: { Authorization: authToken },
            json: assetApiPayload,
            rejectUnauthorized: false
        };

        logger.debug("svcPayload" + JSON.stringify(svcPayload));
        request(svcPayload, function (error, response, body) {
            if (response.statusCode && response.statusCode === 200 && body && body.data) {
                logger.debug("Success: " + JSON.stringify(body));
                return resolve(body);
            } else {
                logger.error("Error in updating assets. " + JSON.stringify(response));
                return reject({
                    "error": "Error in updating assets. " + JSON.stringify(response),
                    "details": response.body.message
                });
            }
        });
    });
}

var checkIfAssetExists = function (eventPayload, configData, authToken) {
    return new Promise((resolve, reject) => {
        var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
        var searchAssetPayload = {
            "service": eventPayload.SERVICE_NAME.S,
            "provider_id": svcContext.provider_id,
            "type": svcContext.type,
            "domain": svcContext.domain
        };

        var svcPostSearchPayload = {
            uri: configData.BASE_API_URL + configData.ASSETS_API_SEARCH_RESOURCE,
            method: "POST",
            headers: { Authorization: authToken },
            json: searchAssetPayload,
            rejectUnauthorized: false
        };

        logger.debug("searchAssetPayload" + JSON.stringify(searchAssetPayload));
        request(svcPostSearchPayload, function (error, response, body) {
            if (response.statusCode && response.statusCode === 200 && body && body.data && body.data.length > 0) {
                logger.debug("Asset found: " + JSON.stringify(body));
                return resolve(body.data[0]);
            } else {
                logger.error("No assets found. " + JSON.stringify(response));
                return reject({
                    "error": "No assets found. " + JSON.stringify(response),
                    "details": response.body.message
                });
            }
        });
    });
}

var handleProcessedEvents = function (id, payload) {
    processedEvents.push({
        "sequence_id": id,
        "event": payload
    });
}

var handleFailedEvents = function (id, failure_message, payload, failure_code) {
    failedEvents.push({
        "sequence_id": id,
        "event": payload,
        "failure_code": failure_code,
        "failure_message": failure_message
    });
}

var getEventProcessStatus = function () {
    return {
        "processed_events": processedEvents.length,
        "failed_events": failedEvents.length
    };
}

var handleError = function (errorType, message) {
    var error = {};
    error.failure_code = errorType;
    error.failure_message = message;
    return error;
}

module.exports = {
    getTokenRequest: getTokenRequest,
    getAuthResponse: getAuthResponse,
    handleError: handleError,
    processEvents: processEvents,
    processEachEvent: processEachEvent,
    checkForInterestedEvents: checkForInterestedEvents,
    processItem: processItem,
    handleProcessedEvents: handleProcessedEvents,
    handleFailedEvents: handleFailedEvents,
    getEventProcessStatus: getEventProcessStatus,
    handler: handler,
    processCreateAsset: processCreateAsset,
    processUpdateAsset: processUpdateAsset,
    checkIfAssetExists: checkIfAssetExists
}