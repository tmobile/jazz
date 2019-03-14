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

const request = require("request");
const rp = require('request-promise-native');

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const errorHandlerModule = require("./components/error-handler.js");
const fcodes = require('./utils/failure-codes.js');

var processedEvents = [];
var failedEvents = [];
var errorHandler = errorHandlerModule(logger);

function handler(event, context, cb) {
  var config = configModule.getConfig(event, context);
  logger.info("event: " + JSON.stringify(event))

  rp(getTokenRequest(config))
    .then(result => {
      return getAuthResponse(result);
    })
    .then(authToken => {
      return processEvents(event, config, authToken);
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

function getTokenRequest(configData) {
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

function getAuthResponse(result) {
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

function processEvents(event, configData, authToken) {
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

function processEachEvent(record, configData, authToken) {
  return new Promise((resolve, reject) => {
    var sequenceNumber = record.kinesis.sequenceNumber;
    var encodedPayload = record.kinesis.data;
    var payload;
    return exportable.checkForInterestedEvents(encodedPayload, sequenceNumber, configData)
      .then(result => {
        payload = result.payload;
        if (result.interested_event) {
          return exportable.processItem(payload, configData, authToken);
        } else {
          return new Promise((resolve, reject) => {
            resolve({ "message": "Not an interesting event" });
          });
        }
      })
      .then(result => {
        exportable.handleProcessedEvents(sequenceNumber, payload);
        return resolve(result);
      })
      .catch(err => {
        logger.error("processEachEvent failed for " + JSON.stringify(record));
        exportable.handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
        return reject(err);
      });
  });
}

function checkForInterestedEvents(encodedPayload, sequenceNumber, config) {
  return new Promise((resolve, reject) => {
    var kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
    logger.info("event payload: " + JSON.stringify(kinesisPayload));
    if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
      if (config.EVENTS.EVENT_TYPE.indexOf(kinesisPayload.Item.EVENT_TYPE.S) > -1 &&
        config.EVENTS.EVENT_NAMES.indexOf(kinesisPayload.Item.EVENT_NAME.S) > -1) {
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

function processItem(eventPayload, configData, authToken) {
  return new Promise((resolve, reject) => {
    if (eventPayload.EVENT_NAME.S === configData.EVENTS.CREATE_ASSET) {
      exportable.checkIfAssetExists(eventPayload, configData, authToken)
        .then(record => {
          logger.info("Asset already existing. Updating assets records");
          exportable.processUpdateAsset(record, eventPayload, configData, authToken)
            .then(result => { return resolve(result) })
            .catch(err => {
              logger.error("processUpdateAsset Failed" + err);
              return reject(err)
            })
        })
        .catch(error => {
          logger.info("Creating new asset records");
          exportable.processCreateAsset(eventPayload, configData, authToken)
            .then(result => { return resolve(result) })
            .catch(err => {
              logger.error("processCreateAsset Failed" + err);
              return reject(err)
            })
        })

    } else if (eventPayload.EVENT_NAME.S === configData.EVENTS.UPDATE_ASSET) {
      exportable.checkIfAssetExists(eventPayload, configData, authToken)
        .then(record => {
          exportable.processUpdateAsset(record, eventPayload, configData, authToken)
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

function processCreateAsset(eventPayload, configData, authToken) {
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
      "asset_type": svcContext.type
    };
    if (configData.EVENTS.EVENT_STATUS.indexOf(eventPayload.EVENT_STATUS.S) > -1) {
      assetApiPayload["status"] = configData.EVENTS.CREATE_ASSET_COMPLETED
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
      headers: {
        "Authorization": authToken,
        "Jazz-Service-ID": eventPayload.SERVICE_ID.S
      },
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

function processUpdateAsset(record, eventPayload, configData, authToken) {
  return new Promise((resolve, reject) => {
    var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
    logger.debug("svcContext: " + JSON.stringify(svcContext));
    var assetApiPayload = {
      "tags": svcContext.tags,
      "asset_type": svcContext.type
    };
    if (configData.EVENTS.EVENT_STATUS.indexOf(eventPayload.EVENT_STATUS.S) > -1) {
      var event_status = eventPayload.EVENT_NAME.S + "_" + eventPayload.EVENT_STATUS.S
      assetApiPayload["status"] = configData.EVENTS[event_status]
    } else {
      logger.error("Error in updating assets. Invalid status value in the payload");
      return reject({
        "error": "Error in updating assets. Invalid status value in the payload",
        "details": eventPayload.EVENT_STATUS.S
      });
    }
    logger.debug("assetApiPayload" + JSON.stringify(assetApiPayload));
    var svcPayload = {
      uri: configData.BASE_API_URL + configData.ASSETS_API_RESOURCE + "/" + record.id,
      method: "PUT",
      headers: {
        "Authorization": authToken,
        "Jazz-Service-ID": eventPayload.SERVICE_ID.S
      },
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

function checkIfAssetExists(eventPayload, configData, authToken) {
  return new Promise((resolve, reject) => {
    var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
    var searchAssetPayload = {
      "service": eventPayload.SERVICE_NAME.S,
      "provider_id": svcContext.provider_id,
      "asset_type": svcContext.type,
      "domain": svcContext.domain
    };

    var svcPostSearchPayload = {
      uri: configData.BASE_API_URL + configData.ASSETS_API_RESOURCE + "?domain=" + searchAssetPayload.domain + "&service=" + searchAssetPayload.service + "&provider_id=" + searchAssetPayload.provider_id + "&asset_type=" + searchAssetPayload.asset_type,
      method: "GET",
      headers: {
        "Authorization": authToken,
        "Jazz-Service-ID": eventPayload.SERVICE_ID.S
      },
      rejectUnauthorized: false
    };

    logger.debug("svcPostSearchPayload" + JSON.stringify(svcPostSearchPayload));
    request(svcPostSearchPayload, function (error, response, body) {
      logger.debug("response" + JSON.stringify(response));
      if (response && response.statusCode && response.statusCode === 200) {
        var responseBody = JSON.parse(body);
        if (responseBody && responseBody.data && responseBody.data.count > 0) {
          logger.debug("Asset found: " + JSON.stringify(body));
          return resolve(responseBody.data.assets[0]);
        } else {
          logger.error("No assets found. " + JSON.stringify(response));
          return reject({
            "error": "No assets found. " + JSON.stringify(response),
            "details": response.body.message
          });
        }

      } else {
        if (error) {
          return reject(error);
        }
        else {
          logger.error("No assets found. " + JSON.stringify(response));
          return reject({
            "error": "No assets found. " + JSON.stringify(response),
            "details": response.body.message
          });
        }
      }

    });
  });
}

function handleProcessedEvents(id, payload) {
  processedEvents.push({
    "sequence_id": id,
    "event": payload
  });
}

function handleFailedEvents(id, failure_message, payload, failure_code) {
  failedEvents.push({
    "sequence_id": id,
    "event": payload,
    "failure_code": failure_code,
    "failure_message": failure_message
  });
}

function getEventProcessStatus() {
  return {
    "processed_events": processedEvents.length,
    "failed_events": failedEvents.length
  };
}

function handleError(errorType, message) {
  var error = {};
  error.failure_code = errorType;
  error.failure_message = message;
  return error;
}

const exportable = {
  getTokenRequest,
  getAuthResponse,
  handleError,
  processEvents,
  processEachEvent,
  checkForInterestedEvents,
  processItem,
  handleProcessedEvents,
  handleFailedEvents,
  getEventProcessStatus,
  handler,
  processCreateAsset,
  processUpdateAsset,
  checkIfAssetExists
};

module.exports = exportable;
