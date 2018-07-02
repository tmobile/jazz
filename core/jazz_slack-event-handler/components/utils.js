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

function getNotificationMessage(serviceDetails, payload, configData) {
  var serviceContxt = JSON.parse(payload.SERVICE_CONTEXT.S);
  var params = {
    'service_name': serviceDetails.service,
    'domain_name': serviceDetails.domain,
    'environment_name': serviceContxt.environment,
    'event_type': payload.EVENT_TYPE.S,
    'event_name': (payload.EVENT_NAME.S).toLowerCase(),
    'build_status': payload.EVENT_STATUS.S,
    'event_status': payload.EVENT_STATUS.S,
    'repo_url': serviceContxt.repository,
    'overview_url': configData.SERVICE_LINK + serviceDetails.id,
    'jenkins_url': serviceContxt.provider_build_url,
    'endpoint_url': serviceContxt.endpoint_url,
    'notifications': configData.NOTIFICATION_MESSAGE,
    'error': serviceContxt.error
  };

  var slackNotification = {
    "pretext": "",
    "text": "",
    "color": "",
  };

  var pretext, text;
  if (params.service_name && params.domain_name && params.event_type) {
    if (params.event_name && params.event_status === 'STARTED') {
      slackNotification.color = configData.COLORS.GRAY;
      text = params.notifications.EVENT_NAME.STARTED;
    } else if (params.event_status === 'COMPLETED') {
      slackNotification.color = configData.COLORS.GREEN;
      text = params.notifications.EVENT_NAME.COMPLETED;
    } else if (params.event_status === 'FAILED') {
      text = params.notifications.EVENT_NAME.FAILED_REASON;
      slackNotification.color = configData.COLORS.RED;
      if (params.error) {
        text = params.notifications.EVENT_NAME.FAILED;
      }
    }

    switch (params.event_type) {
      case 'SERVICE_CREATION':
        pretext = params.notifications.EVENT_TYPE.SERVICE_CREATION;
        if (params.build_status === 'STARTED' && !params.event_name) {
          slackNotification.color = configData.COLORS.BLUE;
          text = params.notifications.EVENT_STARTED.SERVICE_CREATION;
        } else if (params.build_status === 'COMPLETED' && !params.event_name) {
          slackNotification.color = configData.COLORS.BLUE;
          text = params.notifications.EVENT_COMPLETED.SERVICE_CREATION;
          if (params.repo_url) {
            text = text + params.notifications.SCM_URL;
          }
          if (params.overview_url) {
            text = text + params.notifications.SERVICE_URL;
          }
        }
        break;

      case 'SERVICE_DEPLOYMENT':
        pretext = params.notifications.EVENT_TYPE.SERVICE_DEPLOYMENT;
        if (params.environment_name) {
          pretext = pretext + params.notifications.ENVIRONMENT;
        }
        if (params.build_status === 'STARTED' && !params.event_name) {
          slackNotification.color = configData.COLORS.BLUE;
          text = params.notifications.EVENT_STARTED.SERVICE_DEPLOYMENT;
        } else if (params.build_status === 'COMPLETED' && !params.event_name) {
          slackNotification.color = configData.COLORS.BLUE;
          text = params.notifications.EVENT_COMPLETED.SERVICE_DEPLOYMENT;
          if (params.endpoint_url) {
            text = text + params.notifications.ENDPOINT_URL;
          }
          if (params.overview_url) {
            text = text + params.notifications.SERVICE_URL;
          }
          if (params.repo_url) {
            text = text + params.notifications.SCM_URL;
          }
          if (params.jenkins_url) {
            text = text + params.notifications.JENKINS_URL;
          }
        }
        break;

      case 'SERVICE_DELETION':
        pretext = params.notifications.EVENT_TYPE.SERVICE_DELETION;
        if (params.environment_name) {
          pretext = pretext + params.notifications.ENVIRONMENT;
        }
        if (params.build_status === 'STARTED' && !params.event_name) {
          slackNotification.color = configData.COLORS.BLUE;
          text = params.notifications.EVENT_STARTED.SERVICE_DELETION;
        } else if (params.build_status === 'COMPLETED' && !params.event_name) {
          slackNotification.color = configData.COLORS.BLUE;
          text = params.notifications.EVENT_COMPLETED.SERVICE_DELETION;
        }
        break;
    }
  }
  pretext = format(pretext, params);
  text = format(text, params);
  slackNotification.pretext = "_" + pretext + "_";
  slackNotification.text = text;
  return slackNotification;
};

function formatSlackTemplate(pretext, text, color) {
  var attachment = {
    "fallback": "Required plain-text summary of the attachment.",
    "pretext": pretext,
    "text": text,
    "color": color,
    "mrkdwn_in": [
      "text",
      "pretext",
      "author_name"
    ]
  };
  return attachment;
};

module.exports = {
  getNotificationMessage,
  formatSlackTemplate
};
