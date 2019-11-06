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

module.exports = (query, servicesList, onComplete) => {
  // initialize dynamodb
  var dynamodb = utils.initDynamodb();

  var filter = "";
  var attributeValues = {};
  let attributeNames = {};
  var insertAnd = " AND ";

  var scanparams = {
    "TableName": global.services_table,
    "ReturnConsumedCapacity": "TOTAL",
    "Limit": "500"
  };

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
          if (query['isSearch']) {
            filter = filter + `contains(${key_name}, :${key_name})` + insertAnd;
          } else {
            filter = filter + `${key_name} = :${key_name}` + insertAnd;
          }
          attributeValues[(":" + key_name)] = {
            'S': query[key]
          };
      }
    });
  }

  if (filter !== "") {
    filter = filter.substring(0, filter.length - insertAnd.length); // remove insertAnd at the end

    scanparams.FilterExpression = filter;
    scanparams.ExpressionAttributeValues = attributeValues;
    if (Object.keys(attributeNames).length) {
      scanparams.ExpressionAttributeNames = attributeNames;
    }
  }

  query.limit = query.limit || 10;
  query.offset = query.offset || 0;
  query.filter = query.filter || "";
  var scanExecute = function (onComplete) {
    dynamodb.scan(scanparams, function (err, items) {
      var count;
      if (err) {
        onComplete(err);
      } else {
        var items_formatted = [], finalList = [];

        if (servicesList && servicesList.length) {
          let servicesIdList = servicesList.map(item => (item.serviceId));
          items.Items = items.Items.filter(service => servicesIdList.indexOf(service.SERVICE_ID.S) !== -1);
        }

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

            finalList = appendPolicies(items_formatted, servicesList);

          }
          var obj = {
            count: count,
            services: finalList
          };

          onComplete(null, obj);
        }
      }
    });
  };
  scanExecute(onComplete);

  function appendPolicies(filteredList, servicesList) {
    if (servicesList && servicesList.length) {
      for (filteredItem of filteredList) {
        for (serviceItem of servicesList) {
          if (serviceItem.serviceId === filteredItem.id) {
            filteredItem["policies"] = serviceItem.policies
          }
        }
      }
    }

    return filteredList
  };
};
