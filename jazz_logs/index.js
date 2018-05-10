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
const _ = require("lodash");
const request = require('request');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");
const formats = require('./utils.js');
var utils = formats('apis');

module.exports.handler = (event, context, cb) => {

	//Initializations
	var errorHandler = errorHandlerModule();
	var config = configObj(event);
	logger.init(event, context);

	try {

		if (event && event.method && event.method === 'POST') {

			if(!event.body){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("Service inputs not defined!")));
			}

			if(!event.body.service){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter service name.")));
			}
			if(!event.body.domain){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter domain.")));
			}
			if(!event.body.environment){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter environment.")));
			}
			if(!event.body.category){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter category.")));
			}

			if (!event.body.type || !_.includes(config.VALID_LOGTYPES, event.body.type.toLowerCase())){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("Only following values are allowed for logger type - " + config.VALID_LOGTYPES.join(", "))));
			}

			if (!_.includes(config.VALID_CATEGORIES, event.body.category.toLowerCase())){
				return cb(JSON.stringify(errorHandler.throwInputValidationError("Only following values are allowed for category - " + config.VALID_CATEGORIES.join(", "))));
			}

			var service = event.body.service,
				domain = event.body.domain,
				env = event.body.environment.toLowerCase(),
				categoryType = event.body.category.toLowerCase(),
				logType = event.body.type.toUpperCase(),
				page = event.body.offset ? event.body.offset : 0,
				startTime = event.body.start_time ? event.body.start_time : utils.setStartDate(config.DEFAULT_TIME_IN_DAYS),
				endTime = event.body.end_time ? event.body.end_time : new Date(),
				size = event.body.size ? event.body.size : config.DEFAULT_SIZE,
				querys = [];

			//Appending service name with Domain, Env and Jazz_type
			service = domain + "-" + service
			if(config.ENV_PREFIX){
				service = config.ENV_PREFIX + "-" + service
			}

			logger.info("Service name to fetch logs :" + service);

			querys.push(utils.setQuery("servicename", service));
			querys.push(utils.setQuery("environment", env));
			querys.push(utils.setQuery("log_level", logType));

			//Query to filter Control messages
			querys.push(utils.setQuery("!message", "START*"));
			querys.push(utils.setQuery("!message", "END*"));
			querys.push(utils.setQuery("!message", "REPORT*"));

			logger.info("QueryObj: "+ JSON.stringify(querys));

			var servCategory = [];

			if (categoryType.toLowerCase() == 'api'){
				servCategory = ["apilogs","applicationlogs"];
			} else if (categoryType.toLowerCase() == 'function'){
				servCategory = ["applicationlogs"];
			}

			var req = utils.requestLoad;
			req.url = config.BASE_URL + "/_plugin/kibana/elasticsearch/_msearch";
			req.body = setRequestBody(servCategory, env, querys, startTime, endTime, size, page);

			request(req, function(err, res, body) {
				if (err) {
					logger.error("Error occured : " + JSON.stringify(err));
					return cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
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
						return cb(null, responseObj(ret, event.body));

					} else {
						var error_message = 'Unknown error occured';
						var bodyToJSON = JSON.parse(res.body);
						if(typeof bodyToJSON.errors !== 'undefined'){
							error_message = bodyToJSON.errors[0].message;
						}
						logger.error("Exception occured :" + error_message);
						return cb(JSON.stringify(errorHandler.throwInternalServerError("Error while processing the request :" + error_message)));
					}
				}
			});
		} else {
			return cb(JSON.stringify(errorHandler.throwInputValidationError("Invalid request to process for logs API")));
		}
	} catch (e) {
		//Sample Error response for internal server error
		return cb(JSON.stringify(errorHandler.throwInternalServerError("Exception occured while processing the request : "+ JSON.stringify(e))));
	}

	function setRequestBody(category, type, querys, startTime, endTime, size, page){
		var index = {
			"index": category,
			"type": type,
			"ignore_unavailable": true
			};

		var params = {
			"size": size,
			"from" : page,
			"sort":[{
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
