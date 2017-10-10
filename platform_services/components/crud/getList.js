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
	@author: Sunil Fernandes
	@version: 1.0
**/

const utils = require("../utils.js")(); //Import the utils module.


module.exports = (query, onComplete) => {
    // initialize dynamodb
    var dynamodb = utils.initDynamodb();

    var filter = "";
    var attributeValues = {};

    var scanparams = {
        "TableName": global.services_table,
        "ReturnConsumedCapacity": "TOTAL",
        "Limit": "500"
    };

    if (query !== undefined && query !== null) {
        // var keys_list = ['service', 'domain', 'region', 'type', 'runtime', 'created_by'];
        var keys_list = global.config.service_filter_params;

        // Generate filter string
        keys_list.forEach(function(key) {
            var key_name = utils.getDatabaseKeyName(key);

            if (query[key] !== undefined) {
                filter = filter + key_name + " = :" + key_name + " AND ";
                attributeValues[(":" + key_name)] = {
                    'S': query[key]
                };
            }
        });


        if (filter !== "") {
            scanparams.FilterExpression = filter.substring(0, filter.length - 5); // remove the " AND " at the end
            scanparams.ExpressionAttributeValues = attributeValues;
        }
    }

    dynamodb.scan(scanparams, function(err, items) {
        if (err) {
            onComplete(err);
        } else {
            var items_formatted = [];

            items.Items.forEach(function(item) {
                items_formatted.push(utils.formatService(item, true));
                // items_formatted.push(item);
            });

            onComplete(null, items_formatted);
        }
    });
};
