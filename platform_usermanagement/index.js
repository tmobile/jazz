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
Jazz User Management service
@author: 
@version: 1.0
 **/

const _ = require("lodash");

const request = require('request');
const AWS = require('aws-sdk');
const rp = require('request-promise-native');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");

module.exports.handler = (event, context, cb) => {

  	var errorHandler = errorHandlerModule();
  	logger.init(event, context);
  
  	var config = configObj(event);

  	if (!config || config.length) {
	  	logger.error("Cannot load config object, will stop processing");
		return cb(JSON.stringify(errorHandler.throwInternalServerError("101", "Internal error, please reach out to admins")));
  	}

	global.config = config;
	
	try {

		if (!event || !event.method) {
			return cb(JSON.stringify(errorHandler.throwInputValidationError("101", "method cannot be empty")));
		}

		if (event.method !== 'POST')  {
			return cb(JSON.stringify(errorHandler.throwInputValidationError("101", "Service operation not supported")));
		}

		var service_data = event.body;

		logger.info('User Reg Request::' + JSON.stringify(service_data));

		var missing_required_fields = _.difference(_.values(config.required_fields), _.keys(service_data));

		if (missing_required_fields.length > 0) {
			logger.error("Following field(s) are required - " + missing_required_fields.join(", "));
			return cb(JSON.stringify(errorHandler.throwInputValidationError("102", "Following field(s) are required - " + missing_required_fields.join(", "))));
		}

		for (var i = 0; i < config.required_fields.length; i++) {
			if (!service_data[config.required_fields[i]]) {
				logger.error(config.required_fields[i] + "'s value cannot be empty");
				return cb(JSON.stringify(errorHandler.throwInputValidationError("102", config.required_fields[i] + "'s value cannot be empty")));
			}
		}

		service_data.usercode = service_data.usercode.toUpperCase();
		if (!_.includes(config.reg_codes, service_data.usercode)) {
			logger.error("Invalid User Registration Code provided ");
			return cb(JSON.stringify(errorHandler.throwInputValidationError("103", "Invalid User Registration Code")));
		}

		const cognito = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-19', region: config.REGION });

		createUser(cognito, config, service_data)
		.then(result => rp(createUserInBitBucket(config, service_data, result.UserSub)))
		.then(function(result){
			logger.info("User: " + service_data.userid + " registered successfully!");
			return cb(null, {result: "success",errorCode: "0",message: "User registered successfully!"});
		}).catch(function (err) {
			logger.error(JSON.stringify(err));
			logger.error("Failed while registering user: " + service_data.userid);
			return cb(JSON.stringify(errorHandler.throwInputValidationError("106", "Failed while registering user: " + service_data.userid)));
		});
	} catch (e) {
		logger.error('Error in user registration : ' + e.message);
		return cb(JSON.stringify(errorHandler.throwInternalServerError("101", e.message)));
	}
};

function createUser(cognitoClient, config, userData) {
	return new Promise((resolve, reject) => {

		var cognitoParams = {
			ClientId: config.USER_CLIENT_ID,
			Username: userData.userid.toLowerCase(),
			Password: userData.userpassword,
			UserAttributes: [{Name: "custom:reg-code", "Value": userData.usercode}],
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

function createUserInBitBucket(config, userData) {
	var encodedUserid = encodeURIComponent(userData.userid);
	var encodedPwd = encodeURIComponent(userData.userpassword);
	var url = config.bitbucket_service_host + config.bitbucket_usr_add_path + '?name=' + encodedUserid + '&password=' + encodedPwd + '&displayName=' + encodedUserid + '&emailAddress=' + encodedUserid + '&addToDefualtGroup=false&notify=false';

	return {
		url: url,
		auth: {
			user: config.bitbucket_username,
			password: config.bitbucket_password
		},
		method: 'POST',
		rejectUnauthorized: false,
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'X-Atlassian-Token': 'no-check'
		},
		qs: {}
	};
}
