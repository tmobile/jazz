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

module.exports = (service, domain, environment_id, onComplete) => {
    // initialize docCLient
    var docClient = utils.initDocClient();

    var params;

    if (service && domain && environment_id) {
        params = {
            TableName: global.env_tableName,
            FilterExpression: "SERVICE_NAME = :SERVICE_NAME AND SERVICE_DOMAIN = :SERVICE_DOMAIN AND ENVIRONMENT_LOGICAL_ID = :ENVIRONMENT_LOGICAL_ID",
            ExpressionAttributeValues: {
                ":SERVICE_NAME": service,
                ":SERVICE_DOMAIN": domain,
                ":ENVIRONMENT_LOGICAL_ID": environment_id
            }
        };
    } else if (service && domain && !environment_id) {
        params = {
            TableName: global.env_tableName,
            FilterExpression: "SERVICE_NAME = :SERVICE_NAME AND SERVICE_DOMAIN = :SERVICE_DOMAIN",
            ExpressionAttributeValues: {
                ":SERVICE_NAME": service,
                ":SERVICE_DOMAIN": domain
            }
        };
    }
    
    var items_formatted = [];
    var scanExecute = function(onComplete) {
        docClient.scan(params, function(err, data) {
           
            if (err) {
                onComplete(err);
            } else {

                data.Items.forEach(function(item) {
                    items_formatted.push(utils.formatEnvironment(item));
                });

                if (data.LastEvaluatedKey) {
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    scanExecute(onComplete);
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

    scanExecute(onComplete);
};