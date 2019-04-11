/**
 Nodejs Template Project
 @module: config.js
 @description: Defines variables/functions to retrieve environment related data
 @author:
 @version: 1.0
 **/

const fs = require('fs');
const path = require('path');

const getStageConfig = (event, context) => {
  let stage, configObj;
  context.log(context.executionContext.functionName);
  if (event && event.stage) {
    stage = event.stage;
  } else if (context.executionContext && context.executionContext.functionName && context.executionContext.functionName.length > 0) {
    let functionName = context.executionContext.functionName;

    let fnName = functionName.substr(functionName.lastIndexOf('-') + 1, functionName.length);

    if (fnName.endsWith('dev')) {
      stage = 'dev';
    } else if (fnName.endsWith('stg')) {
      stage = 'stg';
    } else if (fnName.endsWith('prod')) {
      stage = 'prod';
    }
  }

  if (stage) {
    let configFile = path.join(__dirname, `../config/${stage}-config.json`);

    if (fs.existsSync(configFile)) {
      configObj = JSON.parse(fs.readFileSync(configFile));
    }
  }

  return configObj;
};

module.exports = {
  getConfig: getStageConfig
}
