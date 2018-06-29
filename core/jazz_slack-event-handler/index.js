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

const configModule = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const utils = require("./components/utils"); //Import the utils module.
const errorHandlerModule = require("./components/error-handler.js");
const failureErrorCodes = require("./utils/failure-codes.js");
const customErrorHandlerModule = require("./components/custom-error-handler.js"); //Import the custom error codes module.
const request = require("request");
const rp = require('request-promise-native');
const errorHandler = errorHandlerModule(logger);
const failureCodes = failureErrorCodes();
var processedEvents = [];
var failedEvents = [];

function handler(event, context, cb) {
  const configData = configModule.getConfig(event, context);

  if (!configData || configData.length) {
    logger.error("Cannot load config object, will stop processing");
    return cb(JSON.stringify(errorHandler.throwInternalServerError("101", "Internal error, please reach out to admins")));
  }
  logger.init(event, context);
  logger.debug("Event :" + JSON.stringify(event));

  rp(getTokenRequest(configData))
    .then(result => {
      return exportable.getAuthResponse(result);
    })
    .then(authToken => {
      return exportable.processRecords(event, configData, authToken);
    })
    .then(result => {
      let records = exportable.getEventProcessStatus();
      logger.debug("Successfully processed events: " + JSON.stringify(records));
      return cb(null, records);
    })
    .catch(err => {
      let records = exportable.getEventProcessStatus();
      logger.error("Error processing events: " + JSON.stringify(err));
      return cb(null, records);
    });
}

function getTokenRequest(configData) {
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
}

function getAuthResponse(result) {
  return new Promise((resolve, reject) => {
    if (result.statusCode === 200 && result.body && result.body.data) {
      return resolve(result.body.data.token);
    } else {
      logger.error("getAuthResponse failed");
      return reject(errorHandler.throwInternalServerError("Invalid token response from API"));
    }
  });
}

function processRecords(event, configData, authToken) {
  return new Promise((resolve, reject) => {
    let processRecordPromises = [];
    for (let i = 0; i < event.Records.length; i++) {
      processRecordPromises.push(exportable.processRecord(event.Records[i], configData, authToken));
    }
    Promise.all(processRecordPromises)
      .then((result) => { return resolve(result); })
      .catch((error) => { return reject(error); });
  });
}

function processRecord(record, configData, authToken) {
  return new Promise((resolve, reject) => {
    let sequenceNumber = record.kinesis.sequenceNumber;
    let encodedPayload = record.kinesis.data;
    let payload;
    return exportable.checkInterest(encodedPayload, sequenceNumber, configData)
      .then(result => {
        payload = result.payload;
        if (result.interested_event) {
          return exportable.processEvent(payload, configData, authToken);
        } else {
          resolve({ "message": "Not an interesting event" });
        }
      })
      .then(result => {
        exportable.handleProcessedEvents(sequenceNumber, payload);
        return resolve(result);
      })
      .catch(err => {
        exportable.handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
        return reject(err);
      });
  });
}

function checkInterest(encodedPayload, sequenceNumber, configData) {
  return new Promise((resolve, reject) => {
    let kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
    logger.debug("kinesisPayload :" + JSON.stringify(kinesisPayload));
    if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
      if (configData.EVENTS.EVENT_TYPE.includes(kinesisPayload.Item.EVENT_TYPE.S) &&
        configData.EVENTS.EVENT_NAME.includes(kinesisPayload.Item.EVENT_NAME.S)) {
        logger.debug("found " + kinesisPayload.Item.EVENT_TYPE.S + " event with sequence number: " + sequenceNumber);
        return resolve({
          "interested_event": true,
          "payload": kinesisPayload.Item
        });
      } else {
        logger.debug("Not an interested event or event type");
        return resolve({
          "interested_event": false,
          "payload": kinesisPayload.Item
        });
      }
    }
  });
}

function processEvent(payload, configData, authToken) {
  return new Promise((resolve, reject) => {
    if (!payload.EVENT_NAME.S || !payload.EVENT_STATUS.S) {
      logger.error("validation error. Either event name or event status is not properly defined.");
      let err = exportable.handleError(failureCodes.PR_ERROR_1.code, "Validation error while processing event for service");
      return reject(err);
    }
    exportable.getServiceDetails(payload, configData, authToken)
      .then(result => { return notifySlackChannel(result, payload, configData, authToken) })
      .then(result => { resolve(result) })
      .catch(error => {
        return reject(error);
      });
  });
}

