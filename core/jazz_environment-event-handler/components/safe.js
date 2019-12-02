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
const logger = require("./logger.js");

function addSafe(environmentApiPayload, serviceId, configData, authToken) {
  return new Promise((resolve, reject) => {
    try {
      if (!configData.TVAULT || !configData.TVAULT.IS_ENABLED) {
        return resolve({
          "error": "T-vault is not enabled",
        });
      }
      safeExportable.createSafe(environmentApiPayload, serviceId, configData, authToken)
        .then((safeName) => { return safeExportable.getAdmins(environmentApiPayload, serviceId, configData, authToken, safeName) })
        .then((result) => { return safeExportable.addAdminsToSafe(environmentApiPayload, configData, authToken, result) })
        .then((result) => { return resolve(result); })
        .catch((err) => {
          logger.error("add safe details failed: " + err);
          return reject(err);
        })
    } catch (err) {
      logger.error("add safe details failed: " + err);
    }
  });
}

function createSafe(environmentPayload, service_id, configData, authToken) {
  return new Promise((resolve, reject) => {
    var updatePayload = {};
    const safeName = `${environmentPayload.domain}_${environmentPayload.service}_${environmentPayload.logical_id}`;
    updatePayload.name = safeName;
    updatePayload.owner = configData.SERVICE_USER;
    updatePayload.description = "create safe for jazz tvault service: " + safeName;

    var svcPayload = {
      uri: `${configData.BASE_API_URL}${configData.TVAULT.API}`,
      method: "POST",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json",
        "Jazz-Service-ID": service_id
      },
      json: updatePayload,
      rejectUnauthorized: false
    };
    request(svcPayload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200) {
        const timestamp = new Date().toISOString();
        const safeDetails = { "name": safeName, "timestamp": timestamp };
        const vaultLink = `${configData.TVAULT.HOSTNAME}/#!/admin`;
        if (environmentPayload.metadata) {
          environmentPayload.metadata['safe'] = safeDetails;
          environmentPayload.metadata['vault_link'] = vaultLink;
        } else {
          environmentPayload.metadata = {
            'safe': safeDetails,
            'vault_link': vaultLink
          };
        }
        return resolve(safeName);
      } else {
        logger.error("Error creating safe: " + JSON.stringify(response));
        return reject({
          "error": "Error creating safe",
          "details": response.body.message
        });
      }
    });
  });
}

function getAdmins(environmentPayload, serviceId, configData, authToken, safeName) {
  return new Promise((resolve, reject) => {
    var payload = {
      uri: `${configData.BASE_API_URL}${configData.LIST_USERS}?serviceId=${serviceId}`,
      method: "GET",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json"
      }
    };
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200) {
        const resultData = {
          'admins': JSON.parse(body),
          'safeName': safeName
        };
        return resolve(resultData);
      } else {
        logger.error("Error getting admins: " + JSON.stringify(response));
        return reject({
          "error": "Error getting admins",
          "details": response.body.message
        });
      }
    });
  });
}

function addAdminsToSafe(environmentPayload, configData, authToken, res) {
  function processAdmins(user) {
    return new Promise((resolve, reject) => {
      var updatePayload = {
        'username': user.userId
      };
      if (user.permission === "admin") {
        updatePayload['permission'] = "write";
      } else {
        updatePayload['permission'] = "read";
      }
      const safeName = res.safeName;
      var payload = {
        uri: `${configData.BASE_API_URL}${configData.TVAULT.API}/${safeName}${configData.TVAULT.ADD_ADMINS}`,
        method: "POST",
        headers: {
          "Authorization": authToken,
          "Content-Type": "application/json"
        },
        json: updatePayload
      };
      request(payload, function (error, response, body) {
        if (response.statusCode && response.statusCode === 200) {
          return resolve(body);
        } else {
          logger.error("Error adding admins to safe: " + JSON.stringify(response));
          return reject({
            "error": "Error adding admins to safe",
            "details": response.body.message
          });
        }
      });

    });
  }
  return new Promise((resolve, reject) => {
    var adminsList = res.admins && res.admins.data && res.admins.data.policies;
    var safeAdmins = adminsList.filter(ele => (ele.permission === "admin" || ele.permission === "read") && ele.category === "manage");
    if ((!adminsList || adminsList.length === 0) || (safeAdmins.length === 0)) {
      return resolve({
        "error": "No admins found for safe",
      });
    }
    var processPromises = [];
    if (safeAdmins.length > 0) {
      for (var i = 0; i < safeAdmins.length; i++) {
        processPromises.push(processAdmins(safeAdmins[i]));
      }
    }

    Promise.all(processPromises)
      .then((result) => {
        logger.debug("result" + JSON.stringify(result));
        return resolve({ message: "All admins added to safe" });
      })
      .catch((error) => {
        logger.error("Promise.all failed to add admins to safe: " + JSON.stringify(error));
        return reject(error);
      });
  });
}

function getEnvDetails(environmentPayload, configData, authToken) {
  return new Promise((resolve, reject) => {
    if (!configData.TVAULT || !configData.TVAULT.IS_ENABLED) {
      return resolve({
        "error": "T-vault is not enabled",
      });
    }

    var payload = {
      uri: `${configData.BASE_API_URL}${configData.ENV_DETAILS}?service=${environmentPayload.service}&domain=${environmentPayload.domain}`,
      method: "GET",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json"
      }
    };
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200) {
        return resolve(body);
      } else {
        logger.error("Error getting environment details: " + JSON.stringify(response));
        return reject({
          "error": "Error getting environment details",
          "details": response.body.message
        });
      }
    });
  });
}

const safeExportable = {
  addSafe,
  createSafe,
  getAdmins,
  addAdminsToSafe,
  getEnvDetails
};

module.exports = safeExportable;

