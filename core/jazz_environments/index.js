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

/**
  CRUD APIs for Environments
  @author:
  @version: 1.0
**/
const _ = require("lodash");

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const crud = require("./components/crud")();
const validateUtils = require("./components/validation")();
const deployDescrValidatorMod = require('./components/validate-sls-yml.js');

var errorHandler = errorHandlerModule();

var handler = (event, context, cb) => {
  //Initializations
  var config = configModule.getConfig(event, context);
  logger.init(event, context);
  logger.info("event:" + JSON.stringify(event));
  global.config = config;
  global.userId = event.principalId;
  global.authorization = event.headers.Authorization;
  var env_tableName = global.config.services_environment_table;
  var indexName = global.config.services_environment_index;

  try {
    genericInputValidation(event)
      .then(function (result) {
        // 1: GET environment by id and environent (/services/{service_id}/{environment})
        if (event.method === "GET" && (event.query || event.path)) {
          validateGetInput(event)
            .then((result) => getServiceEnvironmentByParams(result, indexName, env_tableName))
            .then(function (result) {
              var environment_obj = result.data
              logger.debug("List of environments:" + JSON.stringify(environment_obj));
              return cb(null, responseObj(environment_obj, result.input));
            })
            .catch(function (err) {
              logger.error("Error while getting list of environments:" + JSON.stringify(err));
              if (err.result === "notFoundError") {
                return cb(JSON.stringify(errorHandler.throwNotFoundError(err.message)));
              } else {
                return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected error occurred.")));
              }
            });
        }

        // Update environment
        // 2: PUT environment by environment_logical_id and service and domain as query params
        //(/environment/{environment_logical_id}?service=service&domain=domain)
        if (
          event.method === "PUT" && event.path && Object.keys(event.path).length > 0 &&
          event.path.environment_id && event.query && Object.keys(event.query).length > 0 &&
          event.query.service && event.query.domain
        ) {
          environment_id = event.path.environment_id.toLowerCase();
          service = event.query.service.toLowerCase();
          domain = event.query.domain.toLowerCase();

          var update_environment_payload = event.body;

          if (update_environment_payload.deployment_descriptor) { // If deployment descriptor is present then validate
            try {
              const outstandingResources = deployDescrValidatorMod.validateResources(update_environment_payload.deployment_descriptor);
              if (outstandingResources.length) {
                let message =  `Invalid deployment_descriptor. The resource types not allowed ${outstandingResources}`
                return cb(JSON.stringify(errorHandler.throwInputValidationError(message)));
              } else {
                const outstandingEvents = deployDescrValidatorMod.validateEvents(update_environment_payload.deployment_descriptor);
                if (outstandingEvents.length) { // some events that are not allowed were found so let's reject the request
                  let message =  `Invalid deployment_descriptor. The event types not allowed ${outstandingEvents}`
                  return cb(JSON.stringify(errorHandler.throwInputValidationError(message)));
                } else {
                  const outstandingActions = deployDescrValidatorMod.validateActions(update_environment_payload.deployment_descriptor);
                  if (outstandingActions.length) {
                    let message =  `Invalid deployment_descriptor. The action types not allowed ${outstandingActions}`
                    return cb(JSON.stringify(errorHandler.throwInputValidationError(message)));
                  }
                }
              }
            } catch (e) {
              let message =  `Invalid deployment_descriptor format. Nested exception is ${e}`;
              return cb(JSON.stringify(errorHandler.throwInputValidationError(message)));
            }
          }

          validateUpdateInput(update_environment_payload, environment_id)
            .then(() => validateEnvironmentExists(env_tableName, indexName, service, domain, environment_id))
            .then((result) => updateServiceEnvironment(env_tableName, update_environment_payload, result.data))
            .then(function (result) {
              logger.info("Environment update success:" + JSON.stringify(result));
              return cb(null, responseObj(result, update_environment_payload));
            })
            .catch(function (err) {
              logger.error("Error while updating environment catalog:" + JSON.stringify(err));
              if (err.errorType) {
                // error has already been handled and processed for API gateway
                return cb(JSON.stringify(err));
              } else {
                if (err.result === "inputError") {
                  return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
                }
                return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected error occurred.")));
              }
            });
        }

        // Create new service environment
        // 6: POST a service
        if (event.method === "POST" && event.body) {
          var environment_data = event.body;
          logger.info("Create new environment with the following data:" + JSON.stringify(environment_data));

          validateEnvironmentData(env_tableName, environment_data, indexName)
            .then(() => addNewEnvironment(environment_data, env_tableName))
            .then(function (result) {
              logger.info("New environment created:" + JSON.stringify(result));
              return cb(null, responseObj(result, environment_data));
            })
            .catch(function (err) {
              logger.error("error while creating new environment:" + JSON.stringify(err));
              if (err.errorType) {
                // error has already been handled and processed for API gateway
                return cb(JSON.stringify(err));
              } else {
                if (err.result === "inputError") {
                  return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
                }

                return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected error occurred.")));
              }
            });
        }
      })
      .catch(function (error) {
        if (error.result === "inputError") {
          return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
        } else if (error.result === "unauthorized") {
          return cb(JSON.stringify(errorHandler.throwUnauthorizedError(error.message)));
        } else {
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected error occurred.")))
        }
      })

  } catch (e) {
    logger.error("Internal server error:" + JSON.stringify(e));
    return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected error occurred")));
  }
};

