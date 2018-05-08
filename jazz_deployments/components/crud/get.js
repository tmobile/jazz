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
	Get Deployment-Catalog by Deployment_ID from dynamodb table
    @module: get.js
    @description: CRUD functions for Deployment catalog
	@author: 
	@version: 1.0
**/

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

	docClient.query(params, function (err, data) {

		if (err) {
			onComplete(err);
		} else if (data.Items.length) {
			for (var field in data.Items) {
				var DEPLOYMENT_STATUS = data.Items[field].DEPLOYMENT_STATUS;
				if (_.includes(global.config.ARCHIVED_DEPLOYMENT_STATUS, DEPLOYMENT_STATUS)) {
					onComplete({
						result: "deployment_already_deleted_error",
						message: "Cannot get details for archived/missing deployments."
					});
				} else {
					onComplete(null, utils.ConvertKeysToLowerCase(data.Items[0]));
				}
			}
		} else {
			onComplete(null, utils.ConvertKeysToLowerCase(data.Items[0]));
		}
	});
};