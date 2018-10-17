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

const rp = require('request-promise-native');

const _ = require("lodash");
const request = require("request");
const nanoid = require("nanoid/generate");

const config = require("./components/config.js");
const logger = require("./components/logger.js");
const errorHandlerModule = require("./components/error-handler.js");
var errorHandler = errorHandlerModule(logger);

var processedEvents = [];
var failedEvents = [];

var handler = (event, context, cb) => {
  var configData = config(context);

  rp(getTokenRequest(configData))
    .then(result => {
      return getAuthResponse(result);
    })
    .then(authToken => {
      return processEvents(event, configData, authToken);
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
  return new Promise((resolve, reject) => {
    if (result.statusCode === 200 && result.body && result.body.data) {
      return resolve(result.body.data.token);
    } else {
      logger.error("getAuthResponse failed");
      return reject(errorHandler.throwInternalServerError("Invalid token response from API"));
    }
  });
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
        logger.error("ProcessEachEvent failed for " + JSON.stringify(record));
        handleFailedEvents(sequenceNumber, err.details, payload, err.error);
        return reject(err);
      });
  });
}

var checkForInterestedEvents = function (encodedPayload, sequenceNumber, config) {
  return new Promise((resolve, reject) => {
    var kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
    if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
      if (_.includes(config.EVENTS.EVENT_TYPE, kinesisPayload.Item.EVENT_TYPE.S) &&
        _.includes(config.EVENTS.EVENT_NAME, kinesisPayload.Item.EVENT_NAME.S)) {
        logger.info("found " + kinesisPayload.Item.EVENT_TYPE.S + " event with sequence number: " + sequenceNumber);
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

var processItem = function (eventPayload, configData, authToken) {
  return new Promise((resolve, reject) => {
    var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
    logger.info("svcContext: " + JSON.stringify(svcContext));

    var environmentApiPayload = {};
    environmentApiPayload.service = eventPayload.SERVICE_NAME.S;
    environmentApiPayload.created_by = eventPayload.USERNAME.S;

    environmentApiPayload.domain = svcContext.domain;
    environmentApiPayload.physical_id = svcContext.branch;

    if (eventPayload.EVENT_NAME.S === configData.EVENTS.INITIAL_COMMIT) {
      processEventInitialCommit(environmentApiPayload, configData, authToken)
        .then(result => { return processBuild(environmentApiPayload, configData, authToken); })
        .then(result => { return resolve(result); })
        .catch(err => {
          logger.error("processEventInitialCommit failed: " + err);
          return reject(err);
        })

    } else if (eventPayload.EVENT_NAME.S === configData.EVENTS.CREATE_BRANCH) {
      environmentApiPayload.friendly_name = svcContext.branch;
      processEventCreateBranch(environmentApiPayload, configData, authToken)
        .then(result => { return processBuild(environmentApiPayload, configData, authToken); })
        .then(result => { return resolve(result); })
        .catch(err => {
          logger.error("processEventCreateBranch Failed" + err);
          return reject(err);
        })

    } else if (eventPayload.EVENT_NAME.S === configData.EVENTS.UPDATE_ENVIRONMENT) {
      environmentApiPayload.status = svcContext.status;
      environmentApiPayload.endpoint = svcContext.endpoint;
      environmentApiPayload.friendly_name = svcContext.friendly_name;

      if (svcContext.metadata) {
        environmentApiPayload.metadata = svcContext.metadata;
      }

      if (!svcContext.logical_id) {
        getEnvironmentLogicalId(environmentApiPayload, configData, authToken)
          .then((logical_id) => {
            environmentApiPayload.logical_id = logical_id;
            processEventUpdateEnvironment(environmentApiPayload, configData, authToken)
              .then(result => { return resolve(result); })
              .catch(err => {
                logger.error("processEventUpdateEnvironment Failed" + err);
                return reject(err);
              })
          });

      } else {
        environmentApiPayload.logical_id = svcContext.logical_id;
        processEventUpdateEnvironment(environmentApiPayload, configData, authToken)
          .then(result => { return resolve(result); })
          .catch(err => {
            logger.error("processEventUpdateEnvironment Failed" + err);
            return reject(err);
          })
      }

    } else if (eventPayload.EVENT_NAME.S === configData.EVENTS.DELETE_ENVIRONMENT) {
      environmentApiPayload.endpoint = svcContext.endpoint;
      environmentApiPayload.logical_id = svcContext.environment;

      var event_status = eventPayload.EVENT_STATUS.S;
      if (event_status === 'STARTED') {
        environmentApiPayload.status = configData.ENVIRONMENT_DELETE_STARTED_STATUS;
      } else if (event_status === 'FAILED') {
        environmentApiPayload.status = configData.ENVIRONMENT_DELETE_FAILED_STATUS;
      } else if (event_status === 'COMPLETED') {
        environmentApiPayload.status = configData.ENVIRONMENT_DELETE_COMPLETED_STATUS;
      }

      // Update with DELETE status
      processEventUpdateEnvironment(environmentApiPayload, configData, authToken)
        .then(result => { return resolve(result); })
        .catch(err => {
          logger.error("processEventUpdateEnvironment Failed" + err);
          return reject(err);
        })

    } else if (eventPayload.EVENT_NAME.S === configData.EVENTS.DELETE_BRANCH) {
      environmentApiPayload.physical_id = svcContext.branch;
      processEventDeleteBranch(environmentApiPayload, configData, authToken)
        .then(result => { return resolve(result); })
        .catch(err => {
          logger.error("processEventDeleteBranch Failed" + err);
          return reject(err);
        })
    } else if (eventPayload.EVENT_NAME.S === configData.EVENTS.COMMIT_CODE) {
      processBuild(environmentApiPayload, configData, authToken)
        .then(result => { return resolve(result); })
        .catch(err => {
          logger.error("processBuild Failed" + err);
          return reject(err);
        })
    }

  });
}

var processEventInitialCommit = function (environmentPayload, configData, authToken) {
  function processEnv(env) {
    return new Promise((resolve, reject) => {
      environmentPayload.logical_id = env;
      environmentPayload.status = configData.CREATE_ENVIRONMENT_STATUS;

      var svcPayload = {
        uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE,
        method: "POST",
        headers: { Authorization: authToken },
        json: environmentPayload,
        rejectUnauthorized: false
      };

      if (environmentPayload.service === 'ui' && environmentPayload.domain === 'jazz') {
        return resolve();
      }
      logger.info("svcPayload" + JSON.stringify(svcPayload));
      request(svcPayload, function (error, response, body) {
        if (response.statusCode === 200 && body && body.data) {
          return resolve(null, body);
        } else {
          logger.error(`Error creating ${env} environment in catalog: ${JSON.stringify(response)}`);
          return reject({
            "error": `Error creating ${env} environment for ${environmentPayload.domain} "_" ${environmentPayload.service} in catalog`,
            "details": response.body.message
          });
        }
      });

    });
  }

  return new Promise((resolve, reject) => {
    if (environmentPayload.physical_id === configData.ENVIRONMENT_PRODUCTION_PHYSICAL_ID) {
      Promise.all([processEnv('stg'), processEnv('prod')])
        .then((result) => {
          logger.debug("result" + result);
          return resolve({ message: "Stage and Prod environments are created successfully" });
        })
        .catch((error) => {
          logger.error("Promise.all failed to process env creation: " + JSON.stringify(error));
          return reject(error);
        });
    } else {
      logger.error("INITIAL_COMMIT event should be triggered by a master commit. physical_id is " + environmentPayload.physical_id);
      return reject("INITIAL_COMMIT event should be triggered by a master commit. physical_id is " + environmentPayload.physical_id);
    }
  });
}

var processEventCreateBranch = function (environmentPayload, configData, authToken) {
  return new Promise((resolve, reject) => {

    var nano_id = nanoid(configData.RANDOM_CHARACTERS, configData.RANDOM_ID_CHARACTER_COUNT);
    environmentPayload.logical_id = nano_id + "-dev";
    environmentPayload.status = configData.CREATE_ENVIRONMENT_STATUS;

    logger.info("environmentPayload: " + JSON.stringify(environmentPayload));
    var svcPayload = {
      uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE,
      method: "POST",
      headers: { Authorization: authToken },
      json: environmentPayload,
      rejectUnauthorized: false
    };

    if (environmentPayload.service === 'ui' && environmentPayload.domain === 'jazz') {
      return resolve();
    }
    logger.info("svcPayload" + JSON.stringify(svcPayload));
    request(svcPayload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200 && body && body.data) {
        return resolve(body);
      } else {
        logger.error("Error creating  " + environmentPayload.logical_id + " environment in catalog. response" + JSON.stringify(response));
        return reject({
          "error": "Error creating " + environmentPayload.logical_id + " environment for " + environmentPayload.domain + "_" + environmentPayload.service + " in catalog",
          "details": response.body.message
        });
      }
    });
  });
}

var processEventDeleteBranch = function (environmentPayload, configData, authToken) {
  return new Promise((resolve, reject) => {

    getEnvironmentLogicalId(environmentPayload, configData, authToken)
      .then((logical_id) => {
        logger.info("logical_id" + logical_id);
        environmentPayload.logical_id = logical_id;

        // Update catalog status first. @TODO

        var delSerPayload = {
          uri: configData.BASE_API_URL + configData.DELETE_ENVIRONMENT_API_RESOURCE,
          method: "POST",
          headers: { Authorization: authToken },
          json: {
            "service_name": environmentPayload.service,
            "domain": environmentPayload.domain,
            "version": "LATEST",
            "environment_id": environmentPayload.logical_id
          },
          rejectUnauthorized: false
        };

        request(delSerPayload, function (error, response, body) {
          if (response.statusCode && response.statusCode === 200 && body && body.data) {
            return resolve(body);
          } else {
            logger.error("Error triggering the delete environment: " + JSON.stringify(response));
            return reject({
              "error": "Error triggering the delete environment",
              "details": response.body.message
            });
          }

        });
      })
      .catch(err => {
        logger.error("Error inside processEventDeleteBranch -" + JSON.stringify(err));
        return reject(err);
      });

  });

}

var processEventUpdateEnvironment = function (environmentPayload, configData, authToken) {
  return new Promise((resolve, reject) => {

    var updatePayload = {};
    updatePayload.status = environmentPayload.status;
    updatePayload.endpoint = environmentPayload.endpoint;
    updatePayload.friendly_name = environmentPayload.friendly_name;

    if (environmentPayload.metadata) {
      updatePayload.metadata = environmentPayload.metadata;
    }

    var svcPayload = {
      uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE + "/" + environmentPayload.logical_id
        + `?domain=${environmentPayload.domain}&service=${environmentPayload.service}`,
      method: "PUT",
      headers: { Authorization: authToken },
      json: updatePayload,
      rejectUnauthorized: false
    };

    request(svcPayload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200) {
        return resolve(body);
      } else {
        logger.error("Error updating the environment: " + JSON.stringify(response));
        return reject({
          "error": "Error updating the environment",
          "details": response.body.message
        });
      }
    });

  });
}

