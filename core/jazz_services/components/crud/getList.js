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
	Get List of Service-Catalogs
    @module: getList.js
    @description: CRUD functions for service catalog
	@author:
	@version: 1.0
**/

const utils = require("../utils.js")();
const _ = require("lodash");

module.exports = (query, getAllRecords, servicesList, onComplete) => {
    // initialize dynamodb
    var dynamodb = utils.initDynamodb();

    var filter = "";
    var attributeValues = {};
    var insertAnd = " AND ";

    var scanparams = {
        "TableName": global.services_table,
        "ReturnConsumedCapacity": "TOTAL",
        "Limit": "500"
    };

    let servicesIdList = servicesList.map(item => (item.serviceId))
    console.log("servicesIdList", servicesIdList);

    // filter = filter + "#serviceId IN (:id_1, :id_2)"

    // attributeValues = {
    //     ":id_1": {
    //         "S": "4168f957-cb52-9fd5-af39-6be9b8bc0b41"
    //     },
    //     ":id2": {
    //         "S": "3fea4cb5-7722-2183-0093-bc199358daf9"
    //     }
    // }

    let svcIdStr = "#serviceId IN ("
    for (let i in servicesIdList) {
        let attrValKey = `:id_${i}`
        svcIdStr += `${attrValKey}, `
        attributeValues[attrValKey] = {
            'S': servicesIdList[i]
        }
    }
    filter = `${svcIdStr.substring(0, svcIdStr.length - 2)})`
    let attributeNames = {
        "#serviceId": "SERVICE_ID"
    }

    console.log("filter:", filter);
    console.log("attributeValues: ", attributeValues);

    var filter_key = utils.getDatabaseKeyName(global.config.service_filter_key);

    if (query !== undefined && query !== null) {

        var keys_list = global.config.service_filter_params;

        keys_list.forEach(function (key) {

            var key_name = utils.getDatabaseKeyName(key);

            if (key_name == "SERVICE_TIMESTAMP" && (query.last_updated_after !== undefined || query.last_updated_before !== undefined)) {
                filter = filter + key_name + " BETWEEN :BEFORE" + " AND :AFTER " + insertAnd;
                attributeValues[(":BEFORE")] = {
                    'S': query.last_updated_before
                };
                attributeValues[(":AFTER")] = {
                    'S': query.last_updated_after
                };
            } else if (key_name == "SERVICE_STATUS" && query.status !== undefined) {
                var status = query.status;
                var array = status.split(',');
                var obj = {};

                var filterString = "( ";
                array.forEach(function (value) {
                    filterString += " :" + value + " , ";
                });
                filterString = filterString.substring(0, filterString.length - 3);
                filterString += " )";

                filter = filter + key_name + " IN " + filterString + " AND ";
                array.forEach(function (value) {
                    attributeValues[(":" + value)] = {
                        'S': value
                    };
                });
            } else if (query[key]) {
                filter = filter + key_name + " = :" + key_name + insertAnd;
                attributeValues[(":" + key_name)] = {
                    'S': query[key]
                };
            }
        });
    }

    // if (!getAllRecords || (global.userId && !_.includes(global.config.admin_users, global.userId.toLowerCase()))) {
    //     var ddb_created_by = utils.getDatabaseKeyName("created_by");

    //     // filter for services created by current user
    //     filter = filter + ddb_created_by + " = :" + ddb_created_by + insertAnd;
    //     attributeValues[(":" + ddb_created_by)] = {
    //         'S': global.userId
    //     };
    // }

    if (filter !== "") {
        filter = filter.substring(0, filter.length - insertAnd.length); // remove insertAnd at the end

        scanparams.FilterExpression = filter;
        scanparams.ExpressionAttributeValues = attributeValues;
        scanparams.ExpressionAttributeNames = attributeNames;
    }

    console.log("scanparams: " + JSON.stringify(scanparams));
    query.limit = query.limit || 10;
    query.offset = query.offset || 0;
    query.filter = query.filter || "";
    var scanExecute = function (onComplete) {
        dynamodb.scan(scanparams, function (err, items) {
            var count;
            if (err) {
                onComplete(err);
            } else {
                var items_formatted = [];
                items.Items.forEach(function (item) {
                    items_formatted.push(utils.formatService(item, true));
                });
                if (items.LastEvaluatedKey) {
                    scanparams.ExclusiveStartKey = items.LastEvaluatedKey;
                    scanExecute(onComplete);
                } else {
                    if (items_formatted.length > 0) {

                        items_formatted = utils.sortUtil(items_formatted, query.sort_by, query.sort_direction);

                        if (query.filter) {
                            items_formatted = utils.filterUtil(items_formatted, query.filter);
                        }
                        count = items_formatted.length;
                        if (query.limit && query.offset) {
                            items_formatted = utils.paginateUtil(items_formatted, parseInt(query.limit), parseInt(query.offset));
                        }
                    }
                    var obj = {
                        count: count,
                        services: items_formatted
                    };

                    onComplete(null, obj);
                }
            }
        });
    };
    scanExecute(onComplete);
};
