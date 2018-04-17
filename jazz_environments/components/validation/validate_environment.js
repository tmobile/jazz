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
    Helper Validation functions for Environment-Catalog
    @module: validate.js
    @description: Defines validate functions.
    @author:
    @version: 1.0
**/

const logger = require("../logger.js"); //Import the logging module.
const crud = require("../crud")(); //Import the utils module.
const _ = require("lodash");

module.exports = (tableName, indexName, service, domain, environment_id, onComplete) => {
    // check for query param ,path params and crud.get
    logger.info("Inside Validate Environment: " + indexName + service + domain + environment_id);

    crud.get(tableName, indexName, service, domain, environment_id, function onEnvironmentGet(error, data) {
        if (error) {
            logger.error("Error in ValidateEnvironment: " + JSON.stringify(error));
            onComplete(error, null);
        } else {
            if (_.isEmpty(data.environment)) {
                onComplete({
                    result: "notFoundError",
                    message: "Cannot find environment with following params: service - " + service + ", domain - " + domain + ", environment_id - " + environment_id
                }, null);
            } else {
                onComplete(null, {
                    result: "success",
                    message: "Environment exists",
                    data: data
                });
            }
        }
    });
};