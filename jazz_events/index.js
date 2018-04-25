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
			.then(function(result){
				logger.info(result)
				return cb(null, result);
			})
			.catch(function(error){
				logger.error(error)
				if(error.result === "inputError"){
					return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
				} else {
					return cb(JSON.stringify(errorHandler.throwInternalServerError("An internal error occured. message: " + err.message)))
				}
			});
		}

		//POST Handler
		if (event && event.method && event.method === 'POST') {

			generalInputValidation(event)
			.then(() => validateEventInput(config, event, dynamodb))
			.then(() => storeEventData(config, event, kinesis))
			.then(function(result){
				logger.info("POST result:"+JSON.stringify(result));
				return cb(null, result);
			})
			.catch(function(error){
				logger.error(JSON.stringify(error));
				if (error.code && error.code === 400){	
					return cb(JSON.stringify(errorHandler.throwInputValidationError("Bad request. message: " + error.message)));
				} else {
					return cb(JSON.stringify(errorHandler.throwInternalServerError("An internal error occured. message: " + error.message)));
				} 
			});
		}

	} catch (e) {
		logger.error(e);
		return cb(JSON.stringify(errorHandler.throwInternalServerError(e)));

	}

};

function getEvents(event, config, dynamodb){
	logger.info("Inside getEvents:")
	return new Promise((resolve, reject) => {
		var filter = "";
		var attributeValues = {};

		var scanparams = {
			"TableName": config.events_table,
			"ReturnConsumedCapacity": "TOTAL",
			"Limit": "500"
		};
		if (event.query&& event.query && Object.keys(event.query).length) {
			Object.keys(event.query).forEach(function (key) {
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
				} else {
					//do nothing because we only support username, service_name, and last_evaluated_key for now

				}
			});

			if (!filter) {
				reject(null);
			}
			scanparams.FilterExpression = filter.substring(0, filter.length - 5);
			scanparams.ExpressionAttributeValues = attributeValues;
			dynamodb.scan(scanparams, function (err, items) {
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

function mapGetEventData(result, event){
	logger.info("Inside mapGetEventData:"+JSON.stringify(result));
	return new Promise((resolve, reject) => {
		var events = [];
		if (result && result.Items) {
			result.Items.forEach(function (item) {
				var event = {};
				Object.keys(item).forEach(function (key) {
					if (key === "SERVICE_CONTEXT" ){
						event.service_context = item.SERVICE_CONTEXT.S;
					}else if (key === "EVENT_HANDLER"){
						event.event_handler = item.EVENT_HANDLER.S;
					}else if (key === "EVENT_NAME"){
						event.event_name = item.EVENT_NAME.S;
					}else if (key === "SERVICE_NAME"){
						event.service_name = item.SERVICE_NAME.S;
					}else if (key === "EVENT_TYPE"){
						event.event_type = item.EVENT_TYPE.S;
					}else if (key === "EVENT_STATUS"){
						event.event_status = item.EVENT_STATUS.S;
					}else if (key === "USERNAME"){
						event.username = item.USERNAME.S;
					}else if (key === "EVENT_TIMESTAMP"){
						event.event_timestamp = item.EVENT_TIMESTAMP.S;
					}
					else{
						if (item[key].NULL === true){
							event[key.toLowerCase()] = null;
						}
						else{
							event[key.toLowerCase()] = item[key].S;
						}
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

function generalInputValidation(event){
	logger.info("Inside generalInputValidation:")
	return new Promise((resolve, reject) => {
		if (!event.body) {
			reject({
				result: "inputError",
				message: "Service inputs not defined!"
			});
		}
		if (!event.body.service_context) {
			reject({
				result: "inputError",
				message: "service_context not provided!"
			});
		}
		if (!event.body.event_handler) {
			reject({
				result: "inputError",
				message: "event_handler not provided!"
			});
		}
		if (!event.body.event_name) {
			reject({
				result: "inputError",
				message: "event_name not provided!"
			});
		}
		if (!event.body.service_name) {
			reject({
				result: "inputError",
				message: "service_name not provided!"
			});
		}
		if (!event.body.event_status) {
			reject({
				result: "inputError",
				message: "event_status not provided!"
			});
		}
		if (!event.body.event_type) {
			reject({
				result: "inputError",
				message: "event_type not provided!"
			});
		}
		if (!event.body.username) {
			reject({
				result: "inputError",
				message: "username not provided!"
			});
		}
		if (!event.body.event_timestamp) {
			reject({
				result: "inputError",
				message: "event_timestamp not provided!"
			});
		}
		resolve();
	});
}

function validateEventInput(config, event, dynamodb){
	logger.info("Inside validateEventInput:")
	return new Promise((resolve, reject) => {
		validateEventType(config, event, dynamodb)
		.then(() => validateEventName(config, event, dynamodb))
		.then(() => validateEventHandler(config, event, dynamodb))
		.then(() => validateEventStatus(config, event, dynamodb))
		.then(() => validateTimestamp(event))
		.then(function(){
			resolve()
		})
		.catch(function(error){
			reject(error)
		})
	})
}

function getDynamodbItem(dynamodb, params, eventData){
	logger.info("Inside getDynamodbItem:"+JSON.stringify(params));
	return new Promise((resolve, reject) => {
		dynamodb.getItem(params, function (err, data) {
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

function validateEventType(config, event, dynamodb){
	logger.info("Inside validateEventType:")
	return new Promise((resolve, reject) => {
		var event_type_params = {
			Key: {
				"EVENT_TYPE": {
					S: event.body.event_type
				}
			},
			TableName: config.event_type_table
		};
		getDynamodbItem(dynamodb, event_type_params, event.body.event_type)
		.then(function(result){
			resolve(result);
		})
		.catch(function(error){
			reject(error);
		})
	});
}

function validateEventName(config, event, dynamodb){
	logger.info("Inside validateEventName:");
	return new Promise((resolve, reject) => {
		var event_name_params = {
			Key: {
				"EVENT_NAME": {
					S: event.body.event_name
				}
			},
			TableName: config.event_name_table
		};
		getDynamodbItem(dynamodb, event_name_params, event.body.event_name)
		.then(function(result){
			resolve(result);
		})
		.catch(function(error){
			reject(error);
		})
	});
}

function validateEventHandler(config, event, dynamodb){
	logger.info("Inside validateEventHandler:");
	return new Promise((resolve, reject) => {
		var event_handler_params = {
			Key: {
				"EVENT_HANDLER": {
					S: event.body.event_handler
				}
			},
			TableName: config.event_handler_table
		};
		getDynamodbItem(dynamodb, event_handler_params, event.body.event_handler)
		.then(function(result){
			resolve(result);
		})
		.catch(function(error){
			reject(error);
		})
	});
}

function validateEventStatus(config, event, dynamodb){
	logger.info("Inside validateEventStatus:");
	return new Promise((resolve, reject) => {
		var event_status_params = {
			Key: {
				"EVENT_STATUS": {
					S: event.body.event_status
				}
			},
			TableName: config.event_status_table
		};
		getDynamodbItem(dynamodb, event_status_params, event.body.event_status)
		.then(function(result){
			resolve(result);
		})
		.catch(function(error){
			reject(error);
		})
	});
}

function validateTimestamp(event){
	logger.info("Inside validateTimestamp:");
	return new Promise((resolve, reject) => {
		try {
			if (moment(event.body.event_timestamp, "YYYY-MM-DDTHH:mm:ss:SSS", true).isValid()) {
				resolve(event.body.event_timestamp);
			} else {
				reject({
					"code": 400,
					"message": "Invalid EVENT TIMESTAMP: " + event.body.event_timestamp + ", The format should be YYYY-MM-DDTHH:mm:ss:SSS"
				});
			}
		} catch (err) {
			reject({
				"code": 500,
				"message": "Error parsing EVENT TIMESTAMP: " + event.body.event_timestamp + ", The format should be YYYY-MM-DDTHH:mm:ss:SSS"
			});
		}
	});
}

function storeEventData(config, event, kinesis){
	logger.info("Inside storeEventData:");
	return new Promise((resolve, reject) => {
		var event_id = Uuid();
		var timestamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss:SSS');
		var event_params = {
			Item: {
				"EVENT_ID": {
					S: event_id
				},
				"TIMESTAMP": {
					S: timestamp
				}
			}
		};

		Object.keys(event.body).forEach(function (key) {
			if (key === "service_context") {
				event_params.Item.SERVICE_CONTEXT = {
					S: JSON.stringify(event.body.service_context)
				};
			} else if (key === "event_handler") {
				event_params.Item.EVENT_HANDLER = {
					S: event.body.event_handler
				};
			} else if (key === "event_name") {
				event_params.Item.EVENT_NAME = {
					S: event.body.event_name
				};
			} else if (key === "service_name") {
				event_params.Item.SERVICE_NAME = {
					S: event.body.service_name
				};
			} else if (key === "event_status") {
				event_params.Item.EVENT_STATUS = {
					S: event.body.event_status
				};
			} else if (key === "event_type") {
				event_params.Item.EVENT_TYPE = {
					S: event.body.event_type
				};
			} else if (key === "username") {
				event_params.Item.USERNAME = {
					S: event.body.username
				};
			} else if (key === "event_timestamp") {
				event_params.Item.EVENT_TIMESTAMP = {
					S: event.body.event_timestamp
				};
			} else {
				if (!event.body[key]) {
					event_params.Item[key.toUpperCase()] = {
						NULL: true
					};
				} else {
					event_params.Item[key.toUpperCase()] = {
						S: event.body[key]
					};
				}

			}
		});

		var stream_params = {
			Data: JSON.stringify(event_params),
			PartitionKey: event.body.event_name,
			StreamName: config.event_hub
		};
		kinesis.putRecord(stream_params, function(err, data) {
			if (err) {
				logger.error('kinesis error'+ JSON.stringify(err));
				reject({
					"code": 500,
					"message": "Error storing event. " + err.message
				});
			} else {
				var output ={
					"event_id": event_id
				};
				logger.info("event_id is: "+event_id);
				resolve(responseObj(output, event.body));
			}
		});
	});
}