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

var validateIsEmptyInputData = (deployment_data, onComplete) => {
    if (Object.keys(deployment_data).length === 0) {
        onComplete({
            result: "inputError",
            message: "Input payload cannot be empty"
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            input: deployment_data
        });
    }
};

var validateAllRequiredFields = (deployment_data, required_fields, onComplete) => {
    var missing_required_fields = _.difference(_.values(required_fields), _.keys(deployment_data));
    if (missing_required_fields.length > 0) {
        var message = "Following field(s) are required - " + missing_required_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            input: deployment_data
        });
    }
};

var validateUnAllowedFieldsInInput = (deployment_data, fields_list, onComplete) => {
    var invalid_fields = _.difference(_.keys(deployment_data), _.values(fields_list));
    if (invalid_fields.length > 0) {
        var message = "Following fields are invalid :  " + invalid_fields.join(", ") + ". ";
        onComplete({
            result: "inputError",
            message: message
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            input: deployment_data
        });
    }
};

var validateAllRequiredFieldsValue = (deployment_data, required_fields, onComplete) => {
    var invalid_required_fields = [];
    required_fields.map((value) => {
        if (!deployment_data[value]) {
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
            input: deployment_data
        });
    }
};

var validateRemoveEmptyValues = (deployment_data, onComplete) => {
    for (var field in deployment_data) {
        if (!deployment_data[field]) {
            delete deployment_data[field];
        }
    }
    onComplete(null, {
        result: "success",
        input: deployment_data
    });
};

var validateNotEditableFieldsInUpdate = (deployment_data, fields_list, onComplete) => {
    var invalid_fields = _.intersection(_.keys(deployment_data), _.values(fields_list));
    invalid_fields.map((value) => {
        delete deployment_data[value];
    });

    onComplete(null, {
        result: "success",
        input: deployment_data
    });
};

var validateStatusFieldValue = (deployment_data, status_values, onComplete) => {
    var statusFieldKey = "status",
        has_invalid_status_values = false;
    //check if input contains fields other than allowed fields
    console.log("here is status validation:");
    console.log(deployment_data.hasOwnProperty(statusFieldKey));
    if (deployment_data.hasOwnProperty(statusFieldKey)) {
        console.log("Inside here:");
        //checking "status" field contains the allowed values
        var statusValue = deployment_data[statusFieldKey];
        if(!status_values.includes(statusValue)) has_invalid_status_values = true;
    }
    if (has_invalid_status_values) {
        // return inputError
        onComplete({
            result: "inputError",
            message: "Only following values can be allowed for status field - " + status_values.join(", ")
        }, null);
    } else {
        onComplete(null, {
            result: "success",
            message: deployment_data
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
        validateStatusFieldValue: validateStatusFieldValue,
        validateNotEditableFieldsInUpdate: validateNotEditableFieldsInUpdate
    };
};