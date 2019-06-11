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

'use strict';

global.fetch = require('node-fetch');
const AWSCognito = require('amazon-cognito-identity-js');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");

/**
 * API Auth Service
 *
 * @author:
 * @version:
 */

module.exports.handler = (event, context, callback) => {

	var config = configModule.getConfig(event, context);
	logger.init(event, context);
	var errorHandler = errorHandlerModule(logger);

	try {
		if (event && event.method && event.method === 'POST') {

			if (!event.body.username) {
				logger.warn("Username not provided");
				return callback(JSON.stringify(errorHandler.throwInputValidationError("101", "Username not provided")));
			}

			if (!event.body.password) {
				logger.warn("No password provided for user: " + event.body.username);
				return callback(JSON.stringify(errorHandler.throwInputValidationError("102", "No password provided for user: " + event.body.username + ".")));
			}

			var authenticationData = {
				Username: event.body.username.toLowerCase(),
				Password: event.body.password
			};

			var poolData = {
				UserPoolId: config.USER_POOL_ID,
				ClientId: config.CLIENT_ID
			};

			var authenticationDetails = new AWSCognito.AuthenticationDetails(authenticationData);
			var userPool = new AWSCognito.CognitoUserPool(poolData);
			var userData = {
				Username: event.body.username.toLowerCase(),
				Pool: userPool
			};

			logger.info("Authenticate against cognito for " + event.body.username);

			var cognitoUser = new AWSCognito.CognitoUser(userData);
			cognitoUser.authenticateUser(authenticationDetails, {
				onSuccess: function (result) {
					logger.info("successfully authenticated");
					if(userData.Username === config.ADMIN_ID.toLowerCase()){
						return callback(null, responseObj({"token": result.getAccessToken().getJwtToken(),"globaladmin": true}, {"username": event.body.username}));
					}
					return callback(null, responseObj({ "token": result.getAccessToken().getJwtToken(),"globaladmin": false}, {"username": event.body.username}));
				},
				onFailure: function (err) {
					logger.error("Error while authenticating: " + JSON.stringify(err));
					return callback(JSON.stringify(errorHandler.throwInputValidationError(err.code, err.message)));
				}
			});
		} else {
			logger.warn("Invalid request object " + JSON.stringify(event));
			return callback(JSON.stringify(errorHandler.throwInputValidationError("100", "Bad Request")));
		}
	} catch (e) {
		logger.error("Unknown error occured: " + JSON.stringify(e));
		return callback(JSON.stringify(errorHandler.throwInternalServerError("103", "Unknown error occured: " + e.message)));
	}
};
