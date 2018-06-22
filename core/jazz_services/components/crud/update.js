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
    Update Service-Catalog by SERVICE_ID
    @module: update.js
    @description: CRUD functions for service catalog
    @author: 
    @version: 1.0
**/

const utils = require("../utils.js")();

module.exports = (service_id, update_data, onComplete) => {
    // initialize docCLient
    var docClient = utils.initDocClient();

    var params = {
        TableName: global.services_table,
        Key: {
            "SERVICE_ID": service_id
        }
    };

    var keys_list = global.config.service_update_fields;

    var update_exp = "";
    var attributeValues = {};

    // Generate filter string
    keys_list.forEach(function (key) {
        var key_name = utils.getDatabaseKeyName(key);

        if (update_data[key] !== undefined) {
            update_exp = update_exp + key_name + " = :" + key_name + ", ";
            attributeValues[(":" + key_name)] = update_data[key];
        }
    });

    if (update_exp !== "") {
        params.UpdateExpression = "set " + update_exp.substring(0, update_exp.length - 2);
        params.ExpressionAttributeValues = attributeValues;
        params.ReturnValues = "ALL_NEW";

        docClient.update(params, function (err, data) {
            if (err) {
                // database error
                onComplete({
                    "result": "databaseError",
                    "message": "Error Updating Item  " + err.message
                }, null);
            } else {
                var service = utils.formatService(data.Attributes);
                onComplete(null, service);
            }
        });
    } else {
        onComplete(null, null);
    }
};