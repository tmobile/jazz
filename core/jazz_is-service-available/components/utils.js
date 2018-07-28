/**
    Helper functions for Service-Catalog
  @module: utils.js
  @description: Defines functions like format the output as per Service-Catalog schema etc.
    @author:
    @version: 1.0
**/
const AWS = require('aws-sdk');

var initDynamodb = function() {
  AWS.config.update({
    region: global.config.REGION
  });
  var dynamodb = new AWS.DynamoDB();

  return dynamodb;
};

var isServiceExists = function(query, onComplete) {
    var dynamodb = initDynamodb();

    var attributeValues = {};

    var scanparams = {
        "TableName": global.config.SERVICES_TABLE,
        "ReturnConsumedCapacity": "TOTAL"
    };

    var service_key = 'SERVICE_NAME';
    var domain_key = 'SERVICE_DOMAIN';

    var filter = service_key + " = :" + service_key;
    attributeValues[(":" + service_key)] = {
        'S': query.service
    };

    filter += " AND " + domain_key + " = :" + domain_key;
    attributeValues[(":" + domain_key)] = {
        'S': query.domain
    };

    scanparams.FilterExpression = filter;
    scanparams.ExpressionAttributeValues = attributeValues;

    dynamodb.scan(scanparams, function(error, items) {
        if (error) {
            return onComplete(error);
        } else {
            var obj = {};
            obj.isExists = items.Items.length > 0;

            return onComplete(null, obj);
        }
    });
};

module.exports = () => {
  return {
    initDynamodb: initDynamodb,
    isServiceExists: isServiceExists
  };
};
