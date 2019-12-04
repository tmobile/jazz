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

    logger.debug("getSafeDetails : " + JSON.stringify(payload))
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200 && body) {
        let data = JSON.parse(body).data
        logger.debug("Successfully get safe details for environments : " + JSON.stringify(response));
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
    let existingSafeUsers = [];
    let existingSafeUserPolicy = {};
    let processEachAddOrRemoveUser = [];
    if (safeDetails && safeDetails.users) {
      for (let key in safeDetails.users) {
        existingSafeUsers.push(key);
        existingSafeUserPolicy[key] = safeDetails.users[key].permission;
      }
    }

    //To make same email id as existing safe users. Other wise the comparison may worng.
    const adminUsersList = adminUsers.map(adminUser => removeSpecialCharecters(adminUser.userId));
    let adminUserPolicy = {};
    for (let key in adminUsers) {
      adminUserPolicy[removeSpecialCharecters(adminUsers[key].userId)] = adminUsers[key].permission === 'admin' ? 'write' : 'read';
    }
    const usersToBeAdded = adminUsersList.filter(adminUser => !existingSafeUsers.includes(adminUser));
    const usersToBeRemoved = existingSafeUsers.filter(existingUser => !adminUsersList.includes(existingUser));

    for (let key in usersToBeAdded) {
      processEachAddOrRemoveUser.push(addUserToSafe(safeDetails.name, usersToBeAdded[key], adminUserPolicy[usersToBeAdded[key]], configData, serviceId, authToken))
    }

    for (let key in usersToBeRemoved) {
      processEachAddOrRemoveUser.push(removeUserFromSafe(safeDetails.name, usersToBeRemoved[key], existingSafeUserPolicy[usersToBeRemoved[key]], configData, serviceId, authToken))
    }

    Promise.all(processEachAddOrRemoveUser)
      .then((result) => {
        logger.debug("processAddOrRemoveUsers Promise.all success: " + JSON.stringify(result));
        return resolve();
      })
      .catch((error) => {
        logger.error("processAddOrRemoveUsers promise.all failed" + JSON.stringify(error));
        return reject(error);
      });
  });
}

function addUserToSafe(safename, username, permission, configData, serviceId, authToken) {
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
        "username": username,
        "permission": permission
      }
    };

    logger.debug("addUserToSafe : " + JSON.stringify(payload))
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200 && body && body.data) {
        logger.debug("Successfully add user to the safe : " + JSON.stringify(response));
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

function removeUserFromSafe(safename, username, permission, configData, serviceId, authToken) {
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
        "username": username,
        "permission": permission
      }
    };

    logger.debug("removeUserFromSafe : " + JSON.stringify(payload))
    request(payload, function (error, response, body) {
      if (response.statusCode && response.statusCode === 200 && body && body.data) {
        logger.debug("Successfully deleted user from the safe : " + JSON.stringify(response));
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
      const environment = environments[key];
      if (environment.metadata && environment.metadata.safe)  
        processEachPromises.push(processEachPromise(environment.metadata.safe.name, configData, serviceId, authToken, adminUsers));
    }

    Promise.all(processEachPromises)
      .then((result) => {
        logger.debug("addOrRemoveAllAdminUsersToSafe promise.all success : " + JSON.stringify(result));
        return resolve();
      })
      .catch((error) => {
        logger.error("addOrRemoveAllAdminUsersToSafe promise.all failed" + JSON.stringify(error));
        return reject(error);
      });
  });
}

function processRemoveAllUsers(safeDetails, configData, serviceId, authToken) {
  return new Promise((resolve, reject) => {
    let existingSafeUsers = [];
    let existingSafeUserPolicy = {};
    let processEachRemoveUser = [];
    if (safeDetails && safeDetails.users) {
      for (let key in safeDetails.users) {
        existingSafeUsers.push(key);
        existingSafeUserPolicy[key] = safeDetails.users[key].permission;
      }
    }

    for (let key in existingSafeUsers) {
      processEachRemoveUser.push(removeUserFromSafe(safeDetails.name, existingSafeUsers[key], existingSafeUserPolicy[existingSafeUsers[key]], configData, serviceId, authToken))
    }

    Promise.all(processEachRemoveUser)
      .then((result) => {
        logger.debug("processRemoveAllUsers Promise.all success: " + JSON.stringify(result));
        return resolve();
      })
      .catch((error) => {
        logger.error("processRemoveAllUsers promise.all failed" + JSON.stringify(error));
        return reject(error);
      });
  });
}

function processEachRemoveAllUserPromise(safename, configData, serviceId, authToken) {
  return new Promise((resolve, reject) => {
    getSafeDetails(safename, configData, serviceId, authToken)
      .then((safeDetails) => { return processRemoveAllUsers(safeDetails, configData, serviceId, authToken) })
      .then((res) => {
        return resolve(res);
      })
      .catch((ex) => {
        return reject(ex);
      });
  });
}

function removeAllUsersFromSafe(environmentDetails, configData, serviceId, authToken) {
  return new Promise((resolve, reject) => {
    let environments = environmentDetails.environment
    let processEachPromises = [];

    for (let key in environments) {
      const environment = environments[key];
      if (environment.metadata && environment.metadata.safe)  
        processEachPromises.push(processEachRemoveAllUserPromise(environment.metadata.safe.name, configData, serviceId, authToken));
    }

    Promise.all(processEachPromises)
      .then((result) => {
        logger.debug("removeAllUsersFromSafe promise.all success : " + JSON.stringify(result));
        return resolve();
      })
      .catch((error) => {
        logger.error("removeAllUsersFromSafe promise.all failed" + JSON.stringify(error));
        return reject(error);
      });
  });
}

function removeSpecialCharecters(name) {
  let newName = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  return newName;
}

module.exports = {
  getSafeDetailsForEnvironments,
  addOrRemoveAllAdminUsersToSafe,
  removeAllUsersFromSafe
};
