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
        "Content-Type" : "application/json"
      },
      body: {
        "username": configData.T_VAULT_USERNAME,
        "password": configData.T_VAULT_PASSWORD
      }
    };

    logger.info("login payload : " + JSON.stringify(payload));
    request(payload, function (error, response, body) {
      logger.info("login response : " + JSON.stringify(response));
      if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body && body.client_token) {
        logger.info("Success login: " + JSON.stringify(body));
        return resolve(body.client_token);
      } else {
        logger.error("Error in getting vault token. " + JSON.stringify(response));
        return reject({
          "error": "Error in getting vault token. " + JSON.stringify(response),
          "details": error
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
    body: {
      "path": `shared/${safeDetails.safeName}`,
      "data": {
        "name": `${safeDetails.safeName}`,
        "owner": `${safeDetails.owner}`,
        "description": `${safeDetails.description}`,
        "type": "shared"
      }
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("createSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in creating safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating safe. " + JSON.stringify(response),
        "details": error
      });
    }
  });
}

function getSafeDetails(safeName, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}${configData.GET_SAFE_DETAILS}${safeName}`,
    method: "GET",
    headers: {
      "vault-token": vaultToken
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("getSafeDetails response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body && body.data) {
      logger.info("Successfully got safe details: " + JSON.stringify(body));
      return onComplete(null, body.data);
    } else {
      logger.error("Error in getting safe details. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in getting safe details. " + JSON.stringify(response),
        "details": error
      });
    }
  });
}

function deleteSafe(safeName, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.SAFE_API}${configData.DELETE_SAFE}${safeName}`,
    method: "DELETE",
    headers: {
      "vault-token": vaultToken
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("deleteSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201)) {
      logger.info("Successfully deleted safe details: " + JSON.stringify(body));
      return onComplete(null, body.data);
    } else {
      logger.error("Error in deleting safe details. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in deleting safe details. " + JSON.stringify(response),
        "details": error
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
    body: {
      "path": `shared/${safeDetails.safeName}`,
      "data": {
        "name": `${safeDetails.safeName}`,
        "owner": `${safeDetails.owner}`,
        "description": `${safeDetails.description}`,
        "type": "shared"
      }
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("updateSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully updated safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in updating safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in updating safe. " + JSON.stringify(response),
        "details": error
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
    body: {
      "path": `shared/${safeDetails.safeName}`,
      "access": `${global.globalConfig.ACCESS_LEVEL_FOR_USER_IN_SAFE}`,
      "username": `${safeDetails.userName}`
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("createUserInSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created user in safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in creating user in safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating user in safe. " + JSON.stringify(response),
        "details": error
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
    body: {
      "path": `shared/${safeDetails.safeName}`,
      "access": `${global.globalConfig.ACCESS_LEVEL_FOR_USER_IN_SAFE}`,
      "username": `${safeDetails.userName}`
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("deleteUserFromSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully deleted user from safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in deleting user from safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in deleting user from safe. " + JSON.stringify(response),
        "details": error
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

  request(payload, function (error, response, body) {
    logger.info("getRoleInSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully got role details: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in getting role details. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating role details. " + JSON.stringify(response),
        "details": error
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
    body: {
      "path": `shared/${safeDetails.safeName}`,
      "access": `${global.globalConfig.ACCESS_LEVEL_IN_SAFE}`,
      "role": safeDetails.roleName
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("createRoleInSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created role in safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in creating role in safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating role in safe. " + JSON.stringify(response),
        "details": error
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
    body: {
      "path": `shared/${safeDetails.safeName}`,
      "access": `${global.globalConfig.ACCESS_LEVEL_IN_SAFE}`,
      "role": safeDetails.roleName
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("deleteRoleFromSafe response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully deleted role from safe: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in deleting role from safe. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in deleting role from safe. " + JSON.stringify(response),
        "details": error
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
    body: {
      "username": `${userDetails.userName}`,
      "password": `${userDetails.password}`,
      "policies": `${userDetails.policies}`
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("createUserInVault response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully created user in vault: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in creating user in vault. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in creating user in vault. " + JSON.stringify(response),
        "details": error
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
    body: {
      "username": `${userDetails.userName}`
    },
    rejectUnauthorized: false
  };

  request(payload, function (error, response, body) {
    logger.info("deleteUserFromVault response : " + JSON.stringify(response));
    if (response.statusCode && (response.statusCode === 200 || response.statusCode === 201) && body) {
      logger.info("Successfully deleted user from vault: " + JSON.stringify(body));
      return onComplete(null, body);
    } else {
      logger.error("Error in deleting user from vault. " + JSON.stringify(response));
      return onComplete({
        "error": "Error in deleting user from vault. " + JSON.stringify(response),
        "details": error
      });
    }
  });
}

//---------------------------------
function createRoleInTvault(safeName, configData, vaultToken, onComplete) {
  let payload = {
    uri: `${configData.T_VAULT_API}${configData.CREATE_ROLE}${safeName}`,
    method: "POST",
    headers: {
      "vault-token": vaultToken
    },
    body: {
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
        "error": "Error in creating role in safe. " + JSON.stringify(response),
        "details": error
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
