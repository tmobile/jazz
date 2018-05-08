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
    Helper functions for Environment
    @module: utils.js
    @description: Defines functions like format the output as per Environment schema etc.
    @author:
    @version: 1.0
**/

var AWS = require("aws-sdk");

// initialize document CLient for dynamodb
var initDocClient = function () {
    AWS.config.update({
        region: global.config.ddb_region
    });
    var docClient = new AWS.DynamoDB.DocumentClient();

    return docClient;
};

var initDynamodb = function () {
    AWS.config.update({
        region: global.config.ddb_region
    });
    var dynamodb = new AWS.DynamoDB();

    return dynamodb;
};

var isEmpty = function (obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) return false;
    }
    return true;
};

// convert object returned from the database, as per schema
var formatData = function (data, format) {
    if (!data) {
        return {};
    }

    var deployment_obj = {};

    var parseValue = function (value) {
        var type = Object.keys(value)[0];
        var parsed_value = value[type];
        if (type === "NULL") {
            return null;
        } else if (type === "N") {
            return Number(value);
        } else if (type === "NS") {
            return parsed_value.map(Number);
        } else if (type === "S") {
            return parsed_value;
        } else if (type === "SS") {
            return parsed_value;
        } else if (type === "L") {
            var parsed_value_list = [];
            try {
                for (var i = 0; i < parsed_value.length; i++) {
                    parsed_value_list.push(parseValue(parsed_value[i]));
                }
            } catch (e) {}
            return parsed_value_list;
        } else {
            // probably should be error
            return parsed_value;
        }
    };

    Object.keys(data).map(function (key) {
        var key_name = getSchemaKeyName(key);
        var value = data[key];
        if (value) {
            if (format) {
                deployment_obj[key_name] = parseValue(value);
            } else {
                deployment_obj[key_name] = value;
            }
        }
    });

    return deployment_obj;
};

var getSchemaKeyName = function (key) {
    // Convert database key name back, as per schema

    if (!key) {
        return null;
    }

    if (key === "SERVICE_NAME") {
        return "service";
    } else if (key === "DEPLOYMENT_STATUS") {
        return "status";
    } else if (key === "DOMAIN_NAME") {
        return "domain";
    } else {
        return key.toLowerCase();
    }
};

var ConvertKeysToLowerCase = function (obj) {
    var output = {};
    for (i in obj) {
        if (Object.prototype.toString.apply(obj[i]) === '[object Object]') {
            output[i.toLowerCase()] = ConvertKeysToLowerCase(obj[i]);
        } else if (Object.prototype.toString.apply(obj[i]) === '[object Array]') {
            output[i.toLowerCase()] = [];
            output[i.toLowerCase()].push(ConvertKeysToLowerCase(obj[i][0]));
        } else {
            output[i.toLowerCase()] = obj[i];
        }
    }
    return output;
};

// function to convert key name in schema to database column name
var getDeploymentDatabaseKeyName = function (key) {
    // Some of the keys in schema may be reserved keywords, so it may need some manipulation

    if (!key) {
        return null;
    } else if (key === 'service') {
        return 'SERVICE_NAME';
    } else if (key === 'status') {
        return 'DEPLOYMENT_STATUS';
    } else if (key === 'domain') {
        return 'DOMAIN_NAME';
    } else if (key === 'environment') {
        return 'ENVIRONMENT_LOGICAL_ID';
    } else {
        return key.toUpperCase();
    }
};

var trimArchived = function (items) {

    var item = [];

    for (var i = 0; i < items.length; i++) {
        if ((items[i].status !== "archived") && (items[i].status !== "deletion_completed")) {
            item.push(items[i]);
        }
    }
    return item;
}

var sortUtil = function (data, sort_key, sort_direction) {
    if (sort_key && sort_key === "provider_build_id") {
        data = data.sort(function (a, b) {
            var x = parseInt(a[sort_key]);
            var y = parseInt(b[sort_key]);
            if (sort_direction === "asc") return x < y ? -1 : x > y ? 1 : 0;
            else {
                return x < y ? 1 : x > y ? -1 : 0;
            }
        });
    } else if ((sort_key && sort_key === "created_time")) {
        data = data.sort(function (a, b) {
            var val1 = a.timestamp.replace("T", " ");
            var val2 = b.timestamp.replace("T", " ");
            var x = new Date(val1).getTime();
            var y = new Date(val2).getTime();
            if (sort_direction === "asc") return x < y ? -1 : x > y ? 1 : 0;
            else return x < y ? 1 : x > y ? -1 : 0;
        });
    } else {
        data = data.sort(function (a, b) {
            var x = a[sort_key];
            var y = b[sort_key];
            if (sort_direction === "asc") return x < y ? -1 : x > y ? 1 : 0;
            else {
                return x < y ? 1 : x > y ? -1 : 0;
            }
        });
    }
    return data;
};

var filterUtil = function (data, filter_value) {
    var newArr = [];
    data.map(function (ele) {
        for (var key in ele) {
            var value = "";
            if (typeof ele[key] == "string") value = ele[key].toLowerCase();
            else if (ele[key] && ele[key].length > 0) value = ele[key];

            if (value.indexOf(filter_value.toLowerCase()) !== -1) {
                newArr.push(ele);

                break;
            }
        }
    });
    return newArr;
};

var paginateUtil = function (data, limit, offset) {
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


module.exports = () => {
    return {
        initDynamodb: initDynamodb,
        initDocClient: initDocClient,
        isEmpty: isEmpty,
        getDeploymentDatabaseKeyName: getDeploymentDatabaseKeyName,
        formatData: formatData,
        ConvertKeysToLowerCase: ConvertKeysToLowerCase,
        sortUtil: sortUtil,
        filterUtil: filterUtil,
        paginateUtil: paginateUtil,
        trimArchived: trimArchived
    };
};