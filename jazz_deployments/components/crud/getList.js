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
    Get List of Deployments-Catalog
    @module: getList.js
    @description: CRUD functions for deployments catalog
    @author:
    @version: 1.0
 **/

const utils = require("../utils.js")(); //Import the utils module.
const logger = require("../logger.js"); //Import the logging module.

module.exports = (tableName, query, onComplete) => {
    // initialize dynamodb
    var dynamodb = utils.initDynamodb(),
    filter = "",
    attributeValues = {},
    insertAndString = " AND ",
    scanparams = {
        TableName: tableName,
        ReturnConsumedCapacity: "TOTAL",
        Limit: "500"
    };

    if (query) {
        var keys_list = global.config.REQUIRED_PARAMS.slice(0, global.config.REQUIRED_PARAMS.length);
        //appending the optional_keys list along with required_fields
        if (query.status) {
            keys_list.push("status");
        } else {
            query.status = global.config.ARCHIVED_DEPLOYMENT_STATUS;
            keys_list.push("status");
        }
        // Generate filter string
        keys_list.map(function (key) {
            var key_name = utils.getDeploymentDatabaseKeyName(key);
            if (key_name === "DEPLOYMENT_STATUS" && query.status === global.config.ARCHIVED_DEPLOYMENT_STATUS) {
                if (query[key]) {
                    filter = filter + key_name + " <> :" + key_name + insertAndString;
                    attributeValues[":" + key_name] = {
                        S: query[key]
                    };
                }
            } else {
                if (query[key]) {
                    filter = filter + key_name + " = :" + key_name + insertAndString;
                    attributeValues[":" + key_name] = {
                        S: query[key]
                    };
                }
            }
        });
    }

    filter = filter.substring(0, filter.length - insertAndString.length); // remove the " AND " at the end
    
    if (filter) {
        scanparams.FilterExpression = filter;
        scanparams.ExpressionAttributeValues = attributeValues;
    }

    var items_formatted = [];

    if (query.limit) {
        query.limit = ((query.limit > global.config.PAGINATION_DEFAULTS.max_limit) ? global.config.PAGINATION_DEFAULTS.max_limit : query.limit);
    } else {
        query.limit = global.config.PAGINATION_DEFAULTS.limit;
    }

    query.offset = query.offset || global.config.PAGINATION_DEFAULTS.offset;

    var scanExecute = function (onComplete) {
        dynamodb.scan(scanparams, function (err, items) {
            var count;
            if (err) {
                onComplete(err);
            } else {
                items.Items.map(function (item) {
                    items_formatted.push(utils.formatData(item, true));
                });
                if (items.LastEvaluatedKey) {
                    scanparams.ExclusiveStartKey = items.LastEvaluatedKey;
                    scanExecute(onComplete);
                } else {
                    if (items_formatted.length > 0) {
                        count = items_formatted.length;
                        items_formatted = utils.sortUtil(items_formatted, global.config.DEPLOYMENTS_SORTING_KEY, global.config.DEPLOYMENTS_SORTING_ORDER);
                        items_formatted = utils.paginateUtil(items_formatted, parseInt(query.limit), parseInt(query.offset));
                    }
                    var obj = {
                        count: count,
                        deployments: items_formatted
                    };
                    logger.info("Database Result:" + JSON.stringify(obj));
                    onComplete(null, obj);
                }
            }
        });
    }
    scanExecute(onComplete);
};