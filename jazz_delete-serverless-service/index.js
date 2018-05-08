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

'use strict';
const request = require('request');
const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");
const formats = require('./jenkins-json.js');
const uuid = require('uuid');
var payloads = formats('apis');

/**
	Delete Serverless Service
	@author: 
	@version: 1.0
 **/

module.exports.handler = (event, context, cb) => {

	var errorHandler = errorHandlerModule();
	var config = configObj(event);
	logger.init(event, context);

	if(!config.DELETE_SERVICE_JOB_URL) {
		logger.error("Service configuration missing JOB URL" + JSON.stringify(event));
		return cb(JSON.stringify(errorHandler.throwInternalServerError("Service isn't configured properly, please reach out to Admins for help!")));
	}

	if (!event.body) {
		logger.error("Event body is empty");
		return cb(JSON.stringify(errorHandler.throwInputValidationError("Missing parameters")));
	} else if(!event.body.service_name) {
		logger.error("Service name is missing in the input");
		return cb(JSON.stringify(errorHandler.throwInputValidationError("Service name is missing in the input")));
	} else if(!event.body.domain) {
		logger.error("Domain key is missing in the input");
		return cb(JSON.stringify(errorHandler.throwInputValidationError("Domain is missing in the input")));
	}else if(!event.body.id) {
		logger.error("Service id is missing in the input");
		return cb(JSON.stringify(errorHandler.throwInputValidationError("Service id is missing in the input")));
	}

	var version = "LATEST";
	if(event.body.version) { // version is optional field
		version = event.body.version;
	}

    try {

		var base_auth_token = "Basic " + new Buffer(config.SVC_USER + ":" + config.SVC_PASWD).toString("base64");

		var req = payloads.requestLoad;
		req.url = config.DELETE_SERVICE_JOB_URL + "?token=" + config.JOB_TOKEN;
		req.headers.Authorization = base_auth_token;

		var params = payloads.buildParams;
		params.service_name = event.body.service_name;
		params.domain = event.body.domain;
		params.version = version;
		params.db_service_id = event.body.id;

		var tracking_id = uuid.v4();
		params.tracking_id = tracking_id;

		req.qs = params;
		request(req, function (error, response, body) {
			if (error) {
				logger.error("request errored..: "+JSON.stringify(error));
				return cb(JSON.stringify(errorHandler.throwInternalServerError("Internal error occurred")));
			} else {
				if(response.statusCode === 200 || response.statusCode === 201) {
					logger.info("success..: "+JSON.stringify(response));
					payloads.responseLoad.request_id = tracking_id;
					return cb(null, responseObj(payloads.responseLoad, event.body));
				} else if(response.statusCode === 401){
					logger.error("Failed..: "+JSON.stringify(response));
					return cb(JSON.stringify(errorHandler.throwInternalServerError("Not authorized")));
				}else {
					logger.error("Failed..: "+JSON.stringify(response));
					return cb(JSON.stringify(errorHandler.throwInternalServerError("Internal error occurred")));
				}
			}
		});

	}catch(ex) {
        logger.error('Error : ', ex.message);
        cb(JSON.stringify(errorHandler.throwInternalServerError("Internal error occurred")));
    }

};
