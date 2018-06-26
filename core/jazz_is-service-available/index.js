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

/**
 * API service which checks if a specific service name exists in the given domain
 *
 * @author:
 * @version: 1.0
 */

'use strict';

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const utils = require("./components/utils.js")();

module.exports.handler = (event, context, cb) => {
    var errorHandler = errorHandlerModule();
    logger.init(event, context);

    if (!event || !event.method || event.method != 'GET') {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("101", "Service isn't invoked as a GET API.")));
    }

    if (!event.principalId) {
        logger.error("No principalid found, not processing anymore")
        return cb(JSON.stringify(errorHandler.throwUnauthorizedError("102", "You aren't authorized to access this service. Please login with your credentials.")));
    }

    if (!event.query || !event.query.service || !event.query.domain) {
        logger.error("Invalid parameters sent " + JSON.stringify(event.query));
        return cb(JSON.stringify(errorHandler.throwInputValidationError("103", "Service name and namespace are required")));
    }

    try {
      var config = configModule.getConfig(event, context);
        global.config = config;

        var service = event.query.service.trim().toLowerCase();
        var domain = event.query.domain.trim().toLowerCase();
        var input = {
            service: service,
            domain: domain
        };

        logger.info("Checking service availability with input: " + JSON.stringify(input));
        utils.isServiceExists({
            service: input.service,
            domain: input.domain
        }, function onServiceGet(error, data) {
            if (error) {
                logger.error("Error occured while fetching from service catalog: " + error);
                return cb(JSON.stringify(errorHandler.throwInternalServerError("104", "Unknown internal error")));
            } else {
                return cb(null, responseObj({ available: !data.isExists }, input));
            }
        });
    } catch (e) {
        logger.error("Unknown error occured during execution: " + JSON.stringify(e));
        return cb(JSON.stringify(errorHandler.throwInternalServerError("106", "Internal Error")));
    }
};
