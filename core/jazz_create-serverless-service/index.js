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

'use strict';

const request = require('request');
const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const CronParser = require("./components/cron-parser.js");
const configModule = require("./components/config.js"); 
const logger = require("./components/logger.js");
const util = require('util');
const validateARN = require("./components/validate-arn.js");
const crud = require("./components/crud")(); 

/**
    Serverless create service
    @author:
    @version: 1.0
**/
var user_id;
var serviceId;
var serviceDataObject;
var handler = (event, context, cb) => {

    var errorHandler = errorHandlerModule();
    var config = configModule.getConfig(event, context);
    logger.init(event, context);
    var service_creation_data = event.body;
    try {
        var isValidName = function (name) {
            return /^[A-Za-z0-9\-]+$/.test(name);
        };

        if (!service_creation_data) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Service inputs are not defined")));
        } else if (!service_creation_data.service_type) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("'service_type' is not defined")));
        } else if (!service_creation_data.service_name || !isValidName(service_creation_data.service_name)) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("'service_name' is not defined or has invalid characters")));
        } else if (service_creation_data.service_type !== "website" && (!service_creation_data.runtime)) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("'runtime' is not defined")));
        } else if (service_creation_data.domain && !isValidName(service_creation_data.domain)) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Namespace is not appropriate")));
        } else if (service_creation_data.service_name && service_creation_data.service_name.length > 20) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("'Service Name' can have up to 20 characters")));
        } else if (service_creation_data.domain && service_creation_data.domain.length > 20) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("'Namespace' can have up to 20 characters")));
        }

        user_id = event.principalId;
        if (!user_id) {
            logger.error('Authorizer did not send the user information, please check if authorizer is enabled and is functioning as expected!');
            return cb(JSON.stringify(errorHandler.throwUnAuthorizedError("User is not authorized to access this service")));
        }

        logger.info("Request event: " + JSON.stringify(event));

        getToken(config)
            .then((authToken) => getServiceData(service_creation_data, authToken, config))
            .then((inputs) => createService(inputs))
            .then((service_id) => startServiceOnboarding(service_creation_data, config, service_id))
            .then((result) => {
                cb(null, responseObj(result, service_creation_data));
            })
            .catch(function (err) {
                logger.error('Error while creating service : ' + JSON.stringify(err));
                if (err.jenkins_api_failure) {
                    serviceDataObject.body = {
                        "STATUS": "creation_failed"
                    };
                    crud.update(serviceId, serviceDataObject, (serviceUpdateError, results) => {
                        if (serviceUpdateError) {
                            var errorMessage = {
                                "message": "Error occurred while updating service with failed status.",
                                "error": err
                            };
                            return cb(JSON.stringify(errorHandler.throwInternalServerError(errorMessage)));
                        } else {
                            logger.error("Updated service catalog with failed status.");
                            return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
                        }
                    });
                } else if (err.result === 'inputError') {
                    return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
                }else {
                    return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
                }
            });

    } catch (e) {
        logger.error(e);
        cb(JSON.stringify(errorHandler.throwInternalServerError(e)));
    }
}

var startServiceOnboarding = (service_creation_data, config, service_id) => {
    return new Promise((resolve, reject) => {
        try {
            var base_auth_token = "Basic " + new Buffer(util.format("%s:%s", config.SVC_USER, config.API_TOKEN)).toString("base64");
            var userlist = "";
            var approvers = service_creation_data.approvers;

            userlist = approvers.reduce((stringSoFar, approver) => {
                return stringSoFar + util.format("name=%s&", approver);
            }, "");

            var input = {
                token: config.JOB_TOKEN,
                admin_group: userlist,
                service_id: service_id
            };
            request({
                url: config.JOB_BUILD_URL,
                method: 'POST',
                headers: {
                    "Authorization": base_auth_token
                },
                qs: input
            }, function (err, response, body) {
                if (err) {
                    logger.error('Error while starting service onboarding: ' + err);
                    err.jenkins_api_failure = true;
                    reject(err);
                } else {
                    if (response.statusCode <= 299) { // handle all 2xx response codes as success
                        resolve("Successfully created your service.");
                    } else {
                        logger.error("Failed while request to service onboarding job " + JSON.stringify(response));
                        var message = {
                            'message': "Failed to kick off service onboarding job.",
                            'jenkins_api_failure': true
                        };
                        reject(message);
                    }
                }
            });
        } catch (e) {
            logger.error('Error during startServiceOnboarding: ' + e.message);
            reject(e);
        }
    });
}

