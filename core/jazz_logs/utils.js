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


/* http request payload */
var request_payload = {
	url: "",
	headers: {
		"kbn-xsrf": "",
		"Content-Type": "application/json",
		'cache-control': 'no-cache'
	},
	method: "POST",
	body: {}
};

var to_timestamp = function (datetime) {
	var formattedDate = new Date(datetime);
	return Date.parse(formattedDate);
};

var set_startdate = function (days) {
	var currDate = new Date();
	var strtDate = new Date(currDate);
	strtDate = strtDate.setDate(currDate.getDate() - days);
	return strtDate;
};

var set_query = function (type, value) {
	var query = {
		"query_string": {
			"query": type + ":" + value
		}
	};
	return query;
};

var set_log_level_query = function (LOG_LEVEL_CONFIG, type, value) {
	var query = {
		"query_string": {
			"query": type + ":(" + value.toUpperCase()
		}
	};
	var requestedLogType = LOG_LEVEL_CONFIG.filter(configObject => configObject.Type === value);
	if (requestedLogType[0]) {
		LOG_LEVEL_CONFIG.map(function (configObject) {
			if (configObject.Level < parseInt(requestedLogType[0].Level)) {
				query.query_string.query = query.query_string.query + " OR " + configObject.Type.toUpperCase();
			}
		});
		query.query_string.query = query.query_string.query + ")"
	}
	return query;
};

var response_model = {
	"count": "",
	"logs": []
};

module.exports = (formats) => {
	return {
		"requestLoad": request_payload,
		"setStartDate": set_startdate,
		"setQuery": set_query,
		"setLogLevelQuery": set_log_level_query,
		"toTimestamp": to_timestamp,
		"responseModel": response_model
	};
};
