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
    Helper Validation functions for Service-Catalog
    @module: validate.js
    @description: Defines validate functions.
    @author:
    @version: 1.0
**/

const logger = require("../logger.js"); //Import the logging module.
const _ = require("lodash");
var validateUtils = require("./common.js")();
const async = require("async");
const crud = require("../crud")(); //Import the utils module.
const request = require("request");

module.exports = (environment_data, onComplete)=>{
    logger.info("Inside Validate Create Payload: " + JSON.stringify(environment_data));
    
    var required_fields_create = global.config.service_environment_required_fields;
    var service_field_list = required_fields_create.concat(global.config.service_environment_changeable_fields);

    async.series({
        validateIsEmptyInputData: function(onComplete){
            //check for empty body
            logger.info("Inside validateIsEmptyInputData: ");
            validateUtils.validateIsEmptyInputData(environment_data, onComplete)
        },

        validateAllRequiredFields: function(onComplete){
            //check for required fields
            logger.info("Inside validateAllRequiredFields: ");
            validateUtils.validateAllRequiredFields(environment_data, required_fields_create, onComplete);
        },

        validateStatusFieldValue: function(onComplete) {
            //check for valid status 
            logger.info("Inside validateStatusFieldValue: ");
            validateUtils.validateAllRequiredFieldsValue(environment_data, global.config.service_environment_required_fields, onComplete);
        },

        validateUnAllowedFieldsInInput: function(onComplete) {
            //check for unchangable fields
            logger.info("Inside validateUnAllowedFieldsInInput: ");
            validateUtils.validateUnAllowedFieldsInInput(environment_data, service_field_list, onComplete);
        },

        validateFriendlyName: function(onComplete){
            //check for friendly name
            logger.info("Inside validateFriendlyName: "+JSON.stringify(environment_data));
            validateUtils.validateFriendlyName(environment_data, onComplete);
        },

        validateAllRequiredFieldsValue: function(onComplete) {
            //check for required fields
            logger.info("Inside validateAllRequiredFieldsValue: ");
            validateUtils.validateAllRequiredFieldsValue(environment_data, required_fields_create, onComplete);
        },

        validateRemoveEmptyValues: function(onComplete) {
            // check for empty values before updating environments table
            logger.info("Inside validateRemoveEmptyValues: ");
            validateUtils.validateRemoveEmptyValues(environment_data, onComplete);
        },
        // Check if a service with same domain and service_name combination exists
        validateServiceExists: function(onComplete) {
            logger.info("validateServiceExists: ");
            var service_domain = environment_data.domain;
            var service_name = environment_data.service;
            var svcGetPayload;
            //call services get
            svcGetPayload = {
                uri: global.config.SERVICE_API_URL + global.config.SERVICE_API_RESOURCE + "?domain=" + service_domain + "&service=" + service_name,
                method: "GET",
                headers: {'Authorization':global.authorization},
                rejectUnauthorized: false
            };
            request(svcGetPayload, function(error, response, body) {
                if (response.statusCode === 200) {
                    var output = JSON.parse(body);
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
        validateEnvironmentExists: function(onComplete) {
            // Check if a environment with same environment exists
            var query;

            environment_data.logical_id = environment_data.logical_id.toLowerCase();
            environment_data.service = environment_data.service.toLowerCase();
            environment_data.domain = environment_data.domain.toLowerCase();

            query = { logical_id: environment_data.logical_id, service: environment_data.service, domain: environment_data.domain };
            logger.info("validateEnvironmentExists: "+JSON.stringify(query));
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

                            crud.getList(query, function onServiceGet(error, data) {
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
        }
    },
    function(error, data){
        if (error) {
            logger.error("# Validate Create Payload Error:" + JSON.stringify(error));
            onComplete(error);
        } else {
            logger.info("# Validate Create Payload Data:" + JSON.stringify(data));
            onComplete(null);
        }
    })
}