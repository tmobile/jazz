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
    Update Asset-Catalog by id
    @module: update.js
    @description: CRUD functions for asset catalog
    @author:
    @version: 1.0
**/

const utils = require("../utils.js"); //Import the utils module.

module.exports = (assets_id, update_data, asset_table, onComplete) => {
    var docClient = utils.initDocClient();
    var params = {
        TableName: asset_table,
        Key: {
            "ID": assets_id
        }
    };

    var keys_list = global.global_config.ASSETS_EDITABLE_FIELDS;
    var update_exp = "";
    var attributeValues = {};
    var attributeNames = {};
    var count = 0;
    keys_list.forEach((key) => {
        var key_name = utils.getDatabaseKeyName(key);
        if (Object.keys(update_data).indexOf(key) > -1) {
            update_exp = update_exp + '#key' + count + ' = :' + key_name + ", ";
            attributeValues[(":" + key_name)] = update_data[key];
            attributeNames[("#key" + count)] = key_name;
            count++;
        }
    });
    if (update_exp) {
        params.UpdateExpression = "set " + update_exp.substring(0, update_exp.length - 2);
        params.ExpressionAttributeValues = attributeValues;
        params.ExpressionAttributeNames = attributeNames;
        params.ReturnValues = "ALL_NEW";

        docClient.update(params, (err, data) => {
            if (err) {
                onComplete(err);
            } else {
                onComplete(null, {
                    data: utils.formatResponse(data.Attributes),
                    input: update_data
                });
            }
        });
    } else {
        onComplete(null, null);
    }
};