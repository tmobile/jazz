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

const logger = require("./logger.js")(); //Import the logging module.
const _ = require("lodash");
const crud = require("./crud")();
const utils = require("./utils.js");

function validateIsEmptyInputData(assets_data) {
  logger.debug("Inside validateIsEmptyInputData");
  return new Promise((resolve, reject) => {
    if (Object.keys(assets_data).length === 0) {
      reject({
        "result": "inputError",
        "message": "Input asset data cannot be empty"
      });
    } else {
      resolve({
        "result": "success",
        "input": assets_data
      });
    }
  });
};

function validateEmptyFieldsVal(assets_data) {
  logger.debug("Inside validateEmptyFieldsVal");
  return new Promise((resolve, reject) => {
    var invalid_fields = [];
    var invalid_fields = Object.keys(assets_data).filter((field) => {
      if (!assets_data[field]) return field;
    });

    if (invalid_fields.length > 0) {
      var message = "Following fields do not have a valid value - " + invalid_fields.join(", ");
      reject({
        "result": "inputError",
        "message": message
      });
    } else {
      resolve({
        "result": "success",
        "input": assets_data
      });
    }
  });
};

function validateUnAllowedFieldsInInput(assets_data, fields_list) {
  logger.debug("Inside validateUnAllowedFieldsInInput");
  return new Promise((resolve, reject) => {
    var invalid_fields = _.difference(_.keys(assets_data), _.values(fields_list));
    if (invalid_fields.length > 0) {
      var message = "Following fields are invalid: " + invalid_fields.join(", ") + ". ";
      reject({
        "result": "inputError",
        "message": message
      });
    } else {
      resolve({
        "result": "success",
        "input": assets_data
      });
    }
  });
};

function validateAllRequiredFields(assets_data, required_fields) {
  logger.debug("Inside validateAllRequiredFields");
  return new Promise((resolve, reject) => {
    var missing_required_fields = _.difference(_.values(required_fields), _.keys(assets_data));
    if (missing_required_fields.length > 0) {
      var message = "Following field(s) are required - " + missing_required_fields.join(", ");
      reject({
        "result": "inputError",
        "message": message
      });
    } else {
      resolve({
        "result": "success",
        "input": assets_data
      });
    }
  });
};

function validateInputFieldTypes(assets_data) {
  logger.debug("Inside validateInputFieldTypes");
  return new Promise((resolve, reject) => {
    var invalid_fields = [];
    Object.keys(assets_data).forEach((field) => {
      if (assets_data[field]) {
        if (!validateDataTypes(field, assets_data[field])) {
          invalid_fields.push(field);
        }
      }
    })

    if (invalid_fields.length > 0) {
      var message = "The following field's value/type is not valid - " + invalid_fields.join(", ");
      reject({
        "result": "inputError",
        "message": message
      });
    } else {
      resolve({
        "result": "success",
        "input": "Input value is valid"
      });
    }
  });
};

function validateDataTypes(field, prop_value) {
  logger.debug("Inside validateDataTypes");
  var fields_type = global.global_config.FIELD_DATA_TYPES;
  var field_status = false;
  Object.keys(fields_type).forEach((type) => {
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

function validateEnumValues(assets_data) {
  logger.debug("Inside validateEnumValues");
  return new Promise((resolve, reject) => {
    var invalid_fields = Object.keys(assets_data).filter((field) => {
      var value = assets_data[field];
      if (value && field === "status" && (global.global_config.ASSET_STATUS.indexOf(value) === -1)) {
        return field
      };
      if (value && field === "asset_type" && (global.global_config.ASSET_TYPES.indexOf(value) === -1)) {
        return field
      };
    });

    if (invalid_fields.length > 0) {
      var message = "The following field's value are not valid - " + invalid_fields.join(", ");
      reject({
        "result": "inputError",
        "message": message
      });
    } else {
      resolve({
        "result": "success",
        "input": "Input value is valid"
      });
    }
  });
};

function validateEditableFields(update_data, editableFields) {
  logger.debug("Inside validateEditableFields");
  var invalid_fields = _.difference(_.keys(update_data), _.values(editableFields));
  var editable_data = Object.keys(update_data).filter(key => {
    return (invalid_fields.indexOf(key) > -1) ? false : true;
  });
  var data = {};
  editable_data.forEach(key => {
    data[key] = update_data[key]
  });

  return ({
    result: "success",
    input: data
  });
};

function validateAssetExists(assets_data, asset_table) {
  logger.debug("Inside validateExists");
  return new Promise((resolve, reject) => {
    var filter_expression = utils.createFilterExpression(assets_data);
    crud.getList(assets_data, asset_table, (error, data) => {
      if (error) {
        reject(error);
      } else {
        if (data && data.count > 0) {
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

function validateAssetsExistsById(assets_id, asset_table) {
  logger.debug("Inside validateAssetsExistsById:")
  return new Promise((resolve, reject) => {
    crud.get(assets_id, asset_table, (error, data) => {
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

function validateCreatePayload(create_data, asset_table) {
  return new Promise((resolve, reject) => {
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
      .then(() => validateAssetExists(assets_data, asset_table))
      .then((res) => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
  });
};

function validateUpdatePayload(assets_id, data, asset_table) {
  return new Promise((resolve, reject) => {
    logger.info("Inside new validate update:" + asset_table);
    var editableFields = global.global_config.ASSETS_EDITABLE_FIELDS;
    var update_data = utils.toLowercase(data);

    validateAssetsExistsById(assets_id, asset_table)
      .then(() => validateIsEmptyInputData(update_data))
      .then(() => validateInputFieldTypes(update_data))
      .then(() => validateEnumValues(update_data))
      .then(() => validateEditableFields(update_data, editableFields))
      .then((res) => {
        resolve(res);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

function validateSearchPayload(assets_data) {
  return new Promise((resolve, reject) => {
    logger.info("Inside validate post search:" + JSON.stringify(assets_data));
    var required_fields = global.global_config.ASSET_SEARCH_REQUIRED_FILTER_PARAMS;
    var allowed_fields = required_fields.concat(global.global_config.ASSET_SEARCH_OPTIONAL_FILTER_PARAMS);
    assets_data = utils.toLowercase(assets_data);

    validateIsEmptyInputData(assets_data)
      .then(() => validateEmptyFieldsVal(assets_data))
      .then(() => validateUnAllowedFieldsInInput(assets_data, allowed_fields))
      .then(() => validateAllRequiredFields(assets_data, required_fields))
      .then((res) => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
  });
};

module.exports = {
  validateCreatePayload,
  validateUpdatePayload,
  validateSearchPayload
}
