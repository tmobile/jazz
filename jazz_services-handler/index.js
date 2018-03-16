const config = require('./components/config.js'); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const async = require("async");
const AWS = require('aws-sdk');
const rp = require('request-promise-native');
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

	rp(getToken(configData))
	.then(result => { return validateAuthToken(result); })
	.then(authToken => { return processRecords(configData, authToken); })	
	.then(result => {
		var records = {
			"processed_events": processedEvents.length,
			"failed_events": failedEvents.length			
		}
		logger.info("Successfully processed events. " + JSON.stringify(records));
		return cb(null, {
			"processed_events": processedEvents.length,
			"failed_events": failedEvents.length			
		});
	})
	.catch(err => {
		err.records = {
			"processed_events": processedEvents.length,
			"failed_events": failedEvents.length,
			"total_events":event.Records.length
		};
		logger.error("Error processing events. " + JSON.stringify(err));
		return cb(null, {
			"processed_events": processedEvents.length,
			"failed_events": failedEvents.length			
		});
	});

	
	function getToken(configData) {
		return {
			uri: configData.SERVICE_API_URL + configData.TOKEN_URL,
			method: 'POST',
			json: {
			  "username": configData.SERVICE_USER,
			  "password": configData.TOKEN_CREDS
			},
			rejectUnauthorized: false,
			transform: function(body, response, resolveWithFullResponse) {
				return response;
			}
		}; //End of promise			
	}
	
	function validateAuthToken(result){
		return new Promise((resolve, reject) => {
			if (result.statusCode === 200 && result.body && result.body.data) {
				return resolve(result.body.data.token);
			}else{			   
				return reject(errorHandler.throwUnAuthorizedError("User is not authorized to access this service"));
			}
		}); //End of promise
	}

	function handleError(errorType,message){
		var error = {};
		error.failure_code =  errorType;
		error.failure_message = message;
		return error;
	}
	
	function processRecords(configData, authToken){
		return new Promise((resolve, reject) => {			
			async.each(event.Records, function (record) {	
				 var sequenceNumber = record.kinesis.sequenceNumber;
				 var encodedPayload = record.kinesis.data;
				 var payload;
				 return checkInterest(encodedPayload,sequenceNumber)
				.then(result => {
					payload = result.payload;
					if(result.interested_event){
						return processEvent(payload,configData, authToken);
					}else{
						handleProcessedEvents(sequenceNumber, payload);
					}
				})
				.then(result => {
					handleProcessedEvents(sequenceNumber, payload);
					return resolve();
				})
				.catch(err => {
					handleFailedEvents(sequenceNumber, err.failure_message, payload, err.failure_code);
					return reject(err);
				});
			});//End of for loop	
			
		}); //End of promise		
	}
		
	function checkInterest(encodedPayload,sequenceNumber) {
		return new Promise((resolve, reject) => {			
			var payload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
			if (payload.Item.EVENT_TYPE && payload.Item.EVENT_TYPE.S) {
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
		}); //End of promise
	}
	
	function processEvent(payload,configData, authToken){
		return new Promise((resolve, reject) => {
			if (!payload.EVENT_NAME.S  || !payload.EVENT_STATUS.S ) {
				logger.error("validation error. Either event name or event status is not properly defined.");
				var err = handleError(failureCodes.PR_ERROR_1.code,"Validation error while processing event for service");
				return reject(err);
			}
						
			logger.info("payload : " +JSON.stringify(payload));
			var svcContext = JSON.parse(payload.SERVICE_CONTEXT.S);
			var serviceContext = getServiceContext(svcContext);
			serviceContext.service = payload.SERVICE_NAME.S
			serviceContext.created_by = payload.USERNAME.S
			serviceContext.service_id = payload.SERVICE_ID.S
			
			var statusResponse = getUpdateServiceStatus(payload) ;
			if(statusResponse.interested_event){
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
					"ENDPOINTS": serviceContext.endpoint,
					"STATUS": statusResponse.status,
					"METADATA": serviceContext.metadata
				};
				crud.update(inputs, function (err, results) {
					if (err) {
						logger.error("updateService- crud update" + JSON.stringify(err));
						var error = handleError(failureCodes.PR_ERROR_2.code, err.error);
						return reject(error);
					} else {
						logger.info("updated service "  + serviceContext.service + " in service catalog.");
						return resolve({"message": "updated service "  + serviceContext.service + " in service catalog."});
					}
				});
			}else{
				return resolve({"message" : "Not an interesting event to process"});
			}
		}); //End of promise
	}
	
	function getUpdateServiceStatus(payload){
		var statusResponse = {};
		if (payload.EVENT_TYPE.S === "SERVICE_CREATION") {
			if(payload.EVENT_NAME.S === configData.SERVICE_CREATION_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED"){
				statusResponse = {'status' : "creation_completed" , 'interested_event' : true };
			} else if(payload.EVENT_STATUS.S === "FAILED"){
				statusResponse = {'status' : "creation_failed" , 'interested_event' : true };
			}										
		} else if (payload.EVENT_TYPE.S === "SERVICE_DELETION") {
			if (payload.EVENT_NAME.S === configData.SERVICE_DELETION_EVENT_START && payload.EVENT_STATUS.S === "STARTED") {
				statusResponse = {'status' : "deletion_started" , 'interested_event' : true };
			} else if (payload.EVENT_NAME.S === configData.SERVICE_DELETION_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
				statusResponse = {'status' : "deletion_completed" , 'interested_event' : true };
			} else if(payload.EVENT_STATUS.S === "FAILED"){
				statusResponse = {'status' : "deletion_failed" , 'interested_event' : true };
			}
		} else if (payload.EVENT_TYPE.S === "SERVICE_DEPLOYMENT") {
			if (payload.EVENT_NAME.S === configData.SERVICE_DEPLOYMENT_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
				statusResponse = {'status' : "active" , 'interested_event' : true };
			}
		}else{
			statusResponse = {'interested_event' : false };
		}
		
		return statusResponse;
	}
	
	function getServiceContext(svcContext){
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
			
	
	
	function handleFailedEvents(id, failure_message, payload, failure_code) {
		failedEvents.push({
			"sequence_id" : id,
			"event": payload,
			"failure_code" : failure_code,
			"failure_message": failure_message
		});
	}

	function handleProcessedEvents(id, payload) {
		processedEvents.push({
			"sequence_id": id,
			"event": payload
		});
	}
};