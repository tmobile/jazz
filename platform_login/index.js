'use strict';
const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");
const async = require("async");
const jwt = require("jsonwebtoken");
const AWS = require('aws-sdk');
const moment = require('moment');
const AWSCognito = require('amazon-cognito-identity-js');

/**
API Auth Service
@author: Deepak Babu
@version: 1.0
 **/

module.exports.handler = (event, context, callback) => {

	var config = configObj(event);
	logger.init(event, context);
	var errorHandler = errorHandlerModule(logger);

	try {

		if (event !== undefined && event.method !== undefined && event.method === 'POST') {

			if (event.body.username === undefined || event.body.username === "") {
				return callback(JSON.stringify(errorHandler.throwInputValidationError("Username not provided")));
			}

			if (event.body.password === undefined || event.body.password === "") {
				return callback(JSON.stringify(errorHandler.throwInputValidationError("Authentication Failed for user: " + event.body.username + ". Password not provided")));
			}

			var authenticationData = {
						  Username : event.body.username,
					  Password : event.body.password
					};
			
			var poolData = {
					UserPoolId : 'us-east-1_HQgpgbrGK', // Your user pool id here
					ClientId : '1ap8ji4fj5kaljrtis91bumpbo' // Your client id here
				};
			
			var authenticationDetails = new AWSCognito.AuthenticationDetails(authenticationData);
			var userPool = new AWSCognito.CognitoUserPool(poolData);
			var userData = {
					Username : event.body.username,
					Pool : userPool
				};

			var cognitoUser = new AWSCognito.CognitoUser(userData);
			cognitoUser.authenticateUser(authenticationDetails, {
				onSuccess: function (result) {
							console.log('access token + ' + result.getAccessToken().getJwtToken());
						logger.info(" authenticated ");
						callback(null, responseObj(result, {
														"username": event.body.username
												}));
									},

				onFailure: function(err) {
						logger.error("Error while authenticating: " + err);
											   callback({
														"server_error": "Authentication Failed for user: " + event.body.username + " with unknown error."
												});
				}

			 });

			}else {
				callback(JSON.stringify(errorHandler.throwInputValidationError("Bad Request")));
			}
				

	} catch (e) {
		callback(JSON.stringify(errorHandler.throwInternalServerError("Unknown error occured: " + e.message)));
	}
};



