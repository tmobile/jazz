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

const request = require("request");
const logger = require('../logger.js');

function createUserInVault(configData, service_data, onComplete) {
  getAuthToken(configData)
    .then((authToken) => { return userInVault(configData, service_data, authToken) })
    .then(result => {
      logger.info("Successfully created user in vault");
      return onComplete(null, result);
    })
    .catch(err => {
      logger.error("Error creating user in vault: " + JSON.stringify(err));
      return onComplete(err);
    });
}

function getAuthToken(configData) {
  return new Promise((resolve, reject) => {
    let payload = {
      uri: configData.API.BASE_API_URL + configData.API.LOGIN_API,
      method: 'post',
      json: {
        "username": configData.API.SERVICE_USER,
        "password": configData.API.TOKEN_CREDS
      },
      rejectUnauthorized: false
    };

    logger.debug("getAuthToken payload : " + JSON.stringify(payload));
    request(payload, function (error, response, body) {
      logger.debug("getAuthToken response : " + JSON.stringify(response));
      if (response.statusCode === 200 && response.body && response.body.data) {
        return resolve(response.body.data.token);
      } else {
        logger.error("getAuthToken failed");
        return reject(error);
      }
    });
  });
}

function userInVault(configData, service_data, authToken) {
  return new Promise((resolve, reject) => {
    let payload = {
      uri: configData.API.BASE_API_URL + configData.API.VAULT_API,
      method: 'post',
      headers: {
        'Authorization': authToken
      },
      json: {
        "username": service_data.userid,
        "password": service_data.userpassword
      },
      rejectUnauthorized: false
    };

    logger.debug("userInVault payload : " + JSON.stringify(payload));
    request(payload, function (error, response, body) {
      logger.debug("userInVault response : " + JSON.stringify(response));
      if (response.statusCode === 200 && response.body && response.body.data) {
        return resolve(response.body.data);
      } else {
        logger.error("User creation in vault failed");
        return reject(error);
      }
    });
  });
}

module.exports = {
  createUserInVault,
  getAuthToken,
  userInVault
};
