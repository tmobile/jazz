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

const request = require('request');
const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const CronParser = require("./components/cron-parser.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");
const util = require('util');
const crud = require("./components/crud")(); //Import the utils module.

/**
	Serverless create service
    @author:
    @version: 1.0
**/

module.exports.handler = (event, context, cb) => {

    var errorHandler = errorHandlerModule();
    var config = configObj(event);
    logger.init(event, context);


    try {
        var isValidName = function (name) {
            return /^[A-Za-z0-9\-]+$/.test(name);
        };

        if (!event.body) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Service inputs are not defined")));
        } else if (!event.body.service_type) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("'service_type' is not defined")));
        } else if (!event.body.service_name || !isValidName(event.body.service_name)) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("'service_name' is not defined or has invalid characters")));
        } else if (event.body.service_type !== "website" && (!event.body.runtime)) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("'runtime' is not defined")));
        } else if (event.body.domain && !isValidName(event.body.domain)) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Namespace is not appropriate")));
        }

        var user_id = event.principalId;
        if (!user_id) {
            logger.error('Authorizer did not send the user information, please check if authorizer is enabled and is functioning as expected!');
            return cb(JSON.stringify(errorHandler.throwUnAuthorizedError("User is not authorized to access this service")));
        }

        logger.info("Request event: " + JSON.stringify(event));


        getToken(config)
            .then((authToken) => getServiceData(event, authToken, config))
            .then((inputs) => createService(inputs))
            .then((service_id) => startServiceOnboarding(event, config, service_id))
            .then((result) => {
                cb(null, responseObj(result, event.body));
            })
            .catch(function (err) {
                logger.error('Error while creating a service : ' + JSON.stringify(err));
                return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
            });

    } catch (e) {
        logger.error(e);
        cb(JSON.stringify(errorHandler.throwInternalServerError(e)));

    }


    function startServiceOnboarding(event, config, service_id) {
        return new Promise((resolve, reject) => {
            try {
                var base_auth_token = "Basic " + new Buffer(util.format("%s:%s", config.SVC_USER, config.SVC_PASWD)).toString("base64");
                var userlist = "";
                var approvers = event.body.approvers;
                var domain = (event.body.domain || "").toLowerCase();
                var service_name = event.body.service_name.toLowerCase();

                userlist = approvers.reduce(function (stringSoFar, approver) {
                    return stringSoFar + util.format("name=%s&", approver);
                }, "");

                var input = {
                    token: config.BUILD_TOKEN,
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
                        logger.error('Error while starting Jenkins job: ' + err);
                        reject(err);
                    } else {
                        if (response.statusCode <= 299) { // handle all 2xx response codes as success
                            resolve("Successfully created your service.");
                        } else {
                            logger.error("Failed while request to service onboarding job " + JSON.stringify(response));
                            reject({ 'message': "Failed to kick off service creation job" });
                        }
                    }
                });
            } catch (e) {
                logger.error('Error : ' + e.message);
                reject(e);
            }

        });
    }

    function getToken(configData) {
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

            request(svcPayload, function (error, response, body) {
                if (response.statusCode === 200 && body && body.data) {
                    var authToken = body.data.token;
                    return resolve(authToken);
                } else {
                    return reject({
                        "error": "Could not get authentication token for updating Service catalog.",
                        "message": response.body.message
                    });
                }
            });
        });
    }

    function createService(service_data) {
        return new Promise((resolve, reject) => {
            crud.create(service_data, function (err, results) {
                if (err) {
                    reject({
                        "message": err.error
                    });
                } else {
                    logger.info("created a new service in service catalog.");
                    resolve(results.data.service_id);
                }
            });
        });
    }

    function getServiceData(event, authToken, configData) {
        return new Promise((resolve, reject) => {
            var inputs = {
                "TOKEN": authToken,
                "SERVICE_API_URL": configData.SERVICE_API_URL,
                "SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
                "SERVICE_NAME": event.body.service_name.toLowerCase(),
                "DOMAIN": event.body.domain.toLowerCase(),
                "DESCRIPTION": event.body.description,
                "TYPE": event.body.service_type,
                "RUNTIME": event.body.runtime,
                "REGION": event.body.region,
                "USERNAME": user_id,
                "STATUS": "creation_started"
            };

            var serviceMetadataObj = {};
            if (event.body.tags) {
                inputs.TAGS = event.body.tags;
            }

            if (event.body.email) {
                inputs.EMAIL = event.body.email;
            }

            if (event.body.slack_channel) {
                inputs.SLACKCHANNEL = event.body.slack_channel;
            }
            if ((event.body.service_type === "api" || event.body.service_type === "function") && (event.body.require_internal_access !== null)) {
                serviceMetadataObj.require_internal_access = event.body.require_internal_access;
            }
            if (event.body.service_type === "website") {
                var create_cloudfront_url = "true";
                serviceMetadataObj.create_cloudfront_url = create_cloudfront_url;
                inputs.RUNTIME = 'n/a';
            }
            // Add rate expression to the propertiesObject;
            if (event.body.service_type === "function") {
                if (event.body.rateExpression !== undefined) {
                    var cronExpValidator = CronParser.validateCronExpression(event.body.rateExpression);
                    if (cronExpValidator.result === 'valid') {
                        var rate_expression = event.body.rateExpression;
                        var enable_eventschedule;
                        if (event.body.enableEventSchedule === false) {
                            enable_eventschedule = event.body.enableEventSchedule;
                        } else {
                            enable_eventschedule = true;
                        }

                        if (rate_expression && rate_expression.trim() !== "") {
                            serviceMetadataObj["eventScheduleRate"] = "cron(" + rate_expression + ")";
                        }
                        if (enable_eventschedule && enable_eventschedule !== "") {
                            serviceMetadataObj["eventScheduleEnable"] = enable_eventschedule;
                        }
                        if (event.body.event_source_ec2 && event.body.event_action_ec2) {
                            serviceMetadataObj["event_action_ec2"] = event.body.event_source_ec2;
                            serviceMetadataObj["event_action_ec2"] = event.body.event_action_ec2;
                        }
                        if (event.body.event_source_s3 && event.body.event_action_s3) {
                            serviceMetadataObj["event_source_s3"] = event.body.event_source_s3;
                            serviceMetadataObj["event_action_s3"] = event.body.event_action_s3;
                        }
                        if (event.body.event_source_dynamodb && event.body.event_action_dynamodb) {
                            serviceMetadataObj["event_source_dynamodb"] = event.body.event_source_dynamodb;
                            serviceMetadataObj["event_action_dynamodb"] = event.body.event_action_dynamodb;
                        }
                        if (event.body.event_source_stream && event.body.event_action_stream) {
                            serviceMetadataObj["event_source_stream"] = event.body.event_source_stream;
                            serviceMetadataObj["event_action_stream"] = event.body.event_action_stream;
                        }

                    } else {
                        logger.error('cronExpValidator : ', cronExpValidator);
                        reject(cronExpValidator);
                    }
                }
            }

            inputs.METADATA = serviceMetadataObj;
            resolve(inputs);
        });
    }
};