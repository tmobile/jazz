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
/**
	Deployments event handler function.
	@Author:
	@version: 1.0
**/

const _ = require("lodash");
const request = require("request");
const rp = require('request-promise-native');

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const errorHandlerModule = require("./components/error-handler.js");
const fcodes = require('./utils/failure-codes.js');

var errorHandler = errorHandlerModule(logger);
var failureCodes = fcodes();
var processedEvents = [];
var failedEvents = [];

function handler(event, context, cb) {
	var config = configModule.getConfig(event, context);

	rp(exportable.getTokenRequest(config))
		.then(result => {
			return exportable.getAuthResponse(result);
		})
		.then(authToken => {
			return exportable.processEventRecords(event, config, authToken);
		})
		.then(result => {
			var records = exportable.getEventProcessStatus();
			logger.info("Successfully processed events: " + JSON.stringify(records));
			return cb(null, records);
		})
		.catch(err => {
			var records = exportable.getEventProcessStatus();
			logger.error("Error processing events: " + JSON.stringify(err));
			return cb(null, records);
		});
};

function getTokenRequest(configData) {
	return {
		uri: configData.BASE_API_URL + configData.TOKEN_URL,
		method: 'post',
		json: {
			"username": configData.SERVICE_USER,
			"password": configData.TOKEN_CREDS
		},
		rejectUnauthorized: false,
		transform: (body, response, resolveWithFullResponse) => {
			return response;
		}
	};
}

function getAuthResponse(result) {
	return new Promise((resolve, reject) => {
		if (result.statusCode === 200 && result.body && result.body.data && result.body.data.token) {
			return resolve(result.body.data.token);
		} else {
			logger.error("getAuthResponse failed");
			return reject(errorHandler.throwInternalServerError("Invalid token response from API"));
		}
	});
};

function processEventRecords(event, configData, authToken) {
	return new Promise((resolve, reject) => {
		var processEventRecordPromises = [];
		for (var i = 0; i < event.Records.length; i++) {
			processEventRecordPromises.push(exportable.processEventRecord(event.Records[i], configData, authToken));
		}
		Promise.all(processEventRecordPromises)
			.then((result) => {
				return resolve(result);
			})
			.catch((error) => {
				logger.error("processEventRecords failed: " + JSON.stringify(error));
				return reject(error);
			});
	});
};

function processEventRecord(record, configData, authToken) {
	return new Promise((resolve, reject) => {
		var sequenceNumber = record.kinesis.sequenceNumber;
		var encodedPayload = record.kinesis.data;
		var payload;
		return exportable.checkForInterestedEvents(encodedPayload, sequenceNumber, configData)
			.then(result => {
				payload = result.payload;
				if (result.interested_event) {
					return exportable.processEvent(payload, configData, authToken);
				} else {
					return new Promise((resolve, reject) => {
						resolve({ "message": "Not an interesting event" });
					});
				}
			})
			.then(result => {
				exportable.handleProcessedEvents(sequenceNumber, payload);
				return resolve(result);
			})
			.catch(err => {
				logger.error("processEventRecord failed for: " + JSON.stringify(record));
				exportable.handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
				return reject(err);
			});
	});
};

function checkForInterestedEvents(encodedPayload, sequenceNumber, configData) {
	return new Promise((resolve, reject) => {
		var kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
		if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
			if (_.includes(configData.EVENTS.event_type, kinesisPayload.Item.EVENT_TYPE.S) &&
				_.includes(configData.EVENTS.event_name, kinesisPayload.Item.EVENT_NAME.S)) {
				logger.info("found " + kinesisPayload.Item.EVENT_TYPE.S + " event with sequence number: " + sequenceNumber);
				return resolve({
					"interested_event": true,
					"payload": kinesisPayload.Item
				});
			} else {
				logger.error("Not an interested event or event type");
				return resolve({
					"interested_event": false,
					"payload": kinesisPayload.Item
				});
			}
		}
	});
};

