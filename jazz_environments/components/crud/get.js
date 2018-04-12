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
	Get Environment-Catalog by ENVIRONMET_ID from dynamodb table
    @module: get.js
    @description: CRUD functions for Environment catalog
	@author: 
	@version: 1.0
**/
const utils = require("../utils.js")(); //Import the utils module.
const logger = require("../logger.js"); //Import the logging module.

module.exports = (indexName, service, domain, environment_id, onComplete) => {
    // initialize docCLient
    var docClient = utils.initDocClient();

    var params;

    if (service && domain && environment_id) {
        params = {
            TableName: global.env_tableName,
            IndexName: indexName,
            FilterExpression: "ENVIRONMENT_LOGICAL_ID = :ENVIRONMENT_LOGICAL_ID",
            KeyConditionExpression: "SERVICE_DOMAIN = :SERVICE_DOMAIN and SERVICE_NAME  = :SERVICE_NAME",
            ExpressionAttributeValues: {
                ":SERVICE_NAME": service,
                ":SERVICE_DOMAIN": domain,
                ":ENVIRONMENT_LOGICAL_ID": environment_id
            }
        };
    } else if (service && domain && !environment_id) {
        params = {
            TableName: global.env_tableName,
            IndexName: indexName,
            KeyConditionExpression: "SERVICE_DOMAIN = :SERVICE_DOMAIN and SERVICE_NAME  = :SERVICE_NAME",
            ExpressionAttributeValues: {
                ":SERVICE_NAME": service,
                ":SERVICE_DOMAIN": domain
            }
        };
    } else {
        onComplete("Not enough inputs to get environment details");
    }
    
    logger.info("Scan Prams: " + JSON.stringify(params));

    var items_formatted = [];
    var queryExecute = function(onComplete) {
        docClient.query(params, function(err, data) {
            if (err) {
                onComplete(err);
            } else {

                data.Items.forEach(function(item) {
                    items_formatted.push(utils.formatEnvironment(item));
                });

                if (data.LastEvaluatedKey) {
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    queryExecute(onComplete);
                } else {
                    var obj = {
                        count: items_formatted.length,
                        environment: items_formatted
                    };
                    onComplete(null, obj);
                }
            }
        });
    };

    queryExecute(onComplete);
};