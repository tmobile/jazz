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
		"service": "SERVICE",
		"domain": "DOMAIN",
		"environment": "ENVIRONMENT",
		"asset_type": "ASSET_TYPE",
		"provider": "PROVIDER",
		"provider_id": "PROVIDER_ID",
		"id": "ID",
		"timestamp": "TIMESTAMP"
	}
	// mapping between database field names and keys in the request payload, they might be same for now.
	if (key === keyMap[key]) {
		return keyMap[key];
	} else {
		return key.toUpperCase();
	}
};

var getSchemaKeyName = (key) => {
	if (!key) {
		return null;
	}
	var keyMap = {
		"SERVICE": "service",
		"DOMAIN": "domain",
		"ENVIRONMENT": "environment",
		"ASSET_TYPE": "asset_type",
		"PROVIDER": "provider",
		"PROVIDER_ID": "provider_id"
	}

	if (key === keyMap[key]) {
		return keyMap[key];
	} else {
		return key.toLowerCase();
	}
}

var formatResponse = (service, format) => {
	if (!service) {
		return {};
	}
	var service_obj;

	if (format !== undefined) {
		service_obj = {
			'id': service.ID.S,
			'timestamp': service.TIMESTAMP.S
		};
	} else {
		service_obj = {
			'id': service.ID,
			'timestamp': service.TIMESTAMP
		};
	}

	var parseValue = (value) => {
		var type = Object.keys(value)[0];
		var parsed_value = value[type];
		if (type === 'NULL') {
			return null;
		} else if (type === 'N') {
			return Number(value);
		} else if (type === 'NS') {
			return parsed_value.map(Number);
		} else if (type === 'S') {
			return parsed_value;
		} else if (type === 'SS') {
			return parsed_value;
		} else if (type === 'M') {
			var parsed_value_map = {};
			try {
				Object.keys(parsed_value).forEach((key) => {
					parsed_value_map[key] = parseValue(parsed_value[key]);
				});
			} catch (e) {}
			return parsed_value_map;
		} else if (type === 'L') {
			var parsed_value_list = [];
			try {
				for (var i = 0; i < parsed_value.length; i++) {
					parsed_value_list.push(parseValue(parsed_value[i]));
				}
			} catch (e) {}
			return parsed_value_list;
		} else {
			// probably should be error
			return (parsed_value);
		}
	};
	// "service_required_fields": ["service", "domain", "type", "created_by", "runtime", "status"]
	Object.keys(service).forEach((key) => {
		var key_name = getSchemaKeyName(key);
		var value = service[key];
		if (value !== null && value !== undefined) {
			if (format !== undefined) {
				service_obj[key_name] = parseValue(value);
			} else {
				service_obj[key_name] = value;
			}
		}
	});
	return service_obj;
};


var createFilterExpression = (assets_data) => {

	var asset_type = assets_data.asset_type;
	var filter_expression = {};
	if (asset_type === 's3' || asset_type === 'cloudfront' || asset_type === 'lambda') {
		filter_expression = {
			'service': assets_data.service,
			'domain': assets_data.domain,
			'provider': assets_data.provider,
			'asset_type': asset_type,
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
	Object.keys(input_data).forEach((field) => {
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

var paginateUtil = (data, limit, offset) => {
    var newArr = [];
    if (offset > data.length || offset == data.length || limit === 0) {
        data = [];
    } else if (data.length > limit + offset || data.length === limit + offset) {
        data = data.slice(offset, offset + limit);
    } else if (limit + offset > data.length) {
        data = data.slice(offset, data.length);
    }
    return data;
};

module.exports = {
	initDynamodb,
	initDocClient,
	createFilterExpression,
	toLowercase,
	getDatabaseKeyName,
	formatResponse,
	paginateUtil
};