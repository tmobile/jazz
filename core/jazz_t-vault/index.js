/**
API specification for jazz t-valut api
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const globalConfig = require("./config/global-config.json");
const utils = require("./components/util.js");


//Initializations
const errorHandler = errorHandlerModule();

global.globalConfig = globalConfig;

function handler(event, context, cb) {
  logger.init(event, context);

  try {
    const configData = configModule.getConfig(event, context);
    const resourcePath = event.resourcePath;

    if (event && !event.method) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Method cannot be empty")));
    }

    if (event && !event.principalId) {
      return cb(JSON.stringify(errorHandler.throwUnauthorizedError("User is not authorized to access this service. ")));
    }

    //SAFE
    if (event && event.method === 'POST' && resourcePath.endsWith("/safes")) {
      exportable.validateCreateSafeInput(event)
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.createSafe(event.body, configData, vaultToken))
        .then(result => {
          logger.info("Successfully created safes. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    if (event && event.method === 'GET' && resourcePath.endsWith("/safes/{safeName}")) {
      exportable.validateSafeInput(event)
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.getSafeDetails(event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully got safe details. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error getting safe details: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    if (event && event.method === 'PUT' && resourcePath.endsWith("/safes/{safeName}")) {
      exportable.validateSafeInput(event)
        .then(() => exportable.validateUpdateSafeInput(event))
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.updateSafe(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully updated safes. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error updating safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    if (event && event.method === 'DELETE' && resourcePath.endsWith("/safes/{safeName}")) {
      exportable.validateSafeInput(event)
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.deleteSafe(event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully deleted safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error deleting safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    //USER IN SAFE
    if (event && event.method === 'POST' && resourcePath.endsWith("/{safeName}/user")) {
      exportable.validateSafeInput(event)
        .then(() => exportable.validateUserInSafeInput(event))
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.createUserInSafe(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully created user in safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating user in safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    if (event && event.method === 'DELETE' && resourcePath.endsWith("/{safeName}/user")) {
      exportable.validateSafeInput(event)
        .then(() => exportable.validateUserInSafeInput(event))
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.deleteUserFromSafe(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully deleted user from safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error deleting user from safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    //ROLE IN SAFE
    if (event && event.method === 'GET' && resourcePath.endsWith("/{safeName}/role")) {
      exportable.validateSafeInput(event)
        .then(() => exportable.validateGetRoleInSafeInput(event))
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.getRoleInSafe(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully got role details from safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error getting role from safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    if (event && event.method === 'POST' && resourcePath.endsWith("/{safeName}/role")) {
      exportable.validateSafeInput(event)
        .then(() => exportable.validateRoleInSafeInput(event))
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.createRoleInSafe(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully created role in safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating role in safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    if (event && event.method === 'DELETE' && resourcePath.endsWith("/{safeName}/role")) {
      exportable.validateSafeInput(event)
        .then(() => utils.getVaultToken(configData))
        .then(() => exportable.validateRoleInSafeInput(event))
        .then((vaultToken) => exportable.deleteRoleFromSafe(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully deleted role from safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error deleting role from safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    //USER IN VAULT
    if (event && event.method === 'POST' && resourcePath.endsWith("{service_name}/user")) {
      exportable.validateUserInVaultInput(event)
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.createUserInVault(event.body, configData, vaultToken))
        .then(result => {
          logger.info("Successfully created user in vault. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating user in vault: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    if (event && event.method === 'DELETE' && resourcePath.endsWith("{service_name}/user")) {
      exportable.validateUserInVaultDeleteInput(event)
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.deleteUserFromVault(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully deleted user from vault. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error deleting user from vault: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    //ROLE IN VAULT
    if (event && event.method === 'POST' && resourcePath.endsWith("/{service_name}/role")) {
      exportable.validateSafeInput(event)
        .then(() => exportable.validateUserInSafeInput(event))
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.createUserInSafe(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully created user in safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error creating user in safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

    if (event && event.method === 'DELETE' && resourcePath.endsWith("{service_name}/role")) {
      exportable.validateSafeInput(event)
        .then(() => exportable.validateUserInSafeInput(event))
        .then(() => utils.getVaultToken(configData))
        .then((vaultToken) => exportable.deleteUserFromSafe(event.body, event.path.safeName, configData, vaultToken))
        .then(result => {
          logger.info("Successfully deleted user from safe. ");
          return cb(null, responseObj(result, event.body));
        })
        .catch(err => {
          logger.error("Error deleting user from safes: " + JSON.stringify(err));
          if (err.errorType === "inputError") return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
          else return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        });
    }

  } catch (e) {
    cb(JSON.stringify(errorHandler.throwInternalServerError("Something went wrong. Please try again later.")));
  }
}

function validateCreateSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (exportable.isEmpty(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_SAFE_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

function validateUpdateSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (exportable.isEmpty(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    //  let missingFieldList = globalConfig.CREATE_SAFE_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    // if (missingFieldList.length > 0) return reject({"errorType" : "inputError", "message" : "Following field(s) are required - " + missingFieldList.join(", ")})
    return resolve();
  });
}

function validateSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.path) return reject({ "errorType": "inputError", "message": "Input path cannot be empty" });
    if (exportable.isEmpty(event.path)) return reject({ "errorType": "inputError", "message": "Input path cannot be empty" });
    if (!event.path.safeName) return reject({ "errorType": "inputError", "message": "Following field(s) are required in path- " + event.path.safeName });
    return resolve();
  });
}

function validateUserInSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (exportable.isEmpty(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_USER_IN_SAFE_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

function validateRoleInSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (exportable.isEmpty(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_ROLE_IN_SAFE_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

function validateGetRoleInSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.query) return reject({ "errorType": "inputError", "message": "Query cannot be empty" });
    if (exportable.isEmpty(event.query)) return reject({ "errorType": "inputError", "message": "Query cannot be empty" });
    if (!event.query.roleName) return reject({ "errorType": "inputError", "message": "Following field(s) are required in query- " + event.query.roleName });
    return resolve();
  });
}

function validateUserInVaultInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (exportable.isEmpty(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (!event.body.userName) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + event.body.userName });
    return resolve();
  });
}

function validateUserInVaultDeleteInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (exportable.isEmpty(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_USER_IN_VAULT_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

const isEmpty = (obj) => {
  if (obj == null) return true;
  if (obj.length > 0) return false;
  if (obj.length === 0) return true;
  if (typeof obj !== "object") return true;
  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
};

function createSafe(safeDetails, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    utils.createSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function getSafeDetails(safeName, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    utils.getSafeDetails(safeName, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function deleteSafe(safeName, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    utils.deleteSafe(safeName, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function updateSafe(safeDetails, safeName, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safeName = safeName;
    utils.updateSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function createUserInSafe(safeDetails, safeName, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safeName = safeName;
    utils.createUserInSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function deleteUserFromSafe(safeDetails, safeName, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safeName = safeName;
    utils.deleteUserFromSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function getRoleInSafe(safeDetails, safeName, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safeName = safeName;
    utils.getRoleInSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function createRoleInSafe(safeDetails, safeName, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safeName = safeName;
    utils.createRoleInSafe(safeDetails, configData, vaultToken, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

function deleteRoleFromSafe(safeDetails, safeName, configData, vaultToken) {
  return new Promise((resolve, reject) => {
    safeDetails.safeName = safeName;
    utils.deleteRoleFromSafe(safeDetails, configData, vaultToken, function (err, data) {
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
    utils.createUserInVault(userDetails, configData, vaultToken, function (err, data) {
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
    utils.createUserInVault(userDetails, configData, vaultToken, function (err, data) {
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
  validateCreateSafeInput,
  validateSafeInput,
  validateUpdateSafeInput,
  validateUserInSafeInput,
  validateGetRoleInSafeInput,
  validateRoleInSafeInput,
  validateUserInVaultInput,
  validateUserInVaultDeleteInput,
  isEmpty,
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