var getToken = (configData) => {
    return new Promise((resolve, reject) => {
        var svcPayload = {
            uri: configData.SERVICE_API_URL + configData.TOKEN_URL,
            method: 'post',
            json: {
                "username": configData.SERVICE_USER,
                "password": configData.TOKEN_CREDS
            },
            rejectUnauthorized: false
        };

        request(svcPayload, (error, response, body) => {
            if (response.statusCode === 200 && body && body.data) {
                var authToken = body.data.token;
                return resolve(authToken);
            } else {
                return reject({
                    "error": "Could not get authentication token for updating service catalog.",
                    "message": response.body.message
                });
            }
        });
    });
}

var createService = (service_data) => {
    return new Promise((resolve, reject) => {
        crud.create(service_data, (err, results) => {
            if (err) {
                reject({
                    "message": err.error
                });
            } else {
                logger.info("created a new service in service catalog.");
                serviceId = results.data.service_id;
                resolve(results.data.service_id);
            }
        });
    });
}

var getServiceData = (service_creation_data, authToken, configData) => {
    return new Promise((resolve, reject) => {
        var inputs = {
            "TOKEN": authToken,
            "SERVICE_API_URL": configData.SERVICE_API_URL,
            "SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
            "SERVICE_NAME": service_creation_data.service_name.toLowerCase(),
            "DOMAIN": service_creation_data.domain.toLowerCase(),
            "DESCRIPTION": service_creation_data.description,
            "TYPE": service_creation_data.service_type,
            "RUNTIME": service_creation_data.runtime,
            "REGION": service_creation_data.region,
            "USERNAME": user_id,
            "IS_PUBLIC_ENDPOINT": service_creation_data.is_public_endpoint || false,
            "STATUS": "creation_started"
        };

        var serviceMetadataObj = {};
        if (service_creation_data.tags) {
            inputs.TAGS = service_creation_data.tags;
        }

        if (service_creation_data.email) {
            inputs.EMAIL = service_creation_data.email;
        }

        if (service_creation_data.slack_channel) {
            inputs.SLACKCHANNEL = service_creation_data.slack_channel;
        }

        if ((service_creation_data.service_type === "api" || service_creation_data.service_type === "function") && (service_creation_data.require_internal_access)) {
            serviceMetadataObj.require_internal_access = service_creation_data.require_internal_access;
        }

        // Pass the flag to enable authentication on API
        if (service_creation_data.service_type === "api") {
            serviceMetadataObj.enable_api_security = service_creation_data.enable_api_security || false;
            if (service_creation_data.authorizer_arn) {
                // Validate ARN format - arn:aws:lambda:region:account-id:function:function-name
                if (!validateARN(service_creation_data.authorizer_arn)) {
                    return cb(JSON.stringify(errorHandler.throwInputValidationError("authorizer arn is invalid, expected format=arn:aws:lambda:region:account-id:function:function-name")));
                } else {
                    serviceMetadataObj.authorizer_arn = service_creation_data.authorizer_arn;
                }
            }
        }

        // Disabling require_internal_access and enable_api_security when is_public_endpoint is true
        if (service_creation_data.service_type === "api" && service_creation_data.is_public_endpoint) {
            serviceMetadataObj.require_internal_access = false;
            serviceMetadataObj.enable_api_security = false;
        }

        if (service_creation_data.service_type === "website") {
            var create_cloudfront_url = "true";
            serviceMetadataObj.create_cloudfront_url = create_cloudfront_url;
            inputs.RUNTIME = 'n/a';
        }
        // Add rate expression to the propertiesObject;
        if (service_creation_data.service_type === "function") {
            if (service_creation_data.rateExpression) {
                var cronExpValidator = CronParser.validateCronExpression(service_creation_data.rateExpression);
                if (cronExpValidator.result === 'valid') {
                    var rate_expression = service_creation_data.rateExpression;
                    var enable_eventschedule;
                    if (service_creation_data.enableEventSchedule === false) {
                        enable_eventschedule = service_creation_data.enableEventSchedule;
                    } else {
                        enable_eventschedule = true;
                    }

                    if (rate_expression && rate_expression.trim() !== "") {
                        serviceMetadataObj["eventScheduleRate"] = "cron(" + rate_expression + ")";
                    }
                    if (enable_eventschedule && enable_eventschedule !== "") {
                        serviceMetadataObj["eventScheduleEnable"] = enable_eventschedule;
                    }

                } else {
                    logger.error('cronExpValidator : ', cronExpValidator);
                    reject(cronExpValidator);
                }
            }

            if (service_creation_data.events && service_creation_data.events.length) {
                //Process events into properties
                for (let idx = 0; idx < service_creation_data.events.length; idx++) {
                    var eachEvent, eventSrc, eventAction;
                    eachEvent = service_creation_data.events[idx];
                    logger.info('event: ', JSON.stringify(eachEvent));
                    let isEventNameValid = validateEventName(eachEvent.type, eachEvent.source, configData);
                    if (isEventNameValid && isEventNameValid.result) {
                      eventSrc = "event_source_" + eachEvent.type;
                      eventAction = "event_action_" + eachEvent.type;
                      serviceMetadataObj[eventSrc] = eachEvent.source;
                      serviceMetadataObj[eventAction] = eachEvent.action;
                    } else {
                      if (!isEventNameValid) {
                        isEventNameValid["message"] = `${eachEvent.type} is invalid.`
                      }
                      reject({result: 'inputError', message: isEventNameValid.message});
                    }

                }
            }
        }

        inputs.METADATA = serviceMetadataObj;
        serviceDataObject = inputs;
        resolve(inputs);
    });
}

