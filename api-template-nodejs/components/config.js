/**
	Nodejs Template Project
  @module: config.js
  @description: Defines variables/functions to retrieve environment related data
	@author:
	@version: 1.0
**/

var getStageConfig = (event) => {
  var stage = event.stage;
  var configObj = {};
  // Loads the config files based on the env.
  // Please edit the JSON files.
  if (stage === 'dev') {
    configObj = require('../config/dev-config.json');
  } else if (stage === 'stg') {
    configObj = require('../config/stg-config.json');
  } else if (stage === 'prod') {
    configObj = require('../config/prod-config.json');
  }
  return configObj;
};

module.exports = (event) => {
  var config = getStageConfig(event);
  return config;
};
