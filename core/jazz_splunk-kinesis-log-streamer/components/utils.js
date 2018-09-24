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
	Helper functions for Splunk cloudwatch log streamer
	@module: utils.js
	@description: Helper functions for using Regex patterns, etc.
	@author: 
	@version: 1.0
**/

const logger = require("../components/logger.js");
const global_config = require("../config/global-config.json");
const truncate = require('unicode-byte-truncate');

// Helper functions
var getInfo = function (messages, patternStr) {
	let pattern = new RegExp(patternStr);
	let result = "";
	if (messages) {
		for (let i = 0, len = messages.length; i < len; i++) {
			let _tmp = pattern.exec(messages[i].message);
			if (_tmp && _tmp[1]) {
				logger.debug("found match..:" + _tmp[1]);
				result = _tmp[1];
				break;
			}
		}
	}
	return result;
}

var getSubInfo = function (message, patternStr, index) {
	let pattern = new RegExp(patternStr);
	let result = "";
	if (message) {
		let _tmp = pattern.exec(message);
		if (_tmp && _tmp[index]) {
			logger.debug("found match..:" + _tmp[index]);
			result = _tmp[index];
		}
	}
	return result;
}

var getCommonData = function (payload) {
	return new Promise((resolve, reject) => {
		let data = {};
		data.metadata = {};
		data.request_id = getInfo(payload.logEvents, global_config.PATTERNS.Lambda_request_id);
		if (data.request_id) {
			data.provider = "aws_lambda";
			let domainAndservice;
			data.environment = getSubInfo(payload.logGroup, global_config.PATTERNS.Lambda_environment, 2);
			if (data.environment === "dev") {
				let dev_environment = getSubInfo(payload.logGroup, global_config.PATTERNS.Lambda_environment_dev, 2);
				domainAndservice = getSubInfo(payload.logGroup, global_config.PATTERNS.Lambda_environment_dev, 1);
				data.environment = dev_environment;
			} else {
				domainAndservice = getSubInfo(payload.logGroup, global_config.PATTERNS.Lambda_domain_service, 1);
			}

			let _namespace = domainAndservice.substring(0, domainAndservice.indexOf("_"));
			if (_namespace) {
				data.namespace = _namespace;
				data.service = domainAndservice.substring(_namespace.length + 1);
			} else {
				data.namespace = "";
				data.service = domainAndservice;
			}
			data.metadata.platform_log_group = payload.logGroup;
			data.metadata.platform_log_stream = payload.logStream;
			resolve(data);
		} else {
			resolve(data);
		}
	});
}

