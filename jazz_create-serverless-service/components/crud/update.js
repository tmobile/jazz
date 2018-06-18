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

module.exports = (service_id, inputs, callback) => {

	var jsonBody = getServiceData(inputs.body);
	var svcPayload = {
		uri: inputs.SERVICE_API_URL + inputs.SERVICE_API_RESOURCE + "/" + service_id,
		method: 'PUT',
		headers: { 'Authorization': inputs.TOKEN },
		json: jsonBody,
		rejectUnauthorized: false
	};

	request(svcPayload, function (error, response, body) {
		if ((response.statusCode === 200) && (body && body.data)) {
			return callback(null, body);
		} else {
			return callback({
				"error": "Error creating service " + inputs.DOMAIN + "." + inputs.SERVICE_NAME + " in service catalog",
				"details": response.body.message
			});
		}
	});

	function getServiceData(inputs) {
		var jsonBody = {};
		if (inputs.DESCRIPTION) { jsonBody.description = inputs.DESCRIPTION }
		if (inputs.REGION) {
			if (typeof inputs.REGION === 'array' || inputs.REGION instanceof Array) {
				jsonBody.region = inputs.REGION;
			} else if (typeof inputs.REGION === 'string' || inputs.REGION instanceof String) {
				var region = [];
				if (inputs.REGION.indexOf(',') !== -1) {
					region = inputs.REGION.split(',');
				} else {
					region.push(inputs.REGION);
				}
				jsonBody.region = region;
			}
		}
		if (inputs.REPOSITORY) { jsonBody.repository = inputs.REPOSITORY }
		if (inputs.EMAIL) { jsonBody.email = inputs.EMAIL }
		if (inputs.SLACKCHANNEL) { jsonBody.slack_channel = inputs.SLACKCHANNEL }
		if (inputs.TAGS) { jsonBody.tags = inputs.TAGS }
		if (inputs.ENDPOINTS) { jsonBody.endpoints = inputs.ENDPOINTS }
		if (inputs.METADATA) { jsonBody.metadata = inputs.METADATA }
		if (inputs.STATUS) { jsonBody.status = inputs.STATUS }

		return jsonBody;
	}
};
