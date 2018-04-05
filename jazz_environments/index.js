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

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const utils = require("./components/utils.js")(); //Import the utils module.
const crud = require("./components/crud")(); //Import the utils module.
const request = require("request");
const async = require("async");
const _ = require("lodash");
const validateUtils = require("./components/validation")();

module.exports.handler = (event, context, cb) => {

  //Initializations
  var errorHandler = errorHandlerModule();
  var config = configObj(event);
  logger.init(event, context);
  logger.info("event:"+JSON.stringify(event));
  global.config = config;

  try {
        // event.method cannot be empty, throw error
        if (event === undefined || event.method === undefined) {
            cb(JSON.stringify(errorHandler.throwInputValidationError("method cannot be empty")));
        }

        // get environment_id from the path
        var service;
        var domain;
        var environment_id;
        if (
            event !== undefined &&
            event.path !== undefined &&
            event.path.environment_id !== undefined &&
            Object.keys(event.path).length > 0 &&
            event.path.environment_id !== ""
        ) {
            environment_id = event.path.environment_id;
        }

        if (event.method === "GET" && Object.keys(event.query).length === 0 && Object.keys(event.path).length === 0) {
            return cb(
                JSON.stringify(
                    errorHandler.throwInputValidationError(
                        "GET API can be called only with following query params: domain and service OR GET API can be called only with environment_logical_id as path param along with the following query parameters: 'domain' and 'service'."
                    )
                )
            );
        }

        if (event.method === "GET" && (event.query !== undefined && (event.query.service === undefined || event.query.domain === undefined))) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("GET API requires the following query params: domain and service")));
        }

        if (event.method === "GET" && event.query !== undefined && Object.keys(event.query).length > 0) {
            if (event.query.domain === undefined || event.query.service === undefined) {
                return cb(JSON.stringify(errorHandler.throwInputValidationError("GET API can be called only with following query params: domain and service")));
            }
        }

        if (
            (event.method === "PUT" && (event.path !== undefined && event.path.environment_id === undefined)) ||
            (event.method === "PUT" && (event.query !== undefined && (event.query.domain === undefined || event.query.service === undefined)))
        ) {
            return cb(
                JSON.stringify(
                    errorHandler.throwInputValidationError(
                        "PUT API can be called only with following path param : environment_logical_id AND service name and domain as query params"
                    )
                )
            );
        }

        // throw bad request error if body not specified for POST
        if (event !== undefined && event.method === "POST" && event.body === undefined) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Environment data is required for creating an environment")));
        }

        // throw bad request error if body not specified for PUT
        if (event !== undefined && event.method === "PUT" && event.body === undefined) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Environment data is required for updating an environment")));
        }

        // get environment data from body
        var environment_data;
        if (event !== undefined && event.body !== undefined) {
            environment_data = event.body;
        }

        // throw bad request error if user is unauthorized for GET
        if (event.principalId === undefined || !event.principalId) {
            return cb(JSON.stringify(errorHandler.throwUnauthorizedError("Unauthorized.")));
        }

        global.userId = event.principalId;
        global.authorization = event.headers.Authorization;
        global.env_tableName = global.config.services_environment_table;
        logger.info("env_tableName:"+global.env_tableName);

        // 1: GET environment by id and environent (/services/{service_id}/{environment})
        if (event.method === "GET" && (event.query !== undefined || event.path !== undefined)) {

            var query;
            if (
                event.query !== undefined &&
                (event.query.domain !== undefined && event.query.service !== undefined) &&
                (event.path !== undefined && event.path.environment_id === undefined)
            ) {
                service = event.query.service.toLowerCase();
                domain = event.query.domain.toLowerCase();
                query = { service: service, domain: domain };
            } else if (
                event.path !== undefined &&
                event.path.environment_id !== undefined &&
                (event.query !== undefined && (event.query.domain !== undefined && event.query.service !== undefined))
            ) {
                logger.info("environment_id:" + environment_id);
                environment_id = event.path.environment_id.toLowerCase();
                service = event.query.service.toLowerCase();
                domain = event.query.domain.toLowerCase();
                query = { logical_id: environment_id, service: service, domain: domain };
            } else {
                return cb(JSON.stringify(errorHandler.throwInputValidationError("Invalid set of parameters for the GET API")));
            }

            async.series(
                {
                    // Get service environment by service and domain OR with environment_id
                    getServiceEnvironmentByParams: function(onComplete) {
                        validateUtils.validateEnvironment(service, domain, environment_id, function onValidate(error, data){
                            onComplete(error, data);
                        });
                    }
                },
                function(error, data) {
                    if (error) {
                        if (error.result === 'notFoundError'){
                            logger.error("Cannot find any environment for the following query:" + JSON.stringify(query));
                            return cb(
                                JSON.stringify(errorHandler.throwNotFoundError("Cannot find any environment for the following query:" + JSON.stringify(query)))
                            );
                        } else{
                            logger.error("Error occured. " + JSON.stringify(error, null, 2));
                            return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured.")));
                        }
                    } else {
                        var environment_obj = data.getServiceEnvironmentByParams;
                        logger.verbose("Get Success. " + JSON.stringify(environment_obj, null, 2));
                        return cb(null, responseObj(environment_obj, query));
                    }
                }
            );
        }

        // Update environment
        // 2: PUT environment by environment_logical_id and service and domain as query params
        //(/environment/{environment_logical_id}?service=service&domain=domain)
        if (
            event.method === "PUT" &&
            event.path !== undefined &&
            Object.keys(event.path).length > 0 &&
            event.path.environment_id !== undefined &&
            event.query !== undefined &&
            Object.keys(event.query).length > 0 &&
            event.query.service !== undefined &&
            event.query.domain !== undefined
        ) {
            var update_environment_data = {};
            var environment_key_id;

            environment_id = event.path.environment_id.toLowerCase();
            service = event.query.service.toLowerCase();
            domain = event.query.domain.toLowerCase();

            var update_environment_payload = Object.assign({}, event.body);

            async.series(
                {
                    validateInputData: function(onComplete) {
                        validateUtils.validateUpdatePayload(update_environment_payload, function onValidate(error, data){
                            onComplete(error, data);
                        });
                    },
                    // Check if environment exists
                    validateEnvironmentExists: function(onComplete) {
                        //crud.get for env
                        crud.get(service, domain, environment_id.toLowerCase(), function onServiceGet(error, data) {
                            if (error) {
                                onComplete(error, null);
                            } else {
                                var environment_obj = data.environment[0];
            
                                // throw error if no environment exists
                                if (environment_obj) {
                                    logger.info("Environment Exists" + JSON.stringify(environment_obj, null, 2));
                                    environment_key_id = environment_obj.id;
                                    onComplete(null, {
                                        result: "success",
                                        message: "Environment exists"
                                    });
                                } else {
                                    // returning inputError
                                    onComplete({
                                        result: "inputError",
                                        message:
                                            "Cannot find environment  with id: '" +
                                            environment_id +
                                            "', for service:'" +
                                            service +
                                            "', domain:'" +
                                            domain +
                                            "' to update"
                                    }, null);
                                }
                            }
                        });
                    },
                    // Update service by SERVICE_ID
                    updateServiceEnvironment: function(onComplete) {
                        if (update_environment_payload) {
                            crud.update(update_environment_payload, environment_key_id, onComplete);
                        } else {
                            onComplete(null, null);
                        }
                    }
                },
                function(error, data) {
                    // Handle error
                    if (error) {
                        logger.error("Error occured while updating environment:" + JSON.stringify(error));
                        if (error.result === "inputError") {
                            return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
                        } else {
                            return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occured ")));
                        }
                    } else {
                        var updatedEnvironment = data.updateServiceEnvironment;
                        return cb(null,responseObj({
                            message:"Successfully Updated environment for service:'" +
                                service +"', domain:'" +domain +"', with logical_id: " +environment_id,
                            updatedEnvironment: updatedEnvironment
                        },update_environment_payload));
                    }
                }
            );
        }

        // Create new service environment
        // 6: POST a service
        if (event.method === "POST" && environment_data !== undefined) {
            logger.info("Create new environment with the following data:" + JSON.stringify(environment_data));

            async.series(
                {
                    // Validate environment_data for adding new service
                    validateEnvironmentData: function(onComplete) {
                        validateUtils.validateCreatePayload(environment_data, function onValidation(error, data){
                            onComplete(error, data);
                        });
                    },

                    // Add new service data to the dynamodb
                    addNewEnvironment: function(onComplete) {
                        crud.create(environment_data, onComplete);
                    }
                },
                function onComplete(error, data) {
                    // Handle error
                    if (error) {
                        logger.error("Error occured while adding new environment:" + JSON.stringify(error));
                        if (error.result === "inputError") {
                            return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
                        } else {
                            return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occured ")));
                        }
                    }
                    var result = data.addNewEnvironment;

                    // Add Item success
                    return cb(null, responseObj(result, event.body));
                }
            );
        }
    } catch (e) {
        logger.error("Internal server error:" + JSON.stringify(e));
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured")));
    }
};