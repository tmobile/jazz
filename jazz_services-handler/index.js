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
	.then((result) => validateAuthToken(result))
	.then((authToken) => processRecord(configData, authToken))		
	.then(function(result){
		return cb(null, {
			"processed_events": processedEvents.length,
			"total_events":event.Records.length
		});
	})
	.catch(function(err){
		return cb(JSON.stringify(err));
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
			if (result.statusCode === 200 && typeof result.body !== undefined && typeof result.body.data !== undefined) {
				resolve(result.body.data.token);
			}else{
			   var err = new Error("Unauthorized " + result.statusCode);
				err.error = result.error;
				return reject(err);
			}
		}); //End of promise
	}

	function handleError(errorType,message){
		var err = new Error();
		err.error = {};
		err.error.errorType =  errorType;
		err.error.message = message;
		return err;
	}
	
	function processRecord(configData, authToken){		
		logger.error('event.Records.length: '+ event.Records.length);
		return new Promise((resolve, reject) => {			
			for (var i=0; i< event.Records.length; i++){
				var record = event.Records[i];
				var sequenceNumber = record.kinesis.sequenceNumber;
				var encodedPayload = record.kinesis.data;
				checkInterest(encodedPayload,sequenceNumber)
				.then(function(result) {
					if(result.interested_event){
						processEvent(result.payload,configData, authToken);
						processedEvents.push({
							"sequence_id": sequenceNumber,
							"event": result.payload,
							"failure_code" : null,
							"failure_message": null
						});
					}else{
						processedEvents.push({
							"sequence_id": sequenceNumber,
							"event": result.payload,
							"failure_code" : null,
							"failure_message": null
						});
					}					
				})				
			}//End of for loop			
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
				var err = handleError("NotFound","Not an interesting event");
				reject(err);
			}
		}); //End of promise
	}
	
	function processEvent(payload,configData, authToken){
		logger.error('processEvent: ');
		return new Promise((resolve, reject) => {
			var svcContext = JSON.parse(payload.SERVICE_CONTEXT.S);
			var serviceContext = getServiceContext(svcContext);
			if(!payload.SERVICE_NAME){
				var err = handleError("NotFound","Service name required.");
				reject(err);
			}
			serviceContext.service = payload.SERVICE_NAME.S
			serviceContext.created_by = payload.USERNAME.S
			if (!payload.EVENT_NAME.S  || !payload.EVENT_STATUS.S ) {
				logger.error("validation error. Either event name or event status is not properly defined.");
				var err = handleError("NotFound","Either event name or event status is not properly defined.");
				reject(err);
			}
			if (payload.EVENT_TYPE.S === "SERVICE_CREATION") {
				logger.error('SERVICE_CREATION: ');
				if (payload.EVENT_NAME.S === configData.SERVICE_CREATION_EVENT_START && payload.EVENT_STATUS.S === "COMPLETED") {
					resolve(createService(serviceContext,configData, authToken));
				} else if(payload.EVENT_NAME.S === configData.SERVICE_CREATION_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED"){
					resolve(updateService(serviceContext,configData, authToken,"creation_completed"));
				} else if(payload.EVENT_STATUS.S === "FAILED"){
					resolve(updateService(serviceContext,configData, authToken,"creation_failed"));
				}										
			} else if (payload.EVENT_TYPE.S === "SERVICE_DELETION") {
				logger.error('SERVICE_DELETION: ');
				if (payload.EVENT_NAME.S === configData.SERVICE_DELETION_EVENT_START && payload.EVENT_STATUS.S === "STARTED") {
					resolve(updateService(serviceContext,configData, authToken,"deletion_started"));
				} else if (payload.EVENT_NAME.S === configData.SERVICE_DELETION_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
					resolve(updateService(serviceContext,configData, authToken,"deletion_completed"));
				} else if(payload.EVENT_STATUS.S === "FAILED"){
					resolve(updateService(serviceContext,configData, authToken,"deletion_failed"));
				}
			} else if (payload.EVENT_TYPE.S === "SERVICE_DEPLOYMENT") {
				logger.error('SERVICE_DEPLOYMENT: ');
				if (payload.EVENT_NAME.S === configData.SERVICE_DEPLOYMENT_EVENT_END && payload.EVENT_STATUS.S === "COMPLETED") {
					resolve(updateService(serviceContext,configData, authToken,"active"));
				}
			}
		}); //End of promise
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
	
	function createService(serviceContext,configData, authToken){
		logger.error('createService: ');
		return new Promise((resolve, reject) => {
			var inputs = {
				"TOKEN": authToken,
				"SERVICE_API_URL": configData.SERVICE_API_URL,
				"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
				"SERVICE_NAME": serviceContext.service,
				"DOMAIN": serviceContext.domain,
				"DESCRIPTION": serviceContext.description,
				"TYPE": serviceContext.type,
				"RUNTIME": serviceContext.runtime,
				"REGION": serviceContext.region,
				"REPOSITORY": serviceContext.repository,
				"USERNAME": serviceContext.created_by,
				"EMAIL": serviceContext.email,
				"SLACKCHANNEL": serviceContext.slackChannel,
				"TAGS": serviceContext.tags,
				"ENDPOINTS": serviceContext.endpoint,
				"STATUS": "creation_started",
				"METADATA": serviceContext.metadata
			};

			crud.create(inputs, function (err, results) {
				if (err) {
					return reject(err);					
				} else {
					resolve({"message": "created a new service in service catalog."});
				}
			});
		});//End of promise
	}
	
	function getService(serviceContext,configData, authToken){
		logger.error('getService: ');
		return new Promise((resolve, reject) => {
			var inputs = {
				"TOKEN": authToken,
				"SERVICE_API_URL": configData.SERVICE_API_URL,
				"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
				"DOMAIN": serviceContext.domain,
				"SERVICE_NAME": serviceContext.service
			};
			crud.get(inputs, function (err, results) {
				logger.error('getService crud get: ' + JSON.stringify(results));
				logger.error('getService crud get: err' + JSON.stringify(err));
				if (err) {
					reject(err);
				} else {
					resolve(results);
				}
			});
		});//End of promise
	}
	
	function updateService(serviceContext,configData, authToken,status){
		logger.error('updateService: ');
		return new Promise((resolve, reject) => {
			getService(serviceContext,configData, authToken)
			.then(function(result) {				
				var inputs = {
					"TOKEN": authToken,
					"SERVICE_API_URL": configData.SERVICE_API_URL,
					"SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
					"ID": result.id,
					"DESCRIPTION": serviceContext.description,
					"REPOSITORY": serviceContext.repository,
					"EMAIL": serviceContext.email,
					"SLACKCHANNEL": serviceContext.slackChannel,
					"TAGS": serviceContext.tags,
					"ENDPOINTS": serviceContext.endpoint,
					"STATUS": status,
					"METADATA": serviceContext.metadata
				};

				crud.update(inputs, function (err, results) {
					logger.error('updateService crud update: ' + JSON.stringify(results));
					if (err) {
						reject(err);
					} else {
						logger.info("updated service "  + serviceContext.service + " in service catalog.");
						resolve({"message": "updated service "  + serviceContext.service + " in service catalog."});
					}
				});				
			})
			.then(function(result){
				resolve(result) 
			})
			.catch(function(err){
				reject(err);
			});				
				
		});//End of promise
	}
};