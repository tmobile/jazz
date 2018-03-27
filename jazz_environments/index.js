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

module.exports.handler = (event, context, cb) => {
    //Initializations
    var errorHandler = errorHandlerModule();
    logger.init(event, context);
    var config = configObj(event);
    global.config = config;

    try {
        // event.method cannot be empty, throw error
        if (event === undefined || event.method === undefined) {
            cb(JSON.stringify(errorHandler.throwInputValidationError("method cannot be empty")));
        }
        logger.info("Event:" + JSON.stringify(event));

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
        if (event.principalId === undefined || event.principalId === "" || event.principalId === null) {
            return cb(JSON.stringify(errorHandler.throwUnauthorizedError("Unauthorized.")));
        }

        global.userId = event.principalId;

        var envTableName = config.services_environment_table;

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
                        crud.get(envTableName, service, domain, environment_id, onComplete);
                    }
                },
                function(error, data) {
                    if (error) {
                        logger.error("Error occured. " + JSON.stringify(error, null, 2));
                        return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured.")));
                    } else {
                        logger.info("data:" + JSON.stringify(data));
                        var environment_obj = data.getServiceEnvironmentByParams;

                        // throw error if no service exists with given service_id
                        if (environment_obj.environment.length === 0) {
                            logger.error("Cannot find any environment for the following query:" + JSON.stringify(query));
                            return cb(
                                JSON.stringify(errorHandler.throwNotFoundError("Cannot find any environment for the following query:" + JSON.stringify(query)))
                            );
                        }
                        logger.verbose("Get Success. " + JSON.stringify(environment_obj, null, 2));
                        return cb(null, responseObj(data.getServiceEnvironmentByParams, query));
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
                        var message = "";

                        logger.info("update_environment_payload:" + JSON.stringify(update_environment_payload));
                        //### CHECK If payload is empty
                        if (_.isEmpty(update_environment_payload)) {
                            onComplete({
                                result: "inputError",
                                message: "Environment Data to be updated cannot be empty"
                            });
                        } else {
                            // list of fields that cannot be updated
                            var unchangeable_environment_fields = config.service_environment_unchangeable_fields;

                            var update_payload_keys = _.keys(update_environment_payload);

                            var unchangeable_fields_in_payload = _.intersection(update_payload_keys, unchangeable_environment_fields);

                            //### CHECK If payloadcontains any unchangeable fields
                            if (_.isEmpty(unchangeable_fields_in_payload)) {
                                //### CHECK If "friendly_name" is present in update for "stg" or "prod" environment update
                                if (
                                    environment_id === config.service_environment_production_logical_id ||
                                    environment_id === config.service_environment_stage_logical_id
                                ) {
                                    var friendlyNameKey = "friendly_name";
                                    if (_.includes(_.keys(update_environment_payload), friendlyNameKey)) {
                                        onComplete({
                                            result: "inputError",
                                            message: "Invalid field provided. 'friendly_name' cannot be modified if logical_id is 'stg' or 'prod'"
                                        });
                                    }
                                }

                                var valid_status_values = config.service_environment_status;
                                var has_invalid_status_values = false;
                                var statusFieldKey = "status";
                                var statusValue = update_environment_payload[statusFieldKey];

                                //### CHECK If status value is according to allowed values
                                if (_.includes(_.keys(update_environment_payload), statusFieldKey) && !_.includes(valid_status_values, statusValue)) {
                                    // returning inputError
                                    onComplete({
                                        result: "inputError",
                                        message: "Only following values can be allowed for status field - " + valid_status_values.join(", ")
                                    });
                                }

                                //### CHECK If any Extra fields are present
                                var total_fields_for_update = config.service_environment_changeable_fields;
                                var invalid_fields_for_update = _.difference(_.keys(environment_data), _.values(total_fields_for_update));
                                if (!_.isEmpty(invalid_fields_for_update)) {
                                    onComplete({
                                        result: "inputError",
                                        message:
                                            "Invalid field(s) - " +
                                            invalid_fields_for_update.join(", ") +
                                            ". Only following fields are allowed - " +
                                            total_fields_for_update.join(", ")
                                    });
                                }
                                logger.info("#Validation complete for payload for updating environment");
                                onComplete(null, {
                                    result: "success",
                                    message: "Input Data is valid"
                                });
                            } else {
                                message =
                                    "Invalid fields provided. Following fields cannot be updated - " +
                                    unchangeable_fields_in_payload.join(", ") +
                                    ". Please remove the fields and try again.";

                                onComplete({
                                    result: "inputError",
                                    message: message
                                });
                            }
                        }
                    },
                    // Check if environment exists
                    validateEnvironmentExists: function(onComplete) {
                        // Get service environment by id

                        crud.get(envTableName, service, domain, environment_id.toLowerCase(), function onServiceGet(error, data) {
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
                                    });
                                }
                            }
                        });
                    },
                    // Update service by SERVICE_ID
                    updateServiceEnvironment: function(onComplete) {
                        if (update_environment_payload) {
                            crud.update(update_environment_payload, environment_key_id, envTableName, onComplete);
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
                        return cb(
                            null,
                            responseObj(
                                {
                                    message:
                                        "Successfully Updated environment for service:'" +
                                        service +
                                        "', domain:'" +
                                        domain +
                                        "', with logical_id: " +
                                        environment_id,
                                    updatedEnvironment: updatedEnvironment
                                },
                                update_environment_payload
                            )
                        );
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
                        // validate if input data is empty
                        if (environment_data === undefined || environment_data === null || environment_data === {}) {
                            // return inputError
                            onComplete({
                                result: "inputError",
                                message: "Environment Data cannot be empty"
                            });
                        }

                        var required_fields = config.service_environment_required_fields;
                        // validate required fields
                        var missing_required_fields = _.difference(_.values(required_fields), _.keys(environment_data));
                        if (missing_required_fields.length > 0) {
                            // return inputError
                            onComplete({
                                result: "inputError",
                                message: "Following field(s) are required - " + missing_required_fields.join(", ")
                            });
                        }

                        var status_values = config.service_environment_status;
                        var has_invalid_status_values = true;
                        var statusFieldKey = "status";

                        // check if input contains fields other than allowed fields
                        if (_.includes(_.keys(environment_data), statusFieldKey)) {
                            //checking "status" field contains the allowed values
                            var statusValue = environment_data[statusFieldKey];
                            has_invalid_status_values = !_.includes(status_values, statusValue);
                        }
                        if (has_invalid_status_values) {
                            // return inputError
                            onComplete({
                                result: "inputError",
                                message: "Only following values can be allowed for status field - " + status_values.join(", ")
                            });
                        }

                        var friendlyNameKey = "friendly_name";
                        if (
                            environment_data.logical_id.toLowerCase() === config.service_environment_production_logical_id ||
                            environment_data.logical_id.toLowerCase() === config.service_environment_stage_logical_id
                        ) {
                            if (_.includes(_.keys(environment_data), friendlyNameKey)) {
                                onComplete({
                                    result: "inputError",
                                    message: "Invalid field(s) - " + friendlyNameKey + " is allowed only when logical id is not 'stg' or 'prod'"
                                });
                            }
                        }

                        var optional_fields = required_fields.concat(config.service_environment_changeable_fields);
                        var invalid_fields = _.difference(_.keys(environment_data), _.values(optional_fields));
                        if (invalid_fields.length > 0) {
                            onComplete({
                                result: "inputError",
                                message:
                                    "Invalid field(s) - " + invalid_fields.join(", ") + ". Only following fields are allowed - " + optional_fields.join(", ")
                            });
                        } else {
                            // return on successfull validation
                            onComplete(null, {
                                result: "success",
                                message: environment_data
                            });
                        }
                    },

                    validateServiceExists: function(onComplete) {
                        var service_domain = environment_data.domain;
                        var service_name = environment_data.service;
                        var svcGetPayload;
                        //call services get
                        svcGetPayload = {
                            uri: config.SERVICE_API_URL + config.SERVICE_API_RESOURCE + "?domain=" + service_domain + "&service=" + service_name,
                            method: "GET",
                            rejectUnauthorized: false
                        };

                        request(svcGetPayload, function(error, response, body) {
                            if (response.statusCode === 200) {
                                var output = JSON.parse(body);
                                logger.info("Service avalaibility response:" + JSON.stringify(output));
                                if (output.data === null || output.data === "" || output.data === undefined || output.data.available === undefined) {
                                    onComplete({
                                        result: "inputError",
                                        message: "Error finding service: " + service_domain + "." + service_name + " in service catalog"
                                    });
                                } else if (output.data.available === false) {
                                    onComplete(null, {
                                        result: "success",
                                        message: "Service is available!"
                                    });
                                } else if (output.data.available === true) {
                                    onComplete({
                                        result: "inputError",
                                        message: "Service with domain: " + service_domain + " and service name:" + service_name + ", does not exist."
                                    });
                                }
                            } else {
                                onComplete({
                                    result: "inputError",
                                    message: "Error finding service: " + service_domain + "." + service_name + " in service catalog"
                                });
                            }
                        });
                    },

                    // Check if a environment with same environment exists
                    validateEnvironmentExists: function(onComplete) {
                        var query;

                        environment_data.logical_id = environment_data.logical_id.toLowerCase();
                        environment_data.service = environment_data.service.toLowerCase();
                        environment_data.domain = environment_data.domain.toLowerCase();

                        query = { logical_id: environment_data.logical_id, service: environment_data.service, domain: environment_data.domain };

                        crud.getList(query, envTableName, function onServiceGet(error, data) {
                            if (error) {
                                onComplete(error, null);
                            } else {
                                if (data.environment.length > 0) {
                                    onComplete({
                                        result: "inputError",
                                        message: "The specified environment already exists, please choose a different logical id for your new environment"
                                    });
                                } else {
                                    if (
                                        environment_data.physical_id !== undefined &&
                                        environment_data.physical_id !== "" &&
                                        (environment_data.logical_id !== config.service_environment_production_logical_id &&
                                            environment_data.logical_id !== config.service_environment_stage_logical_id)
                                    ) {
                                        query = {
                                            physical_id: environment_data.physical_id,
                                            service: environment_data.service,
                                            domain: environment_data.domain
                                        };

                                        crud.getList(query, envTableName, function onServiceGet(error, data) {
                                            if (error) {
                                                onComplete(error, null);
                                            } else {
                                                if (data.environment.length > 0) {
                                                    onComplete({
                                                        result: "inputError",
                                                        message:
                                                            "The specified environment already exists, please choose a different physical id for your new environment"
                                                    });
                                                } else {
                                                    onComplete(null, {
                                                        result: "success",
                                                        message: "Valid environment data"
                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        onComplete(null, {
                                            result: "success",
                                            message: "Valid environment data"
                                        });
                                    }
                                }
                            }
                        });
                    },

                    // Add new service data to the dynamodb
                    addNewEnvironment: function(onComplete) {
                        crud.create(environment_data, envTableName, onComplete);
                    }
                },
                function onComplete(error, data) {
                    // Handle error
                    if (error) {
                        logger.error("Error occured while adding new environment:" + JSON.stringify(error));
                        if (error.result === "inputError") {
                            cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
                        } else {
                            cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occured ")));
                        }
                    }
                    var result = data.addNewEnvironment;

                    // Add Item success
                    cb(null, responseObj(result, event.body));
                }
            );
        }
    } catch (e) {
        logger.error("Internal server error:" + JSON.stringify(e));
        cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured")));
    }
};
