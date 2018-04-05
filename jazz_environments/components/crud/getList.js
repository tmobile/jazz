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
    Get List of Service-Catalogs
    @module: getList.js
    @description: CRUD functions for service catalog
    @author:
    @version: 1.0
 **/

const utils = require("../utils.js")(); //Import the utils module.
const logger = require("../logger.js"); //Import the logging module.

module.exports = (query, onComplete) => {
    // initialize dynamodb
    var dynamodb = utils.initDynamodb();

    var filter = "";
    var attributeValues = {};

    var insertAndString = " AND ";

    var scanparams = {
        TableName: global.env_tableName,
        ReturnConsumedCapacity: "TOTAL",
        Limit: "500"
    };

    if (query !== undefined && query) {
        // var keys_list = ['service', 'domain', 'region', 'type', 'runtime', 'created_by','timestamp'];
        var keys_list = global.config.service_environment_filter_params;

        // Generate filter string
        keys_list.forEach(function(key) {
            var key_name = utils.getEnvironmentDatabaseKeyName(key);

            if (query[key] !== undefined) {
                filter = filter + key_name + " = :" + key_name + insertAndString;
                attributeValues[":" + key_name] = {
                    S: query[key]
                };
            }
        });
    }

    filter = filter.substring(0, filter.length - insertAndString.length); // remove the " AND " at the end

    if (filter !== "") {
        scanparams.FilterExpression = filter;
        scanparams.ExpressionAttributeValues = attributeValues;
    }

    var items_formatted = [];
    var scanExecute = function (onComplete) {
        dynamodb.scan(scanparams, function(err, items) {
            var count;
            if (err) {
                onComplete(err);
            } else {
                items.Items.forEach(function(item) {
                    items_formatted.push(utils.formatEnvironment(item));
                });

      			if (items.LastEvaluatedKey) {
					scanparams.ExclusiveStartKey = items.LastEvaluatedKey;
					scanExecute(onComplete);
                } else {
                    var obj = {
                        count: items_formatted.length,
                        environment: items_formatted
                    };
                    logger.info("Database Result:" + JSON.stringify(obj));
                    onComplete(null, obj);
                }
            }
        });
    }
    scanExecute(onComplete);
};