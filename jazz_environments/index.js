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

var handler = (event, context, cb) => {
    //Initializations
    var errorHandler = errorHandlerModule();
    var config = configObj(event);
    logger.init(event, context);
    // logger.info("event:" + JSON.stringify(event));
    global.config = config;

    try {
        // event.method cannot be empty, throw error
        if (!event || !event.method) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("method cannot be empty")));
        }

        // get environment_id from the path
        var service;
        var domain;
        var environment_id;
        if (event && event.path && event.path.environment_id && Object.keys(event.path).length > 0 && event.path.environment_id) {
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

        if (event.method === "GET" && (event.query && (!event.query.service || !event.query.domain))) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("GET API requires the following query params: domain and service")));
        }

        if (event.method === "GET" && event.query && Object.keys(event.query).length > 0) {
            if (!event.query.domain || !event.query.service) {
                return cb(JSON.stringify(errorHandler.throwInputValidationError("GET API can be called only with following query params: domain and service")));
            }
        }

        if (
            (event.method === "PUT" && (event.path && !event.path.environment_id)) ||
            (event.method === "PUT" && (event.query && (!event.query.domain || !event.query.service)))
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
        if (event && event.method === "POST" && !event.body) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Environment data is required for creating an environment")));
        }

        // throw bad request error if body not specified for PUT
        if (event && event.method === "PUT" && !event.body) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Environment data is required for updating an environment")));
        }

        // get environment data from body
        var environment_data;
        if (event && event.body) {
            environment_data = event.body;
        }

        // throw bad request error if user is unauthorized for GET
        if (!event.principalId) {
            return cb(JSON.stringify(errorHandler.throwUnauthorizedError("Unauthorized.")));
        }

        global.userId = event.principalId;
        global.authorization = event.headers.Authorization;
        global.env_tableName = global.config.services_environment_table;
        var indexName = global.config.services_environment_index;

        // 1: GET environment by id and environent (/services/{service_id}/{environment})
        if (event.method === "GET" && (event.query || event.path)) {
            validateGetInput(event)
            .then((result) => getServiceEnvironmentByParams(result, indexName))
            .then(function(result){
                var environment_obj = result.data
                logger.info("List of environments:"+JSON.stringify(environment_obj));
                return cb(null, responseObj(environment_obj, result.input));
            })
            .catch(function (err) {
                logger.error("Error while getting list of environments:"+JSON.stringify(err));
				if (err.errorType) {
					// error has already been handled and processed for API gateway
					return cb(JSON.stringify(err));
				}else {
					if (err.result === "notFoundError") {
						return cb(JSON.stringify(errorHandler.throwNotFoundError(err.message)));
					}

					return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured.")));
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
            var update_environment_data = {};
            var environment_key_id;

            environment_id = event.path.environment_id.toLowerCase();
            service = event.query.service.toLowerCase();
            domain = event.query.domain.toLowerCase();

            var update_environment_payload = Object.assign({}, event.body);

            validateUpdateInput(update_environment_payload, environment_id)
            .then(() => validateEnvironmentExists(service, domain, environment_id))
            .then((result) => updateServiceEnvironment(update_environment_payload, result.data))
            .then(function(result){
                logger.info("Environment update success:"+JSON.stringify(result));
                return cb(null, responseObj(result, update_environment_payload));
            })
            .catch(function(err){
                logger.error("Error while updating environment catalog:"+JSON.stringify(err));
                if (err.errorType) {
					// error has already been handled and processed for API gateway
					return cb(JSON.stringify(err));
				}else {
					if (err.result === "inputError") {
						return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
					}

					return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured.")));
				}
            });
        }

        // Create new service environment
        // 6: POST a service
        if (event.method === "POST" && environment_data) {
            logger.info("Create new environment with the following data:" + JSON.stringify(environment_data));

            validateEnvironmentData(environment_data, indexName)
            .then(() => addNewEnvironment(environment_data))
            .then(function(result){
                logger.info("New environment created:"+JSON.stringify(result));
                return cb(null, responseObj(result, environment_data));
            })
            .catch(function(err){
                logger.error("error while creating new environment:"+JSON.stringify(err));
				if (err.errorType) {
					// error has already been handled and processed for API gateway
					return cb(JSON.stringify(err));
				}else {
					if (err.result === "inputError") {
						return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
					}

					return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured.")));
				}
            });
        }
    } catch (e) {
        logger.error("Internal server error:" + JSON.stringify(e));
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured")));
    }
};

function validateGetInput(event){
    return new Promise((resolve, reject) => {
        var query;
        logger.info("Inside validateGetInput:");
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
            logger.info("validateGetInput:"+JSON.stringify(query));
            resolve(query);
        } else if (
            event.path &&
            event.path.environment_id &&
            (event.query && (event.query.domain && event.query.service))
        ) {
            logger.info("environment_id:" + event.path.environment_id);
            environment_id = event.path.environment_id.toLowerCase();
            service = event.query.service.toLowerCase();
            domain = event.query.domain.toLowerCase();
            query = {
                logical_id: environment_id,
                service: service,
                domain: domain
            };
            logger.info("validateGetInput:"+JSON.stringify(query));
            resolve(query);
        } else {
            reject(errorHandler.throwInputValidationError("Invalid set of parameters for the GET API"));
            // return cb(JSON.stringify(errorHandler.throwInputValidationError("Invalid set of parameters for the GET API")));
        }
    });
};

function getServiceEnvironmentByParams(query, indexName){
    logger.info("Inside getServiceEnvironmentByParams:")
    return new Promise((resolve, reject) => {
        validateUtils.validateEnvironment(indexName, query.service, query.domain, query.logical_id, function onValidate(error, data){
            if(error){
                reject(error);
            } else{
                var output = {
                    data: data.data,
                    input: query
                }
                resolve(output);
            }
        });
    });
}

function validateEnvironmentData(environment_data, indexName){
    return new Promise((resolve, reject)=>{
        validateUtils.validateCreatePayload(environment_data, indexName, function onValidate(error, data){
            if(error){
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function addNewEnvironment(environment_data){
    return new Promise((resolve, reject) =>{
        crud.create(environment_data, function onAddition(error, data){
            if(error){
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateUpdateInput(update_payload, environment_id){
    return new Promise((resolve, reject) =>{
        validateUtils.validateUpdatePayload(update_payload, environment_id, function onValidate(error, data){
            if(error){
                reject(error);
            } else{
                resolve(data);
            }
        });
    })
};

function validateEnvironmentExists(indexName, service, domain, environment_id){
    return new Promise((resolve, reject) => {
        crud.get(indexName, service, domain, environment_id.toLowerCase(), function onServiceGet(error, data) {
            if (error) {
                reject(error);
            } else {
                var environment_obj = data.environment[0];

                // throw error if no environment exists
                if (environment_obj) {
                    logger.info("Environment Exists" + JSON.stringify(environment_obj));
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

function updateServiceEnvironment(update_payload, environment_key_id) {
    return new Promise((resolve, reject) =>{
        crud.update(update_payload, environment_key_id, function onUpdate(error, data){
            if(error){
                reject(error);
            } else{
                resolve(data);
            }
        });
    });
};

module.exports = {
    validateGetInput: validateGetInput,
    getServiceEnvironmentByParams: getServiceEnvironmentByParams,
    validateEnvironmentData: validateEnvironmentData,
    addNewEnvironment: addNewEnvironment,
    validateUpdateInput: validateUpdateInput,
    validateEnvironmentExists: validateEnvironmentExists,
    updateServiceEnvironment: updateServiceEnvironment,
    handler: handler
}