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
    Helper functions for Events
    @module: utils.js
    @author:
    @version: 1.0
**/

var AWS = require("aws-sdk");
const logger = require("./logger.js");

var initDynamodb = function () {
    AWS.config.update({
        region: global.config.ddb_region
    });
    var dynamodb = new AWS.DynamoDB();

    return dynamodb;
};

var initKinesis = function () {
    AWS.config.update({
        region: global.config.ddb_region
    });
    var kinesis = new AWS.Kinesis();

    return kinesis;
};

module.exports = () => {
    return {
        initDynamodb: initDynamodb,
        initKinesis: initKinesis
    };
};