var validateEventName = (eventType, sourceName, config) => {
  let eventSourceName = '', sourceType = eventType.toLowerCase(), logicalIdLen = 15,
  resultObj = {
      result: "",
      message: ""
  };

  if(!eventType || !sourceName) {
    resultObj.result = false;
    resultObj.message =  `Event type and/or source name cannot be empty.`;
    return resultObj;
  }

  let eventSourceObject = {
    's3': sourceName,
    'sqs': sourceName.split(':').pop(),
    'dynamodb': sourceName.split('/').pop(),
    'kinesis': sourceName.split('/').pop()
  };

  eventSourceName = eventSourceObject[sourceType];
  if (!eventSourceName) {
    resultObj.result = false;
    resultObj.message =  `Event type '${eventType}' is invalid.`;
    return resultObj;
  }

  if (eventSourceName && (eventSourceName.startsWith("-") || eventSourceName.startsWith("_") || eventSourceName.startsWith(".") || eventSourceName.endsWith("-") || eventSourceName.endsWith("_") || eventSourceName.endsWith("."))) {
    resultObj.result = false;
    resultObj.message =  `${eventSourceName} cannot begin or end with special character`;
    return resultObj;
  }

  let mapType = config.EVENT_SOURCE_NAME[sourceType];
  let regexPattern = new RegExp(mapType.regexPattern);

  if (eventSourceName.length >= mapType.minLength && eventSourceName.length <= (mapType.maxLength - logicalIdLen) && (regexPattern).test(eventSourceName)) {
    resultObj.result = true;
    resultObj.message =  `Source name of ${eventType} is valid.`;
    return resultObj;
  } else {
    resultObj.result = false;
    resultObj.message =  `Source name of ${eventType} is invalid. '${eventSourceName}' should have valid length and/or pattern.`;
    return resultObj;
  }
};

module.exports = {
    handler: handler,
    startServiceOnboarding: startServiceOnboarding,
    getToken: getToken,
    createService: createService,
    getServiceData: getServiceData
}
