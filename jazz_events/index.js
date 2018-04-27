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
Nodejs Template Project
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.

const AWS = require('aws-sdk');
const async = require('async');
const Uuid = require("uuid/v4");
const moment = require('moment');
const dateFormat = 'YYYY-MM-DDTHH:mm:ss:SSS';

module.exports.handler = (event, context, cb) => {
	//Initializations
	var errorHandler = errorHandlerModule();
	var config = configObj(event);
	logger.init(event, context);
	const dynamodb = new AWS.DynamoDB();
	const kinesis = new AWS.Kinesis();

	try {
		//GET Handler
		if (event && event.method && event.method === 'GET') {
			getEvents(event, config, dynamodb)
				.then((result) => mapGetEventData(result, event))
				.then((result) => {
					return cb(null, result);
				})
				.catch((error) => {
					logger.error(error)
					if (error.result === "inputError") {
						return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
					} else {
						return cb(JSON.stringify(errorHandler.throwInternalServerError("An internal error occured. message: " + err.message)))
					}
				});
		}

		//POST Handler
		if (event && event.method && event.method === 'POST') {

			generalInputValidation(event)
			.then(() => validateEventInput(config, event.body, dynamodb))
			.then(() => storeEventData(config, event.body, kinesis))
			.then((result) => {
				logger.info("POST result:" + JSON.stringify(result));
				return cb(null, result);
			})
			.catch((error) => {
				logger.error(JSON.stringify(error));
				if (error.code && error.code === 400) {
					return cb(JSON.stringify(errorHandler.throwInputValidationError("Bad request. message: " + error.message)));
				} else {
					return cb(JSON.stringify(errorHandler.throwInternalServerError("An internal error occured. message: " + error.message)));
				}
			})
		}
	} catch (e) {
		logger.error(e);
		return cb(JSON.stringify(errorHandler.throwInternalServerError(e)));

	}

};

function getEvents(event, config, dynamodb) {
	logger.info("Inside getEvents:")
	return new Promise((resolve, reject) => {
		var filter = "";
		var attributeValues = {};

		var scanparams = {
			"TableName": config.events_table,
			"ReturnConsumedCapacity": "TOTAL",
			"Limit": "500"
		};
		if (event.query && event.query && Object.keys(event.query).length) {
			Object.keys(event.query).map((key) => {
				if (key === "last_evaluated_key") {
					scanparams.ExclusiveStartKey = event.query[key];
				} else if (key === "username") {
					filter = filter + "USERNAME = :USERNAME AND ";
					attributeValues[":USERNAME"] = {
						'S': event.query[key]
					};
				} else if (key === "service_name") {
					filter = filter + "SERVICE_NAME = :SERVICE_NAME AND ";
					attributeValues[":SERVICE_NAME"] = {
						'S': event.query[key]
					};
				}
			});

			if (!filter) {
				reject(null);
			}
			scanparams.FilterExpression = filter.substring(0, filter.length - 5);
			scanparams.ExpressionAttributeValues = attributeValues;
			dynamodb.scan(scanparams, (err, items) => {
				if (err) {
					logger.error("error in dynamodb scan");
					logger.error(err);
					reject(err);

				} else {
					resolve(items);
				}
			});
		} else {
			reject(null);
		}
	});
}

function mapGetEventData(result, event) {
	logger.info("Inside mapGetEventData:" + JSON.stringify(result));
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
				message: "Bad request. message: The query parameters supported are username, service_name, and last_evaluated_index"
			};
			reject(output);
		}
	});
}

