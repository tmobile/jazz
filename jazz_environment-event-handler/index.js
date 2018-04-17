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

"use strict";

const config = require("./components/config.js");
const logger = require("./components/logger.js");
const utils = require("./utils/utils.js")();
const errorHandlerModule = require("./components/error-handler.js");
var errorHandler = errorHandlerModule(logger);
const rp = require('request-promise-native');

const AWS = require("aws-sdk");
const _ = require("lodash");
const request = require("request");
const async = require("async");
const nanoid = require("nanoid/generate");
const fcodes = require('./utils/failure-codes.js');
const fs = require('fs');

var failureCodes = fcodes();
var processedEvents = [];
var failedEvents = [];

var handler = (event, context, cb) => {
	var configData = config(context);
	var authToken;

	rp(getTokenRequest(configData))
		.then(result => {
			return getAuthResponse(result);
		})
		.then(authToken => {
			return processEvents(event, configData, authToken);
		})
		.then(result => {
			var records = getEventProcessStatus();
			logger.info("Successfully processed events. " + JSON.stringify(records));
			return cb(null, records);
		})
		.catch(err => {
			var records = getEventProcessStatus();
			logger.error("Error processing events. " + JSON.stringify(err));
			return cb(null, records);
		});

}

var getTokenRequest = function (configData) {
	return {
		uri: configData.BASE_API_URL + configData.TOKEN_URL,
		method: 'post',
		json: {
			"username": configData.SERVICE_USER,
			"password": configData.TOKEN_CREDS
		},
		rejectUnauthorized: false,
		transform: function (body, response, resolveWithFullResponse) {
			return response;
		}
	};
};

var getAuthResponse = function (result) {
	logger.info("result.statusCode" + result.statusCode)
	return new Promise((resolve, reject) => {
		if (result.statusCode === 200 && result.body && result.body.data) {
			return resolve(result.body.data.token);
		} else {
			return reject(errorHandler.throwInternalServerError("Invalid token response from API"));
		}
	})
}

var processEvents = function (event, configData, authToken) {
	return new Promise((resolve, reject) => {
		var processEachEventPromises = [];
		for (var i = 0; i < event.Records.length; i++) {
			processEachEventPromises.push(processEachEvent(event.Records[i], configData, authToken));
		}
		Promise.all(processEachEventPromises)
			.then((result) => {
				logger.info("result" + result);
				return resolve(result);
			})
			.catch((error) => { return reject(error); });
	});
}

var processEachEvent = function (record, configData, authToken) {
	return new Promise((resolve, reject) => {
		var sequenceNumber = record.kinesis.sequenceNumber;
		var encodedPayload = record.kinesis.data;
		var payload;
		return checkForInterestedEvents(encodedPayload, sequenceNumber, configData)
			.then(result => {
				payload = result.payload;
				if (result.interested_event) {
					return processItem(payload, configData, authToken);
				} else {
					return new Promise((resolve, reject) => {
						resolve({ "message": "Not an interesting event" });
					});
				}
			})
			.then(result => {
				handleProcessedEvents(sequenceNumber, payload);
				return resolve(result);
			})
			.catch(err => {
				handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
				return reject(err);
			});
	});
}

var checkForInterestedEvents = function (encodedPayload, sequenceNumber, config) {
	return new Promise((resolve, reject) => {
		var kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
		if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
			if (_.includes(config.EVENTS.EVENT_TYPE, kinesisPayload.Item.EVENT_TYPE.S) &&
				_.includes(config.EVENTS.EVENT_NAME, kinesisPayload.Item.EVENT_NAME.S)) {
				logger.info("found " + kinesisPayload.Item.EVENT_TYPE.S + " event with sequence number: " + sequenceNumber);
				return resolve({
					"interested_event": true,
					"payload": kinesisPayload.Item
				});
			} else {
				return resolve({
					"interested_event": false,
					"payload": kinesisPayload.Item
				});
			}
		}
	});
}

