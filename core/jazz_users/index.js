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
Jazz Cognito Users list service
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const validation = require("./components/validation.js");
const getList = require("./components/getList.js");

module.exports.handler = (event, context, cb) => {

  //Initializations
  const errorHandler = errorHandlerModule();
  const config = configModule.getConfig(event, context);
  logger.init(event, context);

  try {
    validation.genericInputValidation(event);

    if (event.method === "GET") {
      getList.listUsers(config)
      .then(res => {
        logger.info("User list: " + JSON.stringify(res));
        return cb(null, responseObj(res, null));
      })
      .catch(err => {
        return cb(JSON.stringify(errorHandler.throwInternalServerError(err)));
      });
    }
  } catch (e) {
    logger.error("error: " + JSON.stringify(e));
    return cb(JSON.stringify(errorHandler.throwInternalServerError(JSON.stringify(e))));
  }
};