function generalInputValidation(event) {
	logger.info("Inside generalInputValidation:")
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

function validateEventInput(config, eventBody, dynamodb) {
	logger.info("Inside validateEventInput:")
	return new Promise((resolve, reject) => {
		var funList = [validateEventType(config, eventBody, dynamodb), validateEventName(config, eventBody, dynamodb), validateEventHandler(config, eventBody, dynamodb), validateEventStatus(config, eventBody, dynamodb), validateTimestamp(eventBody)];
		Promise.all(funList)
			.then(() => {
				resolve()
			})
			.catch((error) => {
				reject(error)
			})
	});
}

function getDynamodbItem(dynamodb, params, eventData) {
	logger.info("Inside getDynamodbItem:" + JSON.stringify(params));
	return new Promise((resolve, reject) => {
		dynamodb.getItem(params, (err, data) => {
			if (err) {
				logger.error("error reading event data from database " + err.message);
				reject({
					"code": 500,
					"message": "error reading event data from database " + err.message
				});
			} else {
				if (!data || !data.Item) {
					logger.error("Invalid event data. " + eventData);
					reject({
						"code": 400,
						"message": "Invalid event data. " + eventData
					});
				} else {
					resolve(data.Item);
				}
			}
		});
	})
}

function validateEventType(config, eventBody, dynamodb) {
	logger.info("Inside validateEventType:")
	return new Promise((resolve, reject) => {
		var event_type_params = {
			Key: {
				"EVENT_TYPE": {
					S: eventBody.event_type
				}
			},
			TableName: config.event_type_table
		};
		getDynamodbItem(dynamodb, event_type_params, eventBody.event_type)
			.then((result) => {
				resolve(result);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function validateEventName(config, eventBody, dynamodb) {
	logger.info("Inside validateEventName:");
	return new Promise((resolve, reject) => {
		var event_name_params = {
			Key: {
				"EVENT_NAME": {
					S: eventBody.event_name
				}
			},
			TableName: config.event_name_table
		};
		getDynamodbItem(dynamodb, event_name_params, eventBody.event_name)
			.then((result) => {
				resolve(result);
			})
			.catch((error) => {
				reject(error);
			})
	});
}

function validateEventHandler(config, eventBody, dynamodb) {
	logger.info("Inside validateEventHandler:");
	return new Promise((resolve, reject) => {
		var event_handler_params = {
			Key: {
				"EVENT_HANDLER": {
					S: eventBody.event_handler
				}
			},
			TableName: config.event_handler_table
		};
		getDynamodbItem(dynamodb, event_handler_params, eventBody.event_handler)
			.then((result) => {
				resolve(result);
			})
			.catch((error) => {
				reject(error);
			})
	});
}

function validateEventStatus(config, eventBody, dynamodb) {
	logger.info("Inside validateEventStatus:");
	return new Promise((resolve, reject) => {
		var event_status_params = {
			Key: {
				"EVENT_STATUS": {
					S: eventBody.event_status
				}
			},
			TableName: config.event_status_table
		};
		getDynamodbItem(dynamodb, event_status_params, eventBody.event_status)
			.then((result) => {
				resolve(result);
			})
			.catch((error) => {
				reject(error);
			})
	});
}

function validateTimestamp(eventBody) {
	logger.info("Inside validateTimestamp:");
	return new Promise((resolve, reject) => {
		try {
			if (moment(eventBody.event_timestamp, dateFormat, true).isValid()) {
				resolve(eventBody.event_timestamp);
			} else {
				reject({
					"code": 400,
					"message": "Invalid EVENT TIMESTAMP: " + eventBody.event_timestamp + ", The format should be " + dateFormat
				});
			}
		} catch (err) {
			reject({
				"code": 500,
				"message": "Error parsing EVENT TIMESTAMP: " + eventBody.event_timestamp + ", The format should be " + dateFormat
			});
		}
	});
}

function storeEventData(config, eventBody, kinesis) {
	logger.info("Inside storeEventData:");
	return new Promise((resolve, reject) => {
		var event_id = Uuid(),
		timestamp = moment().utc().format(dateFormat),
		map = {
			'event_name': 'EVENT_NAME',
			'event_handler': 'EVENT_HANDLER',
			'service_name': 'SERVICE_NAME',
			'event_status': 'EVENT_STATUS',
			'event_type': 'EVENT_TYPE',
			'username': 'USERNAME',
			'event_timestamp': 'EVENT_TIMESTAMP'
		},
		event_params = {
			Item: {
				"EVENT_ID": {
					S: event_id
				},
				"TIMESTAMP": {
					S: timestamp
				}
			}
		};

		Object.keys(eventBody).map((key) => {
			if (eventBody[key]) {
				if (key === "service_context") {
					event_params.Item.SERVICE_CONTEXT = {
						S: JSON.stringify(eventBody.service_context)
					};
				} else {
					if (event_params.Item[map[key]]) {
						event_params.Item[map[key]] = {
							S: eventBody[key]
						}
					} else {
						event_params.Item[key.toUpperCase()] = {
							S: eventBody[key]
						};
					}

				}
			} else {
				event_params.Item[key.toUpperCase()] = {
					NULL: true
				};
			}
		});

		var stream_params = {
			Data: JSON.stringify(event_params),
			PartitionKey: eventBody.event_name,
			StreamName: config.event_hub
		};
		kinesis.putRecord(stream_params, (err, data) => {
			if (err) {
				logger.error('kinesis error' + JSON.stringify(err));
				reject({
					"code": 500,
					"message": "Error storing event. " + err.message
				});
			} else {
				var output = {
					"event_id": event_id
				};
				logger.info("event_id is: " + event_id);
				resolve(responseObj(output, eventBody));
			}
		});
	});
}