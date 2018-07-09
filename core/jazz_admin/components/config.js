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
  Nodejs Template Project
  @module: config.js
  @description: Defines variables/functions to retrieve environment related data
  @author:
  @version: 1.0
**/

const fs = require('fs');
const path = require('path');

var getStageConfig = (event, context) => {
  var stage, configObj;

  if (event && event.stage) {
    stage = event.stage;
  } else if (context && context.functionName && context.functionName.length > 0) {
    var functionName = context.functionName;

    var fnName = functionName.substr(functionName.lastIndexOf('-') + 1, functionName.length);

    if (fnName.endsWith('dev')) {
      stage = 'dev';
    } else if (fnName.endsWith('stg')) {
      stage = 'stg';
    } else if (fnName.endsWith('prod')) {
      stage = 'prod';
    }
  }

  if (stage) {
    var configFile = path.join(__dirname, `../config/${stage}-config.json`);

    if (fs.existsSync(configFile)) {
      configObj = JSON.parse(fs.readFileSync(configFile));
    }
  }

  return configObj;
};

module.exports = {
  getConfig: getStageConfig
}
