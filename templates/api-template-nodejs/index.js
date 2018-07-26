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
Nodejs Template Project
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");

module.exports.handler = (event, context, cb) => {

  //Initializations
  const errorHandler = errorHandlerModule();
  const config = configModule.getConfig(event, context);
  logger.init(event, context);

  try {

    //Following is a code snippet to fetch values from config file:
    const myVal = config.configKey;

    //Following code snippet describes how to log messages within your code:
    /*
    logger.error('Runtime errors or unexpected conditions.');
    logger.warn('Runtime situations that are undesirable or unexpected, but not necessarily "wrong".');
    logger.info('Interesting runtime events (Eg. connection established, data fetched etc.)');
    logger.verbose('Generally speaking, most lines logged by your application should be written as verbose.');
    logger.debug('Detailed information on the flow through the system.');
    */

    const sampleResponse = {
      "foo": "foo-value",
      "bar": "bar-value",
      "configKeys": myVal
    };

    //Your GET method should be handled here
    if (event && event.method && event.method === 'GET') {
      logger.verbose(sampleResponse);
      cb(null, responseObj(sampleResponse, event.query));
    }

    //Your POST method should be handled here
    if (event && event.method && event.method === 'POST') {
      cb(null, responseObj(sampleResponse, event.body));
    }

  } catch (e) {
    //Sample Error response for internal server error
    cb(JSON.stringify(errorHandler.throwInternalServerError("Sample message")));

    //Sample Error response for Not Found Error
    //cb(JSON.stringify(errorHandler.throwNotFoundError("Sample message")));

    //Sample Error response for Input Validation Error
    //cb(JSON.stringify(errorHandler.throwInputValidationError("Sample message")));
  }

};
