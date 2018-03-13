<<<<<<< HEAD
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

/*jshint loopfunc:true */
/**
This Handler looks for Service Creation events and updates Service Catalog
@version: 1.0
 **/

=======
>>>>>>> 0fe91a8fe80bc39219cd8c53d7a328b18d1d0808
const config = require('./components/config.js'); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const async = require("async");
const AWS = require('aws-sdk');
const errorHandlerModule = require("./components/error-handler.js");
const request = require('request');
const scEvents = require('./utils/service-creation-events.js');
const fcodes = require('./utils/failure-codes.js');
const crud = require("./components/crud")(); //Import the utils module.

module.exports.handler = (event, context, cb) => {

	//Initializations
	var configData = config(context);
	var errorHandler = errorHandlerModule(logger);
	const dynamodb = new AWS.DynamoDB();
	var processedEvents = [];
	var failedEvents = [];
	var serviceCreationEvents = scEvents();
	var failureCodes = fcodes();
	var authToken;

	async.series({
		
		getToken: function (mainCallback) {
			try{				
				var svcPayload = {
					uri: configData.SERVICE_API_URL + configData.TOKEN_URL,
					method: 'POST',
					json: {
						"username": configData.SERVICE_USER,
						"password": configData.TOKEN_CREDS
					},
					rejectUnauthorized: false
				};

				request(svcPayload, function (error, response, body) {
					if (response.statusCode === 200 && typeof body !== undefined && typeof body.data !== undefined) {
						authToken = body.data.token;
						mainCallback(null, {
							"auth_token": authToken
						});
					} else {
<<<<<<< HEAD
						logger.error('not interesting event');
						//This is not an interesting event
						innerCallback(null, {
							"interested_event": false
=======
						mainCallback({
							"error": "Could not get authentication token for updating Service catalog.",
							"details": response.body.message
>>>>>>> 0fe91a8fe80bc39219cd8c53d7a328b18d1d0808
						});
					}
				});
			}catch(e){
				mainCallback(e);
			}
		},
		processBatch: function (mainCallback) {
			try{
				async.each(event.Records, function (record, callback) {
					var sequenceNumber = record.kinesis.sequenceNumber;
					var encodedPayload = record.kinesis.data;
					var adToken;

					async.auto({
						checkInterest: function (innerCallback) {

							try {
								var payload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));

								//check if event-type is Service Creation

								if (payload.Item.EVENT_TYPE && payload.Item.EVENT_TYPE.S) {
									logger.info("found " + payload.Item.EVENT_TYPE.S + " event with sequence number: " + sequenceNumber);
									innerCallback(null, {
										"interested_event": true,
										"payload": payload
									});
								} else {
									logger.debug("Missing EVENT_TYPE")
									//This is not an interesting event
									innerCallback(null, {
										"interested_event": false
									});
								}
							} catch(e){
								HandleFailedEvents(failureCodes.PR_ERROR_5.type, JSON.stringify(e), encodedPayload, failureCodes.PR_ERROR_5.code);
								innerCallback(e);
							}

						},

						processRecord: ['checkInterest', function (results, innerCallback) {
							try{
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
									var endpoint;
									var metadata;
									if (svcContext.domain !== undefined) {
										domain = svcContext.domain;
									} else {
										domain = null;
									}
									if (svcContext.description !== undefined) {
										description = svcContext.description;
									} 
									if (svcContext.runtime !== undefined) {
										runtime = svcContext.runtime;
									} 
									if (svcContext.region !== undefined) {
										region = svcContext.region;
									} 
									if (svcContext.repository !== undefined) {
										repository = svcContext.repository;
									} 
									if (svcContext.email !== undefined) {
										email = svcContext.email;
									} 
									if (svcContext.slack_channel !== undefined) {
										slackChannel = svcContext.slack_channel;
									} 
									if (svcContext.tags !== undefined) {
										tags = svcContext.tags;
									} 
									if (svcContext.service_type !== undefined) {
										type = svcContext.service_type;
									}
									if (svcContext.metadata !== undefined) {
										metadata = svcContext.metadata;
									}
									if (svcContext.endpoint !== undefined) {
										endpoint = svcContext.endpoint;
									}								

									if (!payload.EVENT_NAME.S || payload.EVENT_NAME.S === "" || !payload.EVENT_STATUS.S || payload.EVENT_STATUS.S === "") {
										HandleFailedEvents(sequenceNumber, "Validation error while processing event for service " + payload.SERVICE_NAME.S + ".", payload, failureCodes.PR_ERROR_1.code);
										logger.error("validation error. Either event name or event status is not properly defined.");
										return innerCallback({
											"error": "validation error. Either event name or event status is not properly defined."
										});
									}

									var inputs = {};

									if (payload.EVENT_TYPE.S === "SERVICE_CREATION") {

										if (payload.EVENT_NAME.S === configData.SERVICE_CREATION_EVENT_START) {
											if (payload.EVENT_STATUS.S === "COMPLETED") {
												//create service in catalog with status creation_started
												inputs = {
													"TOKEN": authToken,
													"SERVICE_API_URL": configData.SERVICE_API_URL,
													"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
													"SERVICE_NAME": payload.SERVICE_NAME.S,
													"DOMAIN": domain,
													"DESCRIPTION": description,
													"TYPE": type,
													"RUNTIME": runtime,
													"REGION": region,
													"REPOSITORY": repository,
													"USERNAME": payload.USERNAME.S,
													"EMAIL": email,
													"SLACKCHANNEL": slackChannel,
													"TAGS": tags,
													"ENDPOINTS": endpoint,
													"STATUS": "creation_started",
													"METADATA":metadata
												};

												crud.create(inputs, function (err, results) {
													if (err) {
														HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_2.code);
														logger.error(err.details);
														return innerCallback({
															"error": err.error
														});
													} else {
														HandleProcessedEvents(sequenceNumber, payload);
														logger.info("created a new service in service catalog.");
														return innerCallback(null, {
															"message": "created a new service in service catalog."
														});
													}
												});

											}
										} else {

											if (payload.EVENT_NAME.S === configData.SERVICE_CREATION_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
												//update service in catalog with creation_completed
												inputs = {
													"TOKEN": authToken,
													"SERVICE_API_URL": configData.SERVICE_API_URL,
													"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
													"DOMAIN": domain,
													"SERVICE_NAME": payload.SERVICE_NAME.S
												};
												crud.get(inputs, function (err, results) {
													if (err) {
														HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_4.code);
														logger.error(err.details);
														return innerCallback({
															"error": err.error
														});
													} else {

														var service_status = "creation_completed";

														inputs = {
															"TOKEN": authToken,
															"SERVICE_API_URL": configData.SERVICE_API_URL,
															"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
															"ID": results.id,
															"DESCRIPTION": description,
															"REPOSITORY": repository,
															"EMAIL": email,
															"SLACKCHANNEL": slackChannel,
															"TAGS": tags,
															"ENDPOINTS": endpoint,
															"STATUS": service_status
														};

														crud.update(inputs, function (err, results) {
															if (err) {
																HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_2.code);
																logger.error(err.details);
																return innerCallback({
																	"error": "unknown error updating service " + payload.SERVICE_NAME.S + " in service catalog."
																});
															} else {
																HandleProcessedEvents(sequenceNumber, payload);
																logger.info("updated service "  + payload.SERVICE_NAME.S + " in service catalog.");
																return innerCallback(null, {
																	"message": "updated service "  + payload.SERVICE_NAME.S + " in service catalog."
																});
															}
														});
													}
												});

											}

											if (payload.EVENT_STATUS.S === "FAILED") {
												//update service in catalog with creation_failed

												inputs = {
													"TOKEN": authToken,
													"SERVICE_API_URL": configData.SERVICE_API_URL,
													"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
													"DOMAIN": domain,
													"SERVICE_NAME": payload.SERVICE_NAME.S
												};

												crud.get(inputs, function (err, results) {

													if (err) {
														HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_4.code);
														logger.error(err.details);
														return innerCallback({
															"error": err.error
														});
													} else {
														inputs = {
															"TOKEN": authToken,
															"SERVICE_API_URL": configData.SERVICE_API_URL,
															"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
															"ID": results.id,
															"DESCRIPTION": description,
															"REPOSITORY": repository,
															"EMAIL": email,
															"SLACKCHANNEL": slackChannel,
															"TAGS": tags,
															"ENDPOINTS": endpoint,
															"STATUS": "creation_failed"
														};

														crud.update(inputs, function (err, results) {
															if (err) {
																HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_2.code);
																logger.error(err.details);
																return innerCallback({
																	"error": err.error
																});
															} else {
																HandleProcessedEvents(sequenceNumber, payload);
																logger.info("updated service "  + payload.SERVICE_NAME.S + " in service catalog.");
																return innerCallback(null, {
																	"message": "updated service "  + payload.SERVICE_NAME.S + " in service catalog."
																});
															}
														});
													}
												});

											}

										}

									} else if (payload.EVENT_TYPE.S === "SERVICE_DELETION") {

										if (payload.EVENT_NAME.S === configData.SERVICE_DELETION_EVENT_START && payload.EVENT_STATUS.S === "STARTED") {
											//delete service in catalog with status deletion_started
											inputs = {
												"TOKEN": authToken,
												"SERVICE_API_URL": configData.SERVICE_API_URL,
												"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
												"DOMAIN": domain,
												"SERVICE_NAME": payload.SERVICE_NAME.S
											};
											crud.get(inputs, function (err, results) {
												if (err) {
													HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_4.code);
													logger.error(err.details);
													return innerCallback({
														"error": err.error
													});
												} else {

													inputs = {
														"TOKEN": authToken,
														"SERVICE_API_URL": configData.SERVICE_API_URL,
														"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
														"ID": results.id,
														"DESCRIPTION": description,
														"REPOSITORY": repository,
														"EMAIL": email,
														"SLACKCHANNEL": slackChannel,
														"TAGS": tags,
														"ENDPOINTS": endpoint,
														"STATUS": "deletion_started"
													};

													crud.update(inputs, function (err, results) {
														if (err) {
															HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_2.code);
															logger.error(err.details);
															return innerCallback({
																"error": "unknown error updating service " + payload.SERVICE_NAME.S + " in service catalog."
															});
														} else {
															HandleProcessedEvents(sequenceNumber, payload);
															logger.info("updated service "  + payload.SERVICE_NAME.S + " in service catalog.");
															return innerCallback(null, {
																"message": "updated service "  + payload.SERVICE_NAME.S + " in service catalog."
															});
														}
													});

												}

											});
										} else {
											if (payload.EVENT_NAME.S === configData.SERVICE_DELETION_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
												//update service in catalog with creation_completed

												inputs = {
													"TOKEN": authToken,
													"SERVICE_API_URL": configData.SERVICE_API_URL,
													"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
													"DOMAIN": domain,
													"SERVICE_NAME": payload.SERVICE_NAME.S
												};
												crud.get(inputs, function (err, results) {
													if (err) {
														HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_4.code);
														logger.error(err.details);
														return innerCallback({
															"error": err.error
														});
													} else {
														inputs = {
															"TOKEN": authToken,
															"SERVICE_API_URL": configData.SERVICE_API_URL,
															"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
															"ID": results.id,
															"DESCRIPTION": description,
															"REPOSITORY": "[Archived]",
															"EMAIL": email,
															"SLACKCHANNEL": slackChannel,
															"TAGS": tags,
															"ENDPOINTS": endpoint,
															"STATUS": "deletion_completed"
														};

														crud.update(inputs, function (err, results) {
															if (err) {
																HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_2.code);
																logger.error(err.details);
																return innerCallback({
																	"error": "unknown error updating service "  + payload.SERVICE_NAME.S + " in service catalog."
																});
															} else {
																HandleProcessedEvents(sequenceNumber, payload);
																logger.info("updated service "  + payload.SERVICE_NAME.S + " in service catalog.");
																return innerCallback(null, {
																	"message": "updated service "  + payload.SERVICE_NAME.S + " in service catalog."
																});
															}
														});
													}
												});

											}

											if (payload.EVENT_STATUS.S === "FAILED") {
												//update service in catalog with creation_failed

												inputs = {
													"TOKEN": authToken,
													"SERVICE_API_URL": configData.SERVICE_API_URL,
													"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
													"DOMAIN": domain,
													"SERVICE_NAME": payload.SERVICE_NAME.S
												};

												crud.get(inputs, function (err, results) {
													if (err) {
														HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_4.code);
														logger.error(err.details);
														return innerCallback({
															"error": err.error
														});
													} else {
														inputs = {
															"TOKEN": authToken,
															"SERVICE_API_URL": configData.SERVICE_API_URL,
															"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
															"ID": results.id,
															"DESCRIPTION": description,
															"REPOSITORY": repository,
															"EMAIL": email,
															"SLACKCHANNEL": slackChannel,
															"TAGS": tags,
															"ENDPOINTS": endpoint,
															"STATUS": "deletion_failed"
														};

														crud.update(inputs, function (err, results) {
															if (err) {
																HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_2.code);
																logger.error(err.details);
																return innerCallback({
																	"error": err.error
																});
															} else {
																HandleProcessedEvents(sequenceNumber, payload);
																logger.info("updated service " + payload.SERVICE_NAME.S + " in service catalog.");
																return innerCallback(null, {
																	"message": "updated service " + payload.SERVICE_NAME.S + " in service catalog."
																});
															}
														});
													}
												});

											}

										}

									}
									else if (payload.EVENT_TYPE.S === "SERVICE_DEPLOYMENT") {

										if (payload.EVENT_NAME.S === configData.SERVICE_DEPLOYMENT_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
											//delete service in catalog with status deletion_started
											inputs = {
												"TOKEN": authToken,
												"SERVICE_API_URL": configData.SERVICE_API_URL,
												"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
												"DOMAIN": domain,
												"SERVICE_NAME": payload.SERVICE_NAME.S
											};
											crud.get(inputs, function (err, results) {
												if (err) {
													HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_4.code);
													logger.error(err.details);
													return innerCallback({
														"error": err.error
													});
												} else {

													inputs = {
														"TOKEN": authToken,
														"SERVICE_API_URL": configData.SERVICE_API_URL,
														"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
														"ID": results.id,
														"DESCRIPTION": description,
														"REPOSITORY": repository,
														"EMAIL": email,
														"SLACKCHANNEL": slackChannel,
														"TAGS": tags,
														"ENDPOINTS": endpoint,
														"STATUS": "active"
													};

													crud.update(inputs, function (err, results) {
														if (err) {
															HandleFailedEvents(sequenceNumber, err.error, payload, failureCodes.PR_ERROR_2.code);
															logger.error(err.details);
															return innerCallback({
																"error": "unknown error updating service " + payload.SERVICE_NAME.S + " in service catalog."
															});
														} else {
															HandleProcessedEvents(sequenceNumber, payload);
															logger.info("updated service "  + payload.SERVICE_NAME.S + " in service catalog.");
															return innerCallback(null, {
																"message": "updated service "  + payload.SERVICE_NAME.S + " in service catalog."
															});
														}
													});

												}

											});
										}
									}

								} else {
									//push un-interesting event to processed queue
									processedEvents.push({
										"sequence_id": sequenceNumber,
										"failure_code": null,
										"failure_message": null
									});
									innerCallback(null,processedEvents)
								}
							}catch(e){
								HandleFailedEvents(failureCodes.PR_ERROR_2.type, JSON.stringify(e), results.payload, failureCodes.PR_ERROR_2.code);
								innerCallback(e);
							}
						}]
					}, function (err, results) {
							callback(err);
					});
				}, function (err) {
					if(err){
						mainCallback(err)
					} else{
						mainCallback(null, {
							"processed_events": processedEvents.length,
							"failed_events": failedEvents.length
						});
					}
					
					
				});
			}catch(e){
				mainCallback(e);
			}
		}
	}, function (err, results) {
		logger.error("### Error : " + JSON.stringify(err));
		if (err) {
			cb(err);
		} else {
			cb(null, results);
		}
	});

	function HandleFailedEvents(id, error, event, failureCode) {
		failedEvents.push({
			Id: id,
			DelaySeconds: 0,
			MessageBody: error,
			MessageAttributes: {
				"sequence_id": {
					DataType: "String",
					StringValue: id.toString()
				},
				"event": {
					DataType: "String",
					StringValue: JSON.stringify(event)
				},
				"failure_code": {
					DataType: "String",
					StringValue: failureCode
				},
				"failure_message": {
					DataType: "String",
					StringValue: error
				}
			}
		});
	}

	function HandleProcessedEvents(id, event) {
		processedEvents.push({
			"sequence_id": id,
			"event": event
		});
	}
};
