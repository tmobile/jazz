/**
Nodejs Template Project
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const request = require('request');
function handler(event, context, cb) {

  //Initializations
  var errorHandler = errorHandlerModule();
  var config = configObj(event);
  logger.init(event, context);

  try {
    logger.info("BASE URL:",config.BASE_URL);
    logger.info("SCM_TYPE:",config.SCM_TYPE);
    logger.info("PRIVATE_TOKEN_GITLAB",config.PRIVATE_TOKEN_GITLAB);
    temp = {
      "BASE URL": config.BASE_URL,
      "SCM_TYPE": config.SCM_TYPE,
      "PRIVATE_TOKEN_GITLAB": config.PRIVATE_TOKEN_GITLAB,
    };

    if (event !== undefined && event.method !== undefined && event.method === 'POST') {
      if (!event && !event.method && event.method !== 'POST') {
        return cb(JSON.stringify(errorHandler.throwNotFoundError("Method not found")));
      }
      if (!event.body) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Event Body not Defined")));
      }

      if (!event.principalId) {
        logger.error('Authorizer did not send the user information, please check if authorizer is enabled and is functioning as expected!');
        return cb(JSON.stringify(errorHandler.throwUnauthorizedError("User is not authorized to access this service")));
      }
      if (event.principalId != config.ADMIN_ID) {
        return cb(JSON.stringify(errorHandler.throwUnauthorizedError("User is not authorized to access this service")));
      }
      getInstallerVarsJSON(config).then((data) => {
        temp.INSTALLERVARSJSON = data;
        return cb(null, responseObj(temp, event.body));
      }).catch((error) => {
        logger.error("Failed to load instalervarsJSON file :",error);
        cb(JSON.stringify(errorHandler.throwInternalServerError("Failed to load installerVarsJSON.json")));
      });
    }
  } catch (e) {
    cb(JSON.stringify(errorHandler.throwInternalServerError("Sample message")));
  }

}
function buildRequestOption(config){
  if(config.SCM_TYPE=="gitlab"){
    return {
      uri: config.BASE_URL + config.PATH_GIT,
      method: 'get',
      headers: {
        "Private-Token": config.PRIVATE_TOKEN_GITLAB
      },
      rejectUnauthorized: false
    };
  }else{
    return {
      uri: config.BASE_URL + config.PATH_BITBUCKET,
      method: 'get',
      headers: {
        "Authorization": 'Basic ' + new Buffer(config.BB_USERNAME + ':' + config.BB_PASSWORD).toString('base64')
      },
      rejectUnauthorized: false
    };
  }
}
function getInstallerVarsJSON(config) {
  return new Promise((resolve, reject) => {
    try{
      var params = buildRequestOption(config);
      logger.info("optionsObject",JSON.stringify(params));
      request(params, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
            var data = JSON.parse(response.body);
            resolve(data);
        }
      });
    }
    catch(error){
      reject(error);
    }
  });
}

module.exports = {
  handler,
  getInstallerVarsJSON,
  buildRequestOption
};
