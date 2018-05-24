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

const logger = require("../logger.js")(); //Import the logging module.
const validateUtils = require("./common.js")();
const crud = require("../crud")();

module.exports = (config, deployment_data, deploymentTableName, deploymentId, onComplete) => {
    logger.info("Inside Validate get list payload: " + JSON.stringify(deployment_data));

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
            onComplete(null, result.input);
        })
        .catch((error) => {
            logger.error("# Validate update Payload Error:" + JSON.stringify(error));
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

function validateStatusFieldValue(deployment_data, status_field_list) {
    //check for valid status
    logger.debug("Inside validateStatusFieldValue: " + deployment_data.status);
    return new Promise((resolve, reject) => {
        if (deployment_data.status) {
            validateUtils.validateStatusFieldValue(deployment_data, status_field_list, (error, data) => {
                if (error) {
                    logger.error("Error in validateStatusFieldValue" + JSON.stringify(error));
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        } else {
            resolve();
        }
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

function validateNotEditableFieldsInUpdate(deployment_data, unchangeable_fields) {
    logger.debug("Inside validateNotEditableFieldsInUpdate: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateNotEditableFieldsInUpdate(deployment_data, unchangeable_fields, (error, data) => {
            if (error) {
                logger.error("Error in validateNotEditableFieldsInUpdate: " + JSON.stringify(error));
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

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
}