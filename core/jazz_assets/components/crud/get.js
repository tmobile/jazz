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
    Get Assets-Catalog by id from dynamodb table
    @module: get.js
    @description: CRUD functions for assets catalog
	  @author: 
    @version: 1.0
**/

const utils = require("../utils.js"); //Import the utils module.
const logger = require("../logger.js")(); //Import the logging module.

module.exports = (assets_id, asset_table, onComplete) => {
    // initialize docCLient
    var docClient = utils.initDocClient();

    var params = {
        TableName: asset_table
    };
    var callBack = (err, data) => {
        if (err) {
            onComplete(err);
        } else {
            var responseData = (data.Item) ? utils.formatResponse(data.Item) : (data.Items).map(item => utils.formatResponse(item));
            if (Object.keys(responseData).length === 0) {
                logger.debug('Invalid asset with id: ' + assets_id);
                onComplete({
                    "result": "notFoundError",
                    "message": 'Invalid asset with id: ' + assets_id
                });
            } else {
                logger.debug('onComplete get responseData are : ' + JSON.stringify(responseData));
                onComplete(null, responseData);
            }
        }
    };
    if (assets_id) {
        params.Key = {
            "ID": assets_id
        };
        docClient.get(params, (err, data) => {
            callBack(err, data);
        });
    } 
};