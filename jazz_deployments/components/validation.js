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

const logger = require("./logger.js")(); //Import the logging module.
const _ = require("lodash");
const crud = require("./crud")();

function validateCreatePayload(config, deployment_data) {
    logger.info("Inside Validate Create Payload: " + JSON.stringify(deployment_data));
    return new Promise((resolve, reject) => {
        var required_fields_create = config.DEPLOYMENT_CREATION_REQUIRED_FIELDS;
        var service_field_list = required_fields_create.concat(config.OPTIONAL_PARAMS);
        var status_field_list = config.DEPLOYMENT_STATUS;

        validateIsEmptyInputData(deployment_data)
            .then(() => validateAllRequiredFields(deployment_data, required_fields_create))
            .then(() => validateAllRequiredFieldsValue(deployment_data, required_fields_create))
            .then(() => validateStatusFieldValue(deployment_data, status_field_list))
            .then(() => validateUnAllowedFieldsInInput(deployment_data, service_field_list))
            .then(() => validateRemoveEmptyValues(deployment_data))
            .then((result) => {
                logger.info("# Validate Create Payload Data:" + JSON.stringify(result));
                resolve(null);
            })
            .catch((error) => {
                logger.error("# Validate Create Payload Error:" + JSON.stringify(error));
                reject(error);
            });
    });
};

function validateListPayload(config, deployment_data) {
    logger.info("Inside Validate get list payload: " + JSON.stringify(deployment_data));
    return new Promise((resolve, reject) => {
        var required_fields = config.REQUIRED_PARAMS;
        var service_field_list = required_fields.concat(config.OPTIONAL_PARAMS);
        var status_field_list = config.DEPLOYMENT_STATUS;
        validateIsEmptyInputData(deployment_data)
            .then(() => validateAllRequiredFields(deployment_data, required_fields))
            .then(() => {
                if (deployment_data.status) {
                    return validateStatusFieldValue(deployment_data, status_field_list)
                }
            })
            .then(() => validateUnAllowedFieldsInInput(deployment_data, service_field_list))
            .then(() => validateAllRequiredFieldsValue(deployment_data, required_fields))
            .then(() => validateRemoveEmptyValues(deployment_data))
            .then((result) => {
                logger.info("# Validate GetList Payload Data:" + JSON.stringify(result));
                resolve(result);
            })
            .catch((error) => {
                logger.error("# Validate GetList Payload Error:" + JSON.stringify(error));
                reject(error);
            });
    });
};

function validateUpdatePayload(config, deployment_data, deploymentTableName, deploymentId) {
    logger.info("Inside validate deployment update payload: " + JSON.stringify(deployment_data));
    return new Promise((resolve, reject) => {
        var unchangeable_fields = config.REQUIRED_PARAMS;
        // var service_field_list = required_fields.concat(config.OPTIONAL_PARAMS);
        var status_field_list = config.DEPLOYMENT_STATUS;

        validateIsEmptyInputData(deployment_data)
            .then(() => validateNotEditableFieldsInUpdate(deployment_data, unchangeable_fields))
            .then(() => validateStatusFieldValue(deployment_data, status_field_list))
            .then(() => validateRemoveEmptyValues(deployment_data))
            .then(() => validateDeploymentExist(deploymentTableName, deploymentId, deployment_data))
            .then((result) => {
                logger.info("# Validate update Payload Data:" + JSON.stringify(result));
                resolve(result.input);
            })
            .catch((error) => {
                logger.error("# Validate update Payload Error:" + JSON.stringify(error));
                reject(error);
            });
    });
}

function validateIsEmptyInputData(deployment_data) {
    return new Promise((resolve, reject) => {
        if (Object.keys(deployment_data).length === 0) {
            reject({
                result: "inputError",
                message: "Input payload cannot be empty"
            });
        } else {
            resolve({
                result: "success",
                input: deployment_data
            });
        }
    });
};

