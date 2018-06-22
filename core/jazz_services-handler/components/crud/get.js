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

const request = require('request');

module.exports = (inputs, callback) => {

	var svcPayload = {
		uri: inputs.SERVICE_API_URL + inputs.SERVICE_API_RESOURCE + "?domain=" + inputs.DOMAIN + "&service=" + inputs.SERVICE_NAME,
		method: 'GET',
		headers: {
			'Authorization': inputs.TOKEN
		},
		rejectUnauthorized: false
	};

	request(svcPayload, function (error, response, body) {
		if (response.statusCode === 200 && body) {
			var results = JSON.parse(body);
			if (results.data && results.data.services && results.data.services.length > 0) {
				return callback(null, results.data.services[0]);
			} else {
				return callback({
					"error": "Error finding service " + inputs.DOMAIN + "." + inputs.SERVICE_NAME + " in service catalog",
					"details": "Could not find service " + inputs.DOMAIN + "." + inputs.SERVICE_NAME + " in service catalog"
				});
			}

		} else {
			return callback({
				"error": "Error finding service " + inputs.DOMAIN + "." + inputs.SERVICE_NAME + " in service catalog",
				"details": response.body.message
			});
		}
	});

};
