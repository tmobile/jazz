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
    Common Validation functions for Environments-Catalog
    @module: common.js
    @description: Defines common validate functions.
    @author:
    @version: 1.0
**/

const _ = require("lodash");
const logger = require("../logger.js"); //Import the logging module.

var validateIsEmptyInputData = function(environment_data, onComplete) {
    if (_.isEmpty(environment_data)) {
        onComplete({
            result: "inputError",
            message: "Input payload cannot be empty"
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            input: environment_data
        });
    }
};

var validateAllRequiredFields = function(environment_data, required_fields, onComplete) {
    var missing_required_fields = _.difference(_.values(required_fields), _.keys(environment_data));
    if (missing_required_fields.length > 0) {
        var message = "Following field(s) are required - " + missing_required_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            input: environment_data
        });
    }
};

var validateUnAllowedFieldsInInput = function(environment_data, fields_list, onComplete) {
    var invalid_fields = _.difference(_.keys(environment_data), _.values(fields_list));
    if (invalid_fields.length > 0) {
        var message = "Following fields are invalid :  " + invalid_fields.join(", ") + ". ";
        onComplete({
            result: "inputError",
            message: message
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            input: environment_data
        });
    }
};

var validateAllRequiredFieldsValue = function(environment_data, required_fields, onComplete) {
    var invalid_required_fields = [];
    _.forEach(required_fields, function(value, key) {
        if (_.isEmpty(environment_data[value])) {
            invalid_required_fields.push(value);
        }
    });

    if (invalid_required_fields.length > 0) {
        var message = "Following field(s) value cannot be empty - " + invalid_required_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            input: environment_data
        });
    }
};

var validateRemoveEmptyValues = function(environment_data, onComplete) {
    for (var field in environment_data) {
        if (environment_data[field] === undefined || environment_data[field] === "") {
            delete environment_data[field];
        }
    }
    onComplete(null, {
        result: "success",
        input: "Empty String are removed from fields"
    });
};

var validateNotEditableFieldsInUpdate = function(environment_data, fields_list, onComplete) {
    var invalid_fields = _.intersection(_.keys(environment_data), _.values(fields_list));
    _.forEach(invalid_fields, function(value, key) {
        delete environment_data[value];
    });
    
    onComplete(null, {
        result: "success",
        input: environment_data
    });
};

var validateEditableFieldsValue = function(environment_data, fields_list, onComplete) {
    var editable_fields = _.intersection(_.keys(environment_data), _.values(fields_list));

    var invalid_required_fields = [];
    _.forEach(editable_fields, function(value, key) {
        if (_.isEmpty(environment_data[value]) && !_.isBoolean(environment_data[value])) {
            invalid_required_fields.push(value);
        }
    });

    if (invalid_required_fields.length > 0) {
        var message = "Following field(s) value cannot be empty - " + invalid_required_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            input: environment_data
        });
    }
};

var validateFriendlyName = function(environment_data, onComplete) {
    var friendlyNameKey = "friendly_name";
    if (environment_data.logical_id &&
        (environment_data.logical_id.toLowerCase() === global.config.service_environment_production_logical_id ||
        environment_data.logical_id.toLowerCase() === global.config.service_environment_stage_logical_id)
    ) {
        if (_.includes(_.keys(environment_data), friendlyNameKey)) {
            onComplete({
                result: "inputError",
                message: "Invalid field(s) - " + friendlyNameKey + " is allowed only when logical id is not 'stg' or 'prod'"
            }, null);
        } else {
            onComplete(null, {
                result: "success",
                input:environment_data
            });
        }
    } else {
        onComplete(null, {
            result: "success",
            input:environment_data
        });
    }
};

var validateStatusFieldValue = function(environment_data, status_values, onComplete) {
    var statusFieldKey = "status", has_invalid_status_values=false;
    //check if input contains fields other than allowed fields
    if (_.includes(_.keys(environment_data), statusFieldKey)) {
        //checking "status" field contains the allowed values
        var statusValue = environment_data[statusFieldKey];
        has_invalid_status_values = !_.includes(status_values, statusValue);
    }
    if (has_invalid_status_values) {
        // return inputError
        onComplete({
            result: "inputError",
            message: "Only following values can be allowed for status field - " + status_values.join(", ")
        }, null);
    } else {
        onComplete(null,{
            result: "success",
            message: environment_data
        });
    }
};

module.exports = () => {
    return {
        validateIsEmptyInputData: validateIsEmptyInputData,
        validateAllRequiredFields: validateAllRequiredFields,
        validateUnAllowedFieldsInInput: validateUnAllowedFieldsInInput,
        validateAllRequiredFieldsValue: validateAllRequiredFieldsValue,
        validateRemoveEmptyValues: validateRemoveEmptyValues,
        validateNotEditableFieldsInUpdate: validateNotEditableFieldsInUpdate,
        validateEditableFieldsValue: validateEditableFieldsValue,
        validateFriendlyName: validateFriendlyName,
        validateStatusFieldValue: validateStatusFieldValue
    };
};
