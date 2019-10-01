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


function validateCreateSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (validations.genericInputValidation(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_SAFE_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

function validateUpdateSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (validations.genericInputValidation(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    return resolve();
  });
}

function validateSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.path) return reject({ "errorType": "inputError", "message": "Input path cannot be empty" });
    if (validations.genericInputValidation(event.path)) return reject({ "errorType": "inputError", "message": "Input path cannot be empty" });
    if (!event.path.safename) return reject({ "errorType": "inputError", "message": "Following field(s) are required in path- safename" });
    return resolve();
  });
}

function validateUserInSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (validations.genericInputValidation(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_USER_IN_SAFE_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

function validateRoleInSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (validations.genericInputValidation(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_ROLE_IN_SAFE_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

function validateGetRoleInSafeInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.query) return reject({ "errorType": "inputError", "message": "Query cannot be empty" });
    if (validations.genericInputValidation(event.query)) return reject({ "errorType": "inputError", "message": "Query cannot be empty" });
    if (!event.query.rolename) return reject({ "errorType": "inputError", "message": "Following field(s) are required in query- rolename" });
    return resolve();
  });
}

function validateUserInVaultInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (validations.genericInputValidation(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_USER_IN_VAULT_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

function validateUserInVaultDeleteInput(event) {
  return new Promise((resolve, reject) => {
    if (event && !event.body) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    if (validations.genericInputValidation(event.body)) return reject({ "errorType": "inputError", "message": "Input cannot be empty" });
    let missingFieldList = globalConfig.CREATE_USER_IN_VAULT_REQUIRED_FIELDS.filter(x => !Object.keys(event.body).includes(x));
    if (missingFieldList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) are required - " + missingFieldList.join(", ") });
    return resolve();
  });
}

const isEmpty = (obj) => {
  if (obj == null) return true;
  if (obj.length > 0) return false;
  if (obj.length === 0) return true;
  if (typeof obj !== "object") return true;
  for (let key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
};

function genericInputValidation(obj) {
  return new Promise((resolve, reject) => {
    let emptyValueList = [];
    for (let key in obj) {
      if (obj[key] === null || obj[key] === "") {
        emptyValueList.push(key);
      }
    }
    if (emptyValueList.length > 0) return reject({ "errorType": "inputError", "message": "Following field(s) has empty value - " + emptyValueList.join(", ") });
    return resolve();
  });
}

module.exports = { 
  validateCreateSafeInput,
  validateSafeInput,
  validateUpdateSafeInput,
  validateUserInSafeInput,
  validateGetRoleInSafeInput,
  validateRoleInSafeInput,
  validateUserInVaultInput,
  validateUserInVaultDeleteInput,
  genericInputValidation,
  isEmpty
};
