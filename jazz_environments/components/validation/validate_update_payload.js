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

const logger = require("../logger"); //Import the logging module.
const utils = require("../utils.js")(); //Import the utils module.
const validateUtils = require("./common.js")();
const crud = require("../crud")(); //Import the utils module.

module.exports = (environment_data, environment_id, onComplete) => {
    logger.info("Inside Validate Update Payload: " + JSON.stringify(environment_data));

    var non_editable_fields_for_update = global.config.service_environment_unchangeable_fields;
    var editable_fields_for_update = global.config.service_environment_changeable_fields;
    var status_field_list = global.config.service_environment_status
    var service_data_from_db = {};

    validateIsEmptyInputData(environment_data)
    .then(() => validateFriendlyName(environment_data, environment_id))
    .then(() => validateNotEditableFieldsInUpdate(environment_data, non_editable_fields_for_update))
    .then(() => validateEditableFieldsValue(environment_data, editable_fields_for_update))
    .then(() => validateUnAllowedFieldsInInput(environment_data, editable_fields_for_update))
    .then(() => validateStatusFieldValue(environment_data, status_field_list))
    .then(function(result){
        logger.info("# Validate Update Payload Data:" + JSON.stringify(result));
        onComplete(null);
    })
    .catch(function(error){
        logger.info('#validate error')
        logger.error("# Validate Update Payload Error:" + JSON.stringify(error));
        onComplete(error, null);
    });
}

function validateIsEmptyInputData(environment_data) {
    //check for empty fields
    logger.info("Inside validateIsEmptyInputData: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateIsEmptyInputData(environment_data, function onValidate(error, data){
            if(error){
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateFriendlyName(environment_data, environment_id) {
    //check for friendly name
    logger.info("Inside validateFriendlyName: ");
    return new Promise((resolve, reject) =>{
        validateUtils.validateFriendlyName(environment_data, environment_id, function onValidate(error, data){
            if(error){
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateNotEditableFieldsInUpdate(environment_data, non_editable_fields_for_update) {
    // check for non-editable
    logger.info("Inside validateNotEditableFieldsInUpdate: ");
    return new Promise((resolve, reject) =>{
        validateUtils.validateNotEditableFieldsInUpdate(environment_data, non_editable_fields_for_update, function onValidate(error, data){
            if(error){
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateEditableFieldsValue(environment_data, editable_fields_for_update) {
    //check for editable fields
    logger.info("Inside validateEditableFieldsValue: ");
    return new Promise((resolve, reject) =>{
        validateUtils.validateEditableFieldsValue(environment_data, editable_fields_for_update, function onValidate(error, data){
            if(error){
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateUnAllowedFieldsInInput(environment_data, editable_fields_for_update) {
    // check for unallowed fields
    logger.info("Inside validateUnAllowedFieldsInInput:");
    return new Promise((resolve, reject) =>{
        validateUtils.validateUnAllowedFieldsInInput(environment_data, editable_fields_for_update, function onValidate(error, data){
            if(error){
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateStatusFieldValue(environment_data, status_field_list) {
    // check for invalid status values
    logger.info("Inside validateStatusStateChange: ");
    return new Promise((resolve, reject) => {
        validateUtils.validateStatusFieldValue(environment_data, status_field_list, function onValidate(error, data){
            if(error){
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};