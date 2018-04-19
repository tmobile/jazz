/**
    Helper functions for Environment
  @module: utils.js
  @description: Defines functions like format the output as per Environment schema etc.
    @author:
    @version: 1.0
**/

var AWS = require("aws-sdk");

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

var isEmpty = function(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) return false;
    }
    return true;
};

var validateInputParams = function (params){
	if(params !== 'undefined' && params !== '' && params !== ' ' && params !== null){
		return true;
	} 
	return false;
}

// convert object returned from the database, as per schema
var formatData = function(data, format) {
    if (data === undefined || data === null) {
        return {};
    }

    var deployment_obj = {};

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

    Object.keys(data).forEach(function(key) {
        var key_name = getSchemaKeyName(key);
        var value = data[key];
        if (value !== null && value !== undefined) {
            if (format !== undefined) {
                deployment_obj[key_name] = parseValue(value);
            } else {
                deployment_obj[key_name] = value;
            }
        }
    });

    return deployment_obj;
};

var getSchemaKeyName = function(key) {
    // Convert database key name back, as per schema

    if (key === undefined || key === null) {
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

var ConvertKeysToLowerCase = function(obj) {
    var output = {};
    for (i in obj) {
        if (Object.prototype.toString.apply(obj[i]) === '[object Object]') {
           output[i.toLowerCase()] = ConvertKeysToLowerCase(obj[i]);
        }else if(Object.prototype.toString.apply(obj[i]) === '[object Array]'){
            output[i.toLowerCase()]=[];
             output[i.toLowerCase()].push(ConvertKeysToLowerCase(obj[i][0]));
        } else {
            output[i.toLowerCase()] = obj[i];
        }
    }
    return output;
};

// function to convert key name in schema to database column name
var getDeploymentDatabaseKeyName = function(key) {
    // Some of the keys in schema may be reserved keywords, so it may need some manipulation

    if (key === undefined || key === null) {
        return null;
    } else if(key === 'service'){
		return 'SERVICE_NAME';
	} else if(key === 'status'){
		return 'DEPLOYMENT_STATUS';
	} else if(key === 'domain'){
		return 'DOMAIN_NAME';
	} else if(key === 'environment'){
		return 'ENVIRONMENT_LOGICAL_ID';
	} else {
		return key.toUpperCase();
	}
};

var trimArchived = function(items){

    var item = [];

    for( var i = 0 ; i < items.length ; i++ ){
        if((items[i].status !== "archived") && (items[i].status !== "deletion_completed")){
            item.push(items[i]);
        }
    }
    return item;
}

var sortUtil = function(data, sort_key, sort_direction) {
    if (sort_key !== undefined && sort_key === "provider_build_id") {
        data = data.sort(function(a, b) {
            var x = parseInt(a[sort_key]);
            var y = parseInt(b[sort_key]);
            if (sort_direction === "asc") return x < y ? -1 : x > y ? 1 : 0;
            else {
                return x < y ? 1 : x > y ? -1 : 0;
            }
        });
    } else if((sort_key !== undefined && sort_key === "created_time")){
        data = data.sort(function(a, b) {
            var val1 = a.timestamp.replace("T", " ");
            var val2 = b.timestamp.replace("T", " ");
            var x = new Date(val1).getTime();
            var y = new Date(val2).getTime();
            if (sort_direction === "asc") return x < y ? -1 : x > y ? 1 : 0;
            else return x < y ? 1 : x > y ? -1 : 0;
        });
    }else{
        data = data.sort(function(a, b) {
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
		validateInputParams: validateInputParams,
		formatData: formatData,
		ConvertKeysToLowerCase: ConvertKeysToLowerCase,
        sortUtil: sortUtil,
        filterUtil: filterUtil,
        paginateUtil: paginateUtil,
        trimArchived : trimArchived
    };
};