function processEvent(eventPayload, configData, authToken) {
	return new Promise((resolve, reject) => {
		if (eventPayload.SERVICE_CONTEXT && eventPayload.SERVICE_CONTEXT.S) {
			if (eventPayload.EVENT_NAME.S === configData.EVENTS.create_event_name) {
				exportable.processCreateEvent(eventPayload, configData, authToken)
					.then(result => { return resolve(result); })
					.catch(err => {
						logger.error("processCreateEvent failed: " + JSON.stringify(err));
						return reject(err);
					});
			} else if (eventPayload.EVENT_NAME.S === configData.EVENTS.update_event_name) {
				exportable.processUpdateEvent(eventPayload, configData, authToken)
					.then(result => { return resolve(result); })
					.catch(err => {
						logger.error("processUpdateEvent failed: " + JSON.stringify(err));
						return reject(err);
					});
			} else if (eventPayload.EVENT_NAME.S === configData.EVENTS.delete_event_name) {
				//TODO
			}
		} else {
			logger.info("Service Context is not defined");
			var err = exportable.handleError(failureCodes.PR_ERROR_4.code, "Service context is not defined");
			return reject(err);
		}
	});
};

function handleError(errorType, message) {
	var error = {};
	error.failure_code = errorType;
	error.failure_message = message;
	return error;
};

function getDeploymentPayload(svcContext) {
	var deploymentPayload = {};

	if (svcContext.domain) {
		deploymentPayload.domain = svcContext.domain;
	}
	if (svcContext.environment_logical_id) {
		deploymentPayload.environment_logical_id = svcContext.environment_logical_id;
	}
	if (svcContext.provider_build_id) {
		deploymentPayload.provider_build_id = svcContext.provider_build_id;
	}
	if (svcContext.provider_build_url) {
		deploymentPayload.provider_build_url = svcContext.provider_build_url;
	}
	if (svcContext.scm_commit_hash) {
		deploymentPayload.scm_commit_hash = svcContext.scm_commit_hash;
	}
	if (svcContext.scm_url) {
		deploymentPayload.scm_url = svcContext.scm_url;
	}
	if (svcContext.scm_branch) {
		deploymentPayload.scm_branch = svcContext.scm_branch;
	}
	if (svcContext.request_id) {
		deploymentPayload.request_id = svcContext.request_id;
	}
	if (svcContext.status) {
		deploymentPayload.status = svcContext.status;
	}

	return deploymentPayload;
};

function getSvcPayload(method, payload, apiEndpoint, authToken) {
	var svcPayload = {
		headers: {
			'content-type': "application/json",
			'authorization': authToken
		},
		rejectUnauthorized: false
	}

	svcPayload.uri = apiEndpoint;
	svcPayload.method = method;
	if (payload) {
		svcPayload.json = payload;
	}
	logger.info("Deployment API payload :" + JSON.stringify(svcPayload));
	return svcPayload;
};

function processRequest(svcPayload) {
	return new Promise((resolve, reject) => {
		request(svcPayload, function (error, response, body) {
			if (response.statusCode === 200 && body) {
				return resolve(body);
			} else {
				logger.error("Error processing request: " + JSON.stringify(response));
				var error = exportable.handleError(failureCodes.PR_ERROR_3.code, response.body.message);
				return reject(error);
			}
		});
	});
};

function processCreateEvent(eventPayload, configData, authToken) {
	return new Promise((resolve, reject) => {
		var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
		logger.info("svcContext: " + JSON.stringify(svcContext));

		var deploymentPayload = exportable.getDeploymentPayload(svcContext);
		deploymentPayload.service_id = eventPayload.SERVICE_ID.S
		deploymentPayload.service = eventPayload.SERVICE_NAME.S
		var apiEndpoint = configData.BASE_API_URL + configData.DEPLOYMENT_API_RESOURCE;
		var svcPayload = exportable.getSvcPayload("POST", deploymentPayload, apiEndpoint, authToken);

		exportable.processRequest(svcPayload)
			.then(result => { return resolve(result); })
			.catch(err => {
				logger.error("processCreateEvent failed: " + JSON.stringify(err));
				return reject(err);
			});
	});
};

