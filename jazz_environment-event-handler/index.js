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
const crud = require("./components/crud")();
const errorHandlerModule = require("./components/error-handler.js");
var errorHandler = errorHandlerModule(logger);
const rp = require('request-promise-native');

const AWS = require("aws-sdk");
const _ = require("lodash");
const request = require("request");
const async = require("async");
const nanoid = require("nanoid/generate");
const fcodes = require('./utils/failure-codes.js');

var failureCodes = fcodes();
var processedEvents = [];
var failedEvents = [];

var handler = (event, context, cb) => {
    context.functionName = context.functionName + "-test" // @TODO Local testing
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
    console.log("result.statusCode"+result.statusCode)
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
                console.log("result"+result);
                return resolve(result); 
            })
			.catch((error) => { return reject(error); });
	});
}

var processEachEvent = function (record, configData,authToken) {
	return new Promise((resolve, reject) => {
		var sequenceNumber = record.kinesis.sequenceNumber;
		var encodedPayload = record.kinesis.data;
		var payload;
		return checkInterest(encodedPayload, sequenceNumber, configData)
			.then(result => {
				payload = result.payload;
				if (result.interested_event) {
					return processItem(payload, configData, authToken);
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

var checkInterest = function (encodedPayload, sequenceNumber, config) {
	return new Promise((resolve, reject) => {
		var payload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
		if (payload.Item.EVENT_TYPE && payload.Item.EVENT_TYPE.S) {
            if (_.includes(config.EVENTS.EVENT_TYPE, payload.Item.EVENT_TYPE.S) && 
                _.includes(config.EVENTS.EVENT_NAME, payload.Item.EVENT_NAME.S)) {
                logger.info("found " + payload.Item.EVENT_TYPE.S + " event with sequence number: " + sequenceNumber);
                resolve({
                    "interested_event": true,
                    "payload": payload.Item
                });
            } else {
                resolve({
                    "interested_event": false,
                    "payload": payload.Item
                });  
            }
		} 
	});
}

/* validate and processs item. TODO update function name*/
var processItem = function (payload, configData, authToken) {
	return new Promise((resolve, reject) => {
		if (!payload.EVENT_NAME.S || !payload.EVENT_STATUS.S) {
			logger.error("validation error. Either event name or event status is not properly defined.");
			var err = handleError(failureCodes.PR_ERROR_1.code, "Validation error while processing event for service");
			return reject(err);
		}

		var svcContext = JSON.parse(payload.SERVICE_CONTEXT.S);
		var serviceContext = getServiceContext(svcContext);
		serviceContext.service = payload.SERVICE_NAME.S
		serviceContext.created_by = payload.USERNAME.S
        serviceContext.service_id = payload.SERVICE_ID.S
        
        if(payload.EVENT_NAME.S === configData.EVENTS.INITIAL_COMMIT) {
			process_INITIAL_COMMIT(serviceContext, configData, authToken)
			.then(result => {resolve(result)})
			.catch(err => {reject(err)})
        } else if(payload.EVENT_NAME.S === configData.EVENTS.CREATE_BRANCH) {
            return process_INITIAL_COMMIT(configData);
        } else if(payload.EVENT_NAME.S === configData.EVENTS.UPDATE_ENVIRONMENT) {
            return process_UPDATE_ENVIRONMENT();
        } else if(payload.EVENT_NAME.S === configData.EVENTS.DELETE_BRANCH) {
            return process_DELETE_BRANCH();
        } else if(payload.EVENT_NAME.S === configData.EVENTS.DELETE_ENVIRONMENT) {
            return process_DELETE_ENVIRONMENT();
        }
		//var statusResponse = getUpdateServiceStatus(payload, configData);

	});
}

var process_INITIAL_COMMIT = function (serviceContext, configData, authToken) {
	return new Promise((resolve, reject) => {
		var required_fields = configData.ENVIRONMENT_CREATE_REQUIRED_FIELDS;
		var missing_required_fields = _.difference(_.values(required_fields), _.keys(serviceContext));
		if (missing_required_fields.length > 0) {
			return reject ("Following field(s) are required - " + missing_required_fields.join(", "));
		}

		var nano_id = nanoid(configData.RANDOM_CHARACTERS, configData.RANDOM_ID_CHARACTER_COUNT);
		serviceContext.logical_id = nano_id+"-dev";	
		serviceContext.status = configData.CREATE_ENVIRONMENT_STATUS;
	
		crud.create(serviceContext, function(err, results){
			if(err) {

			} else {
				
			}

		});


	});
    
}
    
var process_CREATE_BRANCH = function () {
    
    
}

var process_UPDATE_ENVIRONMENT = function () {
    
}

var process_DELETE_BRANCH = function () {
    
    
}

var process_DELETE_ENVIRONMENT = function () {
    
    
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
	if (svcContext.endpoint) {
		json.endpoint = svcContext.endpoint;
	}

	return json;
}

module.exports = {
    getTokenRequest: getTokenRequest,
    getAuthResponse: getAuthResponse,
    handleError: handleError,
    processEvents: processEvents,
    processEachEvent: processEachEvent,
    checkInterest: checkInterest,
    processItem: processItem,
    handleProcessedEvents: handleProcessedEvents,
    handleFailedEvents: handleFailedEvents,
    getServiceContext: getServiceContext,
    getEventProcessStatus: getEventProcessStatus,
    handler: handler
}
