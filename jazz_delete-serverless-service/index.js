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
const uuid = require('uuid');

const errorHandlerModule = require("./components/error-handler.js");
const eventHandlerModule = require("./components/events-handler.js");
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");
const formats = require('./jenkins-json.js');
var payloads = formats('apis');

/**
	Delete Serverless Service
	@author: 
	@version: 1.0
 **/

module.exports.handler = (event, context, cb) => {

    var tracking_id = uuid.v4();
    var errorHandler = errorHandlerModule();
    var eventHandler = eventHandlerModule(tracking_id);
    var config = configObj(event);
    logger.init(event, context);

    if (!config.DELETE_SERVICE_JOB_URL) {
        logger.error("Service configuration missing JOB URL" + JSON.stringify(event));
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Service isn't configured properly, please reach out to Admins for help!")));
    }

    if (!event.body) {
        logger.error("Event body is empty");
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Missing parameters")));
    } else if (!event.body.service_name) {
        logger.error("Service name is missing in the input");
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Service name is missing in the input")));
    } else if (!event.body.domain) {
        logger.error("Domain key is missing in the input");
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Domain is missing in the input")));
    }

    // If request contains user token, this will hold caller's user_id
    var user_id = event.principalId;
    if (!user_id) {
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Cannot identify the service caller")));
    }

    var version = "LATEST";
    if (event.body.version) { // version is optional field
        version = event.body.version;
    }

    var environment_id = (event.body.environment_id) ? event.body.environment_id : null,
        domain = event.body.domain,
        service_name = event.body.service_name,
        event_name = config.EVENT_NAME.SERVICE;

    if (environment_id) {
        event_name = config.EVENT_NAME.ENVIRONMENT;
    }

    //Object to send starting events only for service deletion
    var sendEventsOptions = {
        "service_context": {
            "domain": domain
        },
        "event_handler": config.EVENT_HANDLER,
        "event_name": event_name,
        "service_name": service_name,
        "event_status": "STARTED",
        "event_type": config.EVENT_TYPE,
        "username": user_id,
        "SERVICE_API_URL": config.SERVICE_API_URL,
        "EVENTS_API_RESOURCE": config.EVENTS_API_RESOURCE
    };

    try {

        var base_auth_token = "Basic " + new Buffer(config.SVC_USER + ":" + config.API_TOKEN).toString("base64");

        var req = payloads.requestLoad;
        req.url = config.DELETE_SERVICE_JOB_URL + "?token=" + config.JOB_TOKEN;
        req.headers.Authorization = base_auth_token;

        var params = payloads.buildParams;
        params.service_name = event.body.service_name;
        params.domain = event.body.domain;
        params.version = version;
        params.tracking_id = tracking_id;

        if (environment_id) {
            params.environment_id = environment_id;
        } else {
            params.environment_id = '';
        }

        req.qs = params;
        //Send STARTED event for CALL_DELETE_WORKFLOW/CALL_DELETE_ENV_WORKFLOW
        logger.debug("Started sendEventsOptions:" + JSON.stringify(sendEventsOptions));
        sendEventToHandler(sendEventsOptions);
        request(req, function (error, response, body) {
            if (error) {
                logger.error("request errored..: " + JSON.stringify(error));
                sendEventsOptions.error = "Failed..: " + JSON.stringify(error);
                sendEventToHandler(sendEventsOptions);
                return cb(JSON.stringify(errorHandler.throwInternalServerError("Internal error occurred")));
            } else {
                if (response.statusCode === 200 || response.statusCode === 201) {
                    logger.info("success..: " + JSON.stringify(response));
                    payloads.responseLoad.request_id = tracking_id;
                    sendEventsOptions.event_status = "COMPLETED";
                    //Send COMPLETED events for CALL_DELETE_WORKFLOW/CALL_DELETE_ENV_WORKFLOW
                    logger.debug("Completed sendEventsOptions:" + JSON.stringify(sendEventsOptions));
                    sendEventToHandler(sendEventsOptions);
                    return cb(null, responseObj(payloads.responseLoad, event.body));
                } else {
                    //Send FAILED event for CALL_DELETE_WORKFLOW/CALL_DELETE_ENV_WORKFLOW
                    var errMessage = "Internal error occurred";
                    sendEventsOptions.error = "Failed..: " + JSON.stringify(response);
                    sendEventsOptions.event_status = "FAILED";
                    if (response.statusCode === 401) {
                        errMessage = "Not authorized";
                    }
                    logger.error("Failed..: " + JSON.stringify(response));
                    logger.debug("Failed sendEventsOptions:" + JSON.stringify(sendEventsOptions));
                    sendEventToHandler(sendEventsOptions);
                    return cb(JSON.stringify(errorHandler.throwInternalServerError(errMessage)));
                }
            }
        });

    } catch (ex) {
        //Send FAILED event for CALL_DELETE_WORKFLOW/CALL_DELETE_ENV_WORKFLOW
        sendEventsOptions.error = "Failed..: " + JSON.stringify(ex.message);
        sendEventsOptions.event_status = "FAILED";
        sendEventToHandler(sendEventsOptions);
        logger.error('Error : ', ex.message);
        cb(JSON.stringify(errorHandler.throwInternalServerError("Internal error occurred")));
    }

    function sendEventToHandler(sendEventsOptions) {
        //Send Started/Completed/Failed events for CALL_DELETE_WORKFLOW /CALL_DELETE_ENV_WORKFLOW
        eventHandler.sendEvent(sendEventsOptions, function (err, data) {
            if (err) {
                logger.error(err.message);
            } else {
                logger.info(data.message);
            }
        });
    }
};