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
const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const crud = require("./components/crud")();

const handler = (event, context, cb) => {
  //Initializations
  let errorHandler = errorHandlerModule();
  let config = configObj.getConfig(event, context);
  global.config = config;
  logger.init(event, context);

  try {
    let apiResponseObj = {};
    if (event && event.method && event.method === 'GET') {
      if (!event.principalId) {
        logger.error('Authorizer did not send the user information, please check if authorizer is enabled and is functioning as expected!');
        return cb(JSON.stringify(errorHandler.throwUnauthorizedError("User is not authorized to access this service|Authorization Incomplete")));
      }
      if (event.principalId != config.ADMIN_ID) {
        return cb(JSON.stringify(errorHandler.throwUnauthorizedError("This user is not authorized to access this service.")));
      }
      exportable.getConfiguration(config)
        .then((data) => {
          apiResponseObj.config = data;
          return cb(null, responseObj(apiResponseObj, event.body));
        }).catch((error) => {
          logger.error("Failed to load admin config file:" + JSON.stringify(error));
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Failed to load config file.")));
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

const exportable = {
  handler,
  getConfiguration
}

module.exports = exportable;
