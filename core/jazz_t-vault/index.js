// =========================================================================
// Copyright © 2019 T-Mobile USA, Inc.
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
Specification for APIs to manage secrets using Jazz & T-Vault
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const globalConfig = require("./config/global-config.json");
const vault = require("./components/utils/vault.js");
const validations = require("./components/utils/validations.js");


//Initializations
const errorHandler = errorHandlerModule();

global.globalConfig = globalConfig;

function handler(event, context, cb) {
  logger.init(event, context);

  try {
    const configData = configModule.getConfig(event, context);
    const resourcePath = event.resourcePath;

    logger.debug("resourcePath: " + resourcePath);

    if (event && !event.method) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Method cannot be empty")));
    }

    if (!event.principalId) {
      return cb(JSON.stringify(errorHandler.throwUnauthorizedError("You aren't authorized to access this service")));
    }

    //SAFE
    if (event && event.method === 'POST' && resourcePath.endsWith("/safes")) {
      validations.validateCreateSafeInput(event)
        .then(() => { return validations.genericInputValidation(event.body) })
        .then(() => { return validations.validateFieldLength(event.body) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.createSafe(event.body, configData, vaultToken) })
        .then((result) => {
          logger.info("Successfully created safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating safe: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    else if (event && event.method === 'GET' && resourcePath.endsWith("/safes/{safename}")) {
      validations.validateSafeInput(event)
        .then(() => { return validations.genericInputValidation(event.path) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.getSafeDetails(event.path.safename, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully got safe details");
          return cb(null, responseObj(result, event.path));
        })
        .catch(err => {
          logger.error("Error getting safe details: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    else if (event && event.method === 'PUT' && resourcePath.endsWith("/safes/{safename}")) {
      validations.validateSafeInput(event)
        .then(() => { return validations.validateUpdateSafeInput(event) })
        .then(() => { return validations.genericInputValidation(event.body) })
        .then(() => { return validations.genericInputValidation(event.path) })
        .then(() => { return validations.validateFieldLength(event.body) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.updateSafe(event.body, event.path.safename, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully updated safe");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error updating safe: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    else if (event && event.method === 'DELETE' && resourcePath.endsWith("/safes/{safename}")) {
      validations.validateSafeInput(event)
        .then(() => { return validations.genericInputValidation(event.path) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.deleteSafe(event.path.safename, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully deleted safe");
          return cb(null, responseObj(result, event.path));
        })
        .catch(err => {
          logger.error("Error deleting safe: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    //USER IN SAFE
    else if (event && event.method === 'POST' && resourcePath.endsWith("/{safename}/user")) {
      validations.validateSafeInput(event)
        .then(() => { return validations.validateUserInSafeInput(event) })
        .then(() => { return validations.genericInputValidation(event.body) })
        .then(() => { return validations.genericInputValidation(event.path) })
        .then(() => { return validations.validateFieldLength(event.body) })
        .then(() => { return validations.validateEnum(event.body) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.createUserInSafe(event.body, event.path.safename, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully created user in safe");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating user in safe: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    else if (event && event.method === 'DELETE' && resourcePath.endsWith("/{safename}/user")) {
      validations.validateSafeInput(event)
        .then(() => { return validations.validateUserInSafeInput(event) })
        .then(() => { return validations.genericInputValidation(event.body) })
        .then(() => { return validations.genericInputValidation(event.path) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.deleteUserFromSafe(event.body, event.path.safename, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully deleted user from safe");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error deleting user from safe: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    //ROLE IN SAFE
    else if (event && event.method === 'GET' && resourcePath.endsWith("/{safename}/role")) {
      validations.validateSafeInput(event)
        .then(() => { return validations.validateGetRoleInSafeInput(event) })
        .then(() => { return validations.genericInputValidation(event.path) })
        .then(() => { return validations.validateRoleArn(event.query.arn) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.getRoleInSafe(event.query.arn, event.path.safename, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully got role details from safe");
          return cb(null, responseObj(result, event.query));
        })
        .catch(err => {
          logger.error("Error getting role from safe: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    else if (event && event.method === 'POST' && resourcePath.endsWith("/{safename}/role")) {
      validations.validateSafeInput(event)
        .then(() => { return validations.genericInputValidation(event.body) })
        .then(() => { return validations.genericInputValidation(event.path) })
        .then(() => { return validations.validateRoleInSafeInput(event) })
        .then(() => { return validations.validateRoleArn(event.body.arn) })
        .then(() => { return validations.validateEnum(event.body) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.createRoleInSafe(event.body, event.path.safename, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully created role in safe");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating role in safe: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    else if (event && event.method === 'DELETE' && resourcePath.endsWith("/{safename}/role")) {
      validations.validateSafeInput(event)
        .then(() => { return validations.validateDeleteRoleInSafeInput(event) })
        .then(() => { return validations.genericInputValidation(event.body) })
        .then(() => { return validations.genericInputValidation(event.path) })
        .then(() => { return validations.validateRoleArn(event.body.arn) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.deleteRoleFromSafe(event.body, event.path.safename, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully deleted role from safe");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error deleting role from safe: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    //USER IN VAULT
    else if (event && event.method === 'POST' && resourcePath.endsWith("/t-vault/user")) {
      validations.validateUserInVaultInput(event)
        .then(() => { return validations.genericInputValidation(event.body) })
        .then(() => { return validations.validateFieldLength(event.body) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.createUserInVault(event.body, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully created user in vault");
          if (event.body.password) delete event.body.password;
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating user in vault: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    else if (event && event.method === 'DELETE' && resourcePath.endsWith("/t-vault/user")) {
      validations.validateUserInVaultDeleteInput(event)
        .then(() => { return validations.genericInputValidation(event.body) })
        .then(() => { return vault.getVaultToken(configData) })
        .then((vaultToken) => { return exportable.deleteUserFromVault(event.body, configData, vaultToken) })
        .then(result => {
          logger.info("Successfully deleted user from vault");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error deleting user from vault: " + JSON.stringify(err));
          if (err.errorType && err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.error)));
        });
    }

    else {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("The requested method is not supported.")));
    }
  } catch (e) {
    logger.error("Unknown internal error occured: " + JSON.stringify(e));
    cb(JSON.stringify(errorHandler.throwInternalServerError("Something went wrong. Please try again later.")));
  }
}


function createSafe(safeDetails, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    vault.createSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function getSafeDetails(safename, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    vault.getSafeDetails(safename, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function deleteSafe(safename, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    vault.deleteSafe(safename, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function updateSafe(safeDetails, safename, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safename = safename;
    vault.updateSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function createUserInSafe(safeDetails, safename, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safename = safename;
    vault.createUserInSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function deleteUserFromSafe(safeDetails, safename, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safename = safename;
    vault.deleteUserFromSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function getRoleInSafe(arn, safename, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    let safeDetails = {};
    safeDetails.safename = safename;
    safeDetails.arn = arn;
    vault.getRoleInSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function createRoleInSafe(safeDetails, safename, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safename = safename;
    vault.createRole(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function deleteRoleFromSafe(safeDetails, safename, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safename = safename;
    vault.deleteRoleFromSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function createUserInVault(userDetails, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    vault.createUserInVault(userDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function deleteUserFromVault(userDetails, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    vault.deleteUserFromVault(userDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

const exportable = {
  handler,
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

module.exports = exportable;
