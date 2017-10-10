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

var getStageConfig = (context) => {
  var functionName = context.functionName;
  var configObj = {};
  // Loads the config files based on the env.
  // Please edit the JSON files.
  if (functionName.endsWith('dev')) {
    configObj = require('../config/dev-config.json');
  } else if (functionName.endsWith('stg')) {
    configObj = require('../config/stg-config.json');
  } else if (functionName.endsWith('prod')) {
    configObj = require('../config/prod-config.json');
  }
  return configObj;
};

module.exports = (context) => {
  var config = getStageConfig(context);
  return config;
};
