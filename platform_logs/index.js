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
API to get the application logs
@author: 
@version: 1.0
 **/

'use strict';
const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const secretHandlerModule = require("./components/secret-handler.js"); //Import the secret-handler module.
const request = require('request');
const formats = require('./utils.js');
var utils = formats('apis');

module.exports.handler = (event, context, cb) => {

	//Initializations
	var errorHandler = errorHandlerModule();
	var config = configObj(event);
	var secretHandler = secretHandlerModule();
	logger.init(event, context);
  
	try {
		//Your POST method should be handled here
		if (event !== undefined && event.method !== undefined && event.method === 'POST') {
		  
		  	// if (!event.principalId) {
        	// 	return cb(JSON.stringify(errorHandler.throwUnauthorizedError("You aren't authorized to access this service. Please login with your credentials.")));
    		// }
    		
			if(event === undefined && event.body === undefined  ){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("Service inputs not defined!")));
			} 
			if(event.body.service === undefined){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter service name.")));
			}			
			if(event.body.domain === undefined){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter domain.")));
			} 			
			if(event.body.environment === undefined){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter environment.")));
			} 
			if(event.body.category === undefined){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter category.")));
			}
			var environments = config.ENV,
				hasEnumEnv = false;			
			for (var idx in environments ){
				if (event.body.environment.toLowerCase() == environments[idx]){
					hasEnumEnv = true;
				}
			}
			
			if(!hasEnumEnv){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("Only following values can be allowed for Envirnoment - " + environments.join(", "))));
			}

			var service = event.body.service,
				domain = event.body.domain,
				env = event.body.environment.toLowerCase(),
				categoryType = event.body.category,
				logType = event.body.type,
				page = (event.body.offset !== undefined && event.body.offset !== '') ? event.body.offset : 0,
				startTime = (event.body.start_time !== undefined && event.body.start_time !== '') ? event.body.start_time : utils.setStartDate(config.DEFAULT_TIME_IN_DAYS),
				endTime = (event.body.end_time !== undefined && event.body.end_time !== '') ? event.body.end_time : new Date(),
				size = (event.body.size !== undefined && event.body.size !== '') ? event.body.size : config.DEFALT_SIZE,
				querys = [];
			
			//Appending service name with Domain, Env and Jazz_type
			service = domain + "-" + service + "-" + env;			
			if(config.JAZZ_TYPE !== undefined && config.JAZZ_TYPE !== null){
				service = config.JAZZ_TYPE + service
			}
			logger.info("Service name to fetch logs :" + service);
			
			querys.push(utils.setQuery("servicename", service));		
			//querys.push(utils.setQuery("domain", domain));
			querys.push(utils.setQuery("environment", env));
			
			//Query to filter Control messages
			querys.push(utils.setQuery("!message", "START*"));
			querys.push(utils.setQuery("!message", "END*"));
			querys.push(utils.setQuery("!message", "REPORT*"));
			
			if(logType){
				var loggerType = config.TYPE, 
					hasEnumLogtype = false;
				for (var logId in loggerType ){
					if (logType.toLowerCase() == loggerType[logId].toLowerCase()){
						hasEnumLogtype = true;
					}
				}
				if(hasEnumLogtype){
					querys.push(utils.setQuery("log_level", logType));
				} else {
					logger.info("Only following values can be allowed for Logger type - " + loggerType.join(", "));
				}
			} 
			
			logger.info("QueryObj: "+ JSON.stringify(querys));
			
			var categoryList = config.CATEGORY, 
				hasEnumValue = false;
			for (var id in categoryList ){
				if (categoryType.toLowerCase() == categoryList[id].toLowerCase()){
					hasEnumValue = true;
				}
			}
			var servCategory = [];
			
			if(!hasEnumValue){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("Only following values can be allowed for service category - " + categoryList.join(", "))));
			} else if (categoryType.toLowerCase() == 'api'){
				servCategory = ["apilogs","applicationlogs"];
			} else if (categoryType.toLowerCase() == 'function'){
				servCategory = ["applicationlogs"];
			} 
			
			var req = utils.requestLoad;
			req.url = config.BASE_URL + "/_plugin/kibana/elasticsearch/_msearch";
			req.body = setRequestBody(servCategory, querys, startTime, endTime, size, page);
			
			request(req, function(err, res, body) {
				if (err) {
					logger.error("Error occured : " + JSON.stringify(err));
					cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
				} else {
					// Success response
					if(res.statusCode == 200){
						var responsebody = res.body,
							responsebodyToJSON = JSON.parse(responsebody),
							count = responsebodyToJSON.responses[0].hits.total,
							hits = responsebodyToJSON.responses[0].hits.hits,
							logs = [];
												
						for (var idx in hits){
							var log = {};
							log.request_id = hits[idx]._source.request_id;
							log.source = hits[idx]._index;
							log.timestamp = hits[idx]._source.timestamp;
							log.message = hits[idx]._source.message;
							log.type = hits[idx]._source.log_level;
							logs.push(log);
						}
						
						utils.responseModel.count = count;
						utils.responseModel.logs = logs;						
						
						// TODO: Remove as this is hack for UI fix
						var ret = {"data" : utils.responseModel};

						logger.info ('Output :' + JSON.stringify(utils.responseModel));
						cb(null, responseObj(ret, event.body));
						
					} else {
						var error_message = 'Unknown error occured';
						var bodyToJSON = JSON.parse(res.body);
						if(typeof bodyToJSON.errors !== 'undefined'){
							error_message = bodyToJSON.errors[0].message;
						} 
						logger.error("Exception occured :" + error_message);
						cb(JSON.stringify(errorHandler.throwInternalServerError("Error while processing the request :" + error_message)));
					}
				}
			});
		}
	} catch (e) {
		//Sample Error response for internal server error
		cb(JSON.stringify(errorHandler.throwInternalServerError("Exception occured while processing the request : "+ JSON.stringify(e))));
	}
	
	function setRequestBody(category, querys, startTime, endTime, size, page){
		var index = {
			"index": category,
			"ignore_unavailable": true 
			};
		
		var params = {
			"size": size,
			"from" : page,
			"sort":[{
				"request_id":{
					"order":"desc"
				}
			},{
				"timestamp":{
					"order":"desc"
				}
			}],
			"query":{
				"bool":{
					"must":[querys, { 
						"range": { 
							"timestamp": { 
								"gte": utils.toTimestamp(startTime), 
								"lte": utils.toTimestamp(endTime), 
								"format": "epoch_millis"  
							}  
						}  
					}],
					"must_not":[{
						"match":{
							"application_logs_id":{
								"query":"_incomplete_req",
								"type":"phrase"
							}
						}
					}]
				}
			},
			"_source":{
				"excludes":[]
			},
			"stored_fields":["*"],
			"script_fields":{}
		};		
		var reqBody = JSON.stringify(index)+"\n"+JSON.stringify(params)+"\n";
		logger.info ("Request Payload : " + JSON.stringify(reqBody));
		return reqBody;
	}
};
