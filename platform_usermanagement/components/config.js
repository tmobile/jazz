/**
	Nodejs Template Project
  @module: config.js
  @description: Defines variables/functions to retrieve environment related data
	@author:
	@version: 1.0
**/

var getStageConfig = (event) => {

  var stage;
  
  if (event && event.awslogs && event.awslogs.data) {
      // cw events default to dev
      stage = 'dev';
  }else {
      stage = event.stage
  } 
  
  var configObj;
  
  if (stage) {
      configObj = require(`../config/${stage}-config.json`);
  } 

  return configObj;
};

module.exports = (event) => {
  var config = getStageConfig(event);
  return config;
};
