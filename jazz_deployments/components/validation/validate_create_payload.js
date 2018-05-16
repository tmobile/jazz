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
    Helper Validation functions for Deployments-Catalog
    @module: validate.js
    @description: Defines validate functions.
    @author:
    @version: 1.0
**/

const logger = require("../logger.js"); //Import the logging module.
const validateUtils = require("./common.js")();

module.exports = (config, deployment_data, onComplete) => {
    logger.info("Inside Validate Create Payload: " + JSON.stringify(deployment_data));

    var required_fields_create = config.DEPLOYMENT_CREATION_REQUIRED_FIELDS;
    var service_field_list = required_fields_create.concat(config.OPTIONAL_PARAMS);
    var status_field_list = config.DEPLOYMENT_STATUS;

    validateIsEmptyInputData(deployment_data)
        .then(() => validateAllRequiredFields(deployment_data, required_fields_create))
        .then(() => validateStatusFieldValue(deployment_data, status_field_list))
        .then(() => validateUnAllowedFieldsInInput(deployment_data, service_field_list))
        .then(() => validateAllRequiredFieldsValue(deployment_data, required_fields_create))
        .then(() => validateRemoveEmptyValues(deployment_data))
        .then((result) => {
            logger.info("# Validate Create Payload Data:" + JSON.stringify(result));
            onComplete(null, null);
        })
        .catch((error) => {
            logger.error("# Validate Create Payload Error:" + JSON.stringify(error));
            onComplete(error, null);
        });
}

function validateIsEmptyInputData(deployment_data) {
    logger.debug("Inside validateIsEmptyInputData: ");
    return new Promise((resolve, reject) => {
        //check for empty body
        validateUtils.validateIsEmptyInputData(deployment_data, (error, data) => {
            if (error) {
                logger.error("Error in validateIsEmptyInputData: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateAllRequiredFields(deployment_data, required_fields_create) {
    logger.debug("Inside validateAllRequiredFields: ");
    return new Promise((resolve, reject) => {
        //check for required fields 
        validateUtils.validateAllRequiredFields(deployment_data, required_fields_create, (error, data) => {
            if (error) {
                logger.error("Error in validateAllRequiredFields: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateStatusFieldValue(deployment_data, status_field_list) {
    //check for valid status
    logger.debug("Inside validateStatusFieldValue: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateStatusFieldValue(deployment_data, status_field_list, (error, data) => {
            if (error) {
                logger.error("Error in validateStatusFieldValue" + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateUnAllowedFieldsInInput(deployment_data, service_field_list) {
    //check for unchangable fields
    logger.debug("Inside validateUnAllowedFieldsInInput: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateUnAllowedFieldsInInput(deployment_data, service_field_list, (error, data) => {
            if (error) {
                logger.error("Error in validateUnAllowedFieldsInInput: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateAllRequiredFieldsValue(deployment_data, required_fields_create) {
    //check for required fields
    logger.debug("Inside validateAllRequiredFieldsValue: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateAllRequiredFieldsValue(deployment_data, required_fields_create, (error, data) => {
            if (error) {
                logger.error("Error in validateAllRequiredFieldsValue: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateRemoveEmptyValues(deployment_data) {
    // check for empty values before updating Deployments table
    logger.debug("Inside validateRemoveEmptyValues: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateRemoveEmptyValues(deployment_data, (error, data) => {
            if (error) {
                logger.error("Error in validateRemoveEmptyValues: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};