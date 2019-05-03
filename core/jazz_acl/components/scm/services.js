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
const logger = require("../logger.js");

const getServiceMetadata = async (config, authToken, serviceId) => {
  return new Promise((resolve, reject) => {
    const svcPayload = {
      uri: `${config.BASE_API_URL}${config.SERVICE_API}/${serviceId}`,
      method: 'GET',
      headers: {
        'Authorization': authToken,
        'Jazz-Service-ID': serviceId
      },
      rejectUnauthorized: false
    };

    request(svcPayload, function (error, response, body) {
      if (error) {
        logger.error("Failed to fetch service data: "+ JSON.stringify(error));
        return reject(error);
      }
      if (response.statusCode === 200 && body) {
        const results = JSON.parse(body);
        if (results.data) {
          return resolve(results.data);
        } else {
          logger.error("Failed to fetch service data: "+ JSON.stringify(response));
          return reject({
            "error": "Could not find service with id : " + serviceId + " in service catalog. "
          });
        }
      } else {
        logger.error("Failed to fetch service data: "+ JSON.stringify(response));
        return reject({
          "error": "Error finding service with id : " + serviceId + " in service catalog."
        });
      }
    });
  });
};

module.exports = {
  getServiceMetadata
};

