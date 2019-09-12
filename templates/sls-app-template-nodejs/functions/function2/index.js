/**
	Nodejs Lambda Template Project
	@Author:
	@version: 1.0
**/

const configModule = require("../../components/config.js");
const logger = require("../../components/logger.js");
const responseObj = require("../../components/response.js");
const errorHandlerModule = require("../../components/error-handler.js");

module.exports.handler = (event, context, cb) => {

  //Initializations
  const config = configModule.getConfig(event, context);
  const errorHandler = errorHandlerModule();
  logger.init(event, context);

  try {

    //Following is a code snippet to fetch values from config file:
    const myVal = config.configKey;

    //Following code snippet describes how to log messages within your code:
    /*
    logger.error('Runtime errors or unexpected conditions.');
    logger.warn('Runtime situations that are undesirable or unexpected, but not necessarily "wrong".');
    logger.info('Interesting runtime events (Eg. connection established, data fetched etc.)');
    logger.verbose('Generally speaking, most lines logged by your application should be written as verbose.');
    logger.debug('Detailed information on the flow through the system.');
    */

   logger.info("Sample log for function2");
    const sampleResponse = {
      "foo": "foo-value2",
      "bar": "bar-value2",
      "configKeys": myVal
    };

    return cb(null, responseObj(sampleResponse, event));

  } catch (e) {
    //Sample Error response for internal server error
    return cb(JSON.stringify(errorHandler.throwInternalServerError("Sample error message")));

    //Sample Error response for Not Found Error
    //cb(JSON.stringify(errorHandler.throwNotFoundError("Sample message")));

    //Sample Error response for Input Validation Error
    //cb(JSON.stringify(errorHandler.throwInputValidationError("Sample message")));
  }


};
