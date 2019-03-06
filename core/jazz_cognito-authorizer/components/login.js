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

const request = require('request');
const logger = require("./logger.js");

const getAuthToken = async (config) => {
  return new Promise((resolve, reject) => {
    const svcPayload = {
      uri: config.BASE_API_URL + config.LOGIN_API,
      method: 'post',
      json: {
        "username": config.JAZZ_ADMIN_USERNAME,
        "password": config.JAZZ_ADMIN_CREDS
      },
      rejectUnauthorized: false
    };

    logger.debug("svcPayload : " + JSON.stringify(svcPayload));
    request(svcPayload, function (error, response, body) {
      logger.debug("getAuthToken response : " + JSON.stringify(response));
      if(error ) {
        logger.error("Authentication failed !!! "+ JSON.stringify(response));
        return reject({ "error": "Authentication failed !!!" });
      } else {
        if (response.statusCode === 200 && response.body && response.body.data && response.body.data.token) {
          return resolve(response.body.data.token);
        } else {
          logger.error("Authentication failed !!! "+ JSON.stringify(response));
          return reject({ "error": "Authentication failed !!!" });
        }
      }
    });
  });
}

module.exports = {
  getAuthToken
};

