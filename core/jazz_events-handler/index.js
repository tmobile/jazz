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

const async = require("async");
const AWS = require('aws-sdk');

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const fcodes = require('./utils/failure-codes.js');

module.exports.handler = (event, context, cb) => {

	//Initializations
	var config = configModule.getConfig(event, context);

	const dynamodb = new AWS.DynamoDB();
	var processedEvents = [];
	var failedEvents = [];

	var docClient = new AWS.DynamoDB.DocumentClient();
	var interestedEvents = [];
	var failureCodes = fcodes();

	async.series({
		getEvents: function (callback) {
			var params = {
				TableName: config.EVENT_NAME_TABLE,
				ProjectionExpression: "EVENT_NAME",
				Limit: 1000,
				ReturnConsumedCapacity: "TOTAL"
			};
			var scanExecute = function (callback) {
				docClient.scan(params, function (err, result) {
					if (err) {
						callback({
							"db_error": "Unable to scan Event Names table to fetch interested events"
						});
					} else {

						//interestedEvents = interestedEvents.concat(result.Items);
						for (i = 0; i < result.Items.length; i++) {
							interestedEvents.push(result.Items[i].EVENT_NAME);
						}

						if (result.LastEvaluatedKey) {
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							scanExecute(callback);
						} else {
							callback(err, interestedEvents);
						}
					}
				});
			};

			scanExecute(callback);
		},
		processRecords: function (callback) {
			async.each(event.Records, function (record, innerCallback) {
				var sequenceNumber = record.kinesis.sequenceNumber;
				var encodedPayload = record.kinesis.data;
				var payload = new Buffer(encodedPayload, 'base64').toString('ascii');

				if (interestedEvents.indexOf(record.kinesis.partitionKey) !== -1) {
					var params = JSON.parse(payload);
					params.ReturnConsumedCapacity = "TOTAL";
					params.TableName = config.EVENT_TABLE;

					dynamodb.putItem(params, function (err, data) {
						if (err) {
							logger.error('Unable to store event in events table, message: ' + JSON.stringify(err));
							failedEvents.push({
								"sequence_id": sequenceNumber,
								"event": payload,
								"failure_code": failureCodes.DB_ERROR_1.code,
								"failure_message": failureCodes.DB_ERROR_1.message
							});
							innerCallback({
								"db_error": "Unable to store event in events table"
							});

						} else {
							logger.info('Stored interested event in table');
							processedEvents.push({
								"sequence_id": sequenceNumber,
								"event": payload,
								"failure_code": null,
								"failure_message": null
							});
							innerCallback(null, {
								"message": "successfully processed interested event"
							});
						}

					});
				} else {
					processedEvents.push({
						"sequence_id": sequenceNumber,
						"event": payload,
						"failure_code": null,
						"failure_message": null
					});
					logger.info('Skipping storage of un-interested event');
					innerCallback(null, {
						"message": "successfully processed un-interested event"
					});
				}

			}, function (err) {
				callback();
			});

		}

	}, function (err, results) {
		if (err) {
			return logger.error('Error inside events handler ' + JSON.stringify(err));
		}

		cb(null, {
			"processed_events": processedEvents.length,
			"failed_events": failedEvents.length
		});
	});

};
