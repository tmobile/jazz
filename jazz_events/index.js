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
Service to handle events 
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js");
const validateUtils = require("./components/validation")(); 
const responseObj = require("./components/response.js"); 
const configObj = require("./components/config.js"); 
const logger = require("./components/logger.js"); 
const utils = require("./components/utils.js")(); 
const crud = require("./components/crud")(); 

var handler = (event, context, cb) => {
	var errorHandler = errorHandlerModule();
	var config = configObj(event);
	logger.init(event, context);
	global.config = config;

	try {
		//GET Handler
		if (event && event.method && event.method === 'GET') {
			getEvents(event, config)
				.then((result) => mapGetEventData(result, event))
				.then((result) => {
					return cb(null, result);
				})
				.catch((error) => {
					logger.error(error);
					if (error.result === "inputError") {
						return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
					} else {
						return cb(JSON.stringify(errorHandler.throwInternalServerError("An internal error occured: " + error.message)));
					}
				});
		}

		//POST Handler
		if (event && event.method && event.method === 'POST') {

			generalInputValidation(event)
				.then(() => validateEventInput(config, event.body))
				.then(() => storeEventData(config, event.body))
				.then((result) => {
					logger.info(result);
					return cb(null, result);
				})
				.catch((error) => {
					logger.error(JSON.stringify(error));
					if (error.code && error.code === 400) {
						return cb(JSON.stringify(errorHandler.throwInputValidationError("Bad request. message: " + error.message)));
					} else {
						return cb(JSON.stringify(errorHandler.throwInternalServerError("An internal error occured: " + error.message)));
					}
				})
		}
	} catch (e) {
		logger.error(e);
		return cb(JSON.stringify(errorHandler.throwInternalServerError(e)));

	}

};

var getEvents = (event, config) => {
	logger.debug("Inside getEvents:")
	return new Promise((resolve, reject) => {
		crud.getList(config.events_table, event.query, (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}

var mapGetEventData = (result, event) => {
	logger.debug("Inside mapGetEventData:");
	return new Promise((resolve, reject) => {
		var events = [],
			map = {
				'SERVICE_CONTEXT': 'service_context',
				'EVENT_HANDLER': 'event_handler',
				'EVENT_NAME': 'event_name',
				'SERVICE_NAME': 'service_name',
				'EVENT_TYPE': 'event_type',
				'EVENT_STATUS': 'event_status',
				'USERNAME': 'username',
				'EVENT_TIMESTAMP': 'event_timestamp'
			};
		if (result && result.Items) {
			result.Items.map((itemList) => {
				var event = {};
				Object.keys(itemList).map((key) => {
					if (!itemList[key].NULL) {
						if (itemList[key]) {
							event[map[key]] = itemList[key].S;
						} else {
							event[key.toLowerCase()] = itemList[key].S;
						}
					} else {
						event[key.toLowerCase()] = null;
					}
				});
				events.push(event);
			});
			if (result.LastEvaluatedKey) {
				resolve(responseObj({
					"events": events,
					"last_evaluated_key": result.LastEvaluatedKey
				}, event.query));
			} else {
				resolve(responseObj({
					"events": events
				}, event.query));
			}
		} else {
			var output = {
				result: "inputError",
				message: "The query parameters supported are username, service_name and last_evaluated_index."
			};
			reject(output);
		}
	});
}

var generalInputValidation = (event) => {
	logger.debug("Inside generalInputValidation:")
	return new Promise((resolve, reject) => {
		var eventBody = event.body;
		if (!eventBody) {
			reject({
				result: "inputError",
				message: "Service inputs not defined!"
			});
		}
		if (!eventBody.service_context) {
			reject({
				result: "inputError",
				message: "service_context not provided!"
			});
		}
		if (!eventBody.event_handler) {
			reject({
				result: "inputError",
				message: "event_handler not provided!"
			});
		}
		if (!eventBody.event_name) {
			reject({
				result: "inputError",
				message: "event_name not provided!"
			});
		}
		if (!eventBody.service_name) {
			reject({
				result: "inputError",
				message: "service_name not provided!"
			});
		}
		if (!eventBody.event_status) {
			reject({
				result: "inputError",
				message: "event_status not provided!"
			});
		}
		if (!eventBody.event_type) {
			reject({
				result: "inputError",
				message: "event_type not provided!"
			});
		}
		if (!eventBody.username) {
			reject({
				result: "inputError",
				message: "username not provided!"
			});
		}
		if (!eventBody.event_timestamp) {
			reject({
				result: "inputError",
				message: "event_timestamp not provided!"
			});
		}
		resolve();
	});
}

var validateEventInput = (config, eventBody) => {
	logger.debug("Inside validateEventInput")
	return new Promise((resolve, reject) => {
		validateUtils.validateEventData(config, eventBody, (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}

var storeEventData = (config, eventBody) => {
	logger.debug("Inside storeEventData");
	return new Promise((resolve, reject) => {
		crud.create(config.event_hub, eventBody, (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(responseObj(data, eventBody));
			}
		});
	});
}
module.exports = {
	handler: handler,
	getEvents: getEvents,
	mapGetEventData: mapGetEventData,
	generalInputValidation: generalInputValidation,
	validateEventInput: validateEventInput,
	storeEventData: storeEventData
}
