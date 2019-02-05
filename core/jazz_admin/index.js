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
      exportable.getConfiguration()
        .then((res) => exportable.addConfiguration(res, event.body))
        .then((res) => {
          return cb(null, responseObj(res, event.body));
        }).catch((error) => {
          logger.error("Failed to add admin configuration:" + JSON.stringify(error));
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Failed to add admin configuration.")));
        });

    } else if (event && event.method && event.method === 'DELETE') {
      if (event && !event.body) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Input cannot be empty. Please give list of keys to be deleted.")));
      }
      if (!(event.body instanceof Array)) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Please give list of keys to be deleted.")));
      }
      exportable.getConfiguration()
        .then((res) => exportable.deleteConfiguration(res, event.body))
        .then((res) => {
          return cb(null, responseObj(res, event.body));
        }).catch((error) => {
          logger.error("Failed to delete the specified admin configuration:" + JSON.stringify(error));
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Failed to delete the specified admin configuration.")));
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

const addConfiguration = (configs, input) => {
  return new Promise((resolve, reject) => {
    const jeditor = new jsonEditor(configs);
    const new_config = jeditor.editJson(input);
    crud.post(new_config, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

const deleteConfiguration = (configs, keys) => {
  return new Promise((resolve, reject) => {
    const jeditor = new jsonEditor(configs);
    const new_config = jeditor.removeKeys(keys);
    crud.post(new_config, function (err, data) {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}


const exportable = {
  handler,
  getConfiguration,
  addConfiguration,
  deleteConfiguration
}

module.exports = exportable;
