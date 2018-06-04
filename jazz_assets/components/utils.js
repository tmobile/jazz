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
    Helper functions for Assets-Catalog
    @module: utils.js
    @description: Defines functions like format the output as per Assets-Catalog schema etc.
    @author: 
    @version: 1.0
**/


const AWS = require('aws-sdk');

// initialize document CLient for dynamodb
var initDocClient = () => {
	AWS.config.update({
		region: global.config.DDB_REGION
	});
	var docClient = new AWS.DynamoDB.DocumentClient();

	return docClient;
};

var initDynamodb = () => {
	AWS.config.update({
		region: global.config.DDB_REGION
	});
	var dynamodb = new AWS.DynamoDB();

	return dynamodb;
};

var getDatabaseKeyName = (key) => {
	if (!key) {
		return null;
	}
	var keyMap = {
		"service": "service",
		"domain": "domain",
		"environment": "environment",
		"type": "type",
		"provider": "provider",
		"provider_id": "provider_id"
	}
	// mapping between database field names and keys in the request payload, they might be same for now.
	if (key === keyMap[key]) {
		return keyMap[key];
	} else {
		return null
	}
};


var createFilterExpression = (assets_data) => {

	var asset_type = assets_data.type;
	var filter_expression = {};
	if (asset_type === 's3' || asset_type === 'cloudfront' || asset_type === 'lambda') {
		filter_expression = {
			'service': assets_data.service,
			'domain': assets_data.domain,
			'provider': assets_data.provider,
			'type': asset_type,
			'environment': assets_data.environment
		};
	} else {
		filter_expression = {
			'service': assets_data.service,
			'domain': assets_data.domain,
			'provider': assets_data.provider,
			'provider_id': assets_data.provider_id
		};
	}
	return filter_expression;
};

var toLowercase = (input_data) => {
	var asset_data = {};
	Object.keys(input_data).map((field) => {
		if (input_data[field] && input_data[field].constructor !== Array) {
			if (global.global_config.CASE_SENSITIVE_FIELDS.indexOf(field.toLowerCase()) > -1) {
				asset_data[field.toLowerCase()] = input_data[field].toLowerCase();
			} else {
				asset_data[field.toLowerCase()] = input_data[field];
			}
		} else if (input_data[field] && input_data[field].constructor === Array) {
			asset_data[field.toLowerCase()] = input_data[field];
		} else if (!input_data[field]) {
			asset_data[field.toLowerCase()] = null;
		}
	});
	return asset_data;
};

module.exports = () => {
	return {
		initDynamodb: initDynamodb,
		initDocClient: initDocClient,
		createFilterExpression: createFilterExpression,
		toLowercase: toLowercase,
		getDatabaseKeyName: getDatabaseKeyName
	};
};