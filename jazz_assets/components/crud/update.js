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
const logger = require("../logger.js"); //Import the logging module.
var _get = require('./get.js');
var _validate = require('./validate.js')();
const utils = require("../utils.js")(); //Import the utils module.
const _ = require("lodash");
const async = require('async');

var getUpdate = function(assets_id, update_data, onComplete){
    var docClient = utils.initDocClient();
    var params = {
        TableName: global.assets_table,
        Key: {
            "id": assets_id
        }
    };

    var keys_list = global.global_config.ASSETS_EDITABLE_FIELDS;
    var update_exp = "";
    var attributeValues = {};
    var attributeNames = {};
    var count = 0;
    keys_list.forEach(function(key) {
        var key_name = key;		
		if(_.includes(_.keys(update_data), key)){
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

        docClient.update(params, function(err, data) {
            if (err) {
                onComplete(err);
            } else {
                onComplete(null, data.Attributes);
            }
        });
    } else {
        onComplete(null, null);
    }
};
var validateAssetsExistsById = function (assets_id, onComplete){
    _get(assets_id, 
        function onAssetGet(error, data) {
            if (error) {
                onComplete(error, null);
            } else {
                onComplete(null, {
                    "result": "success",
                    "input": "asset exists"
                });
            }
        });
};

var validateAndUpdate = function(assets_id, update_data, onComplete){    
	update_data = utils.toLowercase(update_data);
	async.series({
        validateAssetsExists: function(onComplete) {
            validateAssetsExistsById(assets_id, onComplete);
        },
        validateIsEmptyInputData: function(onComplete) {
            _validate.validateIsEmptyInputData(update_data, onComplete);
        },
        validateInputFieldTypes: function(onComplete) {
            _validate.validateInputFieldTypes(update_data, onComplete);
        },
		validateEnumValues: function(onComplete) {
            _validate.validateEnumValues(update_data, onComplete);
        },
        updateAssetsByID: function(onComplete) {
            logger.debug('Update data ' + JSON.stringify(update_data));
            if (update_data) {
                getUpdate(assets_id, update_data, onComplete);
            } else {
                onComplete(null, null);
            }
        }
    }, function(error, data) {
        if (error) {
            logger.error(JSON.stringify(error));
            onComplete(error);
        }
        else{
            logger.debug(JSON.stringify(data));
            var updatedAsset = data.updateAssetsByID;
            onComplete(null, { 'message': 'Successfully Updated asset with id: ' + assets_id, 'updatedAsset': updatedAsset });
        }

    });
};
module.exports = () => {
    return {
        validateAndUpdate: validateAndUpdate
    };
};