var getEnvironmentLogicalId = function (environmentPayload, configData, authToken) {
  return new Promise((resolve, reject) => {
    var svcPayload = {
      uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE + "?domain=" + environmentPayload.domain + "&service=" + environmentPayload.service,
      method: "GET",
      headers: { Authorization: authToken },
      rejectUnauthorized: false
    };

    request(svcPayload, function (error, response, body) {
      if (response.statusCode === 200 && body) {
        var env_logical_id = null;
        var dataJson = typeof body === 'string' ? JSON.parse(body) : body;
        if (dataJson.data && dataJson.data.environment) {
          var envList = dataJson.data.environment;
          for (var count = 0; count < envList.length; count++) {
            if (envList[count]) {
              if (envList[count].physical_id === environmentPayload.physical_id) {
                env_logical_id = envList[count].logical_id;
                return resolve(env_logical_id);
              }
            }
          }
        }

      } else {
        logger.error("getEnvironmentLogicalId" + JSON.stringify(response));
        return reject({
          "error": "Could not get environment Id for service and domain",
          "details": response.body.message
        });
      }
    });
  });
}

var processBuild = function (payload, configData, authToken) {
  return new Promise((resolve, reject) => {
    getServiceDetails(payload, configData, authToken)
      .then(result => { return triggerBuildJob(result, payload, configData) })
      .then(result => { resolve(result) })
      .catch(error => {
        logger.error("processBuild Failed : " + JSON.stringify(error));
        return reject(error);
      });
  });
}

