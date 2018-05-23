 /**
    Search a Asset-Catalog entry in dynamodb table
    @module: postSearch.js
    @description: CRUD functions for asset catalog
    @author: Rashmi Chachan
    @version: 1.0
**/

const utils = require("../utils.js")(); //Import the utils module.
const logger = require("../logger.js"); //Import the logging module.
var _validate = require('./validate.js')();
const async = require('async');

var search = function (query, onComplete){
    // initialize dynamodb
    var docClient = utils.initDocClient();

    var filter = "";
    var insertAndString = " AND ";
    var attributeValues = {};
    var attributeNames = {};

    var params = {
        TableName: global.assets_table,
        IndexName: global.global_config.ASSETS_DOMAIN_SERVICE_INDEX,
        KeyConditionExpression: "#d = :service_domain and service = :service_name",
        ExpressionAttributeValues: {
            ":service_name": query.service,
            ":service_domain": query.domain
        },
        ExpressionAttributeNames: {
            "#d": "domain"
        }
    };

    var keys_list = global.global_config.ASSET_SEARCH_OPTIONAL_FILTER_PARAMS;

    // Generate filter string
    keys_list.forEach(function(key) {
        var key_name = utils.getDatabaseKeyName(key);

        if (query[key] && key_name) {

            if (key_name === "type") {
                // hack - to be removed: special case to deal with reserved keyword - 'type'
                filter = filter + " #asset_type = :" + key_name + insertAndString;
                params.ExpressionAttributeNames["#asset_type"] = key_name;
            } else {
                filter = filter + key_name + " = :" + key_name + insertAndString;
            }
            params.ExpressionAttributeValues[":" + key_name] = query[key];
        }
    });
    
    filter = filter.substring(0, filter.length - insertAndString.length); // remove the " AND " at the end

    if (filter) {
        params.FilterExpression = filter;
    }
	
    logger.debug("Query params generated from the seach request: " + JSON.stringify(params));

    var items = [];
	var queryExecute = function (onComplete) {
		docClient.query(params, function(err, data) {
			if (err) {
				onComplete(err,null);
			} else {
				items = items.concat(data.Items);
				if (data.LastEvaluatedKey) {
					params.ExclusiveStartKey = data.LastEvaluatedKey;
					queryExecute(onComplete);
				} else {					
					onComplete(null, items);
				}
			}
		});
	};
	queryExecute(onComplete);
};

var validateAndSearch = function(assets_data,onComplete){
	assets_data = utils.toLowercase(assets_data);
	
    async.series({
        validateIsEmptyInputData: function(onComplete) {
             _validate.validateIsEmptyInputData(assets_data, onComplete);
        },
        validateEmptyFieldsVal: function(onComplete) {
             _validate.validateEmptyFieldsVal(assets_data, onComplete);
        },
        fetchAssets: function(onComplete) {
            search(assets_data, onComplete);
        }
    }, function(error, data) {
        if (error) {
            logger.error(JSON.stringify(error));
            onComplete(error);            
        }else{
            logger.debug(JSON.stringify(data));
            var searchAsset = data.fetchAssets;           
            onComplete(null, searchAsset);
        }
        
    });
};

module.exports = () => {
     return {
        validateAndSearch: validateAndSearch
    };
};
