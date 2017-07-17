/**
	Delete Service by SERVICE_ID
  @module: delete.js
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

    docClient.delete(params, function(err, data) {
        if (err) {
            onComplete(err);
        } else {
            onComplete(null, { service_id: service_id });
        }
    });
};
