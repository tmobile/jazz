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

/**
    Helper functions for Events
    @module: utils.js
    @author:
    @version: 1.0
**/

const logger = require("../components/logger.js");

function checkForInterestedEvents(encodedPayload, sequenceNumber, configData) {
  return new Promise((resolve, reject) => {

    let kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
    if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
      if (configData.EVENTS.event_type.includes(kinesisPayload.Item.EVENT_TYPE.S) &&
        configData.EVENTS.event_name.includes(kinesisPayload.Item.EVENT_NAME.S)) {
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
};

function getDeploymentPayload(svcContext) {
  let deploymentPayload = {};
  svcContext.domain ? deploymentPayload.domain = svcContext.domain : null;
  svcContext.environment_logical_id ? deploymentPayload.environment_logical_id = svcContext.environment_logical_id : null;
  svcContext.provider_build_id ? deploymentPayload.provider_build_id = svcContext.provider_build_id : null;
  svcContext.provider_build_url ? deploymentPayload.provider_build_url = svcContext.provider_build_url : null;
  svcContext.scm_commit_hash ? deploymentPayload.scm_commit_hash = svcContext.scm_commit_hash : null;
  svcContext.scm_url ? deploymentPayload.scm_url = svcContext.scm_url : null;
  svcContext.scm_branch ? deploymentPayload.scm_branch = svcContext.scm_branch : null;
  svcContext.request_id ? deploymentPayload.request_id = svcContext.request_id : null;
  svcContext.status ? deploymentPayload.status = svcContext.status : null;
  return deploymentPayload;
};

function getSvcPayload(method, payload, apiEndpoint, authToken, serviceId) {
  let svcPayload = {
    'uri': apiEndpoint,
    'method': method,
    headers: {
      'content-type': "application/json",
      'authorization': authToken,
      "Jazz-Service-ID": serviceId
    },
    rejectUnauthorized: false
  }
  if (payload) {
    svcPayload.json = payload;
  }
  logger.debug("Deployment API payload :" + JSON.stringify(svcPayload));
  return svcPayload;
};

function handleError(errorType, message) {
  let error = {
    'failure_code': errorType,
    'failure_message': message
  };
  return error;
};

function getTokenRequest(configData) {
  return {
    uri: configData.BASE_API_URL + configData.TOKEN_URL,
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


const exportable = {
  checkForInterestedEvents,
  getDeploymentPayload,
  getSvcPayload,
  handleError,
  getTokenRequest
};
module.exports = exportable;

