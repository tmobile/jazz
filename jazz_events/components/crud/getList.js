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
    Get List of Environment-Catalogs
    @module: getList.js
    @description: CRUD functions for Events catalog
    @author:
    @version: 1.0
 **/

const utils = require("../utils.js")(); //Import the utils module.
const logger = require("../logger.js"); //Import the logging module.

module.exports = (tableName, query, onComplete) => {
    // Initialize DynamoDB
    var dynamodb = utils.initDynamodb();

    var filter = "";
    var attributeValues = {};

    var scanparams = {
        "TableName": tableName,
        "ReturnConsumedCapacity": "TOTAL",
        "Limit": "500"
    };
    if (query && query && Object.keys(query).length) {
        Object.keys(query).map((key) => {
            if (key === "last_evaluated_key") {
                scanparams.ExclusiveStartKey = query[key];
            } else if (key === "username") {
                filter = filter + "USERNAME = :USERNAME AND ";
                attributeValues[":USERNAME"] = {
                    'S': query[key]
                };
            } else if (key === "service_name") {
                filter = filter + "SERVICE_NAME = :SERVICE_NAME AND ";
                attributeValues[":SERVICE_NAME"] = {
                    'S': query[key]
                };
            }
        });

        if (!filter) {
            onComplete(null, null);
        }
        scanparams.FilterExpression = filter.substring(0, filter.length - 5);
        scanparams.ExpressionAttributeValues = attributeValues;
        dynamodb.scan(scanparams, (err, items) => {
            if (err) {
                logger.error("error in dynamodb scan");
                logger.error(err);
                onComplete(err, null);

            } else {
                onComplete(null, items);
            }
        });
    } else {
        onComplete(null, null);
    }
}