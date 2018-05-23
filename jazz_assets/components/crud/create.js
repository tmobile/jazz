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

const utils = require("../utils.js")(); //Import the utils module.
const Guid = require("guid");
const moment = require('moment');
const logger = require("../logger.js"); //Import the logging module.
var _postSearch = require('./postSearch.js')();
var _validate = require('./validate.js')();
const async = require('async');

var postCreate = function(assets_data, onComplete){
    var docClient = utils.initDocClient();

    var assets_id = Guid.create();
    var timestamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss:SSS');
    var params = {
        Item: {
            "id": assets_id.value,
            "timestamp": timestamp
			},
        ReturnConsumedCapacity: "TOTAL",
        TableName: global.assets_table
    };

    Object.keys(assets_data).forEach(function(key) {
        var param_key = key;
        var param_value = assets_data[key];
		
        if (!param_value) {
            params.Item[param_key] = null;
        } else {
			params.Item[param_key] = param_value;
        }
    });

   docClient.put(params, function(err, data) {
        if (err) {
            onComplete({
                "result": "databaseError",
                "message": "Error adding Item to dynamodb " + err.message
            }, null);
        } else {
			onComplete(null, {
                "assets_id": assets_id.value
            });
        }
    });
};

var validateAndCreate = function(assets_data, onComplete){
	assets_data = utils.toLowercase(assets_data);
    async.series({
        validateIsEmptyInputData: function(onComplete) {
            _validate.validateIsEmptyInputData(assets_data, onComplete);
        },        
        validateUnAllowedFieldsInInput: function(onComplete) {
            var allowed_fields = global.global_config.ASSETS_FIELDS;
            _validate.validateUnAllowedFieldsInInput(assets_data, allowed_fields, onComplete);
        },
        validateAllRequiredFields: function(onComplete) { //TO validate every required fields are there in the request
            var required_fields = global.global_config.ASSETS_CREATION_REQUIRED_FIELDS;
            _validate.validateAllRequiredFields(assets_data, required_fields, onComplete);
        },
        validateInputFieldTypes: function(onComplete) {
            _validate.validateInputFieldTypes(assets_data, onComplete);
        },
		validateEnumValues: function(onComplete) {
            _validate.validateEnumValues(assets_data, onComplete);
        },
        validateAssetExists: function(onComplete) {
			var filter_expression = utils.createFilterExpression(assets_data);			
            _postSearch.validateAndSearch(filter_expression, function onServiceGet(error, data) {
                if (error) {
                    onComplete(error, null);
                } else {
                    if (data.length > 0) {
                        logger.debug('Asset with given data already exists.');
                        onComplete({
                            "result": "inputError",
                            "message": "Asset with given data already exists."
                        });                    
                    } else {
                        onComplete(null, {
                            "result": "success",
                            "message": "Valid asset field combination"
                        });
                    }
                }
            });
        },
        addNewAsset: function(onComplete) {
            postCreate(assets_data, onComplete);
        }
    }, function(error, data) {
        
        if (error) {
            logger.error(JSON.stringify(error));
            onComplete(error);
        }
        else{
            logger.debug(JSON.stringify(data));
            var createdNewAsset = data.addNewAsset;            
            onComplete(null, createdNewAsset);
        }
    });
};
module.exports = () => {
    return {
        validateAndCreate: validateAndCreate
    };
};
