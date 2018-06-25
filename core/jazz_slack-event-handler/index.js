"use strict";

const config = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const utils = require("./components/utils.js")(); //Import the utils module.
const _ = require("lodash");
const errorHandlerModule = require("./components/error-handler.js");
const failureErrorCodes = require("./utils/failure-codes.js");
const customErrorHandlerModule = require("./components/custom-error-handler.js"); //Import the custom error codes module.
const format = require("string-template");

const AWS = require("aws-sdk");
const request = require("request");
const rp = require('request-promise-native');

var errorHandler = errorHandlerModule(logger);
var failureCodes = failureErrorCodes();
var retryErrorHandler = customErrorHandlerModule();
var processedEvents = [];
var failedEvents = [];

var handler = (event, context, cb) => {
    var configData = config(context);

    logger.init(event, context);
    logger.info("Event :" + JSON.stringify(event));

    rp(getTokenRequest(configData))
        .then(result => {
            return getAuthResponse(result);
        })
        .then(authToken => {
            return processRecords(event, configData, authToken);
        })
        .then(result => {
            var records = getEventProcessStatus();
            logger.info("Successfully processed events: " + JSON.stringify(records));
            return cb(null, records);
        })
        .catch(err => {
            var records = getEventProcessStatus();
            logger.error("Error processing events: " + JSON.stringify(err));
            return cb(null, records);
        });
}

var getTokenRequest = (configData) => {
    return {
        uri: configData.SERVICE_API_URL + configData.TOKEN_URL,
        method: 'post',
        json: {
            "username": configData.SERVICE_USER,
            "password": configData.TOKEN_CREDS
        },
        rejectUnauthorized: false,
        transform: (body, response, resolveWithFullResponse) => {
            return response;
        }
    };
};

var getAuthResponse = (result) => {
    return new Promise((resolve, reject) => {
        if (result.statusCode === 200 && result.body && result.body.data) {
            return resolve(result.body.data.token);
        } else {
            logger.error("getAuthResponse failed");
            return reject(errorHandler.throwInternalServerError("Invalid token response from API"));
        }
    });
}

var processRecords = (event, configData, authToken) => {
    return new Promise((resolve, reject) => {
        var processRecordPromises = [];
        for (var i = 0; i < event.Records.length; i++) {
            processRecordPromises.push(processRecord(event.Records[i], configData, authToken));
        }
        Promise.all(processRecordPromises)
            .then((result) => { return resolve(result); })
            .catch((error) => { return reject(error); });
    });
}

var processRecord = (record, configData, authToken) => {
    return new Promise((resolve, reject) => {
        var sequenceNumber = record.kinesis.sequenceNumber;
        var encodedPayload = record.kinesis.data;
        var payload;
        return checkInterest(encodedPayload, sequenceNumber, configData)
            .then(result => {
                payload = result.payload;
                if (result.interested_event) {
                    return processEvent(payload, configData, authToken);
                }
            })
            .then(result => {
                handleProcessedEvents(sequenceNumber, payload);
                return resolve(result);
            })
            .catch(err => {
                handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
                return resolve();
            });
    });
}

