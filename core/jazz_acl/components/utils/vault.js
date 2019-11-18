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


function getSafeDetailsForEnvironments(safename, configData, serviceId, adminUsers, authToken) {
  return new Promise((resolve, reject) => {
    logger.info("getSafeDetailsForEnvironments");
    getSafeDetails(safename, configData, serviceId, authToken)
      .then((safeDetails) => { return processAddOrRemoveUsers(safeDetails, configData, serviceId, adminUsers, authToken) })
      .then((res) => {
        return resolve(res);
      })
      .catch((ex) => {
        return reject(ex);
      });
  });
}

function getSafeDetails(safename, configData, serviceId, authToken) {
  return new Promise((resolve, reject) => {
    logger.info("getSafeDetails");
    let payload = {
      uri: `${configData.BASE_API_URL}${global.globalConfig.API.SAFE}${safename}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authToken,
        "Jazz-Service-ID": serviceId
      }
    };

    logger.info("getSafeDetails : " + JSON.stringify(payload))
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200 && body) {
        let data = JSON.parse(body).data
        logger.info("Successfully get safe details for environments : " + JSON.stringify(response));
        return resolve(data);
      } else {
        logger.error("Error in getting safe details for environments: " + JSON.stringify(response));
        return reject({
          "error": `Error in getting safe details for the safe ${safename}: ${JSON.stringify(response.error)}`
        });
      }
    });
  });
}

function processAddOrRemoveUsers(safeDetails, configData, serviceId, adminUsers, authToken) {
  return new Promise((resolve, reject) => {
    logger.info("processAddOrRemoveUsers")
    let existingSafeUsers = [];
    let processEachAddOrRemoveUser = [];
    if (safeDetails && safeDetails.users) {
      for (let user in safeDetails.users) {
        existingSafeUsers.push(user);
      }
    }

    logger.info("existingSafeUsers " + existingSafeUsers)
    let usersTobeAdded = adminUsers.filter(adminUser => !existingSafeUsers.includes(adminUser));
    let usersTobeRemoved = existingSafeUsers.filter(existingUser => !adminUsers.includes(existingUser));
    logger.info("usersTobeAdded " + usersTobeAdded)
    logger.info("usersTobeRemoved " + usersTobeRemoved)

    for (let key in usersTobeAdded) {
      processEachAddOrRemoveUser.push(addUserToSafe(safeDetails.name, usersTobeAdded[key], configData, serviceId, authToken))
    }

    for (let key in usersTobeRemoved) {
      processEachAddOrRemoveUser.push(removeUserFromSafe(safeDetails.name, usersTobeRemoved[key], configData, serviceId, authToken))
    }

    Promise.all(processEachAddOrRemoveUser)
      .then((result) => {
        logger.info("processAddOrRemoveUsers Promise.all success: " + JSON.stringify(result));
        return resolve();
      })
      .catch((error) => {
        logger.error("processAddOrRemoveUsers promise.all failed" + JSON.stringify(error));
        return reject(error);
      });
  });
}

function addUserToSafe(safename, userame, configData, serviceId, authToken) {
  return new Promise((resolve, reject) => {
    let payload = {
      uri: `${configData.BASE_API_URL}${global.globalConfig.API.SAFE}${safename}${global.globalConfig.API.USER_TO_SAFE}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authToken,
        "Jazz-Service-ID": serviceId
      },
      json: {
        "username": userame
      }
    };

    logger.info("addUserToSafe : " + JSON.stringify(payload))
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200 && body && body.data) {
        logger.info("Successfully add user to the safe : " + JSON.stringify(response));
        return resolve(body.data);
      } else {
        logger.error("Error in adding user to the safe : " + JSON.stringify(response));
        return reject({
          "error": `Error in adding user ${username} to the safe ${safename} :  ${JSON.stringify(response.error)}`
        });
      }
    });
  });
}

function removeUserFromSafe(safename, username, configData, serviceId, authToken) {
  return new Promise((resolve, reject) => {
    let payload = {
      uri: `${configData.BASE_API_URL}${global.globalConfig.API.SAFE}${safename}${global.globalConfig.API.USER_TO_SAFE}`,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authToken,
        "Jazz-Service-ID": serviceId
      },
      json: {
        "username": username
      }
    };

    logger.info("removeUserFromSafe : " + JSON.stringify(payload))
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200 && body && body.data) {
        logger.info("Successfully deleted user from the safe : " + JSON.stringify(response));
        return resolve(body.data);
      } else {
        logger.error("Error in deleting user from the safe : " + JSON.stringify(response));
        return reject({
          "error": `Error in deleting user ${username} from the safe ${safename} :  ${JSON.stringify(response.error)}`
        });
      }
    });
  });
}

function processEachPromise(safename, configData, serviceId, authToken, adminUsers) {
  return new Promise((resolve, reject) => {
    logger.info("processEachPromise");
    getSafeDetailsForEnvironments(safename, configData, serviceId, adminUsers, authToken)
      .then((res) => {
        return resolve(res);
      })
      .catch((ex) => {
        return reject(ex);
      });
  });
}

function addOrRemoveAllAdminUsersToSafe(environmentDetails, configData, serviceId, authToken, adminUsers) {
  return new Promise((resolve, reject) => {
    let environments = environmentDetails.environment
    let processEachPromises = [];

    for (let key in environments) {
      let environment = environments[key];
      logger.info("environment : " + JSON.stringify(environment));
      if (environment.metadata && environment.metadata.SAFE_DETAILS)  //TODO to check the case
        processEachPromises.push(processEachPromise(environment.metadata.SAFE_DETAILS.name, configData, serviceId, authToken, adminUsers));
    }

    logger.info("processEachPromise ----- " + JSON.stringify(processEachPromises))
    Promise.all(processEachPromises)
      .then((result) => {
        logger.info("addOrRemoveAllAdminUsersToSafe promise.all success : " + JSON.stringify(result));
        return resolve();
      })
      .catch((error) => {
        logger.error("addOrRemoveAllAdminUsersToSafe promise.all failed" + JSON.stringify(error));
        return reject(error);
      });
  });
}

module.exports = {
  getSafeDetailsForEnvironments,
  addOrRemoveAllAdminUsersToSafe
};
