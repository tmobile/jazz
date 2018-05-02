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
	Get Environment-Catalog by ENVIRONMET_ID from dynamodb table
    @module: get.js
    @description: CRUD functions to update Events catalog
	@author: 
	@version: 1.0
**/
const utils = require("../utils.js")(); //Import the utils module.
const Uuid = require("uuid/v4");
const moment = require('moment');
const logger = require("../logger.js"); //Import the logging module.

module.exports = (eventHub, eventBody, onComplete) => {
	// Generate event Id
	var event_id = Uuid(),
	kinesis = utils.initKinesis(),// Initialize kinesis
	timestamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss:SSS'),
	map = {
		'event_name': 'EVENT_NAME',
		'event_handler': 'EVENT_HANDLER',
		'service_name': 'SERVICE_NAME',
		'event_status': 'EVENT_STATUS',
		'event_type': 'EVENT_TYPE',
		'username': 'USERNAME',
		'event_timestamp': 'EVENT_TIMESTAMP'
	},
	event_params = {
		Item: {
			"EVENT_ID": {
				S: event_id
			},
			"TIMESTAMP": {
				S: timestamp
			}
		}
	};

	Object.keys(eventBody).map((key) => {
		if (eventBody[key]) {
			if (key === "service_context") {
				event_params.Item.SERVICE_CONTEXT = {
					S: JSON.stringify(eventBody.service_context)
				};
			} else {
				if (event_params.Item[map[key]]) {
					event_params.Item[map[key]] = {
						S: eventBody[key]
					}
				} else {
					event_params.Item[key.toUpperCase()] = {
						S: eventBody[key]
					};
				}

			}
		} else {
			event_params.Item[key.toUpperCase()] = {
				NULL: true
			};
		}
	});

	var stream_params = {
		Data: JSON.stringify(event_params),
		PartitionKey: eventBody.event_name,
		StreamName: eventHub
	};
	kinesis.putRecord(stream_params, (err, data) => {
		if (err) {
			logger.error('kinesis error' + JSON.stringify(err));
			onComplete({
				"code": 500,
				"message": "Error storing event. " + err.message
			}, null);
		} else {
			var output = {
				"event_id": event_id
			};
			logger.info("event_id is: " + event_id);
			onComplete(null, output);
		}
	});
}