var checkInterest = (encodedPayload, sequenceNumber, configData) => {
    return new Promise((resolve, reject) => {
        var kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
        logger.info("kinesisPayload :" + JSON.stringify(kinesisPayload));
        if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
            if (_.includes(configData.EVENTS.EVENT_TYPE , kinesisPayload.Item.EVENT_TYPE.S) &&
            _.includes(configData.EVENTS.EVENT_NAME , kinesisPayload.Item.EVENT_NAME.S)) {
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

var processEvent = (payload, configData, authToken) => {
    return new Promise((resolve, reject) => {
        if (!payload.EVENT_NAME.S || !payload.EVENT_STATUS.S) {
            logger.error("validation error. Either event name or event status is not properly defined.");
            var err = handleError(failureCodes.PR_ERROR_1.code, "Validation error while processing event for service");
            return reject(err);
        }
        getServiceDetails(payload, configData, authToken)
            .then(result => { notifySlackChannel(result, payload, configData, authToken) })
            .then(result => { resolve(result) })
            .catch(err => {
                return reject(error);
            });
    });
}

var getSvcPayload = (method, payload, apiEndpoint, authToken) => {
    var svcPayload = {
        headers: {
            'content-type': "application/json",
            'authorization': authToken
        },
        rejectUnauthorized: false
    }

    svcPayload.uri = apiEndpoint;
    svcPayload.method = method;
    if (payload) {
        svcPayload.json = payload;
    }
    logger.info("payload :" + JSON.stringify(svcPayload));
    return svcPayload;
};

var procesRequest = (svcPayload) => {
    return new Promise((resolve, reject) => {
        request(svcPayload, function (error, response, body) {
            if (response.statusCode === 200 && body) {
                return resolve(body);
            } else {
                logger.error("Error processing request: " + JSON.stringify(response));
                var error = handleError(failureCodes.PR_ERROR_3.code, response.body.message);
                return reject(error);
            }
        });
    });
};

var getServiceDetails = (eventPayload, configData, authToken) => {
    return new Promise((resolve, reject) => {   
        var service_id = eventPayload.SERVICE_ID.S;
        var apiEndpoint = configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "/" + service_id;
        var svcPayload = getSvcPayload("GET", null, apiEndpoint, authToken);

        procesRequest(svcPayload)
            .then(result => { return resolve(result); })
            .catch(err => {
                logger.error("getServiceDetails failed: " + JSON.stringify(err));
                return reject(err);
            });
    });
};

var notifySlackChannel = (result, payload, configData, authToken) => {
    var output = JSON.parse(result);
    if (!output.data) {
        logger.error("Service details not foound in service catalog");
        var error = handleError(failureCodes.PR_ERROR_1.code, failureCodes.PR_ERROR_1.message);
        return reject(error);
    }
    var serviceDetails = output.data;
    logger.info("service details : "+JSON.stringify(serviceDetails));
    var slackChannel = serviceDetails.slack_channel;
    if (!slackChannel) {
        logger.error("Slack channel not found");
        var error = handleError(failureCodes.PR_ERROR_5.code, failureCodes.PR_ERROR_5.message);
        return reject(error);
    }

    var attachments = [];
    var notification = utils.getNotificationMessage(serviceDetails, payload, configData);
    logger.info("notification details : "+JSON.stringify(notification));
    if (notification) {
        attachments.push(utils.formatSlackTemplate(
            notification.pretext,
            notification.text,
            notification.color
        ));
    }

    var slackNotifierUserName = configData.SLACK_NOTIFIER_USER_NAME;
    var slackToken = configData.SLACK_TOKEN

    var slackNotificationSvcPayload = {
        "method": "POST",
        "uri": configData.SLACK_BASIC_NOTIFICATION_URL + "?token=" + slackToken + "&channel=" + slackChannel + "&username=" + slackNotifierUserName,
        "rejectUnauthorized": false,
        "headers": {    "Content-Type": "application/x-www-form-urlencoded" },
        "form": { "attachments" : JSON.stringify(attachments)}
    };

    procesRequest(slackNotificationSvcPayload)
        .then(result => { return resolve(result); })
        .catch(err => {
            logger.error("Slack notification error occured for service:: " + JSON.stringify(err));
            return reject(err);
        });
}

var handleError = (errorType, message) => {
    var error = {};
    error.failure_code = errorType;
    error.failure_message = message;
    return error;
}

var handleFailedEvents = (id, failure_message, payload, failure_code) => {
    failedEvents.push({
        "sequence_id": id,
        "event": payload,
        "failure_code": failure_code,
        "failure_message": failure_message
    });
}

var handleProcessedEvents = (id, payload) => {
    processedEvents.push({
        "sequence_id": id,
        "event": payload
    });
}

var getEventProcessStatus = () => {
    return {
        "processed_events": processedEvents.length,
        "failed_events": failedEvents.length
    };
}


module.exports = {
    getTokenRequest: getTokenRequest,
    getAuthResponse: getAuthResponse,
    processRecords: processRecords,
    processRecord: processRecord,
    checkInterest: checkInterest,
    processEvent: processEvent,
    handler: handler,
    getSvcPayload: getSvcPayload,
    procesRequest: procesRequest,
    getServiceDetails: getServiceDetails,
    notifySlackChannel: notifySlackChannel,
    handleError: handleError,
    handleFailedEvents: handleFailedEvents,
    getEventProcessStatus: getEventProcessStatus
}