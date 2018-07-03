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

var SlackChannelInfoErrorHandler = function (error) {
  return {
    name: "SlackChannelInfoError",
    error: error
  };
}

var SlackChannelNotificationErrorHandler = function (error) {
  return {
    name: "SlackChannelNotificationError",
    error: error
  };
}

var ServiceGetErrorHandler = function (error) {
  return {
    name: "ServiceGetError",
    error: error
  };
}

module.exports = () => {
  return {
    SlackChannelInfoErrorHandler: SlackChannelInfoErrorHandler,
    SlackChannelNotificationErrorHandler: SlackChannelNotificationErrorHandler,
    ServiceGetErrorHandler: ServiceGetErrorHandler
  };
};
