/**
Get List of Service-Catalogs
@module: getList.js
@description: CRUD functions for service catalog
@author: Sunil Fernandes
@version: 1.0
 **/

const utils = require("../utils.js")(); //Import the utils module.
const logger = require("../logger.js"); //Import the logging module.

module.exports = (tableName, query, onComplete) => {
    // initialize dynamodb
    var dynamodb = utils.initDynamodb();

    var filter = "";
    var attributeValues = {};

    var insertAndString = " AND ";

    var scanparams = {
        TableName: tableName,
        ReturnConsumedCapacity: "TOTAL",
        Limit: "500"
    };

    if (query !== undefined && query !== null) {
        var keys_list = global.config.required_params.slice(0, global.config.required_params.length);

        //appending the optional_keys list along with required_fields
        if(query.status != null && query.status != undefined){
            keys_list.push("status");
        }else{
            query.status = global.config.ARCHIVED_DEPLOYMENT_STATUS;
            keys_list.push("status");
        }
        // Generate filter string
        keys_list.forEach(function(key) {
            var key_name = utils.getDeploymentDatabaseKeyName(key);

            if((key_name == "DEPLOYMENT_STATUS") && (query.status == global.config.ARCHIVED_DEPLOYMENT_STATUS)){

                if (query[key] !== undefined) {

                    filter = filter + key_name + " <> :" + key_name + insertAndString;
                    attributeValues[":" + key_name] = {
                        S: query[key]
                    };
                    
                }

            }else{

                if (query[key] !== undefined) {
                    filter = filter + key_name + " = :" + key_name + insertAndString;
                    attributeValues[":" + key_name] = {
                        S: query[key]
                    };
                }
        }

        });

    }

    filter = filter.substring(0, filter.length - insertAndString.length); // remove the " AND " at the end

    if (filter !== "") {
        scanparams.FilterExpression = filter;
        scanparams.ExpressionAttributeValues = attributeValues;
    }
   
    var items_formatted = [];

    if(query.limit !== undefined){
        query.limit = ((query.limit > global.config.pagination_defaults.max_limit) ? global.config.pagination_defaults.max_limit : query.limit);
    }else{
        query.limit = global.config.pagination_defaults.limit;
    }
    query.offset = query.offset || global.config.pagination_defaults.offset;

    var scanExecute = function (onComplete) {
        dynamodb.scan(scanparams, function(err, items) {
            var count;
            if (err) {
                onComplete(err);
            } else {
                items.Items.forEach(function(item) {
                    items_formatted.push(utils.formatData(item, true));
                });


                if (items.LastEvaluatedKey) {
					scanparams.ExclusiveStartKey = items.LastEvaluatedKey;
					scanExecute(onComplete);
                } else {
                  if (items_formatted.length > 0) {
                          
                        count = items_formatted.length;

                        items_formatted = utils.sortUtil( items_formatted , global.config.DEPLOYMENTS_SORTING_KEY , global.config.DEPLOYMENTS_SORTING_ORDER );

                        items_formatted = utils.paginateUtil(items_formatted, parseInt(query.limit) , parseInt(query.offset));
    
                  }

                    var obj = {
                        count: count,
                        deployments: items_formatted
                    };
                    logger.info("Database Result:" + JSON.stringify(obj));
                    onComplete(null, obj);
                }
            }
        });
    }
    scanExecute(onComplete);
};
