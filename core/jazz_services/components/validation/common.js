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
    Common Validation functions for Service-Catalog
    @module: common.js
    @description: Defines common validate functions.
    @author:
    @version: 1.0
**/

const _ = require("lodash");
const logger = require("../logger.js"); //Import the logging module.

var validateIsEmptyInputData = function (service_data, onComplete) {
    if (_.isEmpty(service_data)) {
        onComplete({
            result: "inputError",
            message: "Input payload cannot be empty"
        });
    } else {
        onComplete(null, {
            result: "success",
            input: service_data
        });
    }
};

var validateAllRequiredFields = function (service_data, required_fields, onComplete) {
    // logger.info(required_fields)
    var missing_required_fields = _.difference(_.values(required_fields), _.keys(service_data));
    // logger.info(missing_required_fields)
    if (missing_required_fields.length > 0) {
        var message = "Following field(s) are required - " + missing_required_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        });
    } else {
        onComplete(null, {
            result: "success",
            input: service_data
        });
    }
};

var validateUnAllowedFieldsInInput = function (service_data, fields_list, onComplete) {
    var invalid_fields = _.difference(_.keys(service_data), _.values(fields_list));
    if (invalid_fields.length > 0) {
        var message = "Following fields are invalid :  " + invalid_fields.join(", ") + ". ";
        onComplete({
            result: "inputError",
            message: message
        });
    } else {
        onComplete(null, {
            result: "success",
            input: service_data
        });
    }
};

var validateInputFieldTypes = function (service_data, onComplete) {
    var invalid_fields = [];

    var fields_type = {};
    _.forEach(global.global_config.SERVICE_FIELDS_METADATA, function (value, key) {
        fields_type[value.key] = value.type;
    });

    for (var field in service_data) {
        if (service_data[field]) {
            if (!validateDataTypes(field, service_data[field], fields_type)) {
                invalid_fields.push(field);
            }
        }
    }
    if (invalid_fields.length > 0) {
        var message = "The following field's value/type is not valid - " + invalid_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        });
    } else {
        onComplete(null, {
            result: "success",
            input: "Input value is valid"
        });
    }
};

var validateDataTypes = function (field, prop_value, fields_type) {
    var field_status = false;
    for (var type in fields_type) {
        if (field === type) {
            if (fields_type[type] === "String") {
                if (prop_value && (typeof prop_value == "string" || prop_value instanceof String)) {
                    field_status = true;
                }
            } else if (fields_type[type] === "Array") {
                if (prop_value && prop_value.constructor === Array) {
                    field_status = true;
                }
            } else if (fields_type[type] === "Boolean") {
                if (typeof prop_value == "boolean" || prop_value instanceof Boolean) {
                    field_status = true;
                }
            } else if (fields_type[type] === "Object") {
                if (prop_value && prop_value instanceof Object) {
                    field_status = true;
                }
            }
        }
    }
    return field_status;
};

var validateEnumValues = function (service_data, onComplete) {
    var invalid_fields = [];
    for (var field in service_data) {
        if (service_data[field]) {
            var value = service_data[field];
            switch (field) {
                case "status":
                    if (!_.includes(global.global_config.SERVICE_STATUS, value)) {
                        invalid_fields.push(field);
                    }
                    break;
                case "runtime":
                    if (!_.includes(global.global_config.SERVICE_RUNTIMES, value) && service_data.type !== "website") {
                        invalid_fields.push(field);
                    }
                    break;
                case "type":
                    if (
                        !_.find(global.global_config.SERVICE_INTER_DEPENDENT_FIELDS_MAP, function (obj) {
                            return obj.type === value;
                        })
                    ) {
                        invalid_fields.push(field);
                    }
                    break;
            }
        }
    }

    if (invalid_fields.length > 0) {
        var message = "The following field's value is not valid - " + invalid_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        });
    } else {
        onComplete(null, {
            result: "success",
            input: "Input value is valid"
        });
    }
};

var validateAllRequiredFieldsValue = function (service_data, required_fields, onComplete) {
    var invalid_required_fields = [];
    _.forEach(required_fields, function (value, key) {
        if (_.isEmpty(service_data[value])) {
            invalid_required_fields.push(value);
        }
    });

    if (invalid_required_fields.length > 0) {
        var message = "Following field(s) value cannot be empty - " + invalid_required_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        });
    } else {
        onComplete(null, {
            result: "success",
            input: service_data
        });
    }
};

