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
const logger = require('./logger.js');

function getVaultToken(configData) {
  return new Promise((resolve, reject) => {
    let payload = {
      uri: `${configData.T_VAULT_API}${configData.T_VAULT_LOGIN_API}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      json: {
        "username": configData.T_VAULT_USERNAME,
        "password": configData.T_VAULT_PASSWORD
      }
    };

    logger.debug("login payload : " + JSON.stringify(payload));
    request(payload, function (error, response, body) {
      logger.debug("login response : " + JSON.stringify(response));
      if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body && body.client_token) {
        logger.info("Successfully logined to tvault: ");
        return resolve(body.client_token);
      } else {
        logger.error("Error in getting vault token. " + JSON.stringify(response));
        return reject({
          "error": "Error in getting vault token. " + response.body.errors
        });
      }
    });
  });
}

function createSafe(safeDetails, configData, vaultToken, onComplete) {

  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}`,
    method: "POST",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "path": `shared/${safeDetails.safeName.toLowerCase()}`,
      "data": {
        "name": `${safeDetails.safeName.toLowerCase()}`,
        "owner": `${safeDetails.owner}`,
        "ownerid": `${safeDetails.owner}`,
        "description": `${safeDetails.description}`
      }
    },
    rejectUnauthorized: false
  };


  logger.info("createSafe payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("createSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created safe: ");
      return onComplete(null, body);
    } else {
      logger.error("Error in creating safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating safe. " + response.body.errors
      });
    }
  });
}

function getSafeDetails(safeName, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}${configData.GET_SAFE_DETAILS}${safeName.toLowerCase()}`,
    method: "GET",
    headers: {
      "vault-token": vaultToken
    },
    rejectUnauthorized: false
  };

  logger.info("getSafeDetails payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("getSafeDetails response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201)) {
      const safeDetails = JSON.parse(body);
      logger.info("Successfully got safe details: ");
      return onComplete(null, safeDetails.data);
    } else {
      logger.error("Error in getting safe details. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in getting safe details. " + response.body.errors
      });
    }
  });
}

function deleteSafe(safeName, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}${configData.DELETE_SAFE}${safeName.toLowerCase()}`,
    method: "DELETE",
    headers: {
      "vault-token": vaultToken
    },
    rejectUnauthorized: false
  };

  logger.info("deleteSafe payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("deleteSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201)) {
      logger.info("Successfully deleted safe details: " + JSON.stringify(body));
      return onComplete(null, body.data);
    } else {
      logger.error("Error in deleting safe details. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in deleting safe details. " + response.body.errors
      });
    }
  });
}

function updateSafe(safeDetails, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}`,
    method: "PUT",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "path": `shared/${safeDetails.safeName.toLowerCase()}`,
      "data": {
        "name": `${safeDetails.safeName.toLowerCase()}`,
        "owner": `${safeDetails.owner}`,
        "description": `${safeDetails.description}`,
        "type": "shared"
      }
    },
    rejectUnauthorized: false
  };

  logger.info("updateSafe payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("updateSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully updated safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in updating safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in updating safe. " + response.body.errors
      });
    }
  });
}

function createUserInSafe(safeDetails, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}${configData.USER_IN_SAFE_API}`,
    method: "POST",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "path": `shared/${safeDetails.safeName.toLowerCase()}`,
      "access": `${global.globalConfig.ACCESS_LEVEL_FOR_USER_IN_SAFE}`,
      "username": `${safeDetails.userName}`
    },
    rejectUnauthorized: false
  };

  logger.info("createUserInSafe payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("createUserInSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created user in safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in creating user in safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating user in safe. " + response.body.errors
      });
    }
  });
}

function deleteUserFromSafe(safeDetails, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}${configData.USER_IN_SAFE_API}`,
    method: "DELETE",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "path": `shared/${safeDetails.safeName.toLowerCase()}`,
      "access": `${global.globalConfig.ACCESS_LEVEL_FOR_USER_IN_SAFE}`,
      "username": `${safeDetails.userName}`
    },
    rejectUnauthorized: false
  };

  logger.info("deleteUserFromSafe payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("deleteUserFromSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully deleted user from safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in deleting user from safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in deleting user from safe. " + response.body.errors
      });
    }
  });
}


function getRoleInSafe(safeDetails, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.GET_ROLE_DETAILS}${safeDetails.roleName}`,
    method: "GET",
    headers: {
      "vault-token": vaultToken
    },
    rejectUnauthorized: false
  };

  logger.info("getRoleInSafe payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("getRoleInSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully got role details: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in getting role details. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating role details. " + response.body.errors
      });
    }
  });
}

function createRoleInSafe(safeDetails, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}${configData.ROLE_IN_SAFE_API}`,
    method: "POST",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "path": `shared/${safeDetails.safeName.toLowerCase()}`,
      "access": `${global.globalConfig.ACCESS_LEVEL_IN_SAFE}`,
      "role": safeDetails.roleName
    },
    rejectUnauthorized: false
  };

  logger.info("createRoleInSafe payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("createRoleInSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created role in safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in creating role in safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating role in safe. " + response.body.errors
      });
    }
  });
}

function deleteRoleFromSafe(safeDetails, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}${configData.ROLE_IN_SAFE_API}`,
    method: "DELETE",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "path": `shared/${safeDetails.safeName.toLowerCase()}`,
      "access": `${global.globalConfig.ACCESS_LEVEL_IN_SAFE}`,
      "role": safeDetails.roleName
    },
    rejectUnauthorized: false
  };

  logger.info("deleteRoleFromSafe payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("deleteRoleFromSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully deleted role from safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in deleting role from safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in deleting role from safe. " + response.body.errors
      });
    }
  });
}

function createUserInVault(userDetails, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.USER_IN_VAULT}`,
    method: "POST",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "username": `${userDetails.userName}`,
      "password": `${userDetails.password}`,
      "policies": `${userDetails.policies}`
    },
    rejectUnauthorized: false
  };

  logger.info("createUserInVault payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("createUserInVault response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created user in vault: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in creating user in vault. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating user in vault. " + response.body.errors
      });
    }
  });
}

function deleteUserFromVault(userDetails, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.USER_IN_VAULT}/${userDetails.userName}`,
    method: "DELETE",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "username": `${userDetails.userName}`
    },
    rejectUnauthorized: false
  };

  logger.info("deleteUserFromVault payload : " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    logger.info("deleteUserFromVault response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully deleted user from vault: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in deleting user from vault. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in deleting user from vault. " + response.body.errors
      });
    }
  });
}

//---------------------------------
function createRoleInTvault(safeName, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.CREATE_ROLE}${safeName.toLowerCase()}`,
    method: "POST",
    headers: {
      "vault-token": vaultToken
    },
    json: {
      "auth_type": "iam",
      "role": "basic",
      "bound_iam_principal_arn": [
        `arn:aws:iam::${global.globalConfig.ACCOUNTID}:role/${global.globalConfig.INSTANCE_PREFIX}_basic_execution`
      ],
      "resolve_aws_unique_ids": "false"
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("createRoleInTvault response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created role in safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in creating role in safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating role in safe. " + response.body.errors
      });
    }
  });
}

module.exports = {
  getVaultToken,
  createSafe,
  getSafeDetails,
  deleteSafe,
  updateSafe,
  createUserInSafe,
  deleteUserFromSafe,
  getRoleInSafe,
  createRoleInSafe,
  deleteRoleFromSafe,
  createUserInVault,
  deleteUserFromVault
};
