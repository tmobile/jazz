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
    Helper functions for Assets-Catalog
    @module: validate.js
    @description: Defines validate functions.
    @author: 
    @version: 1.0
**/

const _ = require("lodash");

var validateIsEmptyInputData = (assets_data, onComplete) => {
    if (Object.keys(assets_data).length === 0) {
        onComplete({
            "result": "inputError",
            "message": "Input asset data cannot be empty"
        });
    } else {
        onComplete(null, {
            "result": "success",
            "input": assets_data
        });
    }
};

var validateEmptyFieldsVal = (assets_data, onComplete) => {
    var invalid_fields = [];
    Object.keys(assets_data).map((field) => {
        var value = assets_data[field];
        if (!value) {
            invalid_fields.push(field);
        }
    });

    if (invalid_fields.length > 0) {
        var message = "Following fields does not provided a valid value - " + invalid_fields.join(", ");
        onComplete({
            "result": "inputError",
            "message": message
        });
    } else {
        onComplete(null, {
            "result": "success",
            "input": assets_data
        });
    }
};

var validateUnAllowedFieldsInInput = (assets_data, fields_list, onComplete) => {
    var invalid_fields = _.difference(_.keys(assets_data), _.values(fields_list));
    if (invalid_fields.length > 0) {
        var message = "Following fields are invalid :  " + invalid_fields.join(", ") + ". ";
        onComplete({
            "result": "inputError",
            "message": message
        });
    } else {
        onComplete(null, {
            "result": "success",
            "input": assets_data
        });
    }

};

var validateAllRequiredFields = (assets_data, required_fields, onComplete) => {
    var missing_required_fields = _.difference(_.values(required_fields), _.keys(assets_data));
    if (missing_required_fields.length > 0) {
        var message = "Following field(s) are required - " + missing_required_fields.join(", ");
        onComplete({
            "result": "inputError",
            "message": message
        });
    } else {
        onComplete(null, {
            "result": "success",
            "input": assets_data
        });
    }

};

var validateInputFieldTypes = (assets_data, onComplete) => {
    var invalid_fields = [];
    Object.keys(assets_data).map((field) => {
        if (assets_data[field]) {
            if (!validateDataTypes(field, assets_data[field])) {
                invalid_fields.push(field);
            }
        }
    })

    if (invalid_fields.length > 0) {
        var message = "The following field's value/type is not valid - " + invalid_fields.join(", ");
        onComplete({
            "result": "inputError",
            "message": message
        });
    } else {
        onComplete(null, {
            "result": "success",
            "input": "Input value is valid"
        });
    }
};
var validateDataTypes = (field, prop_value) => {
    var fields_type = global.global_config.FIELD_DATA_TYPES;
    var field_status = false;
    Object.keys(fields_type).map((type) => {
        if (field === type) {
            if (fields_type[type] === 'String') {
                if (prop_value && (typeof prop_value === 'string' || prop_value instanceof String)) {
                    field_status = true;
                }
            } else if (fields_type[type] === 'Array') {
                if (prop_value && prop_value.constructor === Array) {
                    field_status = true;
                }
            }
        }
    });
    return field_status;
};

var validateEnumValues = (assets_data, onComplete) => {
    var invalid_fields = [];
    Object.keys(assets_data).map((field) => {
        if (assets_data[field]) {
            var value = assets_data[field];
            switch (field) {
                case 'status':
                    if (global.global_config.ASSET_STATUS.indexOf(value) === -1) {
                        invalid_fields.push(field);
                    }
                    break;
                case 'type':
                    if (global.global_config.ASSET_TYPES.indexOf(value) === -1) {
                        invalid_fields.push(field);
                    }
                    break;
            }
        }
    });

    if (invalid_fields.length > 0) {
        var message = "The following field's value is not valid - " + invalid_fields.join(", ");
        onComplete({
            "result": "inputError",
            "message": message
        });
    } else {
        onComplete(null, {
            "result": "success",
            "input": "Input value is valid"
        });
    }
};

var validateEditableFields = (update_data, editableFields, onComplete) => {
    var invalid_fields = _.difference(_.keys(update_data), _.values(editableFields));
    invalid_fields.map((value) => {
        delete update_data[value];
    });

    onComplete(null, {
        result: "success",
        input: update_data
    });
}


module.exports = () => {
    return {
        validateIsEmptyInputData: validateIsEmptyInputData,
        validateEmptyFieldsVal: validateEmptyFieldsVal,
        validateUnAllowedFieldsInInput: validateUnAllowedFieldsInInput,
        validateAllRequiredFields: validateAllRequiredFields,
        validateInputFieldTypes: validateInputFieldTypes,
        validateEnumValues: validateEnumValues,
        validateEditableFields: validateEditableFields
    };
};
