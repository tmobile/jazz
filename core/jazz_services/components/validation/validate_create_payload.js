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

module.exports = (service_data, onComplete) => {
    logger.info("Inside Validate Create Payload: " + JSON.stringify(service_data));
    var service_field_list = [];
    var required_fields_create = [];
    _.forEach(global.global_config.SERVICE_FIELDS_METADATA, function (value, key) {
        service_field_list.push(value.key);
        if (value.required) {
            required_fields_create.push(value.key);
        }
    });
    async.series({
        validateIsEmptyInputData: function (onComplete) {
            logger.info("Inside validateIsEmptyInputData: ");
            validateUtils.validateIsEmptyInputData(service_data, onComplete)
        },

        validateAllRequiredFields: function (onComplete) {
            logger.info("Inside validateAllRequiredFields: ");
            validateUtils.validateAllRequiredFields(service_data, required_fields_create, onComplete);
        },

        validateUnAllowedFieldsInInput: function (onComplete) {
            logger.info("Inside validateUnAllowedFieldsInInput: ");
            validateUtils.validateUnAllowedFieldsInInput(service_data, service_field_list, onComplete);
        },

        validateInputFieldTypes: function (onComplete) {
            logger.info("Inside validateInputFieldTypes: ");
            validateUtils.validateInputFieldTypes(service_data, onComplete);
        },

        validateEnumValues: function (onComplete) {
            logger.info("Inside validateEnumValues: ");
            validateUtils.validateEnumValues(service_data, onComplete);
        },

        validateAllRequiredFieldsValue: function (onComplete) {
            logger.info("Inside validateAllRequiredFieldsValue: ");
            validateUtils.validateAllRequiredFieldsValue(service_data, required_fields_create, onComplete);
        },

        validateEmailFieldValue: function (onComplete) {
            logger.info("Inside validateEmailFieldValue: ");
            validateUtils.validateEmail(service_data, onComplete);
        },

        validateServiceTypeAndRuntimeRelation: function (onComplete) {
            logger.info("Inside validateServiceTypeAndRuntimeRelation: ");
            validateUtils.validateServiceTypeAndRuntimeRelation(service_data, onComplete);
        },

        validateRemoveEmptyValues: function (onComplete) {
            logger.info("Inside validateRemoveEmptyValues: ");
            validateUtils.validateRemoveEmptyValues(service_data, onComplete);
        },
        // Check if a service with same domain and service_name combination exists
        validateServiceExists: function (onComplete) {
            getAllRecords = "true";
            var query = { service: service_data.service.toLowerCase(), domain: service_data.domain.toLowerCase() };
            crud.getList(query, getAllRecords, function onServiceGet(error, data) {
                if (error) {
                    onComplete(error);
                } else {
                    if (data.services.length > 0) {
                        logger.error('Service name in the specified domain already exists.');
                        message = "Service name in the specified domain already exists.";
                        onComplete({
                            result: "inputError",
                            message: message
                        });
                    } else {
                        onComplete(null, {
                            "result": "success",
                            "input": service_data
                        });
                    }
                }
            });
        }
    },
        function (error, data) {
            if (error) {
                logger.error("# Validate Create Payload Error:" + JSON.stringify(error));
                onComplete(error);
            } else {
                logger.info("# Validate Create Payload Data:" + JSON.stringify(data));
                onComplete(null);
            }
        })
}