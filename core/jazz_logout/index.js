// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const AWS = require('aws-sdk');

module.exports.handler = (event, context, cb) => {
	//Initializations
	var errorHandler = errorHandlerModule();
	var config = configObj(event);
	logger.init(event, context);

	try {

		if (!event || !event.method || event.method != 'POST') {
			logger.error("Invalid input parameters " + JSON.stringify(event));
			return cb(JSON.stringify(errorHandler.throwInputValidationError('Invalid input parameters.')));
		}

		if (!event.headers.Authorization) {
			logger.error('No session token to sign-out');
			return cb(JSON.stringify(errorHandler.throwInputValidationError('Authorization token not provided.')));
		}

		var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

		var cognitoParams = {
			AccessToken: event.headers.Authorization
		};

		cognitoidentityserviceprovider.getUser(cognitoParams, function (err, data) {
			if (err)
				logger.info("Couldnot identify user from the available token " + JSON.stringify(err));
			else {
				logger.info("Identified user from Token " + JSON.stringify(data.Username));

				cognitoidentityserviceprovider.globalSignOut(cognitoParams, function (err, data) {
					if (err)
						logger.info("Error " + err + " stack " + err.stack);
					else {
						logger.info("Signed out " + JSON.stringify(data));
						cb(null, responseObj({ "status": "User signed out successfully!" }, {}));
					}
				});
			}
		});
	} catch (e) {
		logger.error("Unknown error occured. Could not signout user! " + JSON.stringify(e));
		cb(JSON.stringify(errorHandler.throwInternalServerError("Unknown error occured. Could not signout user! " + e)));
	}
};
