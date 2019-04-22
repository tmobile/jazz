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

  let dirName = path.dirname(_getCallerFile());

  let configDir = path.join(dirName, 'config');

  if (event && event.stage) {
    stage = event.stage;
  } else if (context && context.functionName && context.functionName.length > 0) {
    let functionName = context.functionName;

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
    let configFile = path.join(configDir, `${stage}-config.json`);
    if (fs.existsSync(configFile)) {
      configObj = JSON.parse(fs.readFileSync(configFile));
    }
  }

  return configObj;
};

/* Where this function is being called from. It is needed to get the location of
   'config' folder to get the configuration values from */
function _getCallerFile() {
    var originalFunc = Error.prepareStackTrace;

    var callerfile;
    try {
        var err = new Error();
        var currentfile;

        Error.prepareStackTrace = function (err, stack) { return stack; };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if(currentfile !== callerfile) break;
        }
    } catch (e) {}

    Error.prepareStackTrace = originalFunc;

    return callerfile;
}

module.exports = {
	getConfig: getStageConfig
}
