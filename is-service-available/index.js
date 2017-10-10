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
 * API service which checks if a specific service name exists
 *
 * @author: Terry Jung
 * @version: 1.2
 */
'use strict';
const secretHandlerModule = require("./components/secret-handler.js"); //Import the secret-handler module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.

const request = require('request');

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.

module.exports.handler = (event, context, cb) => {
    var errorHandler = errorHandlerModule();
    var secretHandler = secretHandlerModule();
    logger.init(event, context);

    try {
        var USERNAME, PASSWORD, password_encrypted, bitbucket_service_host, bitbucket_service_path;

        var config = configObj(event);

        // Get bitbucket service details from config file
        USERNAME = config.bitbucket_service_login_username;
        bitbucket_service_host = config.bitbucket_service_host;
        bitbucket_service_path = config.bitbucket_service_path;
        password_encrypted = config.bitbucket_service_login_password;
        PASSWORD = config.bitbucket_service_login_password;

        // Validate configurations
		if (PASSWORD === undefined || PASSWORD === "") {
            logger.error("Error in configurations file. bitbucket_service_login_password is required");
            cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
        }
        if (USERNAME === undefined || USERNAME === "") {
            logger.error("Error in configurations file. Username is required");
            cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
        }
        if (bitbucket_service_host === undefined || bitbucket_service_host === "") {
            logger.error("Error in configurations file. bitbucket_service_host is required");
            cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
        }
        if (bitbucket_service_path === undefined || bitbucket_service_path === "") {
            logger.error("Error in configurations file. bitbucket_service_path is required");
            cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
        }

        // GET method should be handled here
        if (event !== undefined && event.method !== undefined && event.method === 'GET') {
            if (event.query === undefined || event.query.service === undefined || event.query.service === "") {
                cb(JSON.stringify(errorHandler.throwInputValidationError("Service name is required")));
            }

            // get input parameters
            var service = event.query.service.toLowerCase();
            var domain = event.query.domain;
            var service_name;

            // If domain_name exists prepend it to the service_name
            if (domain !== undefined && domain !== null && domain.trim() !== "") {
                domain = domain.trim().toLowerCase();
                service_name = domain + "-" + service;
            } else {
                service_name = service;
                domain = "";
            }

            bitbucket_service_path += service_name;
            var input = {
                service: service,
                domain: domain
            };

            var options = {
                url: bitbucket_service_host + bitbucket_service_path,
                auth: {
                    user: USERNAME,
                    password: PASSWORD
                },
                method: 'GET',
                rejectUnauthorized: false,
                headers: {
                    'Accept': 'application/json',
                    'Accept-Charset': 'utf-8',
                }
            };
            request(options, function(err, res, body) {
                if (err) {
                    logger.error("Error occured during bitbucket service call: " + err);
                    cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
                } else {
                    // Success response
                    var data;
                    if (res.request && res.request.uri && res.request.uri.href){
                        logger.info('Bitbucket repo url that is being checked for: ' + res.request.uri.href);
                    }
                    if (res.statusCode == 404) {
                      // Service name is available to use only when no repository exists with this repository name
                      logger.info("No such service exists in bitbucket. Ready to use for service creation");
                      data = {available: true};
                    } else {
                      logger.info("Service already exists, cannot be used for service creation");
                      data = {available: false};
                    }
                    cb(null, responseObj(data, input));
                }
            });
        } else {
            cb(JSON.stringify(errorHandler.throwInternalServerError("Operation not supported")));
        }
    } catch (e) {
        logger.error("Unknown error occured during execution: " + JSON.stringify(e));
        cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
    }
};
