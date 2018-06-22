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
    Create a Asset-Catalog entry in dynamodb table
    @module: create.js
    @description: CRUD functions for asset catalog
    @author:
    @version: 1.0
**/

const utils = require("../utils.js"); //Import the utils module.
const Uuid = require("uuid/v4");
const moment = require('moment');

module.exports = (assets_data, asset_table, onComplete) => {
    var docClient = utils.initDocClient();

    var assets_id = Uuid();
    var timestamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss:SSS');
    var params = {
        Item: {
            "ID": assets_id,
            "TIMESTAMP": timestamp
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: asset_table
    };

    Object.keys(assets_data).forEach((key) => {
        var param_key = utils.getDatabaseKeyName(key);
        var param_value = assets_data[key];

        if (!param_value) {
            params.Item[param_key] = null;
        } else {
            params.Item[param_key] = param_value;
        }
    });

    docClient.put(params, (err, data) => {
        if (err) {
            onComplete({
                "result": "databaseError",
                "message": "Error adding Item to dynamodb " + err.message
            }, null);
        } else {
            onComplete(null, {
                "assets_id": assets_id
            });
        }
    });
};