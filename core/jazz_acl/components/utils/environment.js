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
const logger = require('../logger.js');

function getEnvironmentDetails(configData, serviceInfo, authToken) {
  return new Promise((resolve, reject) => {
    let payload = {
      uri: `${configData.BASE_API_URL}${global.globalConfig.API.ENVIRONMENTS}?service=${serviceInfo.service}&domain=${serviceInfo.domain}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authToken,
        "Jazz-Service-ID": serviceInfo.id
      }
    };

    logger.debug("getEnvironmentDetails : " + JSON.stringify(payload))
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200 && body) {
        logger.debug("Successfully got environment details : " + JSON.stringify(response))
        let resp = JSON.parse(body);
        return resolve(resp.data);
      } else {
        logger.error("Error in getting environment details: " + JSON.stringify(response));
        return reject({
          "error": "Error in getting environment details: " + response.error
        });
      }
    });
  });
}


module.exports = {
  getEnvironmentDetails
};
