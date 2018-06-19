 /**
      Search a Asset-Catalog entry in dynamodb table
      @module: postSearch.js
      @description: CRUD functions for asset catalog
      @author:
      @version: 1.0
  **/

 const utils = require("../utils.js"); //Import the utils module.
 const logger = require("../logger.js")(); //Import the logging module.

 module.exports = (query, asset_table, onComplete) => {
     // initialize dynamodb
     var docClient = utils.initDocClient();

     var filter = "";
     var insertAndString = " AND ";
     var attributeValues = {};
     var attributeNames = {};

     var params = {
         TableName: asset_table,
         IndexName: global.global_config.ASSETS_DOMAIN_SERVICE_INDEX,
         KeyConditionExpression: "#d = :service_domain and SERVICE = :service_name",
         ExpressionAttributeValues: {
             ":service_name": query.service,
             ":service_domain": query.domain
         },
         ExpressionAttributeNames: {
             "#d": "DOMAIN"
         }
     };

     var keys_list = global.global_config.ASSET_SEARCH_OPTIONAL_FILTER_PARAMS;

     // Generate filter string
     keys_list.forEach((key) => {
         var key_name = utils.getDatabaseKeyName(key);

         if (query[key] && key_name) {
             filter = filter + key_name + " = :" + key_name + insertAndString;
             params.ExpressionAttributeValues[":" + key_name] = query[key];
         }
     });

     filter = filter.substring(0, filter.length - insertAndString.length); // remove the " AND " at the end

     if (filter) {
         params.FilterExpression = filter;
     }

     logger.debug("Query params generated from the seach request: " + JSON.stringify(params));

     var items = [];
     var queryExecute = (onComplete) => {
         docClient.query(params, (err, data) => {
             if (err) {
                 onComplete(err, null);
             } else {
                 items = items.concat(data.Items);
                 if (data.LastEvaluatedKey) {
                     params.ExclusiveStartKey = data.LastEvaluatedKey;
                     queryExecute(onComplete);
                 } else {
                     var responseObject = items.map(item => utils.formatResponse(item));
                     onComplete(null, responseObject);
                 }
             }
         });
     };
     queryExecute(onComplete);
 };