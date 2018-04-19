/**
    Create a Deployment entry in dynamodb table
    @module: create.js
    @description: CRUD functions for Deployment 
    @author: ARadhak2
    @version: 1.0
**/

const utils = require("../utils.js")(); //Import the utils module.
const moment = require("moment");

module.exports = (deploymentData, tableName, deploymentId, onComplete) => {
	
	// initialize dynamodb
    var docClient = utils.initDocClient(),
		timestamp = moment().utc().format("YYYY-MM-DDTHH:mm:ss:SSS");
		
    var params = {
        Item: {
            DEPLOYMENT_ID: deploymentId,
			CREATED_TIME: timestamp
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: tableName
    };	

    // Add all properties in input object to the params object
    Object.keys(deploymentData).forEach(function(key) {
        var param_key = utils.getDeploymentDatabaseKeyName(key);
        var param_value = deploymentData[key];

        if (param_value === null || param_value === undefined) {
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
