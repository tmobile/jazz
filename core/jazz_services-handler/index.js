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
  CRUD APIs for Service Catalog
  @author:
  @version: 1.0
**/

const rp = require('request-promise-native');

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const errorHandlerModule = require("./components/error-handler.js");

const fcodes = require('./utils/failure-codes.js');
const crud = require("./components/crud")();

var errorHandler = errorHandlerModule(logger);
var failureCodes = fcodes();
var processedEvents = [];
var failedEvents = [];

var handler = (event, context, cb) => {

	var config = configModule.getConfig(event, context);
	processedEvents = [];
	failedEvents = [];

	logger.info("event : " + JSON.stringify(event));
	rp(getToken(config))
		.then(result => { return validateAuthToken(result); })
		.then(authToken => { return processRecords(event, config, authToken); })
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

};

var getToken = function (configData) {
	return {
		uri: configData.SERVICE_API_URL + configData.TOKEN_URL,
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

var validateAuthToken = function (result) {
	return new Promise((resolve, reject) => {
		if (result.statusCode === 200 && result.body && result.body.data) {
			return resolve(result.body.data.token);
		} else {
			return reject(errorHandler.throwUnauthorizedError("User is not authorized to access this service"));
		}
	});
}

var handleError = function (errorType, message) {
	var error = {};
	error.failure_code = errorType;
	error.failure_message = message;
	return error;
}

var processRecords = function (event, configData, authToken) {
	return new Promise((resolve, reject) => {
		var processRecordPromises = [];
		for (let i = 0; i < event.Records.length; i++) {
			processRecordPromises.push(processRecord(event.Records[i], configData, authToken));
		}
		Promise.all(processRecordPromises)
			.then((result) => { return resolve(result); })
			.catch((error) => { return reject(error); });
	});
}

var processRecord = function (record, configData, authToken) {
	return new Promise((resolve, reject) => {
		var sequenceNumber = record.kinesis.sequenceNumber;
		var encodedPayload = record.kinesis.data;
		var payload;
		
		return checkInterest(encodedPayload, sequenceNumber, configData)
			.then(result => {
				payload = result.payload;
				if (result.interested_event) {
					return processEvent(payload, configData, authToken);
				}
			})
			.then(result => {
				handleProcessedEvents(sequenceNumber, payload);
				return resolve(result);
			})
			.catch(err => {
				handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
				return resolve();
			});
	});
}
var checkInterest = function (encodedPayload, sequenceNumber, configData) {
	return new Promise((resolve, reject) => {
		var kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
		logger.info("kinesisPayload : " + JSON.stringify(kinesisPayload));
		if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
			if (configData.EVENTS.EVENT_TYPE.indexOf(kinesisPayload.Item.EVENT_TYPE.S) > -1 &&
				configData.EVENTS.EVENT_NAME.indexOf(kinesisPayload.Item.EVENT_NAME.S) > -1) {
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
}

var processEvent = function (payload, configData, authToken) {
	return new Promise((resolve, reject) => {
		if (!payload.EVENT_NAME.S || !payload.EVENT_STATUS.S) {
			logger.error("validation error. Either event name or event status is not properly defined.");
			var err = handleError(failureCodes.PR_ERROR_1.code, "Validation error while processing event for service");
			return reject(err);
		}
		getServiceId(payload, configData, authToken)
			.then(result => { return updateService(result, payload, configData, authToken); })
			.then(result => { return resolve({ "message": "updated service " + payload.SERVICE_NAME.S + " in service catalog." }); })
			.catch(err => {
				logger.error("Error updating service in service catalog : " + JSON.stringify(err));
				var error = handleError(failureCodes.PR_ERROR_2.code, "Error updating service in service catalog ");
				return reject(error);
			});
	});
}

var updateService = function (result, payload, configData, authToken) {
	return new Promise((resolve, reject) => {
		var svcContext = JSON.parse(payload.SERVICE_CONTEXT.S);
		var serviceContext = getServiceContext(svcContext);
		serviceContext.service = payload.SERVICE_NAME.S
		serviceContext.created_by = payload.USERNAME.S
		serviceContext.service_id = result.service_id
		var statusResponse = getUpdateServiceStatus(payload, configData);
		var inputs = {
			"TOKEN": authToken,
			"SERVICE_API_URL": configData.SERVICE_API_URL,
			"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
			"ID": serviceContext.service_id,
			"DESCRIPTION": serviceContext.description,
			"REPOSITORY": serviceContext.repository,
			"EMAIL": serviceContext.email,
			"SLACKCHANNEL": serviceContext.slackChannel,
			"TAGS": serviceContext.tags,
			"STATUS": statusResponse.status,
			"METADATA": serviceContext.metadata,
			"DEPLOYMENT_TARGETS": serviceContext.deployment_targets

		};
		logger.info("update input : " + JSON.stringify(inputs));
		crud.update(inputs, function (err, results) {
			if (err) {
				var error = handleError(failureCodes.PR_ERROR_2.code, err.error);
				return reject(error);
			} else {
				logger.info("updated service " + serviceContext.service + " in service catalog.");
				return resolve({ "message": "updated service " + serviceContext.service + " in service catalog." });
			}
		});
	});
}

var getServiceId = function (payload, configData, authToken) {
	return new Promise((resolve, reject) => {
		if (payload.SERVICE_ID.S) {
			logger.info("Service id present in the event payload");
			return resolve({ "service_id": payload.SERVICE_ID.S });
		} else {
			logger.info("Service id not present in the event payload");
			var svcContext = JSON.parse(payload.SERVICE_CONTEXT.S);
			if (!svcContext.domain) {
				var error = handleError(failureCodes.PR_ERROR_4.code, "Service domain not found");
				return reject(error);
			}
			if (!payload.SERVICE_NAME.S) {
				var error = handleError(failureCodes.PR_ERROR_4.code, "Service name not found");
				return reject(error);
			}

			var inputs = {
				"TOKEN": authToken,
				"SERVICE_API_URL": configData.SERVICE_API_URL,
				"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
				"DOMAIN": svcContext.domain,
				"SERVICE_NAME": payload.SERVICE_NAME.S
			};
			logger.info("get input : " + JSON.stringify(inputs));
			crud.get(inputs, function (err, results) {
				if (err) {
					logger.error("Failed while fetching service from service catalog : " + JSON.stringify(err));
					var error = handleError(failureCodes.PR_ERROR_4.code, err.error);
					return reject(error);
				} else {
					return resolve({ "service_id": results.id });
				}
			});
		}
	});
}

var getUpdateServiceStatus = function (payload, configData) {
	var statusResponse = {};
	if (payload.EVENT_TYPE.S === "SERVICE_CREATION") {
		if (payload.EVENT_NAME.S === configData.EVENTS.SERVICE_CREATION_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
			statusResponse = { 'status': "creation_completed" };
		} else if (payload.EVENT_STATUS.S === "FAILED") {
			statusResponse = { 'status': "creation_failed" };
		}
	} else if (payload.EVENT_TYPE.S === "SERVICE_DELETION") {
		if (payload.EVENT_NAME.S === configData.EVENTS.SERVICE_DELETION_EVENT_START && payload.EVENT_STATUS.S === "STARTED") {
			statusResponse = { 'status': "deletion_started" };
		} else if (payload.EVENT_NAME.S === configData.EVENTS.SERVICE_DELETION_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
			statusResponse = { 'status': "deletion_completed" };
		} else if (payload.EVENT_STATUS.S === "FAILED") {
			statusResponse = { 'status': "deletion_failed" };
		}
	} else if (payload.EVENT_TYPE.S === "SERVICE_DEPLOYMENT") {
		if (payload.EVENT_NAME.S === configData.EVENTS.SERVICE_DEPLOYMENT_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
			statusResponse = { 'status': "active" };
		}
	}
	return statusResponse;
}

var getServiceContext = function (svcContext) {
	var json = {};
	if (svcContext.domain) {
		json.domain = svcContext.domain;
	} else {
		json.domain = null;
	}
	if (svcContext.description) {
		json.description = svcContext.description;
	}
	if (svcContext.runtime) {
		json.runtime = svcContext.runtime;
	}
	if (svcContext.region) {
		json.region = svcContext.region;
	}
	if (svcContext.repository) {
		json.repository = svcContext.repository;
	}
	if (svcContext.email) {
		json.email = svcContext.email;
	}
	if (svcContext.slack_channel) {
		json.slackChannel = svcContext.slack_channel;
	}
	if (svcContext.tags) {
		json.tags = svcContext.tags;
	}
	if (svcContext.service_type) {
		json.type = svcContext.service_type;
	}
	if (svcContext.metadata) {
		json.metadata = svcContext.metadata;
	}
	if (svcContext.deployment_targets) {
		json.deployment_targets = svcContext.deployment_targets
	}

	return json;
}

var handleFailedEvents = function (id, failure_message, payload, failure_code) {
	failedEvents.push({
		"sequence_id": id,
		"event": payload,
		"failure_code": failure_code,
		"failure_message": failure_message
	});
}

var handleProcessedEvents = function (id, payload) {
	processedEvents.push({
		"sequence_id": id,
		"event": payload
	});
}

var getEventProcessStatus = function () {
	return {
		"processed_events": processedEvents.length,
		"failed_events": failedEvents.length
	};
}

module.exports = {
	getToken: getToken,
	validateAuthToken: validateAuthToken,
	processRecords: processRecords,
	processRecord: processRecord,
	handleError: handleError,
	checkInterest: checkInterest,
	processEvent: processEvent,
	getUpdateServiceStatus: getUpdateServiceStatus,
	handleFailedEvents: handleFailedEvents,
	handleProcessedEvents: handleProcessedEvents,
	getEventProcessStatus: getEventProcessStatus,
	getServiceContext: getServiceContext,
	updateService: updateService,
	getServiceId: getServiceId,
	handler: handler
}
