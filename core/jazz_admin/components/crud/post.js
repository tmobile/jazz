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
  CRUD APIs for Config Catalog
  @author:
  @version: 1.0
**/

const utils = require("../utils.js");

module.exports = (new_config, onComplete) => {

  // initialize dynamodb docClient
  const docClient = utils.initDocClient();

  let params = {
    Item: new_config,
    ReturnConsumedCapacity: "TOTAL",
    TableName: global.config.TABLE_NAME
  };

  docClient.put(params, function (err, data) {
    if (err) {
      onComplete(err, null);
    } else {
      onComplete(null, {
        "message": "success"
      });
    }
  });
};
