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
const deasync = require('deasync');

module.exports = () => {
	var secretObj = {

		decryptSecret: function (secret) {

			var dec_payload = secret;
			var done = false;
			var data;

			var dec_options = {
				uri: "https://cloud-api.corporate.t-mobile.com/api/platform/decrypt-secret",
				method: 'POST',
				json: dec_payload,
				rejectUnauthorized: false
			};

			if (dec_payload.secret_id === undefined || dec_payload.secret_id === "") {
				return {
					"error": true,
					"message": "Secret_id not provided"
				};
			}
			if (dec_payload.cipher === undefined || dec_payload.cipher === "") {
				return {
					"error": true,
					"message": "cipher not provided"
				};
			}

			request(dec_options, function (error, response, body) {
				if (error) {
					data = {
						"error": true,
						"message": JSON.stringify(error)
					};
					done = true;
				} else {
					if (response.statusCode === 200 && body.data.plain_text !== undefined && body.data.plain_text !== "") {
						data = {

							"message": body.data.plain_text
						};
						done = true;
					} else {
						data = {
							"error": true,
							"message": body.message
						};
						done = true;
					}
				}

			});

			require('deasync').loopWhile(function () {
				return !done;
			});
			return data;

		}
	};
	return secretObj;

};
