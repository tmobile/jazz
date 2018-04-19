/**
  Delete Deployment details by DEPLOYMENT_ID
  @module: delete.js
  @description: CRUD functions for service catalog
	@author: Sunil Fernandes
	@version: 1.0
**/

const utils = require("../utils.js")(); //Import the utils module.

module.exports = (tableName, deploymentId, onComplete) => {
	
	// initialize docCLient
    var docClient = utils.initDocClient();

    var params = {
        TableName: tableName,
        Key: {
            'DEPLOYMENT_ID': deploymentId
        }
    };

    docClient.delete(params, function(err, data) {
        if (err) {
            onComplete(err);
        } else {
			onComplete(null, { deploymentId: deploymentId});
        }
    });
};
