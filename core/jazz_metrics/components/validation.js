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
    massage functions for output data
    @module: utils.js
    @description: Validate Utility functions.
    @author:
    @version: 1.0
**/
const moment = require("moment");
const global_config = require("../config/global-config.json");
const _ = require("lodash");

var validateGeneralFields = (input) => {
  var required_fields = global_config.REQUIRED_FIELDS;
  return new Promise((resolve, reject) => {
    validateIsEmptyInputData(input)
      .then(() => validateRequiredFields(input, required_fields))
      .then(() => validateAllRequiredFieldsValue(input, required_fields))
      .then(() => validateDate(input.start_time, input.end_time))
      .then(() => validateInterval(input.interval))
      .then(() => validateAssetType(input))
      .then(() => validateMetricsInput(input))
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      })
  });
}

function validateDate(startDate, endDate) {
  return new Promise((resolve, reject) => {
    if(!moment(startDate).isValid()) {
      reject({
        result: "inputError",
        message: `Start date time is not in valid format`
      })
    }
    if(!moment(endDate).isValid()) {
      reject({
        result: "inputError",
        message: `End date time is not in valid format`
      })
    }
    resolve({
      result: "success"
    });
  });
}

function validateInterval(interval) {

  return new Promise((resolve, reject) => {
    const intervalKeys = Object.keys(global_config.APIGEE.INTERVAL_MAP);
    if(!intervalKeys.includes(interval.toString())) {
      reject({
        result: "inputError",
        message: `Interval can only be ${intervalKeys.join(', ')} seconds`
      })
    } else {
      resolve({
        result: "success"
      });
    }
  });
}

var validateIsEmptyInputData = (input) => {
  return new Promise((resolve, reject) => {
    if (Object.keys(input).length === 0) {
      reject({
        result: "inputError",
        message: "Input payload cannot be empty"
      });
    } else {
      resolve({
        result: "success",
        input: input
      });
    }
  });
}

var validateRequiredFields = (input, required_fields) => {
  return new Promise((resolve, reject) => {
    var missing_required_fields = _.difference(_.values(required_fields), _.keys(input));
    if (missing_required_fields.length > 0) {
      var message = "Following field(s) are required - " + missing_required_fields.join(", ");
      reject({
        result: "inputError",
        message: message
      });
    } else {
      resolve({
        result: "success",
        input: input
      });
    }
  });
}

var validateAllRequiredFieldsValue = (input, required_fields) => {
  return new Promise((resolve, reject) => {
    var invalid_required_fields = [];
    required_fields.map((value) => {
      if (!input[value]) {
        invalid_required_fields.push(value);
      }
    });

    if (invalid_required_fields.length > 0) {
      var message = "Following field(s) value cannot be empty - " + invalid_required_fields.join(", ");
      reject({
        result: "inputError",
        message: message
      });
    } else {
      resolve({
        result: "success",
        input: input
      });
    }
  });
};

var validateMetricsInput = (data) => {
  return new Promise((resolve, reject) => {
    var statistics_type = global_config.STATISTICS_TYPE;
    var patternUTC = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(.[0-9]{0,3})?Z?$/;
    data.statistics = data.statistics.toLowerCase();

    if (data.interval % 60 !== 0) {
      reject({
        result: "inputError",
        message: "Invalid interval value"
      });
    }

    if (!(patternUTC.test(data.end_time))) {
      reject({
        result: "inputError",
        message: "Invalid end_time"
      });
    }

    if (!(patternUTC.test(data.start_time))) {
      reject({
        result: "inputError",
        message: "Invalid start_time"
      });
    }

    if (data.start_time > data.end_time) {
      reject({
        result: "inputError",
        message: "start_time should be less than end_time"
      });
    }

    if (statistics_type.indexOf(data.statistics) === -1) {
      reject({
        result: "inputError",
        message: "Invalid statistics type"
      });
    }

    resolve(data);
  });
};

var validateAssetType = (input) => {
  return new Promise((resolve, reject) => {
    if(input.asset_type && global_config.ASSET_TYPES.indexOf(input.asset_type) === -1) {
      reject({
        result: "inputError",
        message: `${input.asset_type} asset type is not supported.`
      });
    } else {
      resolve(input);
    }
  });
}

module.exports = {
  validateGeneralFields
}
