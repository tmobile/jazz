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

const logger = require("../logger.js")();
const validateUtils = require("./common.js")();
const utils = require('../utils.js')();
const crud = require("../crud")();

module.exports = (assets_id, data, onComplete) => {
    logger.info("Inside validate update:" + assets_id);
    var editableFields = global.global_config.ASSETS_EDITABLE_FIELDS;
    var update_data = utils.toLowercase(data);

    validateAssetsExistsById(assets_id)
        .then(() => validateIsEmptyInputData(update_data))
        .then(() => validateInputFieldTypes(update_data))
        .then(() => validateEnumValues(update_data))
        .then(() => validateEditableFields(update_data, editableFields))
        .then((res) => {
            onComplete(null, res);
        })
        .catch((error) => {
            onComplete(error, null);
        });
}

function validateAssetsExistsById(assets_id) {
    logger.debug("Inside validateAssetsExistsById:")
    return new Promise((resolve, reject) => {
        crud.get(assets_id, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve({
                    "result": "success",
                    "input": "asset exists"
                });
            }
        });
    });
};

function validateIsEmptyInputData(update_data) {
    logger.debug("Inside validateIsEmptyInputData");
    return new Promise((resolve, reject) => {
        validateUtils.validateIsEmptyInputData(update_data, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        })
    })
};

function validateInputFieldTypes(update_data) {
    logger.debug("Inside validateInputFieldTypes");
    return new Promise((resolve, reject) => {
        validateUtils.validateInputFieldTypes(update_data, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateEnumValues(update_data) {
    logger.debug("Inside validateEnumValues");
    return new Promise((resolve, reject) => {
        validateUtils.validateEnumValues(update_data, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function validateEditableFields(update_data, editableFields) {
    logger.debug("Inside validateEditableFields");
    return new Promise((resolve, reject) => {
        validateUtils.validateEditableFields(update_data,  editableFields,(error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};