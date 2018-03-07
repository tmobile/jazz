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
		if (event !== undefined && event.method !== undefined && event.method === 'GET') {

			async.series({
				get_events: function (callback) {
					var filter = "";
					var attributeValues = {};

					var scanparams = {
						"TableName": config.events_table,
						"ReturnConsumedCapacity": "TOTAL",
						"Limit": "500"
					};
					console.log(event.query);
					if (event.query !== undefined && event.query !== null && Object.keys(event.query).length > 0) {
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

						if (filter === "") {
							return callback(null, {});
						}
						scanparams.FilterExpression = filter.substring(0, filter.length - 5);
						scanparams.ExpressionAttributeValues = attributeValues;
						dynamodb.scan(scanparams, function (err, items) {
							if (err) {

								logger.error("error in dynamodb scan");
								logger.error(err);
								callback(err);

							} else {
								callback(null, items);
							}
						});
					} else {
						callback(null, {});
					}
				}
			}, function (err, results) {

				if (err) {
					logger.error(err);
					cb(JSON.stringify(errorHandler.throwInternalServerError("An internal error occured. message: " + err.message)));
				} else {
					var events = [];
					if (results.get_events !== undefined && results.get_events !== "" && results.get_events.Items !== undefined && results.get_events.Items !== "") {
						results.get_events.Items.forEach(function (item) {
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

						if (results.get_events.LastEvaluatedKey !== undefined || results.get_events.LastEvaluatedKey !== "") {
							cb(null, responseObj({
									"events": events,
									"last_evaluated_key": results.get_events.LastEvaluatedKey
								}, event.query));
						} else {
							cb(null, responseObj({
									"events": events
								}, event.query));
						}
					} else {
						cb(JSON.stringify(errorHandler.throwInputValidationError("Bad request. message: The query parameters supported are username, service_name, and last_evaluated_index")));
					}
				}

			});
		}

		//POST Handler
		if (event !== undefined && event.method !== undefined && event.method === 'POST') {
			if (event.body === undefined) {
				return cb(JSON.stringify(errorHandler.throwInternalServerError("Service inputs not defined!")));
			}
			if (event.body.service_context === undefined || event.body.service_context === "") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError("service_context not provided!")));
			}
			if (event.body.event_handler === undefined || event.body.event_handler === "") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError("event_handler not provided!")));
			}
			if (event.body.event_name === undefined || event.body.event_name === "") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError("event_name not provided!")));
			}
			if (event.body.service_name === undefined || event.body.service_name === "") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError("service_name not provided!")));
			}
			if (event.body.event_status === undefined || event.body.event_status === "") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError("event_status not provided!")));
			}
			if (event.body.event_type === undefined || event.body.event_type === "") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError("event_type not provided!")));
			}
			if (event.body.username === undefined || event.body.username === "") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError("username not provided!")));
			}
			if (event.body.event_timestamp === undefined || event.body.event_timestamp === "") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError("event_timestamp not provided!")));
			}

			var event_id = Uuid();

			async.auto({
				validate_event_type: function (callback) {
					logger.info(event.body.event_type);
					var event_type_params = {
						Key: {
							"EVENT_TYPE": {
								S: event.body.event_type
							}
						},
						TableName: config.event_type_table
					};
					dynamodb.getItem(event_type_params, function (err, data) {
						if (err) {
							logger.error("error reading event_type from database " + err.message);
							callback({
								"code": 500,
								"message": "error reading event_type from database " + err.message
							});
						} else {
							if (data === undefined || data === null || data.Item === undefined || data.Item === null) {
								logger.error("Invalid EVENT_TYPE. " + event.body.event_type);
								callback({
									"code": 400,
									"message": "Invalid EVENT_TYPE. " + event.body.event_type
								}, null);
							} else {
								callback(null, data.Item);
							}
						}
					});
				},
				validate_event_name: function (callback) {
					logger.info(event.body.event_name);
					var event_name_params = {
						Key: {
							"EVENT_NAME": {
								S: event.body.event_name
							}
						},
						TableName: config.event_name_table
					};
					dynamodb.getItem(event_name_params, function (err, data) {
						if (err) {
							logger.error("error reading event_name from database " + err.message);
							callback({
								"code": 500,
								"message": "error reading event_name from database " + err.message
							});
						} else {
							if (data === undefined || data === null || data.Item === undefined || data.Item === null) {
								logger.error("Invalid EVENT_NAME. " + event.body.event_name);
								callback({
									"code": 400,
									"message": "Invalid EVENT_NAME. " + event.body.event_name
								}, null);
							} else {
								callback(null, data.Item);
							}
						}
					});
				},
				validate_event_handler: function (callback) {
					logger.info(event.body.event_handler);
					var event_handler_params = {
						Key: {
							"EVENT_HANDLER": {
								S: event.body.event_handler
							}
						},
						TableName: config.event_handler_table
					};
					dynamodb.getItem(event_handler_params, function (err, data) {
						if (err) {
							logger.error("error reading event_handler from database " + err.message);
							callback({
								"code": 500,
								"message": "error reading event_handler from database " + err.message
							});
						} else {
							if (data === undefined || data === null || data.Item === undefined || data.Item === null) {
								logger.error("Invalid EVENT_HANDLER. " + event.body.event_handler);
								callback({
									"code": 400,
									"message": "Invalid EVENT_HANDLER. " + event.body.event_handler
								}, null);
							} else {
								callback(null, data.Item);
							}
						}
					});
				},
				validate_event_status: function (callback) {
					logger.info(event.body.event_status);
					var event_status_params = {
						Key: {
							"EVENT_STATUS": {
								S: event.body.event_status
							}
						},
						TableName: config.event_status_table
					};
					dynamodb.getItem(event_status_params, function (err, data) {
						if (err) {
							logger.error("error reading event_status from database " + err.message);
							callback({
								"code": 500,
								"message": "error reading event_status from database " + err.message
							});
						} else {
							if (data === undefined || data === null || data.Item === undefined || data.Item === null) {
								logger.error("Invalid EVENT_STATUS. " + event.body.event_status);
								callback({
									"code": 400,
									"message": "Invalid EVENT_STATUS. " + event.body.event_status
								}, null);
							} else {
								callback(null, data.Item);
							}
						}
					});
				},
				validate_timestamp: function (callback) {
					try {
						if (moment(event.body.event_timestamp, "YYYY-MM-DDTHH:mm:ss:SSS", true).isValid()) {
							callback(null, event.body.event_timestamp);
						} else {
							callback({
								"code": 400,
								"message": "Invalid EVENT TIMESTAMP: " + event.body.event_timestamp + ", The format should be YYYY-MM-DDTHH:mm:ss:SSS"
							}, null);
						}
					} catch (err) {
						callback({
							"code": 500,
							"message": "Error parsing EVENT TIMESTAMP: " + event.body.event_timestamp + ", The format should be YYYY-MM-DDTHH:mm:ss:SSS"
						}, null);
					}
				},
				store_context: ['validate_event_type', 'validate_event_name', 'validate_event_handler', 'validate_event_status', 'validate_timestamp', function (results, callback) {
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
								if (event.body[key] === null) {
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

								callback({
									"code": 500,
									"message": "Error storing event. " + err.message
								}, null);
							} else {
								callback(null, {
									"event_id": event_id
								});
							}
						});

					}
				]
			}, function (err, results) {

				if (err) {
					logger.error(err);
					if (err.code !== undefined && err.code === 500) {
						cb(JSON.stringify(errorHandler.throwInternalServerError("An internal error occured. message: " + err.message)));
					} else {
						cb(JSON.stringify(errorHandler.throwInputValidationError("Bad request. message: " + err.message)));
					}

				} else {
					logger.info(results.store_context);
					cb(null, responseObj(results.store_context, event.body));
				}

			});
		}

	} catch (e) {
		logger.error(e);
		cb(JSON.stringify(errorHandler.throwInternalServerError(e)));

	}

};