function processUpdateEvent(eventPayload, configData, authToken) {
	return new Promise((resolve, reject) => {
		var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
		logger.info("svcContext: " + JSON.stringify(svcContext));

		var deploymentPayload = exportable.getDeploymentPayload(svcContext);
		deploymentPayload.service_id = eventPayload.SERVICE_ID.S
		deploymentPayload.service = eventPayload.SERVICE_NAME.S

		exportable.getDeployments(deploymentPayload, configData, authToken)
			.then(result => { return exportable.updateDeployments(result, deploymentPayload, configData, authToken); })
			.then(result => { return resolve(result); })
			.catch(err => {
				logger.error("processUpdateEvent failed: " + JSON.stringify(err));
				return reject(err);
			});
	});
};

function getDeployments(deploymentPayload, configData, authToken) {
	return new Promise((resolve, reject) => {
		var env_id = deploymentPayload.environment_logical_id;
		if (env_id) {
			var service_name = deploymentPayload.service;
			var domain = deploymentPayload.domain;
			var apiEndpoint = configData.BASE_API_URL + configData.DEPLOYMENT_API_RESOURCE + "?service=" + service_name + "&domain=" + domain + "&environment=" + env_id;;
			var svcPayload = exportable.getSvcPayload("GET", null, apiEndpoint, authToken);
			exportable.processRequest(svcPayload)
				.then(result => { return resolve(result); })
				.catch(err => {
					logger.error("getDeployments failed: " + JSON.stringify(err));
					return reject(err);
				});
		} else {
			logger.error("Environment logical id is not defined");
			var err = handleError(failureCodes.PR_ERROR_4.code, "Environment logical id is not defined");
			return reject(err);
		}
	});
};

function updateDeployments(res, deploymentPayload, configData, authToken) {
	return new Promise((resolve, reject) => {
		var deploymentResults = JSON.parse(res);
		if (deploymentResults.data && deploymentResults.data.deployments && deploymentResults.data.deployments.length > 0) {
			var deploymentsCollection = deploymentResults.data.deployments;
			var deploymentData;

			for (var idx in deploymentsCollection) {
				if (deploymentsCollection[idx].provider_build_url === deploymentPayload.provider_build_url &&
					deploymentsCollection[idx].provider_build_id === deploymentPayload.provider_build_id) {
					deploymentData = deploymentsCollection[idx];
				}
			}
			if (deploymentData && deploymentData.deployment_id) {
				Object.keys(deploymentPayload).forEach(function (key) {
					if (key !== 'status') {
						deploymentPayload[key] = deploymentData[key];
					}
				});
				logger.info("Update deployment request payload: " + JSON.stringify(deploymentPayload));
				var apiEndpoint = configData.BASE_API_URL + configData.DEPLOYMENT_API_RESOURCE + "/" + deploymentData.deployment_id;
				var svcPayload = getSvcPayload("PUT", deploymentPayload, apiEndpoint, authToken);
				exportable.processRequest(svcPayload)
					.then(result => { return resolve(result); })
					.catch(err => {
						logger.error("updateDeployments failed: " + JSON.stringify(err));
						return reject(err);
					});
			} else {
				logger.error("Deployment details not found!");
				var err = handleError(failureCodes.PR_ERROR_4.code, "Deployment details not found!");
				return reject(err);
			}
		} else {
			logger.error("Deployment details not found!");
			var err = handleError(failureCodes.PR_ERROR_4.code, "Deployment details not found!");
			return reject(err);
		}
	});
};

function getEventProcessStatus() {
	return {
		"processed_events": processedEvents.length,
		"failed_events": failedEvents.length
	};
};

function handleProcessedEvents(id, payload) {
	processedEvents.push({
		"sequence_id": id,
		"event": payload
	});
};

function handleFailedEvents(id, failure_message, payload, failure_code) {
	failedEvents.push({
		"sequence_id": id,
		"event": payload,
		"failure_code": failure_code,
		"failure_message": failure_message
	});
};

const exportable = {
	getTokenRequest,
	getAuthResponse,
	handleError,
	checkForInterestedEvents,
	handleProcessedEvents,
	handleFailedEvents,
	getEventProcessStatus,
	handler,
	processEventRecords,
	processEventRecord,
	processEvent,
	getDeploymentPayload,
	getSvcPayload,
	processRequest,
	processCreateEvent,
	processUpdateEvent,
	getDeployments,
	updateDeployments
};
module.exports = exportable;