/* validate and processs item. TODO update function name*/
var processItem = function (eventPayload, configData, authToken) {
	return new Promise((resolve, reject) => {

		var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
		logger.info("svcContext: " + JSON.stringify(svcContext));

		var environmentApiPayload = {};
		environmentApiPayload.service = eventPayload.SERVICE_NAME.S;
		environmentApiPayload.created_by = eventPayload.USERNAME.S;

		environmentApiPayload.domain = svcContext.domain;
		environmentApiPayload.physical_id = svcContext.branch;

		//environmentApiPayload.endpoint = svcContext.endpoint;

		if (eventPayload.EVENT_NAME.S === configData.EVENTS.INITIAL_COMMIT) {
			process_INITIAL_COMMIT(environmentApiPayload, configData, authToken)
				.then(result => { return resolve(result) })
				.catch(err => { return reject(err) })

		} else if (eventPayload.EVENT_NAME.S === configData.EVENTS.CREATE_BRANCH) {
			environmentApiPayload.friendly_name = svcContext.branch;
			process_CREATE_BRANCH(environmentApiPayload, configData, authToken)
				.then(result => { return resolve(result) })
				.catch(err => { return reject(err) })

		} else if (eventPayload.EVENT_NAME.S === configData.EVENTS.UPDATE_ENVIRONMENT) {
			environmentApiPayload.status = svcContext.status;
			environmentApiPayload.endpoint = svcContext.endpoint;
			environmentApiPayload.friendly_name = svcContext.friendly_name;

			if (!svcContext.logical_id) {
				getEnvironmentLogicalId(environmentApiPayload, configData, authToken)
					.then((logical_id) => {
						environmentApiPayload.logical_id = logical_id;
						process_UPDATE_ENVIRONMENT(environmentApiPayload, configData, authToken)
							.then(result => { return resolve(result) })
							.catch(err => { return reject(err) })
					});

			} else {
				environmentApiPayload.logical_id = svcContext.logical_id;
				process_UPDATE_ENVIRONMENT(environmentApiPayload, configData, authToken)
					.then(result => { return resolve(result) })
					.catch(err => { return reject(err) })
			}

		} else if (eventPayload.EVENT_NAME.S === configData.EVENTS.DELETE_ENVIRONMENT) {
			environmentApiPayload.endpoint = svcContext.endpoint;
			environmentApiPayload.logical_id = svcContext.environment;

			var event_status = eventPayload.EVENT_STATUS.S;
			if (event_status === 'STARTED') {
				environmentApiPayload.status = configData.ENVIRONMENT_DELETE_STARTED_STATUS;
			} else if (event_status === 'FAILED') {
				environmentApiPayload.status = configData.ENVIRONMENT_DELETE_FAILED_STATUS;
			} else if (event_status === 'COMPLETED') {
				environmentApiPayload.status = configData.ENVIRONMENT_DELETE_COMPLETED_STATUS;
			}

			// Update with DELETE status
			process_UPDATE_ENVIRONMENT(environmentApiPayload, configData, authToken)
				.then(result => { return resolve(result) })
				.catch(err => { return reject(err) })

		} else if (eventPayload.EVENT_NAME.S === configData.EVENTS.DELETE_BRANCH) {
			environmentApiPayload.physical_id = svcContext.branch;

			process_DELETE_BRANCH(environmentApiPayload, configData, authToken)
				.then(result => { return resolve(result) })
				.catch(err => { return reject(err) })

		}

	});
}

var process_INITIAL_COMMIT = function (environmentPayload, configData, authToken) {
	return new Promise((resolve, reject) => {
		if (environmentPayload.physical_id === configData.ENVIRONMENT_PRODUCTION_PHYSICAL_ID) {
			environmentPayload.logical_id = "stg";
			environmentPayload.status = configData.CREATE_ENVIRONMENT_STATUS;

			var svcPayload = {
				uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE,
				method: "POST",
				headers: { Authorization: authToken },
				json: environmentPayload,
				rejectUnauthorized: false
			};

			logger.info("svcPayload" + JSON.stringify(svcPayload));
			request(svcPayload, function (error, response, body) {
				if (response.statusCode === 200 && typeof body !== undefined && typeof body.data !== undefined) {
					return resolve(null, body);
				} else {
					return reject({
						"error": "Error creating service " + svcPayload.DOMAIN + "." + svcPayload.SERVICE_NAME + " in service catalog",
						"details": response.body.message
					});
				}
			});

			svcPayload.json.logical_id = "prod";

			logger.info("svcPayload" + JSON.stringify(svcPayload));
			request(svcPayload, function (error, response, body) {
				if (response.statusCode === 200 && typeof body !== undefined && typeof body.data !== undefined) {
					return resolve(null, body);
				} else {
					return reject({
						"error": "Error creating service " + svcPayload.DOMAIN + "." + svcPayload.SERVICE_NAME + " in service catalog",
						"details": response.body.message
					});
				}
			});

		} else {
			return reject("INITIAL_COMMIT event should be triggered by a master commit. physical_id is " + environmentApiPayload.physical_id);
		}

	});

}

var process_CREATE_BRANCH = function (environmentPayload, configData, authToken) {
	return new Promise((resolve, reject) => {

		var nano_id = nanoid(configData.RANDOM_CHARACTERS, configData.RANDOM_ID_CHARACTER_COUNT);
		environmentPayload.logical_id = nano_id + "-dev";
		environmentPayload.status = configData.CREATE_ENVIRONMENT_STATUS;

		logger.info("environmentPayload" + JSON.stringify(environmentPayload));
		var svcPayload = {
			uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE,
			method: "POST",
			headers: { Authorization: authToken },
			json: environmentPayload,
			rejectUnauthorized: false
		};

		logger.info("svcPayload" + JSON.stringify(svcPayload));
		request(svcPayload, function (error, response, body) {
			if (response.statusCode && response.statusCode === 200 && typeof body !== undefined && typeof body.data !== undefined) {
				return resolve(body);
			} else {
				return reject({
					"error": "Error creating service " + svcPayload.DOMAIN + "." + svcPayload.SERVICE_NAME + " in service catalog",
					"details": response.body.message
				});
			}
		});
	});

}

