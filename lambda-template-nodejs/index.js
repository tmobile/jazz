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
	Nodejs Lambda Template Project
	@Author:
	@version: 1.0
**/

const config = require('./components/config.js'); //Import the environment data.
const secretHandlerModule = require("./components/secret-handler.js"); //Import the secret-handler module.
const logger = require("./components/logger.js"); //Import the logging module.

module.exports.handler = (event, context, cb) => {

  //Initializations
  var configData = config(context);
  var secretHandler = secretHandlerModule();


  //Following is a code snippet to fetch plaintext for your secret:
  /*
  var decryptObj = secretHandler.decryptSecret(config.mysecret);
  var plaintext = "";
  var decryptionerror = "";
  if (decryptObj.error !== undefined && decryptObj.error == true) {
  	decryptionerror = decryptObj.message;
  } else {

  	plaintext = decryptObj.message;
  }
  */

  //Following code snippet describes how to log messages within your code:
  /*
  logger.error('Runtime errors or unexpected conditions.');
  logger.warn('Runtime situations that are undesirable or unexpected, but not necessarily "wrong".');
  logger.info('Interesting runtime events (Eg. connection established, data fetched etc.)');
  logger.verbose('Generally speaking, most lines logged by your application should be written as verbose.');
  logger.debug('Detailed information on the flow through the system.');
  */

  cb(null, {
    message: 'Your Hello World lambda function executed successfully!',
    input: event
  });
};
