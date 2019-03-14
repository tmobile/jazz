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
Jazz User Management service
@author:
@version: 1.0
 **/

const _ = require("lodash");

const AWS = require('aws-sdk');
const rp = require('request-promise-native');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const getList = require("./components/getList.js");

const scmFactory = require("./scm/scmFactory.js");

function handler(event, context, cb)  {

	var errorHandler = errorHandlerModule();
	logger.init(event, context);

	var config = configModule.getConfig(event, context);

	if (!config || config.length) { 	
		logger.error("Cannot load config object, will stop processing");
		return cb(JSON.stringify(errorHandler.throwInternalServerError("101", "Internal error, please reach out to admins")));
	}

	global.config = config;
	try {
		logger.info(JSON.stringify(event));

		if (!event || !event.method || !event.resourcePath) {
			return cb(JSON.stringify(errorHandler.throwInputValidationError("101", "invalid or missing arguments")));
		}

		if (!(event.method === 'POST' || event.method === 'GET')) {
			return cb(JSON.stringify(errorHandler.throwInputValidationError("101", "Service operation not supported")));
		}

		var service_data = event.body;

		var subPath = getSubPath(event.resourcePath);
		const cognito = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-19', region: config.REGION });

		if (subPath.indexOf('reset') > -1) {
			logger.info('User password reset Request:' + JSON.stringify(service_data));

			exportable.validateResetParams(service_data)
			.then(() => exportable.forgotPassword(cognito, config, service_data) )
				.then(result => {
						  logger.info("Password reset was successful for user: " + service_data.email);
						  return cb(null, responseObj({ result: "success", errorCode: "0", message: "Password reset was successful for user: " + service_data.email }));
					  })
				.catch((err) => {
					logger.error("Failed while resetting user password: " + JSON.stringify(err));
					
					if (err.errorType) {
						// error has already been handled and processed for API gateway
						return cb(JSON.stringify(err));
					} else {
						if (err.code) {
							return cb(JSON.stringify(errorHandler.throwInputValidationError(err.code, err.message)));
						}
						return cb(JSON.stringify(errorHandler.throwInternalServerError("106", "Failed while resetting user password for: " + service_data.email)));
					}
				});
		} else if (subPath.indexOf('updatepwd') > -1) {
			logger.info('User password update Request::' + JSON.stringify(service_data));

			exportable.validateUpdatePasswordParams(service_data)
				.then(() =>  exportable.updatePassword(cognito, config, service_data))
				.then(result => {
					logger.info("Successfully updated password for user: " + service_data.email);
					return cb(null, responseObj({ result: "success", errorCode: "0", message: "Successfully updated password for user: " + service_data.email }));
				})
				.catch(function (err) {
					logger.error("Failed while updating user password: " + JSON.stringify(err));

					if (err.errorType) {
						// error has already been handled and processed for API gateway
						return cb(JSON.stringify(err));
					} else {
						if (err.code) {
							return cb(JSON.stringify(errorHandler.throwInputValidationError(err.code, err.message)));
						}

						return cb(JSON.stringify(errorHandler.throwInternalServerError("106", "Failed while updating user password for: " + service_data.email)));
					}
				});
		} else if (subPath.indexOf('users') > -1) {

			if(!event.principalId) {
				return cb(JSON.stringify(errorHandler.throwUnauthorizedError("401", "Unauthorized")));
			}

			if (event.method === "GET") {
				getList.listUsers(config)
				.then(res => {
				logger.info("User list: " + JSON.stringify(res));
				return cb(null, responseObj({result: res, errorCode: "0", message: null}));
				})
				.catch(err => {
				return cb(JSON.stringify(errorHandler.throwInternalServerError('106', JSON.stringify(err))));
				});
			}
		} else {
			logger.info('User Reg Request::' + JSON.stringify(service_data));

			exportable.validateCreaterUserParams(config, service_data)
				.then((s) => exportable.createUser(cognito, config, s))
				.then((s) => rp(exportable.getRequestToCreateSCMUser(config, service_data)))
				.then(result => {
					logger.info("User: " + service_data.userid + " registered successfully!");
					return cb(null, responseObj({ result: "success", errorCode: "0", message: "User registered successfully!" }));
				})
				.catch(function (err) {
					logger.error("Failed while registering user: " + JSON.stringify(err, Object.getOwnPropertyNames(err)));

					if (err.errorType) {
						// error has already been handled and processed for API gateway
						return cb(JSON.stringify(err));
					} else {
						if (err.code) {
							return cb(JSON.stringify(errorHandler.throwInputValidationError(err.code, err.message)));
						}

						return cb(JSON.stringify(errorHandler.throwInternalServerError("101", "Failed while registering user: " + service_data.userid)));
					}
				});
		}
	} catch (e) {
		logger.error('Error in user registration : ' + e.message);
		return cb(JSON.stringify(errorHandler.throwInternalServerError("101", e.message)));
	}
};

