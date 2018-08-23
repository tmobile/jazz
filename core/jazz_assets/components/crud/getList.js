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
      Search a Asset-Catalog entry in dynamodb table
      @module: getList.js
      @description: CRUD functions for asset catalog
      @author:
      @version: 1.0
  **/

const utils = require("../utils.js"); //Import the utils module.
const logger = require("../logger.js")(); //Import the logging module.

module.exports = (query, asset_table, onComplete) => {
    // initialize dynamodb
    const docClient = utils.initDocClient();

    let filter = "";
    let insertAndString = " AND ";

    let params = {
        TableName: asset_table,
        IndexName: global.global_config.ASSETS_DOMAIN_SERVICE_INDEX,
        KeyConditionExpression: "#d = :service_domain and SERVICE = :service_name",
        ExpressionAttributeValues: {
            ":service_name": query.service,
            ":service_domain": query.domain
        },
        ExpressionAttributeNames: {
            "#d": "DOMAIN"
        }
    };

    let keys_list = global.global_config.ASSET_SEARCH_OPTIONAL_FILTER_PARAMS;

    // Generate filter string
    keys_list.forEach((key) => {
        if (key !== "limit" && key !== "offset") { // LIMIT is a reserved keyword
            var key_name = utils.getDatabaseKeyName(key);

            if (query[key] && key_name) {
                filter = filter + key_name + " = :" + key_name + insertAndString;
                params.ExpressionAttributeValues[":" + key_name] = query[key];
            }
        }
    });

    filter = filter.substring(0, filter.length - insertAndString.length); // remove the " AND " at the end

    if (filter) {
        params.FilterExpression = filter;
    }

    let pagination = {};
    pagination.limit = query.limit || global.global_config.PAGINATION_DEFAULTS.limit;
    if (pagination.limit > global.global_config.PAGINATION_DEFAULTS.max_limit) {
        pagination.limit = global.global_config.PAGINATION_DEFAULTS.max_limit
    }
    pagination.offset = query.offset || global.global_config.PAGINATION_DEFAULTS.offset;

    logger.debug("Query params generated from the seach request: " + JSON.stringify(params));

    let items = [];
    let queryExecute = (onComplete) => {
        docClient.query(params, (err, data) => {
            let count;
            if (err) {
                onComplete(err, null);
            } else {
                items = items.concat(data.Items);
                if (data.LastEvaluatedKey) {
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    queryExecute(onComplete);
                } else {
                    count = items.length;
                    if (pagination.limit >= 0 && pagination.offset >=0 ) {
                        items = utils.paginateUtil(items, parseInt(pagination.limit), parseInt(pagination.offset));
                    }

                    let paginatedObjList = items.map(item => utils.formatResponse(item));
                    let obj = {
                        count: count,
                        assets: paginatedObjList
                    };
                    onComplete(null, obj);
                }


            }
        });
    };
    queryExecute(onComplete);
};
