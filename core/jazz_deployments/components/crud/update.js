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
    Update Deployment details by DEPLOYMENT_ID
    @module: update.js
    @description: CRUD functions for deployments catalog
    @author: 
    @version: 1.0
**/

const utils = require("../utils.js"); //Import the utils module.

module.exports = (deploymentData, tableName, deploymentId, onComplete) => {

    // initialize docCLient
    var docClient = utils.initDocClient(),
        params = {
            TableName: tableName,
            Key: {
                'DEPLOYMENT_ID': deploymentId
            }
        },
        update_exp = "",
        attributeValues = {};

    // Add all properties in input object to the params object
    Object.keys(deploymentData).map((key) => {
        var param_key = utils.getDeploymentDatabaseKeyName(key);
        var param_value = deploymentData[key];

        if (param_value) {
            update_exp = update_exp + param_key + " = :" + param_key + ", ";
            attributeValues[":" + param_key] = param_value;
        }
    });

    if (update_exp) {
        params.UpdateExpression = "set " + update_exp.substring(0, update_exp.length - 2);
        params.ExpressionAttributeValues = attributeValues;
        params.ReturnValues = "ALL_NEW";
        docClient.update(params, (err, data) => {
            if (err) {
                // database error
                onComplete({
                        result: "databaseError",
                        message: "Error Updating Item  " + err.message
                    },
                    null
                );
            } else {
                onComplete(null, data);
            }
        });
    } else {
        onComplete(null, null);
    }
};