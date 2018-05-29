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
    Helper Validation functions for Assets-Catalog
    @module: validate.js
    @description: Defines validate functions.
    @author:
    @version: 1.0
**/

const logger = require("../logger.js")(); //Import the logging module.
const validateUtils = require("./common.js")();
const utils = require("../utils.js")();
const crud = require("../crud")();

module.exports = (create_data, onComplete) => {
    logger.info("Inside validateAndCreate:" + JSON.stringify(create_data));
    var required_fields = global.global_config.ASSETS_CREATION_REQUIRED_FIELDS;
    var allowed_fields = global.global_config.ASSETS_FIELDS;
    var assets_data = utils.toLowercase(create_data);
    validateIsEmptyInputData(assets_data)
        .then(() => validateUnAllowedFieldsInInput(assets_data, allowed_fields))
        .then(() => validateAllRequiredFields(assets_data, required_fields))
        .then(() => validateInputFieldTypes(assets_data))
        .then(() => validateEnumValues(assets_data))
        .then(() => validateEmptyFieldsVal(assets_data))
        .then(() => validateAssetExists(assets_data))
        .then((res) => {
            onComplete(null, res);
        })
        .catch(error => {
            onComplete(error, null);
        });
}

function validateIsEmptyInputData(assets_data) {
    logger.debug("Inside validateIsEmptyInputData");
    return new Promise((resolve, reject) => {
        validateUtils.validateIsEmptyInputData(assets_data, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        })
    })
};

function validateUnAllowedFieldsInInput(assets_data, allowed_fields) {
    logger.debug("Inside validateUnAllowedFieldsInInput");
    return new Promise((resolve, reject) => {
        validateUtils.validateUnAllowedFieldsInInput(assets_data, allowed_fields, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        })
    });
};

function validateAllRequiredFields(assets_data, required_fields) {
    logger.debug("validateAllRequiredFields");
    return new Promise((resolve, reject) => {
        validateUtils.validateAllRequiredFields(assets_data, required_fields, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateInputFieldTypes(assets_data) {
    logger.debug("Inside validateInputFieldTypes");
    return new Promise((resolve, reject) => {
        validateUtils.validateInputFieldTypes(assets_data, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateEnumValues(assets_data) {
    logger.debug("Inside validateEnumValues");
    return new Promise((resolve, reject) => {
        validateUtils.validateEnumValues(assets_data, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateEmptyFieldsVal(assets_data) {
    logger.debug("Inside validateEmptyFieldsVal");
    return new Promise((resolve, reject) => {
        validateUtils.validateEmptyFieldsVal(assets_data, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateAssetExists(assets_data) {
    logger.debug("Inside validateExists");
    return new Promise((resolve, reject) => {
        var filter_expression = utils.createFilterExpression(assets_data);
        crud.postSearch(filter_expression, (error, data) => {
            if (error) {
                reject(error);
            } else {
                if (data.length > 0) {
                    logger.debug('Asset with given data already exists.');
                    reject({
                        "result": "inputError",
                        "message": "Asset with given data already exists."
                    });
                } else {
                    resolve({
                        "result": "success",
                        "message": "Valid asset field combination"
                    });
                }
            }
        });
    });
};