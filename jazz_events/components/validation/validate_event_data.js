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
    Validation functions for event data
    @module: index.js
    @description: validate event data using validateEventType, validateEventName, validateEventHandler .
	@author: 
	@version: 1.0
**/
const moment = require('moment');

const logger = require("../logger.js"); 
const crud = require("../../components/crud")();

const dateFormat = 'YYYY-MM-DDTHH:mm:ss:SSS';

module.exports = (config, eventBody, onComplete) => {
    logger.info("Inside validate_event_data");
    var funList = [validateEventType(config, eventBody), validateEventName(config, eventBody), validateEventHandler(config, eventBody), validateEventStatus(config, eventBody), validateTimestamp(eventBody)];
    Promise.all(funList)
    .then(() => {
        onComplete(null, null);
    })
    .catch((error) => {
		logger.error("#Validate event specific data error: " + JSON.stringify(error));
        onComplete(error, null)
    });
}

function getDynamodbItem(params, eventData) {
	logger.debug("Inside getDynamodbItem: " + eventData);
	return new Promise((resolve, reject) => {
		crud.get(params, eventData, (error, data) => {
			if(error){
				reject(error);
			} else{
				resolve(data);
			}
		});
	})
}

function validateEventType (config, eventBody) {
	logger.debug("Inside validateEventType")
	return new Promise((resolve, reject) => {
		var event_type_params = {
			Key: {
				"EVENT_TYPE": {
					S: eventBody.event_type
				}
			},
			TableName: config.event_type_table
		};
		getDynamodbItem(event_type_params, eventBody.event_type)
			.then((result) => {
				resolve(result);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function validateEventName (config, eventBody) {
	logger.debug("Inside validateEventName");
	return new Promise((resolve, reject) => {
		var event_name_params = {
			Key: {
				"EVENT_NAME": {
					S: eventBody.event_name
				}
			},
			TableName: config.event_name_table
		};
		getDynamodbItem(event_name_params, eventBody.event_name)
			.then((result) => {
				resolve(result);
			})
			.catch((error) => {
				reject(error);
			})
	});
}

function validateEventHandler (config, eventBody) {
	logger.debug("Inside validateEventHandler");
	return new Promise((resolve, reject) => {
		var event_handler_params = {
			Key: {
				"EVENT_HANDLER": {
					S: eventBody.event_handler
				}
			},
			TableName: config.event_handler_table
		};
		getDynamodbItem(event_handler_params, eventBody.event_handler)
			.then((result) => {
				resolve(result);
			})
			.catch((error) => {
				reject(error);
			})
	});
}

function validateEventStatus (config, eventBody) {
	logger.debug("Inside validateEventStatus");
	return new Promise((resolve, reject) => {
		var event_status_params = {
			Key: {
				"EVENT_STATUS": {
					S: eventBody.event_status
				}
			},
			TableName: config.event_status_table
		};
		getDynamodbItem(event_status_params, eventBody.event_status)
			.then((result) => {
				resolve(result);
			})
			.catch((error) => {
				reject(error);
			})
	});
}

function validateTimestamp (eventBody) {
	logger.debug("Inside validateTimestamp");
	return new Promise((resolve, reject) => {
		try {
			if (moment(eventBody.event_timestamp, dateFormat, true).isValid()) {
				resolve(eventBody.event_timestamp);
			} else {
				reject({
					"code": 400,
					"message": "Invalid EVENT TIMESTAMP: " + eventBody.event_timestamp + ", expected format is " + dateFormat
				});
			}
		} catch (error) {
			reject({
				"code": 500,
				"message": "Error parsing EVENT TIMESTAMP: " + eventBody.event_timestamp + ", expected format is " + dateFormat
			});
		}
	});
}
