/**
  Update Deployment details by DEPLOYMENT_ID
  @module: update.js
  @description: CRUD functions for service catalog
    @author: Sidd
    @version: 1.0
**/

const utils = require("../utils.js")(); //Import the utils module.

module.exports = (deploymentData, tableName, deploymentId, onComplete) => {
	
	// initialize docCLient
    var docClient = utils.initDocClient();

    var params = {
        TableName: tableName,
        Key: {
            'DEPLOYMENT_ID': deploymentId
        }
    };

    var update_exp = "";
    var attributeValues = {};

    // Add all properties in input object to the params object
    Object.keys(deploymentData).forEach(function(key) {
        var param_key = utils.getDeploymentDatabaseKeyName(key);
        var param_value = deploymentData[key];

        if (param_value !== undefined) {
            update_exp = update_exp + param_key + " = :" + param_key + ", ";
            attributeValues[":" + param_key] = param_value;
        }
    });

    if (update_exp !== "") {
        params.UpdateExpression = "set " + update_exp.substring(0, update_exp.length - 2);
        params.ExpressionAttributeValues = attributeValues;
        params.ReturnValues = "ALL_NEW";
		docClient.update(params, function(err, data) {
            if (err) {
                // database error
                onComplete(
                    {
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
