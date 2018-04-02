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

// Helper functions

// function to convert key name in schema to database column name
var getEnvironmentDatabaseKeyName = function(key) {
    // Some of the keys in schema may be reserved keywords, so it may need some manipulation

    if (key === undefined || key === null) {
        return null;
    }

    if (key === "service") {
        return "SERVICE_NAME";
    } else if (key === "domain") {
        return "SERVICE_DOMAIN";
    } else {
        return "ENVIRONMENT_" + key.toUpperCase();
    }
    //check for timestamp
};

var getSchemaKeyName = function(key) {
    // Convert database key name back, as per schema

    if (key === undefined || key === null) {
        return null;
    }

    if (key === "SERVICE_NAME") {
        return "service";
    } else if (key === "SERVICE_DOMAIN") {
        return "domain";
    } else if (key === "ENVIRONMENT_ID") {
        return "id";
    } else {
        return key.replace(/^(ENVIRONMENT_)/, "").toLowerCase();
    }
};

// convert object returned from the database, as per schema
var formatEnvironment = function(environment, format) {
    if (environment === undefined || environment === null) {
        return {};
    }

    var environment_obj;

    if (format !== undefined) {
        environment_obj = {
            service: environment.SERVICE_NAME.S,
            environment: environment.SERVICE_DOMAIN.S
        };
    } else {
        environment_obj = {
            service: environment.SERVICE_NAME,
            domain: environment.SERVICE_DOMAIN
        };
    }

    var parseValue = function(value) {
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

    Object.keys(environment).forEach(function(key) {
        var key_name = getSchemaKeyName(key);
        var value = environment[key];
        if (value !== null && value !== undefined) {
            if (format !== undefined) {
                environment_obj[key_name] = parseValue(value);
            } else {
                environment_obj[key_name] = value;
            }
        }
    });

    return environment_obj;
};

// initialize document CLient for dynamodb
var initDocClient = function() {
    AWS.config.update({ region: "us-west-2" });
    var docClient = new AWS.DynamoDB.DocumentClient();

    return docClient;
};

var initDynamodb = function() {
    AWS.config.update({ region: "us-west-2" });
    var dynamodb = new AWS.DynamoDB();

    return dynamodb;
};
var sortUtil = function(data, sort_key, sort_direction) {
    if (sort_key !== undefined && sort_key !== "timestamp") {
        data = data.sort(function(a, b) {
            var x = a[sort_key];
            var y = b[sort_key];
            if (sort_direction === "asc") return x < y ? -1 : x > y ? 1 : 0;
            else {
                return x < y ? 1 : x > y ? -1 : 0;
            }
        });
    } else {
        data = data.sort(function(a, b) {
            var val1 = a.timestamp.replace("T", " ");
            var val2 = b.timestamp.replace("T", " ");
            var x = new Date(val1).getTime();
            var y = new Date(val2).getTime();
            if (sort_direction === "asc") return x < y ? -1 : x > y ? 1 : 0;
            else return x < y ? 1 : x > y ? -1 : 0;
        });
    }
    return data;
};

var filterUtil = function(data, filter_value) {
    var newArr = [];
    data.forEach(function(ele) {
        for (var key in ele) {
            var value = "";
            if (typeof ele[key] == "string") value = ele[key].toLowerCase();
            else if (ele[key] !== null && ele[key].length > 0) value = ele[key];

            if (value.indexOf(filter_value.toLowerCase()) !== -1) {
                newArr.push(ele);

                break;
            }
        }
    });
    return newArr;
};

var paginateUtil = function(data, limit, offset) {
    var newArr = [];

    if (data.length - 1 > limit + offset) {
        data = data.slice(offset, offset + limit);
    } else {
        data = data.slice(offset, data.length - 1);
    }
    return data;
};

var isEmpty = function(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) return false;
    }
    return true;
};

module.exports = () => {
    return {
        initDynamodb: initDynamodb,
        initDocClient: initDocClient,
        getEnvironmentDatabaseKeyName: getEnvironmentDatabaseKeyName,
        formatEnvironment: formatEnvironment,
        isEmpty: isEmpty,
        sortUtil: sortUtil,
        filterUtil: filterUtil,
        paginateUtil: paginateUtil
    };
};
