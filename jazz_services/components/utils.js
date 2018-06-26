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
    Helper functions for Service-Catalog
    @module: utils.js
    @description: Defines functions like format the output as per Service-Catalog schema etc.
    @author:
    @version: 1.0
**/


const AWS = require('aws-sdk');

// function to convert key name in schema to database column name
var getDatabaseKeyName = function (key) {
    // Some of the keys in schema may be reserved keywords, so it may need some manipulation

    if (key === undefined || key === null) {
        return null;
    }

    if (key === 'service') {
        return 'SERVICE_NAME';
    } else {
        return 'SERVICE_' + key.toUpperCase();
    }
};

var getSchemaKeyName = function (key) {
    // Convert database key name back, as per schema

    if (key === undefined || key === null) {
        return null;
    }

    if (key === "SERVICE_NAME") {
        return "service";
    } else if (key === "TIMESTAMP") {
        return "timestamp";
    } else if (key === "SERVICE_ID") {
        return "id";
    } else {
        return key.replace(/^(SERVICE_)/, "").toLowerCase();
    }
};

// convert object returned from the database, as per schema
var formatService = function (service, format) {
    if (service === undefined || service === null) {
        return {};
    }
    var service_obj;

    if (format !== undefined) {
        service_obj = {
            'id': service.SERVICE_ID.S,
            'timestamp': service.TIMESTAMP.S
        };
    } else {
        service_obj = {
            'id': service.SERVICE_ID,
            'timestamp': service.TIMESTAMP
        };
    }

    var parseValue = function (value) {
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
                Object.keys(parsed_value).forEach(function (key) {
                    parsed_value_map[key] = parseValue(parsed_value[key]);
                });
            } catch (e) { }
            return parsed_value_map;
        } else if (type === 'L') {
            var parsed_value_list = [];
            try {
                for (var i = 0; i < parsed_value.length; i++) {
                    parsed_value_list.push(parseValue(parsed_value[i]));
                }
            } catch (e) { }
            return parsed_value_list;
        } else {
            // probably should be error
            return (parsed_value);
        }
    };
    // "service_required_fields": ["service", "domain", "type", "created_by", "runtime", "status"]
    Object.keys(service).forEach(function (key) {
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

// initialize document CLient for dynamodb
var initDocClient = function () {
    AWS.config.update({ region: global.config.ddb_region });
    var docClient = new AWS.DynamoDB.DocumentClient();

    return docClient;
};

var initDynamodb = function () {
    AWS.config.update({ region: global.config.ddb_region });
    var dynamodb = new AWS.DynamoDB();

    return dynamodb;
};

//Assigning null to empty string as DynamoDB doesnot allow empty string.
//But our usecase needs empty string for updation
var getUpdateData = function (update_data) {
    var input_data = {};
    for (var field in update_data) {
        if (update_data[field] === "" || update_data[field] === undefined) {
            input_data[field] = null;
        } else if (update_data[field] && update_data[field].constructor === Array) {
            var array = update_data[field];
            if (array.length > 0) {
                var new_array = [];
                for (var i = 0; i < array.length; i++) {
                    if (array[i]) {
                        new_array.push(array[i]);
                    }
                }
                input_data[field] = new_array;
            } else {
                input_data[field] = [];
            }
        } else {
            input_data[field] = update_data[field];
        }
    }
    return input_data;
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

var sortUtil = function (data, sort_key, sort_direction) {
    if (sort_key !== undefined && sort_key !== "timestamp") {
        data = data.sort(function (a, b) {
            var x = a[sort_key];
            var y = b[sort_key];
            if (sort_direction === "asc") return x < y ? -1 : x > y ? 1 : 0;
            else {
                return x < y ? 1 : x > y ? -1 : 0;
            }
        });
    } else {
        data = data.sort(function (a, b) {
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

var filterUtil = function (data, filter_value) {
    var newArr = [];
    data.forEach(function (ele) {
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


module.exports = () => {
    return {
        initDynamodb: initDynamodb,
        initDocClient: initDocClient,
        getDatabaseKeyName: getDatabaseKeyName,
        formatService: formatService,
        sortUtil: sortUtil,
        filterUtil: filterUtil,
        getUpdateData: getUpdateData,
        paginateUtil: paginateUtil
    };
};
