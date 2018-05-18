/**
	Deployments event handler function.
	@Author: 
	@version: 1.0
**/

const _ = require("lodash");
const request = require("request");
const rp = require('request-promise-native');
const Uuid = require("uuid/v4");

const config = require("./components/config.js"); 
const logger = require("./components/logger.js"); 
const errorHandlerModule = require("./components/error-handler.js");
const fcodes = require('./utils/failure-codes.js');

var errorHandler = errorHandlerModule(logger);

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
			return processEventRecords(event, configData, authToken);
		})
		.then(result => {
			var records = getEventProcessStatus();
			logger.info("Successfully processed events: " + JSON.stringify(records));
			return cb(null, records);
		})
		.catch(err => {
			var records = getEventProcessStatus();
			logger.error("Error processing events: " + JSON.stringify(err));
			return cb(null, records);
		});
};

var getTokenRequest = (configData) => {
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
};

var getAuthResponse = (result) => {
	return new Promise((resolve, reject) => {
		if (result.statusCode === 200 && result.body && result.body.data && result.body.data.token) {
			return resolve(result.body.data.token);
		} else {
			logger.error("getAuthResponse failed");
			return reject(errorHandler.throwInternalServerError("Invalid token response from API"));
		}
	});
};

var processEventRecords = (event, configData, authToken) => {
	return new Promise((resolve, reject) => {
		var processEventRecordPromises = [];
		for (var i = 0; i < event.Records.length; i++) {
			processEventRecordPromises.push(processEventRecord(event.Records[i], configData, authToken));
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

var processEventRecord = (record, configData, authToken) => {
	return new Promise((resolve, reject) => {
		var sequenceNumber = record.kinesis.sequenceNumber;
		var encodedPayload = record.kinesis.data;
		var payload;
		return checkForInterestedEvents(encodedPayload, sequenceNumber, configData)
			.then(result => {
				payload = result.payload;
				if (result.interested_event) {
					return processEvent(payload, configData, authToken);
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
				logger.error("processEventRecord failed for: " + JSON.stringify(record));
				handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
				return reject(err);
			});
	});
};

function checkForInterestedEvents(encodedPayload, sequenceNumber, configData)  {
	console.log("in the actual function 2");
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

var processEvent = (eventPayload, configData, authToken) => {
	return new Promise((resolve, reject) => {
		if (eventPayload.SERVICE_CONTEXT && eventPayload.SERVICE_CONTEXT.S) {
			if (eventPayload.EVENT_NAME.S === configData.EVENTS.create_event_name) {
				processCreateEvent(eventPayload, configData, authToken)
					.then(result => { return resolve(result); })
					.catch(err => {
						logger.error("processCreateEvent failed: " + JSON.stringify(err));
						return reject(err);
					});
			} else if (eventPayload.EVENT_NAME.S === configData.EVENTS.update_event_name) {
				processUpdateEvent(eventPayload, configData, authToken)
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
			var err = handleError(failureCodes.PR_ERROR_4.code, "Service context is not defined");
			return reject(err);
		}
	});
};

var handleError = (errorType, message) => {
	var error = {};
	error.failure_code = errorType;
	error.failure_message = message;
	return error;
};

var getDeploymentPayload = (svcContext) => {
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

var getSvcPayload = (method, payload, apiEndpoint, authToken) => {
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

var procesRequest = (svcPayload) => {
	return new Promise((resolve, reject) => {
		request(svcPayload, function (error, response, body) {
			if (response.statusCode === 200 && body) {
				return resolve(body);
			} else {
				logger.error("Error processing request: " + JSON.stringify(response));
				var error = handleError(failureCodes.PR_ERROR_3.code, response.body.message);
				return reject(error);
			}
		});
	});
};

var processCreateEvent = (eventPayload, configData, authToken) => {
	return new Promise((resolve, reject) => {
		var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
		logger.info("svcContext: " + JSON.stringify(svcContext));

		var deploymentPayload = getDeploymentPayload(svcContext);
		deploymentPayload.service_id = eventPayload.SERVICE_ID.S
		deploymentPayload.service = eventPayload.SERVICE_NAME.S
		var apiEndpoint = configData.BASE_API_URL + configData.DEPLOYMENT_API_RESOURCE;
		var svcPayload = getSvcPayload("POST", deploymentPayload, apiEndpoint, authToken);

		procesRequest(svcPayload)
			.then(result => { return resolve(result); })
			.catch(err => {
				logger.error("processCreateEvent failed: " + JSON.stringify(err));
				return reject(err);
			});
	});
};

var processUpdateEvent = (eventPayload, configData, authToken) => {
	return new Promise((resolve, reject) => {
		var svcContext = JSON.parse(eventPayload.SERVICE_CONTEXT.S);
		logger.info("svcContext: " + JSON.stringify(svcContext));

		var deploymentPayload = getDeploymentPayload(svcContext);
		deploymentPayload.service_id = eventPayload.SERVICE_ID.S
		deploymentPayload.service = eventPayload.SERVICE_NAME.S

		getDeployments(deploymentPayload, configData, authToken)
			.then(result => { return updateDeployments(result, deploymentPayload, configData, authToken); })
			.then(result => { return resolve(result); })
			.catch(err => {
				logger.error("processUpdateEvent failed: " + JSON.stringify(err));
				return reject(err);
			});
	});
};

var getDeployments = (deploymentPayload, configData, authToken) => {
	return new Promise((resolve, reject) => {
		var env_id = deploymentPayload.environment_logical_id;
		if (env_id) {
			var service_name = deploymentPayload.service;
			var domain = deploymentPayload.domain;
			var apiEndpoint = configData.BASE_API_URL + configData.DEPLOYMENT_API_RESOURCE + "?service=" + service_name + "&domain=" + domain + "&environment=" + env_id;;
			var svcPayload = getSvcPayload("GET", null, apiEndpoint, authToken);
			procesRequest(svcPayload)
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

var updateDeployments = (res, deploymentPayload, configData, authToken) => {
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
				procesRequest(svcPayload)
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

var getEventProcessStatus = () => {
	return {
		"processed_events": processedEvents.length,
		"failed_events": failedEvents.length
	};
};

var handleProcessedEvents = function (id, payload) {
	processedEvents.push({
		"sequence_id": id,
		"event": payload
	});
};

var handleFailedEvents = function (id, failure_message, payload, failure_code) {
	failedEvents.push({
		"sequence_id": id,
		"event": payload,
		"failure_code": failure_code,
		"failure_message": failure_message
	});
};

module.exports = {
	getTokenRequest: getTokenRequest,
	getAuthResponse: getAuthResponse,
	handleError: handleError,
	checkForInterestedEvents,
	handleProcessedEvents: handleProcessedEvents,
	handleFailedEvents: handleFailedEvents,
	getEventProcessStatus: getEventProcessStatus,
	handler: handler,
	processEventRecords: processEventRecords,
	processEventRecord: processEventRecord,
	processEvent: processEvent,
	getDeploymentPayload: getDeploymentPayload,
	getSvcPayload: getSvcPayload,
	procesRequest: procesRequest,
	processCreateEvent: processCreateEvent,
	processUpdateEvent: processUpdateEvent,
	getDeployments: getDeployments,
	updateDeployments: updateDeployments
};