function getSvcPayload(method, payload, apiEndpoint, authToken) {
  var svcPayload = {
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
  return svcPayload;
}

function processRequest(svcPayload) {
  return new Promise((resolve, reject) => {
    request(svcPayload, function (error, response, body) {
      if ((response.statusCode === 200 || response.statusCode === 201) && body) {
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
    var apiEndpoint = `${configData.BASE_API_URL}${configData.SERVICE_API_RESOURCE}?service=${eventPayload.service}&domain=${eventPayload.domain}&isAdmin=true`;
    var svcPayload = getSvcPayload("GET", null, apiEndpoint, authToken);
    if (eventPayload.service === 'ui' && eventPayload.domain === 'jazz') {
      return resolve();
    }
    processRequest(svcPayload)
      .then(result => { return resolve(result); })
      .catch(err => {
        logger.error("getServiceDetails failed: " + JSON.stringify(err));
        var error = handleError(failureCodes.PR_ERROR_5.code, failureCodes.PR_ERROR_5.message);
        return reject(error);
      });
  });
}

var triggerBuildJob = function (result, payload, configData) {
  return new Promise((resolve, reject) => {
    var output;
    if (result) {
      output = JSON.parse(result);
    }
    var serviceDetails = {};
    var buildQuery;
    if (payload.service === 'ui' && payload.domain === 'jazz') {
      serviceDetails.type = 'ui';
      buildQuery = `/build?token=${configData.JOB_TOKEN}`;
    } else {
      if (!output.data && !output.data.services && output.data.services.length > 0) {
        logger.error("Service details not found in service catalog: " + JSON.stringify(output));
        var error = handleError(failureCodes.PR_ERROR_5.code, failureCodes.PR_ERROR_5.message);
        return reject(error);
      }
      serviceDetails = output.data.services[0];
      logger.debug("service details : " + JSON.stringify(serviceDetails));
      buildQuery = `/buildWithParameters?token=${configData.JOB_TOKEN}&service_name=${serviceDetails.service}&domain=${serviceDetails.domain}&scm_branch=${payload.physical_id}`;
    }

    var authToken = "Basic " + new Buffer(configData.JENKINS_USER + ":" + configData.API_TOKEN).toString("base64");
    var apiEndpoint = `${configData.JOB_BUILD_URL}${configData.BUILDPACKMAP[serviceDetails.type]}${buildQuery}`;
    var svcPayload = getSvcPayload("POST", null, apiEndpoint, authToken);

    processRequest(svcPayload)
      .then(result => { logger.debug("Deployment started successfully."); return resolve(result); })
      .catch(err => {
        logger.error("triggerBuildJob failed: " + JSON.stringify(err));
        var error = handleError(failureCodes.PR_ERROR_3.code, failureCodes.PR_ERROR_3.message);
        return reject(error);
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
  processEventDeleteBranch: processEventDeleteBranch,
  processEventUpdateEnvironment: processEventUpdateEnvironment,
  processEventCreateBranch: processEventCreateBranch,
  processEventInitialCommit: processEventInitialCommit,
  getEnvironmentLogicalId: getEnvironmentLogicalId,
  processBuild: processBuild,
  triggerBuildJob: triggerBuildJob,
  getServiceDetails: getServiceDetails,
  processRequest: processRequest,
  getSvcPayload: getSvcPayload
}
