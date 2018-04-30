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
	Get Environment-Catalog by ENVIRONMET_ID from dynamodb table
    @module: get.js
    @description: CRUD functions for respective Events catalog
	@author: 
	@version: 1.0
**/
const utils = require("../utils.js")(); //Import the utils module.
const logger = require("../logger.js"); //Import the logging module.

module.exports = (params, eventData, onComplete) => {
    logger.info("Inside crud.get:"+JSON.stringify(params));

    var dynamodb = utils.initDynamodb();

    dynamodb.getItem(params, (err, data) => {
        logger.info("getItem error:"+JSON.stringify(err));
        logger.info("getItem data:"+JSON.stringify(data));
        if (err) {
            logger.error("error reading event data from database " + err.message);
            onComplete({
                "code": 500,
                "message": "error reading event data from database " + err.message
            }, null);
        } else {
            if (!data || !data.Item) {
                logger.error("Invalid event data. " + eventData);
                onComplete({
                    "code": 400,
                    "message": "Invalid event data. " + eventData
                }, null);
            } else {
                onComplete(null, data.Item);
            }
        }
    });
}