var process_DELETE_BRANCH = function (environmentPayload, configData, authToken) {
	return new Promise((resolve, reject) => {

		getEnvironmentLogicalId(environmentPayload, configData, authToken)
			.then((logical_id) => {
				logger.info("logical_id" + logical_id);
				environmentPayload.logical_id = logical_id;

				// Update catalog status first. @TODO

				var deleteServiceEnvPayload = {
					"service_name": environmentPayload.service,
					"domain": environmentPayload.domain,
					"version": "LATEST",
					"environment_id": environmentPayload.logical_id
				};

				var delSerPayload = {
					uri: configData.BASE_API_URL + configData.DELETE_ENVIRONMENT_API_RESOURCE,
					method: "POST",
					headers: { Authorization: authToken },
					json: deleteServiceEnvPayload,
					rejectUnauthorized: false
				};

				request(delSerPayload, function (error, response, body) {
					if (response.statusCode && response.statusCode === 200) {
						return resolve(body);
					} else {
						return reject({
							"error": "Error creating triggering the delete environment",
							"details": response.body.message
						});
					}

				});
			});

	});

}

var process_UPDATE_ENVIRONMENT = function (environmentPayload, configData, authToken) {
	return new Promise((resolve, reject) => {

		var updatePayload = {};
		updatePayload.status = environmentPayload.status;
		updatePayload.endpoint = environmentPayload.endpoint;
		updatePayload.friendly_name = environmentPayload.friendly_name;

		var svcPayload = {
			uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE + "/" + environmentPayload.logical_id +
				"?domain=" +
				environmentPayload.domain +
				"&service=" +
				environmentPayload.service,
			method: "PUT",
			headers: { Authorization: authToken },
			json: updatePayload,
			rejectUnauthorized: false
		};

		request(svcPayload, function (error, response, body) {
			if (response.statusCode && response.statusCode === 200) {
				return resolve(body);
			} else {
				return reject({
					"error": "Error updating the environment",
					"details": response.body.message
				});
			}

		});

	});

}


var getEnvironmentLogicalId = function (environmentPayload, configData, authToken) {
	return new Promise((resolve, reject) => {
		var svcPayload = {
			uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE + "?domain=" + environmentPayload.domain + "&service=" + environmentPayload.service,
			method: "GET",
			headers: { Authorization: authToken },
			rejectUnauthorized: false
		};

		request(svcPayload, function (error, response, body) {
			if (response.statusCode === 200 && typeof body !== undefined && typeof body.data !== undefined) {
				logger.info("body==" + body);

				var env_logical_id = null;
				var dataJson = JSON.parse(body);
				if (dataJson.data && dataJson.data.environment) {
					var envList = dataJson.data.environment;
					for (var count = 0; count < envList.length; count++) {
						if (envList[count]) {
							if (envList[count].physical_id === environmentPayload.physical_id) {
								env_logical_id = envList[count].logical_id;
								return resolve(env_logical_id);
							}
						}
					}
				}

			} else {
				return reject({
					"error": "Could not get environment Id for service and domain",
					"details": response.body.message
				});
			}

		});

	});

}


var handleProcessedEvents = function (id, payload) {
	processedEvents.push({
		"sequence_id": id,
		"event": payload
	});
}

var handleFailedEvents = function (id, failure_message, payload, failure_code) {
	failedEvents.push({
		"sequence_id": id,
		"event": payload,
		"failure_code": failure_code,
		"failure_message": failure_message
	});
}

var getEventProcessStatus = function () {
	return {
		"processed_events": processedEvents.length,
		"failed_events": failedEvents.length
	};
}

var handleError = function (errorType, message) {
	var error = {};
	error.failure_code = errorType;
	error.failure_message = message;
	return error;
}

var getServiceContext = function (svcContext) {
	var json = {};
	if (svcContext.domain) {
		json.domain = svcContext.domain;
	} else {
		json.domain = null;
	}

	if (svcContext.runtime) {
		json.runtime = svcContext.runtime;
	}
	if (svcContext.region) {
		json.region = svcContext.region;
	}
	if (svcContext.service_type) {
		json.type = svcContext.service_type;
	}
	if (svcContext.branch) {
		json.physical_id = svcContext.branch;
	}
	if (svcContext.branch) {
		json.branch = svcContext.branch;
	}
	if (svcContext.service_id) {
		json.service_id = svcContext.service_id;
	}
	if (svcContext.environment) {
		json.environment = svcContext.environment;
	}

	return json;
}

module.exports = {
	getTokenRequest: getTokenRequest,
	getAuthResponse: getAuthResponse,
	handleError: handleError,
	processEvents: processEvents,
	processEachEvent: processEachEvent,
	checkForInterestedEvents: checkForInterestedEvents,
	processItem: processItem,
	handleProcessedEvents: handleProcessedEvents,
	handleFailedEvents: handleFailedEvents,
	getServiceContext: getServiceContext,
	getEventProcessStatus: getEventProcessStatus,
	handler: handler
}
