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
