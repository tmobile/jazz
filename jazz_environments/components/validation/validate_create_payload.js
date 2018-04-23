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
    Helper Validation functions for Environment-Catalog
    @module: validate.js
    @description: Defines validate functions.
    @author:
    @version: 1.0
**/

const logger = require("../logger.js"); //Import the logging module.
const validateUtils = require("./common.js")();
const crud = require("../crud")(); //Import the utils module.
const request = require("request");

module.exports = (tableName, environment_data, indexName, onComplete) => {
    logger.info("Inside Validate Create Payload: " + JSON.stringify(environment_data));

    var required_fields_create = global.config.service_environment_required_fields;
    var service_field_list = required_fields_create.concat(global.config.service_environment_changeable_fields);
    var status_field_list = global.config.service_environment_status;

    validateIsEmptyInputData(environment_data)
        .then(() => validateAllRequiredFields(environment_data, required_fields_create))
        .then(() => validateStatusFieldValue(environment_data, status_field_list))
        .then(() => validateUnAllowedFieldsInInput(environment_data, service_field_list))
        .then(() => validateFriendlyName(environment_data))
        .then(() => validateAllRequiredFieldsValue(environment_data, required_fields_create))
        .then(() => validateRemoveEmptyValues(environment_data))
        .then(() => validateServiceExists(environment_data))
        .then(() => validateEnvironmentExists(environment_data, indexName, tableName))
        .then((result) => {
            logger.info("# Validate Create Payload Data:" + JSON.stringify(result));
            onComplete(null,result);
        })
        .catch((error) => {
            logger.error("# Validate Create Payload Error:" + JSON.stringify(error));
            onComplete(error, null);
        });
}

function validateIsEmptyInputData(environment_data) {
    logger.debug("Inside validateIsEmptyInputData: ");
    return new Promise((resolve, reject) => {
        //check for empty body
        validateUtils.validateIsEmptyInputData(environment_data, function onValidate(error, data) {
            if (error) {
                logger.error("Error in validateIsEmptyInputData: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateAllRequiredFields(environment_data, required_fields_create) {
    logger.debug("Inside validateAllRequiredFields: ");
    return new Promise((resolve, reject) => {
        //check for required fields 
        validateUtils.validateAllRequiredFields(environment_data, required_fields_create, function onValidate(error, data) {
            if (error) {
                logger.error("Error in validateAllRequiredFields: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateStatusFieldValue(environment_data, status_field_list) {
    //check for valid status
    logger.debug("Inside validateStatusFieldValue: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateStatusFieldValue(environment_data, status_field_list, function onValidate(error, data) {
            if (error) {
                logger.error("Error in validateStatusFieldValue" + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateUnAllowedFieldsInInput(environment_data, service_field_list) {
    //check for unchangable fields
    logger.debug("Inside validateUnAllowedFieldsInInput: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateUnAllowedFieldsInInput(environment_data, service_field_list, function onValidate(error, data) {
            if (error) {
                logger.error("Error in validateUnAllowedFieldsInInput: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateFriendlyName(environment_data) {
    //check for friendly name
    logger.debug("Inside validateFriendlyName: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateFriendlyName(environment_data, environment_data.logical_id, function onValidate(error, data) {
            if (error) {
                logger.error("Error in validateFriendlyName: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateAllRequiredFieldsValue(environment_data, required_fields_create) {
    //check for required fields
    logger.debug("Inside validateAllRequiredFieldsValue: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateAllRequiredFieldsValue(environment_data, required_fields_create, function onValidate(error, data) {
            if (error) {
                logger.error("Error in validateAllRequiredFieldsValue: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateRemoveEmptyValues(environment_data) {
    // check for empty values before updating environments table
    logger.debug("Inside validateRemoveEmptyValues: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateRemoveEmptyValues(environment_data, function onValidate(error, data) {
            if (error) {
                logger.error("Error in validateRemoveEmptyValues: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateServiceExists(environment_data) {
    logger.debug("Inside validateServiceExists: ");
    return new Promise((resolve, reject) => {
        var service_domain = environment_data.domain;
        var service_name = environment_data.service;
        var svcGetPayload;
        //call services get
        svcGetPayload = {
            uri: global.config.SERVICE_API_URL + global.config.SERVICE_API_RESOURCE + "?domain=" + service_domain + "&service=" + service_name,
            method: "GET",
            headers: {
                'Authorization': global.authorization
            },
            rejectUnauthorized: false
        };
        request(svcGetPayload, function (error, response, body) {
            if (response.statusCode === 200) {
                logger.info("output.....:"+JSON.stringify(body))
                var output = JSON.parse(body);
                logger.info("output.....:"+JSON.stringify(output))
                if (!output.data || !output.data || output.data.available == null) {
                    reject({
                        result: "inputError",
                        message: "Error finding service: " + service_domain + "." + service_name + " in service catalog"
                    });
                } else if (output.data.available === false) {
                    resolve({
                        result: "success",
                        message: "Service is available!"
                    });
                } else if (output.data.available === true) {
                    reject({
                        result: "inputError",
                        message: "Service with domain: " + service_domain + " and service name:" + service_name + ", does not exist."
                    });
                }
            } else {
                reject({
                    result: "inputError",
                    message: "Error finding service: " + service_domain + "." + service_name + " in service catalog"
                });
            }
        });
    });
};

function validateEnvironmentExists(environment_data, indexName, tableName) {
    // Check if a environment with same environment exists
    logger.debug("Inside validateEnvironmentExists");
    return new Promise((resolve, reject) => {
        var query;

        environment_data.logical_id = environment_data.logical_id.toLowerCase();
        environment_data.service = environment_data.service.toLowerCase();
        environment_data.domain = environment_data.domain.toLowerCase();
        environment_data.physical_id = environment_data.physical_id.toLowerCase();
        query = {
            logical_id: environment_data.logical_id,
            service: environment_data.service,
            domain: environment_data.domain,
            physical_id: environment_data.physical_id
        };
        crud.getList(tableName, query, indexName, function onServiceGet(error, data) {
            if (error) {
                logger.error("Error in validateEnvironmentExists: " + JSON.stringify(error));
                reject(error);
            } else {
                if (data.environment.length > 0) {
                    reject({
                        result: "inputError",
                        message: "The specified environment already exists, please choose a different logical id for your new environment"
                    });
                } else {
                    if (
                        environment_data.physical_id &&
                        (environment_data.logical_id !== config.service_environment_production_logical_id &&
                            environment_data.logical_id !== config.service_environment_stage_logical_id)
                    ) {
                        query = {
                            physical_id: environment_data.physical_id,
                            service: environment_data.service,
                            domain: environment_data.domain
                        };

                        crud.getList(tableName, query, indexName, function onServiceGet(error, data) {
                            if (error) {
                                logger.error("Error in validateEnvironmentExists: " + JSON.stringify(error));
                                reject(error);
                            } else {
                                if (data.environment.length > 0) {
                                    reject({
                                        result: "inputError",
                                        message: "The specified environment already exists, please choose a different physical id for your new environment"
                                    });
                                } else {
                                    resolve({
                                        result: "success",
                                        message: "Valid environment data"
                                    });
                                }
                            }
                        });
                    } else {
                        resolve({
                            result: "success",
                            message: "Valid environment data"
                        });
                    }
                }
            }
        });
    });
}