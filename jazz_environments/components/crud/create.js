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
    Create a Environment entry in dynamodb table
    @module: create.js
    @description: CRUD functions for Environments
    @author:
    @version: 1.0
**/

const utils = require("../utils.js")(); //Import the utils module.
const Guid = require("guid");
const moment = require("moment");

module.exports = (environmentData, onComplete) => {
    // initialize dynamodb
    var docClient = utils.initDocClient();

    var timestamp = moment()
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss:SSS");

    // Generate service_id
    var id = Guid.create();
    var params = {
        Item: {
            ENVIRONMENT_ID: id.value,
            ENVIRONMENT_CREATED: timestamp,
            ENVIRONMENT_LAST_UPDATED: timestamp
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: global.envTableName
    };

    environmentData.logical_id = environmentData.logical_id.toLowerCase();

    // Add all properties in input object to the params object
    Object.keys(environmentData).forEach(function(key) {
        var param_key = utils.getEnvironmentDatabaseKeyName(key);
        var param_value = environmentData[key];

        if (param_value === null || param_value === undefined) {
            params.Item[param_key] = null;
        } else {
            params.Item[param_key] = param_value;
        }
    });

    // Add new item to database
    docClient.put(params, function(err, data) {
        if (err) {
            // database error
            onComplete(
                {
                    result: "databaseError",
                    message: "Error adding Item to dynamodb " + err.message
                },
                null
            );
        } else {
            // Success!!
            onComplete(null, {
                result: "success",
                environment_id: id.value,
                environment_logical_id: environmentData.logical_id
            });
        }
    });
};