var genericInputValidation = function (event) {
  return new Promise((resolve, reject) => {
    // event.method cannot be empty, throw error
    if (!event || !event.method) {
      reject({
        result: "inputError",
        message: "method cannot be empty"
      })
    }

    if (event.method === "GET" && Object.keys(event.query).length === 0 && Object.keys(event.path).length === 0) {
      reject({
        result: "inputError",
        message: "GET API can be called only with following query params: domain and service OR GET API can be called only with environment_logical_id as path param along with the following query parameters: 'domain' and 'service'."
      });
    }

    if (event.method === "GET" && (event.query && (!event.query.service || !event.query.domain))) {
      reject({
        result: "inputError",
        message: "GET API requires the following query params: domain and service"
      });
    }

    if (event.method === "GET" && event.query && Object.keys(event.query).length > 0) {
      if (!event.query.domain || !event.query.service) {
        reject({
          result: "inputError",
          message: "GET API can be called only with following query params: domain and service"
        });
      }
    }

    if (
      (event.method === "PUT" && (event.path && !event.path.environment_id)) ||
      (event.method === "PUT" && (event.query && (!event.query.domain || !event.query.service)))
    ) {
      reject({
        result: "inputError",
        message: "PUT API can be called only with following path param : environment_logical_id AND service name and domain as query params"
      });
    }

    // throw bad request error if body not specified for POST
    if (event && event.method === "POST" && !event.body) {
      reject({
        result: "inputError",
        message: "Environment data is required for creating an environment"
      });
    }

    // throw bad request error if body not specified for PUT
    if (event && event.method === "PUT" && !event.body) {
      reject({
        result: "inputError",
        message: "Environment data is required for updating an environment"
      });
    }

    // throw bad request error if user is unauthorized for GET
    if (!event.principalId) {
      reject({
        result: "unauthorized",
        message: "Unauthorized."
      });
    }

    resolve();
  });
};

var validateGetInput = function (event) {
  return new Promise((resolve, reject) => {
    var query;
    if (
      event.query && (event.query.domain && event.query.service) &&
      (event.path && !event.path.environment_id)
    ) {
      service = event.query.service.toLowerCase();
      domain = event.query.domain.toLowerCase();
      query = {
        service: service,
        domain: domain
      };
      resolve(query);
    } else if (
      event.path &&
      event.path.environment_id &&
      (event.query && (event.query.domain && event.query.service))
    ) {
      environment_id = event.path.environment_id.toLowerCase();
      service = event.query.service.toLowerCase();
      domain = event.query.domain.toLowerCase();
      query = {
        service: service,
        domain: domain,
        logical_id: environment_id
      };
      resolve(query);
    } else {
      reject(errorHandler.throwInputValidationError("Invalid set of parameters for the GET API"));
    }
  });
};

var getServiceEnvironmentByParams = function (query, indexName, tableName) {
  return new Promise((resolve, reject) => {
    validateUtils.validateEnvironment(tableName, indexName, query.service, query.domain, query.logical_id, function onValidate(error, data) {
      if (error) {
        reject(error);
      } else {
        var output = {
          data: data.data,
          input: query
        }
        resolve(output);
      }
    });
  });
}

var validateEnvironmentData = function (tableName, environment_data, indexName) {
  return new Promise((resolve, reject) => {
    validateUtils.validateCreatePayload(tableName, environment_data, indexName, function onValidate(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};

var addNewEnvironment = function (environment_data, tableName) {
  return new Promise((resolve, reject) => {
    crud.create(environment_data, tableName, function onAddition(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};

var validateUpdateInput = function (update_payload, environment_id) {
  return new Promise((resolve, reject) => {
    validateUtils.validateUpdatePayload(update_payload, environment_id, function onValidate(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  })
};

var validateEnvironmentExists = function (tableName, indexName, service, domain, environment_id) {
  return new Promise((resolve, reject) => {
    crud.get(tableName, indexName, service, domain, environment_id.toLowerCase(), function onServiceGet(error, data) {
      if (error) {
        reject(error);
      } else {
        var environment_obj = data.environment[0];

        // throw error if no environment exists
        if (environment_obj) {
          environment_key_id = environment_obj.id;
          var result = {
            result: "success",
            message: "Environment exists",
            data: environment_key_id
          };
          resolve(result);
        } else {
          // returning inputError
          var result = {
            result: "inputError",
            message: "Cannot find environment  with id: '" +
              environment_id +
              "', for service:'" +
              service +
              "', domain:'" +
              domain +
              "' to update"
          }
          reject(result);
        }
      }
    });
  });
};

var updateServiceEnvironment = function (tableName, update_payload, environment_key_id) {
  return new Promise((resolve, reject) => {
    crud.update(tableName, update_payload, environment_key_id, function onUpdate(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};

module.exports = {
  genericInputValidation: genericInputValidation,
  validateGetInput: validateGetInput,
  getServiceEnvironmentByParams: getServiceEnvironmentByParams,
  validateEnvironmentData: validateEnvironmentData,
  addNewEnvironment: addNewEnvironment,
  validateUpdateInput: validateUpdateInput,
  validateEnvironmentExists: validateEnvironmentExists,
  updateServiceEnvironment: updateServiceEnvironment,
  handler: handler
}
