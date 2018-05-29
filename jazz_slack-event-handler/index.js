"use strict";

const config = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const utils = require("./components/utils.js")(); //Import the utils module.
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
    var failureQueue = configData.FAILURE_QUEUE;
    var event_config = configData.EVENTS;

    logger.init(event, context);
    logger.debug("Event_configuration:" + event_config);

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
        for (i = 0; i < event.Records.length; i++) {
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
        if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
            if (configData.EVENTS.EVENT_TYPE.includes(kinesisPayload.Item.EVENT_TYPE.S) &&
                configData.EVENTS.EVENT_NAME.includes(kinesisPayload.Item.EVENT_NAME.S)) {
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
    logger.info("Deployment API payload :" + JSON.stringify(svcPayload));
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
        var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
        logger.info("svcContext: " + JSON.stringify(svcContext));
        var serviceDomain
        if (svcContext.domain) {
            serviceDomain = serviceContxt.domain;
            logger.info("Service Domain obtained as JSON:" + serviceDomain);
        }
        var service_name = eventPayload.SERVICE_NAME.S;
        var apiEndpoint = configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "?domain=" + serviceDomain + "&service=" + service_name;
        var svcPayload = getSvcPayload("GET", null, apiEndpoint, authToken);

        procesRequest(svcPayload)
            .then(result => { return resolve(result); })
            .catch(err => {
                logger.error("processCreateEvent failed: " + JSON.stringify(err));
                return reject(err);
            });
    });
};

var notifySlackChannel = (result, payload, configData, authToken) => {
    var output = JSON.parse(result);
    var serviceContxt = JSON.parse(payload.Item.SERVICE_CONTEXT.S);

    if (!output.data && output.data.count <= 0) {
        logger.error("Service details not foound in service catalog");
        var error = handleError(failureCodes.PR_ERROR_1.code, failureCodes.PR_ERROR_1.message);
        return reject(error);
    }
    var serviceDetails = output.data.services[0];
    var slackChannel = serviceDetails.slack_channel;
    if (!slackChannel) {
        logger.error("Slack channel not found");
        var error = handleError(failureCodes.PR_ERROR_5.code, failureCodes.PR_ERROR_5.message);
        return reject(error);
    }

    var attachments = [];
    var eventName = results.checkInterest.event_name,
        bitbucketUrl = serviceContxt.repository,
        serviceUrl = configData.SERVICE_LINK + serviceDetails.id,
        jenkinsUrl = serviceContxt.provider_build_url,
        endpointUrl = serviceContxt.endpoint_url;
    logger.info("serviceUrl: " + serviceUrl + ", bitbucketUrl: " + bitbucketUrl + ", jenkinsUrl: " + jenkinsUrl + ", endpointUrl: " + endpointUrl);

    var notification = utils.getNotificationMessage(serviceDetails, payload, configData);

    if (notification) {
        attachments.push(utils.formatSlackTemplate(
            notification.pretext,
            notification.text,
            notification.color
        ));
    }
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
    handleError: handleError,
    processRecords: processRecords,
    processRecord: processRecord,
    checkInterest: checkInterest,
    processEvent: processEvent

}