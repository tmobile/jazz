const utils = require("../utils.js")(); //Import the utils module.
const _ = require("lodash");

module.exports = (tableName, deploymentId, onComplete) => {
	
	// initialize docCLient
    var docClient = utils.initDocClient(),
		params = {
			TableName: tableName,
			KeyConditionExpression: "DEPLOYMENT_ID = :id",
			ExpressionAttributeValues: {
				":id": deploymentId
			}
		};
	
    docClient.query(params, function(err, data) {
		
		if(err){
			onComplete(err);
		}else if( data.Items.length !== 0 ){
			for(var field in data.Items){
				var DEPLOYMENT_STATUS = data.Items[field].DEPLOYMENT_STATUS;
				if(_.includes(global.config.ARCHIVED_DEPLOYMENT_STATUS , DEPLOYMENT_STATUS )){
					onComplete({ result: "deployment_already_deleted_error", message: "Cannot get details for archived/missing deployments." });
				}else{
					onComplete(null, utils.ConvertKeysToLowerCase(data.Items[0]));
				}
			}
		}else{		
				onComplete(null, utils.ConvertKeysToLowerCase(data.Items[0]));
			}
    });
};