var validateEmail = function (service_data, onComplete) {
    if (_.includes(_.keys(service_data), global.global_config.EMAIL_FIELD_KEY)) {
        var email = service_data[global.global_config.EMAIL_FIELD_KEY];
        var message;
        if (email !== "" && email !== null) {
            var rex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (rex.test(email) === true) {
                onComplete(null, {
                    result: "success",
                    input: "Input value is valid"
                });
            } else {
                message = "The email field's value is not valid :" + email;
                onComplete({
                    result: "inputError",
                    message: message
                });
            }
        } else {
            message = "The email field's value is not valid.";
            onComplete({
                result: "inputError",
                message: message
            });
        }
    } else {
        onComplete(null, {
            result: "success",
            input: "Input value is valid"
        });
    }
};

var validateServiceTypeAndRuntimeRelation = function (service_data, onComplete) {
    var relation_obj = _.find(global.global_config.SERVICE_INTER_DEPENDENT_FIELDS_MAP, function (obj) {
        return obj.type === service_data[global.global_config.TYPE_FIELD_KEY];
    });
    var required_field_key;
    if (_.isEmpty(relation_obj.fields)) {
        //Service Type present in payload does not require runtime
        onComplete(null, {
            result: "success",
            input: "Input value is valid"
        });
    } else {
        _.forEach(relation_obj.fields, function (value, key) {
            required_field_key = value.key;
            if (_.includes(_.keys(service_data), required_field_key)) {
                onComplete(null, {
                    result: "success",
                    input: "Input value is valid"
                });
            } else {
                var message =
                    "The field :" + required_field_key + " is required for the following service type  - " + service_data[global.global_config.TYPE_FIELD_KEY];
                onComplete({
                    result: "inputError",
                    message: message
                });
            }
        });
    }
};

var validateRemoveEmptyValues = function (service_data, onComplete) {
    for (var field in service_data) {
        if (service_data[field] === undefined || service_data[field] === "") {
            delete service_data[field];
        }
    }
    onComplete(null, {
        result: "success",
        input: "Empty String are removed from fields"
    });
};

var validateNotEditableFieldsInUpdate = function (service_data, fields_list, onComplete) {
    var invalid_fields = _.intersection(_.keys(service_data), _.values(fields_list));
    _.forEach(invalid_fields, function (value, key) {
        delete service_data[value];
    });

    onComplete(null, {
        result: "success",
        input: service_data
    });
};

var validateEditableFieldsValue = function (service_data, fields_list, onComplete) {
    var editable_fields = _.intersection(_.keys(service_data), _.values(fields_list));

    var invalid_required_fields = [];
    _.forEach(editable_fields, function (value, key) {
        if (_.isEmpty(service_data[value]) && !_.isBoolean(service_data[value])) {
            invalid_required_fields.push(value);
        }
    });

    if (invalid_required_fields.length > 0) {
        var message = "Following field(s) value cannot be empty - " + invalid_required_fields.join(", ");
        onComplete({
            result: "inputError",
            message: message
        });
    } else {
        onComplete(null, {
            result: "success",
            input: service_data
        });
    }
};

var validateStatusStateChange = function (update_data, service_data_from_db, onComplete) {
    var message;
    switch (service_data_from_db.status) {
        case "creation_completed":
            if (update_data.status === "creation_completed" || update_data.status === "creation_failed" || update_data.status === "creation_started") {
                message = "Service creation already completed.";
                onComplete({
                    result: "inputError",
                    message: message
                });
            } else {
                onComplete(null, {
                    service_updatable: true
                });
            }
            break;
        case "deletion_completed":
            message = "Service already deleted.";
            onComplete({
                result: "inputError",
                message: message
            });
            break;
        case "deletion_started":
            if (update_data.status === "deletion_completed" || update_data.status === "deletion_failed") {
                onComplete(null, {
                    result: "success",
                    input: "Input value is valid"
                });
            } else {
                message = "Service deletion already started.";
                onComplete({
                    result: "inputError",
                    message: message
                });
            }
            break;
        default:
            onComplete(null, {
                result: "success",
                input: "Input value is valid"
            });
            break;
    }
};

module.exports = () => {
    return {
        validateIsEmptyInputData: validateIsEmptyInputData,
        validateAllRequiredFields: validateAllRequiredFields,
        validateUnAllowedFieldsInInput: validateUnAllowedFieldsInInput,
        validateInputFieldTypes: validateInputFieldTypes,
        validateEnumValues: validateEnumValues,
        validateAllRequiredFieldsValue: validateAllRequiredFieldsValue,
        validateEmail: validateEmail,
        validateServiceTypeAndRuntimeRelation: validateServiceTypeAndRuntimeRelation,
        validateRemoveEmptyValues: validateRemoveEmptyValues,
        validateNotEditableFieldsInUpdate: validateNotEditableFieldsInUpdate,
        validateEditableFieldsValue: validateEditableFieldsValue,
        validateStatusStateChange: validateStatusStateChange
    };
};
