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
const utils = require("../utils.js")();

module.exports = (assets_data, onComplete) => {
    logger.info("Inside validate post search:" + JSON.stringify(assets_data));
    assets_data = utils.toLowercase(assets_data);

    validateIsEmptyInputData(assets_data)
        .then(() => validateEmptyFieldsVal(assets_data))
        .then((res) => {
            onComplete(null, res);
        })
        .catch(error => {
            onComplete(error, null);
        });
};

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