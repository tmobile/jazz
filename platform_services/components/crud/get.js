/**
	Get Service-Catalog by SERVICE_ID from dynamodb table
  @module: get.js
  @description: CRUD functions for service catalog
	@author: Sunil Fernandes
	@version: 1.0
**/

const utils = require("../utils.js")(); //Import the utils module.


module.exports = (service_id, onComplete) => {
    // initialize docCLient
    var docClient = utils.initDocClient();

    var params = {
        TableName: global.services_table,
        Key: {
            "SERVICE_ID": service_id
        }
    };


    docClient.get(params, function(err, data) {
        if (err) {
            onComplete(err);
        } else {
            var service = utils.formatService(data.Item);
            onComplete(null, service);
        }
    });
};
