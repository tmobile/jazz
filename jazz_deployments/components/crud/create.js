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
    Create a Deployment entry in dynamodb table
    @module: create.js
    @description: CRUD functions for Deployment 
    @author:
    @version: 1.0
**/

const utils = require("../utils.js")(); //Import the utils module.
const moment = require("moment");
const Uuid = require("uuid/v4");
module.exports = (deploymentData, tableName, onComplete) => {
	
	// initialize dynamodb
    var docClient = utils.initDocClient(),
        timestamp = moment().utc().format("YYYY-MM-DDTHH:mm:ss:SSS"),
    deploymentId = Uuid();
		
    var params = {
        Item: {
            DEPLOYMENT_ID: deploymentId,
			CREATED_TIME: timestamp
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: tableName
    };
    
    // Add all properties in input object to the params object
    Object.keys(deploymentData).map(function(key) {
        var param_key = utils.getDeploymentDatabaseKeyName(key);
        var param_value = deploymentData[key];
        if (!param_value) {
            params.Item[param_key] = null;
        } else {
            params.Item[param_key] = param_value;
        }
    });
	
	// Add new item to database
    docClient.put(params, function(err, data) {
        if (err) {
            // database error
            onComplete({
                    result: "databaseError",
                    message: "Error adding Item to dynamodb " + err.message
                }, null );
        } else {
            // Success!!
            onComplete(null, {
                result: "success",
                deployment_id: deploymentId
            });
        }
    });
};
