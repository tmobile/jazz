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
    Helper functions for Events
    @module: utils.js
    @author:
    @version: 1.0
**/

function checkForInterestedEvents(encodedPayload, sequenceNumber, configData) {
	return new Promise((resolve, reject) => {
		var kinesisPayload = JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
		if (kinesisPayload.Item.EVENT_TYPE && kinesisPayload.Item.EVENT_TYPE.S) {
			if (_.includes(configData.EVENTS.event_type, kinesisPayload.Item.EVENT_TYPE.S) &&
				_.includes(configData.EVENTS.event_name, kinesisPayload.Item.EVENT_NAME.S)) {
				logger.info("found " + kinesisPayload.Item.EVENT_TYPE.S + " event with sequence number: " + sequenceNumber);
				return resolve({
					"interested_event": true,
					"payload": kinesisPayload.Item
				});
			} else {
				logger.error("Not an interested event or event type");
				return resolve({
					"interested_event": false,
					"payload": kinesisPayload.Item
				});
			}
		}
	});
};

const exporatble  = {
  checkForInterestedEvents
};
module.exports =  exporatble;

