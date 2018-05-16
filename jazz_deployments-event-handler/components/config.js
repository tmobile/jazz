/**
  @module: config.js
  @description: Defines variables/functions to retrieve deployment related data
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