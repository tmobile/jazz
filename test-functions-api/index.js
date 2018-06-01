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
var handler = (event, context, cb) => {

  //Initializations
  var errorHandler = errorHandlerModule();
  var config = configObj(event);
  logger.init(event, context);

  try {

    //Following is a code snippet to fetch values from config file:
    //var myVal = config.configKey;


    //Following code snippet describes how to log messages within your code:
    /*
    logger.error('Runtime errors or unexpected conditions.');
    logger.warn('Runtime situations that are undesirable or unexpected, but not necessarily "wrong".');
    logger.info('Interesting runtime events (Eg. connection established, data fetched etc.)');
    logger.verbose('Generally speaking, most lines logged by your application should be written as verbose.');
    logger.debug('Detailed information on the flow through the system.');
    */

    var sampleResponse = {
      "foo": "foo-value",
      "bar": "bar-value"
    };
    var successresponse = {
      "execStatus": 0
    }
    var thisPointer = this
    this.execStatus = 0;
    this.payloadData = null
    //Your POST method should be handled here
    if (event !== undefined && event.method !== undefined && event.method === 'POST') {
      logger.info("reached here 1")
      if (!event.body) {
        logger.warn("Event Body Not defined ");
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Event Body not Defined")));
      } else if (!event.body.functionARN) {
        logger.warn("Event Body Not defined ");
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Function ARN to be tested not Defined")));
      } else {
        var functionARN = event.body.functionARN;
        logger.info(functionARN,event);
        invokeLambda(functionARN).then((data) => {
          cb(JSON.stringify(errorHandler.throwInternalServerError("ohh this is good")));
        }).catch((err) => {
          cb(JSON.stringify(errorHandler.throwInternalServerError("Some small messup")));
        })
      }
    }
  } catch (e) {
    //Sample Error response for internal server error
    cb(JSON.stringify(errorHandler.throwInternalServerError("Sample message")));

    //Sample Error response for Not Found Error
    //cb(JSON.stringify(errorHandler.throwNotFoundError("Sample message")));

    //Sample Error response for Input Validation Error
    //cb(JSON.stringify(errorHandler.throwInputValidationError("Sample message")));
  }

};
var invokeLambda = (functionARN,event) => {
  return new Promise((resolve, reject) => {
    if (validateARN(functionARN)) {
      logger.info("ARN IS VALID")
      try {
        var aws = require('aws-sdk');
        var lambda = new aws.Lambda({
          region: 'us-east-1' //change to your region
        });
        lambda.invoke({
          FunctionName: functionARN,
          Payload: JSON.stringify(event, null, 2) // pass params
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
    }
  })
}
module.exports ={
  handler: handler,
  invokeLambda : invokeLambda
}