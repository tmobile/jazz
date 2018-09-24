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
    Create a Service-Catalog entry in dynamodb table
    @module: create.js
    @description: CRUD functions for service catalog
    @author: 
    @version: 1.0
**/

const utils = require("../utils.js")();
const Guid = require("guid");
const moment = require('moment');

module.exports = (service_data, onComplete) => {
    // initialize dynamodb
    var docClient = utils.initDocClient();

    // Generate service_id
    var service_id = Guid.create();

    var timestamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss:SSS');
    var params = {
        Item: {
            "SERVICE_ID": service_id.value,
            "TIMESTAMP": timestamp
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: global.services_table
    };

    // Required parameters
    // var required_params = ['service', 'domain', 'type', 'created_by', 'runtime'];
    var required_params = global.config.service_required_fields;
    required_params.forEach(function (key) {
        var param_key = utils.getDatabaseKeyName(key);
        params.Item[param_key] = service_data[key];
    });

    // Other parameters
    // var other_params = ['description', 'region', 'repository', 'email', 'slack_channel', 'tags'];
    var other_params = global.config.service_optional_fields;

    other_params.forEach(function (key) {
        var param_key = utils.getDatabaseKeyName(key);
        var param_value = service_data[key];

        if (param_value === null || param_value === undefined) {
            params.Item[param_key] = null;
        } else {
            params.Item[param_key] = param_value;
        }
    });

    // Add new item to database
    docClient.put(params, function (err, data) {
        if (err) {

            // database error
            onComplete({
                "result": "databaseError",
                "message": "Error adding Item to dynamodb " + err.message
            }, null);
        } else {

            // Success!!
            onComplete(null, {
                "result": "success",
                "service_id": service_id.value
            });
        }
    });
};