function getSvcPayload(method, payload, apiEndpoint, authToken) {
  let svcPayload = {
    headers: {
      'content-type': "application/json",
      'authorization': authToken
    },
    rejectUnauthorized: false
  };

  svcPayload.uri = apiEndpoint;
  svcPayload.method = method;
  if (payload) {
    svcPayload.json = payload;
  }
  logger.debug("payload :" + JSON.stringify(svcPayload));
  return svcPayload;
}

function processRequest(svcPayload) {
  return new Promise((resolve, reject) => {
    request(svcPayload, function (error, response, body) {
      if (response.statusCode === 200 && body) {
        return resolve(body);
      } else {
        logger.error("Error processing request: " + JSON.stringify(response));
        return reject(error);
      }
    });
  });
}

function getServiceDetails(eventPayload, configData, authToken) {
  return new Promise((resolve, reject) => {
    let service_id = eventPayload.SERVICE_ID.S;
    let apiEndpoint = configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "/" + service_id;
    let svcPayload = exportable.getSvcPayload("GET", null, apiEndpoint, authToken);

    exportable.processRequest(svcPayload)
      .then(result => { return resolve(result); })
      .catch(err => {
        logger.error("getServiceDetails failed: " + JSON.stringify(err));
        let error = exportable.handleError(failureCodes.PR_ERROR_1.code, failureCodes.PR_ERROR_1.message);
        return reject(error);
      });
  });
}

function notifySlackChannel(result, payload, configData, authToken) {
  return new Promise((resolve, reject) => {
    let output = JSON.parse(result);
    if (!output.data) {
      logger.error("Service details not found in service catalog");
      let error = exportable.handleError(failureCodes.PR_ERROR_1.code, failureCodes.PR_ERROR_1.message);
      return reject(error);
    }
    let serviceDetails = output.data;
    logger.debug("service details : " + JSON.stringify(serviceDetails));
    if (!serviceDetails.slack_channel) {
      logger.error("Slack channel not found");
      let error = exportable.handleError(failureCodes.PR_ERROR_5.code, failureCodes.PR_ERROR_5.message);
      return reject(error);
    }

    let attachments = [];
    let notification = utils.getNotificationMessage(serviceDetails, payload, configData);
    logger.debug("notification details : " + JSON.stringify(notification));
    if (notification) {
      attachments.push(utils.formatSlackTemplate(
        notification.pretext,
        notification.text,
        notification.color
      ));
    }


    let slackNotificationSvcPayload = {
      "method": "POST",
      "uri": configData.SLACK_BASIC_NOTIFICATION_URL + "?token=" + configData.SLACK_TOKEN + "&channel=" + serviceDetails.slack_channel + "&username=" + configData.SLACK_NOTIFIER_USER_NAME,
      "rejectUnauthorized": false,
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "form": { "attachments": JSON.stringify(attachments) }
    };

    exportable.processRequest(slackNotificationSvcPayload)
      .then(result => { return resolve(result); })
      .catch(err => {
        logger.error("Slack notification error ocured for service:: " + JSON.stringify(err));
        let error = exportable.handleError(failureCodes.PR_ERROR_4.code, failureCodes.PR_ERROR_4.message);
        return reject(error);
      });
  });
}

function handleError(errorType, message) {
  let error = {};
  error.failure_code = errorType;
  error.failure_message = message;
  return error;
}

function handleFailedEvents(id, failure_message, payload, failure_code) {
  failedEvents.push({
    "sequence_id": id,
    "event": payload,
    "failure_code": failure_code,
    "failure_message": failure_message
  });
}

function handleProcessedEvents(id, payload) {
  processedEvents.push({
    "sequence_id": id,
    "event": payload
  });
}

function getEventProcessStatus() {
  return {
    "processed_events": processedEvents.length,
    "failed_events": failedEvents.length
  };
}

const exportable = {
  getTokenRequest,
  getAuthResponse,
  processRecords,
  processRecord,
  checkInterest,
  processEvent,
  handler,
  getSvcPayload,
  processRequest,
  getServiceDetails,
  notifySlackChannel,
  handleError,
  handleFailedEvents,
  handleProcessedEvents,
  getEventProcessStatus
};
module.exports = exportable;
