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

const moment = require('moment');
const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const APPEND_ZEROES = '-0000';

function validateMissingFields(requiredFields, query) {
  let missingFields = requiredFields.map(v => v.toLowerCase()).filter(key => !query[key]);

  return missingFields ? missingFields.join(', ') : missingFields;
}

function validateFromDate(from) {
  //if from date is provided validate, else assign default dates
  let fromDate;
  if (from) {
    if (!moment(from, moment.ISO_8601, true).isValid()) {
      return null;
    } else {
      fromDate = moment(from).format(DATE_FORMAT) + APPEND_ZEROES;
    }
  } else {
    fromDate = moment().subtract(1, "days").format(DATE_FORMAT) + APPEND_ZEROES;
  }

  return fromDate;
}

function validateToDate(to) {
  //if to date is provided validate, else assign default dates
  let toDate;
  if (to) {
    if (!moment(to, moment.ISO_8601, true).isValid()) {
      return null;
    } else {
      toDate = moment(to).format(DATE_FORMAT) + APPEND_ZEROES;
    }
  } else {
    toDate = moment().format(DATE_FORMAT) + APPEND_ZEROES;
  }

  return toDate;
}

function validateFromAfterTo(fromDate, toDate) {
  if (fromDate && toDate) {
    if (moment(toDate).isAfter(fromDate)) {
      return true;
    }
  }

  return false;
}

module.exports = {
  validateMissingFields,
  validateFromDate,
  validateToDate,
  validateFromAfterTo
};