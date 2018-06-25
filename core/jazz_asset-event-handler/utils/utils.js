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

const format = require("string-template");

// function to get notification message from template.
var getNotificationMessage = function (event_name, event_status, service_name, error, notification_message) {
    var message;
    
    switch (event_status) {
        case "STARTED":
            message = format(notification_message.EVENT_NAME.STARTED, {
                service_name: service_name,
                event_name: event_name
            });
            break;
        case "FAILED":
            if (error) {
                message = format(notification_message.EVENT_NAME.FAILED_REASON, {
                    service_name: service_name,
                    event_name: event_name,
                    reason: error
                });
            } else {
                message = format(notification_message.EVENT_NAME.FAILED, {
                    service_name: service_name,
                    event_name: event_name
                });
            }
            break;
        case "COMPLETED":
            message = format(notification_message.EVENT_NAME.COMPLETED, {
                service_name: service_name,
                event_name: event_name
            });
            break;
    }

    return message;
};

module.exports = () => {
    return {
        getNotificationMessage: getNotificationMessage
    };
};