function validateAllRequiredFields(deployment_data, required_fields) {
    return new Promise((resolve, reject) => {
        var missing_required_fields = _.difference(_.values(required_fields), _.keys(deployment_data));
        if (missing_required_fields.length > 0) {
            var message = "Following field(s) are required - " + missing_required_fields.join(", ");
            reject({
                result: "inputError",
                message: message
            });
        } else {
            resolve({
                result: "success",
                input: deployment_data
            });
        }
    });
};

function validateUnAllowedFieldsInInput(deployment_data, fields_list) {
    return new Promise((resolve, reject) => {
        var invalid_fields = _.difference(_.keys(deployment_data), _.values(fields_list));
        if (invalid_fields.length > 0) {
            var message = "Following fields are invalid :  " + invalid_fields.join(", ") + ". ";
            reject({
                result: "inputError",
                message: message
            });
        } else {
            resolve({
                result: "success",
                input: deployment_data
            });
        }
    });
};

function validateAllRequiredFieldsValue(deployment_data, required_fields) {
    return new Promise((resolve, reject) => {
        var invalid_required_fields = [];
        required_fields.map((value) => {
            if (!deployment_data[value]) {
                invalid_required_fields.push(value);
            }
        });

        if (invalid_required_fields.length > 0) {
            var message = "Following field(s) value cannot be empty - " + invalid_required_fields.join(", ");
            reject({
                result: "inputError",
                message: message
            });
        } else {
            resolve({
                result: "success",
                input: deployment_data
            });
        }
    });
};

function validateRemoveEmptyValues(deployment_data) {
    return new Promise((resolve, reject) => {
        var data = {};
        var emptyFields = Object.keys(deployment_data).filter(field => {
            return (deployment_data[field] ? true : false)
        });
        emptyFields.forEach(key => {
            data[key] = deployment_data[key];
        })
        resolve({
            result: "success",
            input: data
        });
    });
};

function validateNotEditableFieldsInUpdate(deployment_data, fields_list) {
    return new Promise((resolve, reject) => {
        var invalid_fields = _.intersection(_.keys(deployment_data), _.values(fields_list));
        var editable_data = Object.keys(deployment_data).filter(key => {return (invalid_fields.indexOf(key) > -1) ? false : true;});
        var data = {};
        editable_data.forEach(key => {
            data[key] = deployment_data[key]
        });

        resolve({
            result: "success",
            input: data
        });
    });
};

function validateStatusFieldValue(deployment_data, status_values) {
    return new Promise((resolve, reject) => {
        var statusFieldKey = "status",
            has_invalid_status_values = false;
        //check if input contains fields other than allowed fields
        if (deployment_data.hasOwnProperty(statusFieldKey)) {
            //checking "status" field contains the allowed values
            var statusValue = deployment_data[statusFieldKey];
            has_invalid_status_values = !_.includes(status_values, statusValue);
        }
        if (has_invalid_status_values) {
            reject({
                result: "inputError",
                message: "Only following values can be allowed for status field - " + status_values.join(", ")
            });
        } else {
            resolve({
                result: "success",
                message: deployment_data
            });
        }
    });
};

function validateDeploymentExist(deploymentTableName, deploymentId, deployment_data) {
    logger.debug("Inside validateDeploymentExist:" + deploymentId);
    return new Promise((resolve, reject) => {
        crud.get(deploymentTableName, deploymentId, (error, data) => {
            if (error) {
                logger.error("getDeploymentDetailsById error:" + JSON.stringify(error));
                reject(error);
            } else {
                if (data && (Object.keys(data).length === 0 && data.constructor === Object)) {
                    logger.error('Cannot find deployment details with id : ' + deploymentId);
                    reject({
                        result: "notFound",
                        message: 'Cannot find deployment details with id :' + deploymentId
                    });
                } else {
                    resolve({
                        message: "Deployment with provided Id exist",
                        input: deployment_data
                    });
                }
            }
        });
    })
};

module.exports = {
    validateCreatePayload,
    validateListPayload,
    validateUpdatePayload
}