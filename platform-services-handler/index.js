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

/*jshint loopfunc:true */
/**
This Handler looks for Service Creation events and updates Service Catalog
@Author: Deepak Babu, Somanchi
@version: 1.0
 **/

const config = require('./components/config.js'); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const async = require("async");
const AWS = require('aws-sdk');
const errorHandlerModule = require("./components/error-handler.js");
const request = require('request');
const scEvents = require('./utils/service-creation-events.js');
const fcodes = require('./utils/failure-codes.js');

module.exports.handler = (event, context, cb) => {

	//Initializations
	var configData = config(context);
	var errorHandler = errorHandlerModule(logger);
	const dynamodb = new AWS.DynamoDB();
	var processedEvents = [];
	var failedEvents = [];
	var startingEvent = configData.SERVICE_CREATION_EVENT_START;
	var endingEvent = configData.SERVICE_CREATION_EVENT_END;
	var serviceCreationEvents = scEvents();
	var failureCodes = fcodes();
	var failureQueue = configData.FAILURE_QUEUE;

	async.each(event.Records, function (record, callback) {

		/*
		 ************************************************
		SAMPLE KINESIS RECORD
		 ************************************************{
		kinesis: {
		kinesisSchemaVersion: '1.0',
		partitionKey: 'VALIDATE_INPUT',
		sequenceNumber: '49574219880753003597816065353678073460941546253285588994',
		data: 'eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMifSwiVElNRVNUQU1QIjp7IlMiOiIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiJ9LCJTRVJWSUNFX0NPTlRFWFQiOnsiUyI6IntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSJ9LCJFVkVOVF9IQU5ETEVSIjp7IlMiOiJKRU5LSU5TIn0sIkVWRU5UX05BTUUiOnsiUyI6IlZBTElEQVRFX0lOUFVUIn0sIlNFUlZJQ0VfTkFNRSI6eyJTIjoidGVzdDgifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJDT01QTEVURUQifSwiRVZFTlRfVFlQRSI6eyJTIjoiU0VSVklDRV9DUkVBVElPTiJ9LCJVU0VSTkFNRSI6eyJTIjoic3ZjX2NwdF9qbmtfYXV0aF9wcmQifSwiRVZFTlRfVElNRVNUQU1QIjp7IlMiOiIyMDE3LTA1LTA1VDA2OjA2OjM3OjUzMyJ9LCJBQUEiOnsiTlVMTCI6dHJ1ZX0sIkJCQiI6eyJTIjoidmFsIn19LCJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjoiVE9UQUwiLCJUYWJsZU5hbWUiOiJFdmVudHNfRGV2In0=',
		approximateArrivalTimestamp: 1498499666.218
		},
		eventSource: 'aws:kinesis',
		eventVersion: '1.0',
		eventID: 'shardId-000000000000:49574219880753003597816065353678073460941546253285588994',
		eventName: 'aws:kinesis:record',
		invokeIdentityArn: 'arn:aws:iam::xxx:role/lambda_basic_execution',
		awsRegion: 'us-west-2',
		eventSourceARN: 'arn:aws:kinesis:us-west-2:xxx:stream/serverless-events-hub-dev'
		}
		 ************************************************

		 ************************************************
		SAMPLE DECODED DATA (FROM KINESIS RECORD)
		 ************************************************{
		"Item": {
		"EVENT_ID": {
		"S": "e825ef7b-c8b7-8a84-d3f0-d73bd7a8d566"
		},
		"TIMESTAMP": {
		"S": "2017-06-26T19:54:30:013"
		},
		"SERVICE_CONTEXT": {
		"S": "{\"service_type\":\"api\",\"runtime\":\"nodejs\",\"admin_group\":\"name=d&name=b&name=a&name=b&name=u&\"}"
		},
		"EVENT_HANDLER": {
		"S": "JENKINS"
		},
		"EVENT_NAME": {
		"S": "VALIDATE_INPUT"
		},
		"SERVICE_NAME": {
		"S": "test8"
		},
		"EVENT_STATUS": {
		"S": "COMPLETED"
		},
		"EVENT_TYPE": {
		"S": "SERVICE_CREATION"
		},
		"USERNAME": {
		"S": "svc_cpt_jnk_auth_prd"
		},
		"EVENT_TIMESTAMP": {
		"S": "2017-05-05T06:06:37:533"
		},
		"AAA": {
		"NULL": true
		},
		"BBB": {
		"S": "val"
		}
		}
		}
		 ************************************************
		 */

		var sequenceNumber = record.kinesis.sequenceNumber;
		var encodedPayload = record.kinesis.data;

		async.auto({
			checkInterest: function (innerCallback) {
				//check if event-name is in the service-creation-events list
				if (Object.keys(serviceCreationEvents).indexOf(record.kinesis.partitionKey) !== -1) {

					var payload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
					//check if event-type is Service Creation
					if (payload.Item.EVENT_TYPE && payload.Item.EVENT_TYPE.S && payload.Item.EVENT_TYPE.S === "SERVICE_CREATION") {
						// logger.info("found SERVICE_CREATION event with sequence number: " + sequenceNumber);
						innerCallback(null, {
							"interested_event": true,
							"payload": payload
						});
					} else {
						logger.error('not interesting event');
						//This is not an interesting event
						innerCallback(null, {
							"interested_event": false
						});
					}
				} else {
					logger.error('partitionKey not available');
					//This is not an interesting event
					innerCallback(null, {
						"interested_event": false
					});

				}
			},

			processRecord: ['checkInterest', function (results, innerCallback) {

					if (results.checkInterest.interested_event) {
						var payload = results.checkInterest.payload.Item;
						/*
						1. if event-name = CALL_ONBOARDING_WORKFLOW and event-status = Completed Call services with status STARTED
						2. if event-name = ONBOARDING_COMPLETED and event-status = Completed Call services to get service id and then call put on services for updating status as COMPLETED
						3. if event-status = Failed for any event Call services to get service id and then call put on services for updating status as FAILED
						 */

						var svcContext = JSON.parse(payload.SERVICE_CONTEXT.S);
						var domain;
						var description;
						var runtime;
						var region;
						var repository;
						var email;
						var slackChannel;
						var tags;
						var type;
						if (svcContext.domain) {
							domain = svcContext.domain;
						} else {
							domain = null;
						}
						if (svcContext.description) {
							description = svcContext.description;
						} else {
							description = null;
						}
						if (svcContext.runtime) {
							runtime = svcContext.runtime;
						} else {
							runtime = null;
						}
						if (svcContext.region) {
							region = svcContext.region;
						} else {
							region = null;
						}
						if (svcContext.repository) {
							repository = svcContext.repository;
						} else {
							repository = null;
						}
						if (svcContext.email) {
							email = svcContext.email;
						} else {
							email = null;
						}
						if (svcContext.slack_channel) {
							slackChannel = svcContext.slack_channel;
						} else {
							slackChannel = null;
						}
						if (svcContext.tags) {
							tags = svcContext.tags;
						} else {
							tags = null;
						}
						if (svcContext.service_type) {
							type = svcContext.service_type;
						} else {
							type = null;
						}

						if (!payload.EVENT_NAME.S || payload.EVENT_NAME.S === "" || !payload.EVENT_STATUS.S || payload.EVENT_STATUS.S === "") {
							logger.info('Invalid EVENT_NAME.S or EVENT_STATUS');
							failedEvents.push({
								Id: sequenceNumber,
								DelaySeconds: 0,
								MessageBody: "Validation error while processing event for service " + domain + "." + payload.SERVICE_NAME.S + ".",
								MessageAttributes: {
									"sequence_id": {
										DataType: "String",
										StringValue: sequenceNumber.toString()
									},
									"event": {
										DataType: "String",
										StringValue: JSON.stringify(payload)
									},
									"failure_code": {
										DataType: "String",
										StringValue: failureCodes.PR_ERROR_1.code
									},
									"failure_message": {
										DataType: "String",
										StringValue: "validation error. Either event name or event status is not properly defined."
									}
								}
							});
							logger.error("validation error. Either event name or event status is not properly defined.");
							return innerCallback({
								"error": "validation error. Either event name or event status is not properly defined."
							});
						}
						if (payload.EVENT_NAME.S === startingEvent) {
							logger.info('EVENT_NAME ' + startingEvent);
							if (payload.EVENT_STATUS.S === "COMPLETED") {

                              var req =  {
										"service": payload.SERVICE_NAME.S,
										"domain": domain,
										"description": description,
										"type": type,
										"runtime": runtime,
										"region": region,
										"repository": repository,
										"created_by": payload.USERNAME.S,
										"email": email,
										"slack_channel": slackChannel,
										"tags": tags,
										"status": "STARTED"
									};

								// call services post with status started
								var svcPayload = {
									uri: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE,
                                    url: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE,
									method: 'POST',
									json: req,
									rejectUnauthorized: false
								};



								request(svcPayload, function (error, response, body) {

									if (response.statusCode === 200) {
										if (body.data === null || body.data === "") {
											failedEvents.push({
												Id: sequenceNumber,
												DelaySeconds: 0,
												MessageBody: "Unknown error while creating a new service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.",
												MessageAttributes: {
													"sequence_id": {
														DataType: "String",
														StringValue: sequenceNumber.toString()
													},
													"event": {
														DataType: "String",
														StringValue: JSON.stringify(payload)
													},
													"failure_code": {
														DataType: "String",
														StringValue: failureCodes.PR_ERROR_2.code
													},
													"failure_message": {
														DataType: "String",
														StringValue: failureCodes.PR_ERROR_2.message
													}
												}
											});
											logger.error("Unknown error while creating a new service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
											return innerCallback({
												"error": "Unknown error while creating a new service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
											});

										} else {
											processedEvents.push({
												"sequence_id": sequenceNumber,
												"event": payload,
												"failure_code": null,
												"failure_message": null
											});
											logger.info("created a new service in service catalog.");
											logger.verbose("created a new service in service catalog.");
											return innerCallback(null, {
												"message": "created a new service in service catalog."
											});
										}

									} else {
										failedEvents.push({
											Id: sequenceNumber,
											DelaySeconds: 0,
											MessageBody: "Processing error while creating a new service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.",
											MessageAttributes: {
												"sequence_id": {
													DataType: "String",
													StringValue: sequenceNumber.toString()
												},
												"event": {
													DataType: "String",
													StringValue: JSON.stringify(payload)
												},
												"failure_code": {
													DataType: "String",
													StringValue: failureCodes.PR_ERROR_3.code
												},
												"failure_message": {
													DataType: "String",
													StringValue: response.body.message
												}
											}
										});
										logger.error("Processing error while creating a new service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
										logger.error(response.body.message);
										return innerCallback({
											"error": "error creating a new service in service catalog."
										});
									}
								});

							}
							/*for "CALL_ONBOARDING_WORKFLOW" event all other statuses including failed can be ignored
							because service catalog item create will only happen
							when CALL_ONBOARDING_WORKFLOW successfully completes */
						} else {
							var svcGetPayload;
							if (payload.EVENT_NAME.S === endingEvent && payload.EVENT_STATUS.S === "COMPLETED") {
								//call services put with status completed
								logger.info('EVENT_NAME '+  endingEvent+'with COMPLETED status ');
								svcGetPayload = {
									uri: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "?domain=" + domain + "&service=" + payload.SERVICE_NAME.S,
									url: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "?domain=" + domain + "&service=" + payload.SERVICE_NAME.S,
									method: 'GET',
									rejectUnauthorized: false
								};

								request(svcGetPayload, function (error, response, body) {

									if (response.statusCode === 200) {
										var output = JSON.parse(body);
										if (output.data === null || output.data === "" || output.data === undefined || output.data.length === undefined || output.data.length === 0 ) {
											failedEvents.push({
												Id: sequenceNumber,
												DelaySeconds: 0,
												MessageBody: "error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog",
												MessageAttributes: {
													"sequence_id": {
														DataType: "String",
														StringValue: sequenceNumber.toString()
													},
													"event": {
														DataType: "String",
														StringValue: JSON.stringify(payload)
													},
													"failure_code": {
														DataType: "String",
														StringValue: failureCodes.PR_ERROR_4.code
													},
													"failure_message": {
														DataType: "String",
														StringValue: "service " + domain + "." + payload.SERVICE_NAME.S + " not available in service catalog"
													}
												}
											});
											logger.error("error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog");
											return innerCallback({
												"error": "error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog"
											});

										} else {
											//call put

											var svcPayload = {
												uri: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "/" + output.data[0].id,
												url: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "/" + output.data[0].id,
												method: 'PUT',
												json: {
													"service": payload.SERVICE_NAME.S,
													"domain": domain,
													"description": description,
													"type": type,
													"runtime": runtime,
													"region": region,
													"repository": repository,
													"created_by": payload.USERNAME.S,
													"email": email,
													"slack_channel": slackChannel,
													"tags": tags,
													"status": "COMPLETED"
												},
												rejectUnauthorized: false
											};

											request(svcPayload, function (error, response, body) {
												if (response.statusCode === 200) {
													if (body.data === null || body.data === "") {
														failedEvents.push({
															Id: sequenceNumber,
															DelaySeconds: 0,
															MessageBody: "Processing error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.",
															MessageAttributes: {
																"sequence_id": {
																	DataType: "String",
																	StringValue: sequenceNumber.toString()
																},
																"event": {
																	DataType: "String",
																	StringValue: JSON.stringify(payload)
																},
																"failure_code": {
																	DataType: "String",
																	StringValue: failureCodes.PR_ERROR_2.code
																},
																"failure_message": {
																	DataType: "String",
																	StringValue: "unknown error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
																}
															}
														});
														logger.error("unknown error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
														return innerCallback({
															"error": "unknown error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
														});

													} else {
														processedEvents.push({
															"sequence_id": sequenceNumber,
															"event": payload,
															"failure_code": null,
															"failure_message": null
														});
														logger.verbose("updated service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
														logger.info("updated service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
														return innerCallback(null, {
															"message": "updated service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
														});
													}

												} else {
													failedEvents.push({
														Id: sequenceNumber,
														DelaySeconds: 0,
														MessageBody: "Processing error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.",
														MessageAttributes: {
															"sequence_id": {
																DataType: "String",
																StringValue: sequenceNumber.toString()
															},
															"event": {
																DataType: "String",
																StringValue: JSON.stringify(payload)
															},
															"failure_code": {
																DataType: "String",
																StringValue: failureCodes.PR_ERROR_3.code
															},
															"failure_message": {
																DataType: "String",
																StringValue: response.body.message
															}
														}
													});
													logger.error("error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
													logger.error(response.body.message);
													return innerCallback({
														"error": "error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
													});
												}
											});
										}

									} else {
										failedEvents.push({
											Id: sequenceNumber,
											DelaySeconds: 0,
											MessageBody: "error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog",
											MessageAttributes: {
												"sequence_id": {
													DataType: "String",
													StringValue: sequenceNumber.toString()
												},
												"event": {
													DataType: "String",
													StringValue: JSON.stringify(payload)
												},
												"failure_code": {
													DataType: "String",
													StringValue: failureCodes.PR_ERROR_3.code
												},
												"failure_message": {
													DataType: "String",
													StringValue: response.body.message
												}
											}
										});
										logger.error("error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog");
										logger.error(response.body.message);
										return innerCallback({
											"error": "error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog"
										});

									}
								});

							}
							if (payload.EVENT_STATUS.S === "FAILED") {
								logger.info('FAILED EVENT_STATUS');
								//call services put with status failed
								svcGetPayload = {
									uri: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "?domain=" + domain + "&service=" + payload.SERVICE_NAME.S,
									url: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "?domain=" + domain + "&service=" + payload.SERVICE_NAME.S,
									method: 'GET',
									rejectUnauthorized: false
								};
								request(svcGetPayload, function (error, response, body) {


									if (response.statusCode === 200) {
										var output = JSON.parse(body);
										if (output.data === null || output.data === "" || output.data === undefined || output.data.length === undefined || output.data.length === 0) {
											failedEvents.push({
												Id: sequenceNumber,
												DelaySeconds: 0,
												MessageBody: "error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog",
												MessageAttributes: {
													"sequence_id": {
														DataType: "String",
														StringValue: sequenceNumber.toString()
													},
													"event": {
														DataType: "String",
														StringValue: JSON.stringify(payload)
													},
													"failure_code": {
														DataType: "String",
														StringValue: failureCodes.PR_ERROR_4.code
													},
													"failure_message": {
														DataType: "String",
														StringValue: "service " + domain + "." + payload.SERVICE_NAME.S + " not available in service catalog"
													}
												}
											});
											logger.error("error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog");
											return innerCallback({
												"error": "error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog"
											});
										} else {
											//call put
											var svcPayload = {
												uri: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "/" + output.data[0].id,
												url: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "/" + output.data[0].id,
												method: 'PUT',
												json: {
													"service": payload.SERVICE_NAME.S,
													"domain": domain,
													"description": description,
													"type": type,
													"runtime": runtime,
													"region": region,
													"repository": repository,
													"created_by": payload.USERNAME.S,
													"email": email,
													"slack_channel": slackChannel,
													"tags": tags,
													"status": "FAILED"
												},
												rejectUnauthorized: false
											};
											request(svcPayload, function (error, response, body) {
												if (response.statusCode === 200) {
													if (body.data === null || body.data === "") {
														failedEvents.push({
															Id: sequenceNumber,
															DelaySeconds: 0,
															MessageBody: "Processing error while updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.",
															MessageAttributes: {
																"sequence_id": {
																	DataType: "String",
																	StringValue: sequenceNumber.toString()
																},
																"event": {
																	DataType: "String",
																	StringValue: JSON.stringify(payload)
																},
																"failure_code": {
																	DataType: "String",
																	StringValue: failureCodes.PR_ERROR_2.code
																},
																"failure_message": {
																	DataType: "String",
																	StringValue: "unknown error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
																}
															}
														});
														logger.error("unknown error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
														return innerCallback({
															"error": "unknown error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
														});

													} else {
														processedEvents.push({
															"sequence_id": sequenceNumber,
															"event": payload,
															"failure_code": null,
															"failure_message": null
														});
														logger.verbose("updated service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
														logger.info("updated service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
														return innerCallback(null, {
															"message": "updated service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
														});
													}

												} else {
													failedEvents.push({
														Id: sequenceNumber,
														DelaySeconds: 0,
														MessageBody: "Processing error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.",
														MessageAttributes: {
															"sequence_id": {
																DataType: "String",
																StringValue: sequenceNumber.toString()
															},
															"event": {
																DataType: "String",
																StringValue: JSON.stringify(payload)
															},
															"failure_code": {
																DataType: "String",
																StringValue: failureCodes.PR_ERROR_3.code
															},
															"failure_message": {
																DataType: "String",
																StringValue: response.body.message
															}
														}
													});
													logger.error("error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog.");
													logger.error(response.body.message);
													return innerCallback({
														"error": "error updating service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog."
													});
												}
											});
										}

									} else {
										failedEvents.push({
											Id: sequenceNumber,
											DelaySeconds: 0,
											MessageBody: "error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog",
											MessageAttributes: {
												"sequence_id": {
													DataType: "String",
													StringValue: sequenceNumber.toString()
												},
												"event": {
													DataType: "String",
													StringValue: JSON.stringify(payload)
												},
												"failure_code": {
													DataType: "String",
													StringValue: failureCodes.PR_ERROR_3.code
												},
												"failure_message": {
													DataType: "String",
													StringValue: response.body.message
												}
											}
										});
										logger.error("error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog");
										return innerCallback({
											"error": "error finding service " + domain + "." + payload.SERVICE_NAME.S + " in service catalog"
										});
									}
								});
							}
						}

					} else {
						logger.error('push un-interesting event to processed queue');
						//push un-interesting event to processed queue
						processedEvents.push({
							"sequence_id": sequenceNumber,
							"failure_code": null,
							"failure_message": null
						});
					}

				}
			]

		}, function (err, results) {
			callback();
		});

	}, function (err) {
		async.series(
			[
				function (callback) {
					var sqs = new AWS.SQS({
							apiVersion: '2012-11-05'
						});
					var sqsparams = {
						Entries: failedEvents,
						QueueUrl: failureQueue
					};

					if (failedEvents.length > 0) {
						logger.error(JSON.stringify(failedEvents));
						sqs.sendMessageBatch(sqsparams, function (err, data) {
							if (err) {
								logger.error("SQS error");
								callback(err);

							} else {
								callback(null, data);

							}

						});
					} else {
						callback(null, null);
					}

				}
			], function (err, results) {
			if (err) {
				logger.info(err)
				cb(err);
			} else {
				logger.verbose('events failed'+ failedEvents.length+'processed events'+processedEvents.length);
				cb(null, {
					"processed_events": processedEvents.length,
					"failed_events": failedEvents.length
				});
			}
		});

	});

};