/**
 * Returns the subpath for this service
 * @param {String} queryPath
 * @returns {String} subPaths
 */
function getSubPath(queryPath) {
	if (queryPath) {
		var queryPaths = queryPath.split('/');
		if (queryPaths && queryPaths.length > 2) {
			queryPaths.splice(0, 3); // /{namespace}/{service}/
			return queryPaths.join('/');
		}
	}
}

/**
 * Validates user password reset params
 * @param {object} userInput
 *
 */
function validateResetParams(userInput) {
	return new Promise((resolve, reject) => {

		var errorHandler = errorHandlerModule();

		if (!userInput.email) {
			logger.info("no email address provided for password reset");
			reject(errorHandler.throwInputValidationError("102", "email is required field"));
		} else {
			resolve();
		}
	});
}

function validateUpdatePasswordParams(userInput) {
	return new Promise((resolve, reject) => {

		var errorHandler = errorHandlerModule();

		if (!userInput.email) {
			logger.warn("no email address provided for password update"); 
			return reject(errorHandler.throwInputValidationError("102", "Email is required field"));
		}

		if (!userInput.verificationCode) {
			logger.warn("no verification code provided for password update");
			return reject(errorHandler.throwInputValidationError("102", "Verification code is required"));
		}

		if (!userInput.password) {
			logger.warn("no password provided for password update");
			return reject(errorHandler.throwInputValidationError("102", "Password is required"));
		}
		else {
			resolve('success');
		}
	});
}

/**
 *
 * @param {object} userInput
 * @returns promise
 */
function validateCreaterUserParams(config, userInput) { 
	var errorHandler = errorHandlerModule();

	return new Promise((resolve, reject) => {

		var missing_required_fields = _.difference(_.values(config.required_fields), _.keys(userInput));
		
		if (missing_required_fields.length > 0) {
			logger.error("Following field(s) are required - " + missing_required_fields.join(", "));
			return reject(errorHandler.throwInputValidationError("102", "Following field(s) are required - " + missing_required_fields.join(", ")));
		}

		for (var i = 0; i < config.required_fields.length; i++) {
			if (!userInput[config.required_fields[i]]) {
				logger.error(config.required_fields[i] + "'s value cannot be empty");
				return reject(errorHandler.throwInputValidationError("102", config.required_fields[i] + "'s value cannot be empty"));
			}
		}

		userInput.usercode = userInput.usercode.toUpperCase();
		if (!_.includes(config.reg_codes, userInput.usercode)) {
			logger.error("Invalid User Registration Code provided ");
			return reject(errorHandler.throwInputValidationError("103", "Invalid User Registration Code"));
		}

		resolve(userInput);
	});
}

function createUser(cognitoClient, config, userData) {
	return new Promise((resolve, reject) => {

		var cognitoParams = {
			ClientId: config.USER_CLIENT_ID,
			Username: userData.userid.toLowerCase(),
			Password: userData.userpassword,
			UserAttributes: [{ Name: "custom:reg-code", "Value": userData.usercode }],
			ValidationData: []
		};

		cognitoClient.signUp(cognitoParams, (err, result) => {
			if (err)
				reject(err);
			else
				resolve(result);
		});
	});
}

function forgotPassword(cognitoClient, config, userData) {
	return new Promise((resolve, reject) => {

		var cognitoParams = {
			ClientId: config.USER_CLIENT_ID,
			Username: userData.email
		};
		cognitoClient.forgotPassword(cognitoParams, (err, result) => {
			if (err)
				reject(err);
			else
				resolve(result);
		});
	});
}

function updatePassword(cognitoClient, config, userData) {
	return new Promise((resolve, reject) => {

		var cognitoParams = {
			ClientId: config.USER_CLIENT_ID,
			Username: userData.email,
			ConfirmationCode: userData.verificationCode,
			Password: userData.password
		};

		cognitoClient.confirmForgotPassword(cognitoParams, (err, result) => {
			if (err)
				reject(err);
			else
				resolve(result);
		});
	});
}

function getRequestToCreateSCMUser(config, userData) {
	var scm = new scmFactory(config);
	return scm.addUserRequest(userData.userid.toLowerCase(), userData.userpassword);
}


const exportable = {	
	handler,
	validateResetParams,
	validateUpdatePasswordParams,
	validateCreaterUserParams,
	createUser,
	forgotPassword,
	updatePassword,
	getRequestToCreateSCMUser
	
};
module.exports = exportable;