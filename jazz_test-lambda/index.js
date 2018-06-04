/**
Nodejs Template Project
@author:
@version: 1.0
 **/
const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const validateARN = require("./components/validate-arn.js");
const validateJSON = require("./components/validate-json.js");
var handler = (event, context, cb) => {

  //Initializations
  var errorHandler = errorHandlerModule();
  var config = configObj(event);
  logger.init(event, context);

  try {
    var testResponse = {
      "StatusCode": 200,
      "execStatus": 0
    }
    var requestJson
    if (event !== undefined && event.method !== undefined && event.method === 'POST') {
      logger.info("reached here 1")
      if (!event.body) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Event Body not Defined")));
      } else if (!event.body.functionARN) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Function ARN to be tested not Defined")));
      } else if (!validateARN(event.body.functionARN)) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Function ARN to be tested is Invalid")));
      } else if (!event.body.inputJSON) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Input for function to be tested is not Defined")));
      } else {
        var functionARN = event.body.functionARN;
        
        if (event.body.inputJSON && !validateJSON(event.body.inputJSON)) {
          return cb(JSON.stringify(errorHandler.throwInputValidationError("Not a valid JSON")));
        }
        var inputJSON = JSON.parse(event.body.inputJSON);
        invokeLambda(functionARN,inputJSON).then((data) => {
          if (data && data.StatusCode === 200) {
            testResponse.execStatus = 1 // Test Succesfull
          }
          return cb(null, responseObj(testResponse, event.body)); // Test Failed 
        }).catch((err) => {
          return cb(null, responseObj(testResponse, event.body)); // Test Failed 
        })
      }
    }
  } catch (e) {
    cb(JSON.stringify(errorHandler.throwInternalServerError("Lambda Invocation Failed")));
  }

};

var invokeLambda = (functionARN, inputJSON) => {
  return new Promise((resolve, reject) => {
    logger.info("ARN IS VALID")
    try {
      var aws = require('aws-sdk');
      var lambda = new aws.Lambda({
        region: config.AWS_REGION //change to your region
      });
      lambda.invoke({
        FunctionName: functionARN,
        Payload: JSON.stringify(inputJSON, null, 2) // pass params
      }, function (error, data) {
        if (error) {
          logger.info("in error")
          logger.error(error)
          reject("Got error from Lambda invokation")
        } else if (data.Payload) {
          logger.info("oMGGGGGG")
          logger.info(data)
          resolve(data)
        }
      });
    } catch (e) {
      reject("Error in invoking Lambda")
      logger.info("Error In Invoking Lambda")
      logger.error(e)
    }
  })
}
module.exports = {
  handler: handler,
  invokeLambda: invokeLambda
}