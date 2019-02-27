// =========================================================================
// Copyright ©  2017 T-Mobile USA, Inc.
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
API for the admin user to perform administrative tasks
@author:
@version: 1.0
 **/

'use strict';
const errorHandler = require("./components/error-handler.js")(); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const jsonEditor = require("./components/json-editor.js");
const crud = require("./components/crud")();

const handler = (event, context, cb) => {
  //Initializations
  let config = configObj.getConfig(event, context);
  global.config = config;
  logger.init(event, context);

  try {

    if (event && !event.method) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Method cannot be empty")));
    }

    if (event && !event.principalId) {
      return cb(JSON.stringify(errorHandler.throwUnauthorizedError("User is not authorized to access this service|Authorization Incomplete")));
    }

    if (event && event.principalId !== config.ADMIN_ID) {
      return cb(JSON.stringify(errorHandler.throwUnauthorizedError("This user is not authorized to access this service.")));
    }

    if (event && event.method && event.method === 'GET') {
      let apiResponseObj = {};
      exportable.getConfiguration()
        .then((res) => {
          apiResponseObj.config = res;
          return cb(null, responseObj(apiResponseObj, event.body));
        }).catch((error) => {
          logger.error("Failed to load admin configuration :" + JSON.stringify(error));
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Failed to load admin configuration.")));
        });

    } else if (event && event.method && event.method === 'POST') {
      if (event && !event.body) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Input cannot be empty")));
      }
      exportable.validateQueryInput(event)
        .then(() => exportable.getConfiguration())
        .then((res) => exportable.addConfiguration(res, event))
        .then((res) => {
          return cb(null, responseObj(res, event.body));
        }).catch((error) => {
          logger.error("Failed to add admin configuration:" + JSON.stringify(error));
          return cb(JSON.stringify(error));
        });

    } else if (event && event.method && event.method === 'DELETE') {
      exportable.validateQueryInput(event)
        .then(() => exportable.validateInputForDelete(event))
        .then(() => exportable.getConfiguration())
        .then((res) => exportable.deleteConfiguration(res, event))
        .then((res) => {
          return cb(null, responseObj(res, event.body));
        }).catch((error) => {
          logger.error("Failed to delete the specified admin configuration:" + JSON.stringify(error));
          return cb(JSON.stringify(error));
        });
    } else {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("The requested method is not supported")));
    }
  } catch (error) {
    logger.error(JSON.stringify(error));
    cb(JSON.stringify(errorHandler.throwInternalServerError("Unknown Error")));
  }
}

const getConfiguration = () => {
  return new Promise((resolve, reject) => {
    crud.get(function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

const addConfiguration = (configs, event) => {
  return new Promise((resolve, reject) => {
    const jeditor = new jsonEditor(configs);
    let new_config
    if (isEmpty(event.query)) {
      new_config = jeditor.editJson(event.body);
    } else {
      const input = {
        path: event.query.path,
        id: event.query.id,
        value: event.query.value,
        body: event.body
      }
      const res = jeditor.editJsonList(input)
      if (!res.isError) {
        new_config = res.data
      } else {
        return reject(res.error);
      }
    }

    crud.post(new_config, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

const deleteConfiguration = (configs, event) => {
  return new Promise((resolve, reject) => {
    const jeditor = new jsonEditor(configs);
    let new_config
    if (isEmpty(event.query)) {
      new_config = jeditor.removeKeys(event.body);
    } else {
      const input = {
        path: event.query.path,
        id: event.query.id,
        value: event.query.value
      }
      const res = jeditor.removeJsonList(input)
      if (!res.isError) {
        new_config = res.data
      } else {
        return reject(res.error);
      }
    }

    crud.post(new_config, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

const validateQueryInput = (event) => {
  return new Promise((resolve, reject) => {
    if (!isEmpty(event.query)) {
      if (!event.query.path) {
         reject({
          errorType: "BadRequest",
          message: "Json path is not provided in query."
        });
      }
      if (!event.query.id) {
        return reject({
          errorType: "BadRequest",
          message: "Unique id is not provided in query."
        });
      }
      if (!event.query.value) {
        return reject({
          errorType: "BadRequest",
          message: "Unique value is not provided in query."
        });
      }
    }
    return resolve({ result: "success" });
  });
}

const validateInputForDelete = (event) => {
  return new Promise((resolve, reject) => {
    if (isEmpty(event.query)) {
      if (!event.body) {
        return reject({
          errorType: "BadRequest",
          message: "Input cannot be empty. Please give list of keys to be deleted."
        });
      }
      if (!(event.body instanceof Array)) {
        return reject({
          errorType: "BadRequest",
          message: "Please give list of keys to be deleted."
        });
      }
    } else {
      let pathList = event.query.path.split("#");
      let idList = event.query.id.split("#");
      let valueList = event.query.value.split("#");

      if (pathList.length !== idList.length || pathList.length !== valueList.length) {
        return reject({
          errorType: "BadRequest",
          message: "Please give the correct mapping in query"
        });
      }
    }
    return resolve({ result: "success" });
  });
}

const isEmpty = (obj) => {
  if (obj == null) return true;
  if (obj.length > 0)    return false;
  if (obj.length === 0)  return true;
  if (typeof obj !== "object") return true;
  for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}

const exportable = {
  handler,
  validateQueryInput,
  getConfiguration,
  addConfiguration,
  deleteConfiguration,
  validateInputForDelete,
  isEmpty
}

module.exports = exportable;