var transformApiLogs = function (payload) {
	return new Promise((resolve, reject) => {
		let data = {},
			bulkRequestBody = '';
		data.metadata = {};
		data.event_timestamp = new Date();
		data.provider = "aws_apigateway";
		data.metadata.platform_log_group = payload.logGroup;
		data.metadata.platform_log_stream = payload.logStream;
		data.environment = getSubInfo(payload.logGroup, global_config.PATTERNS.environment, 2);
		data.request_id = getInfo(payload.logEvents, global_config.PATTERNS.request_id);
		data.metadata.method = getInfo(payload.logEvents, global_config.PATTERNS.method);
		if (!data.metadata.method) {
			// Cloudwatch do not have method info for get!
			data.metadata.method = "GET";
		}

		let apiDomainAndService = getInfo(payload.logEvents, global_config.PATTERNS.domain_service);
		let _apiDomain = apiDomainAndService.substring(0, apiDomainAndService.indexOf("/"));

		if (_apiDomain) {
			data.namespace = _apiDomain;
			data.service = apiDomainAndService.substring(_apiDomain.length + 1);
		} else {
			data.namespace = "";
			data.service = apiDomainAndService;
		}

		data.metadata.path = getInfo(payload.logEvents, global_config.PATTERNS.path);
		data.metadata.application_logs_id = getInfo(payload.logEvents, global_config.PATTERNS.lambda_ref_id);
		if (!data.metadata.application_logs_id) {
			data.metadata.application_logs_id = "_incomplete_req";
		}
		let method_req_headers = getInfo(payload.logEvents, global_config.PATTERNS.method_req_headers);
		data.metadata.origin = getSubInfo(method_req_headers, global_config.PATTERNS.origin, 1);
		data.metadata.host = getSubInfo(method_req_headers, global_config.PATTERNS.host, 1);
		if (!data.metadata.host) {
			data.metadata.host = "_incomplete_req";
		}
		data.metadata.user_agent = getSubInfo(method_req_headers, global_config.PATTERNS.user_agent, 1);
		data.metadata.x_forwarded_port = getSubInfo(method_req_headers, global_config.PATTERNS.x_forwarded_port, 1);
		data.metadata.x_forwarded_for = getSubInfo(method_req_headers, global_config.PATTERNS.x_forwarded_for, 1);
		data.metadata.x_amzn_trace_id = getSubInfo(method_req_headers, global_config.PATTERNS.x_amzn_trace_id, 1);
		data.metadata.content_type = getSubInfo(method_req_headers, global_config.PATTERNS.content_type, 1);
		data.metadata.cache_control = getSubInfo(method_req_headers, global_config.PATTERNS.cache_control, 1);
		data.log_level = "INFO"; // Default to INFO for apilogs
		data.metadata.status = getInfo(payload.logEvents, global_config.PATTERNS.status);

		if (data.request_id && data.service) {
			bulkRequestBody = {
				sourcetype: "apilogs",
				event: data
			};
			logger.debug("Splunk payload for API Gateway LogEvent:" + JSON.stringify(bulkRequestBody));
			resolve(bulkRequestBody);
		} else {
			logger.error("Invalid api logs event..: " + JSON.stringify(payload));
			reject({
				result: "inputError",
				message: "Invalid api logs event."
			});
		}
	});
}

var transformLambdaLogs = function (logEvent, commonData) {
	return new Promise((resolve, reject) => {
		if (Object.keys(commonData).length && commonData.service) {
			try {
				let data = {};
				data.metadata = {};
				Object.keys(commonData).forEach(key => {
					data[key] = commonData[key];
				});
				data.request_id = getSubInfo(logEvent.message, global_config.PATTERNS.guid_regex, 0);
				data.event_timestamp = new Date(1 * logEvent.timestamp).toISOString();
				let message = logEvent.message;
				let messageLength = Buffer.byteLength(message, 'utf8');
				if (messageLength > 32766) { //since 32766(32KB) is the default message size
					let truncatedMessage = truncate(message, 32740); // message size + ...[TRUNCATED]
					data.message = truncatedMessage + "  ...[TRUNCATED]";
				} else {
					data.message = message;
				}

				data.log_level = getSubInfo(logEvent.message, global_config.PATTERNS.log_level, 0);
				if (!data.log_level) {
					data.log_level = global_config.DEFAULT_LOG_LEVEL;
				}

				if (!(data.message.startsWith("REPORT") || data.message.startsWith("START") || data.message.startsWith("END"))) {
					let timestmp = getSubInfo(data.message, global_config.PATTERNS.timestamp_pattern, 0);
					data.message = data.message.replace(timestmp, "");
					let guid = getSubInfo(data.message, global_config.PATTERNS.guid_regex, 0);
					data.message = data.message.replace(guid, "");
					data.message = data.message.replace(data.log_level, "");
				}

				data.message = data.message.trim();
				let bulkRequestBody = {
					sourcetype: "applicationlogs",
					event: data
				};
				logger.debug("Splunk payload for Lambda LogEvent:" + JSON.stringify(bulkRequestBody));
				resolve(bulkRequestBody);
			} catch(e) {
				logger.error(error);
			}
			
		} else {
			logger.error("Invalid lambda logs event.");
			reject({
				result: "inputError",
				message: "Invalid lambda logs event."
			});
		}
	});
}

module.exports = {
	getCommonData,
	transformApiLogs,
	transformLambdaLogs
};