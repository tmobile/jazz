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

const logger = require("../logger"); //Import the logging module.
const utils = require("../utils.js")(); //Import the utils module.
const _ = require("lodash");
var validateUtils = require("./common.js")();
const async = require("async");
const crud = require("../crud")(); //Import the utils module.

module.exports = (environment_data, onComplete) => {
    logger.info("Inside Validate Update Payload: " + JSON.stringify(environment_data));

    var non_editable_fields_for_update = global.config.service_environment_unchangeable_fields;
    var editable_fields_for_update = global.config.service_environment_changeable_fields;
    var status_field_list = global.config.service_environment_status
    var service_data_from_db = {};

    async.series({
        validateIsEmptyInputData: function(onComplete) {
            //check for empty fields
            logger.info("Inside validateIsEmptyInputData: ");
            validateUtils.validateIsEmptyInputData(environment_data, onComplete);
        },
        validateFriendlyName: function(onComplete) {
            //check for friendly name
            logger.info("Inside validateFriendlyName: ");
            validateUtils.validateFriendlyName(environment_data, onComplete);
        },

        validateNotEditableFieldsInUpdate: function(onComplete) {
            // check for non-editable
            logger.info("Inside validateNotEditableFieldsInUpdate: ");
            validateUtils.validateNotEditableFieldsInUpdate(environment_data, non_editable_fields_for_update, onComplete);
        },

        validateEditableFieldsValue: function(onComplete) {
            //check for editable fields
            logger.info("Inside validateEditableFieldsValue: ");
            validateUtils.validateEditableFieldsValue(environment_data, editable_fields_for_update, onComplete);
        },

        
        validateUnAllowedFieldsInInput: function(onComplete){
            // check for unallowed fields
            logger.info("Inside validateUnAllowedFieldsInInput:");
            validateUtils.validateUnAllowedFieldsInInput(environment_data, editable_fields_for_update, onComplete);
        },

        validateStatusFieldValue: function(onComplete) {
            // check for invalid status values
            logger.info("Inside validateStatusStateChange: ");
            validateUtils.validateStatusFieldValue(environment_data, status_field_list, onComplete);
        }
    },
    function(error, data) {
        if (error) {
            logger.info('#validate error')
            logger.error("# Validate Update Payload Error:" + JSON.stringify(error));
            onComplete(error);
        } else {
            logger.info("# Validate Update Payload Data:" + JSON.stringify(data));
            onComplete(null);
        }
    });
    
}