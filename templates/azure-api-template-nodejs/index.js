
/**
 Nodejs Azure Function Template Project
 @Author:
 @version: 1.0
 **/

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const responseObj = require("./components/response.js");
const errorHandlerModule = require("./components/error-handler.js");

module.exports = function(context, req) {
    //Initializations
    const config = configModule.getConfig(req, context);
    const errorHandler = errorHandlerModule();
    logger.init(req, context);


    context.log('Node.js HTTP trigger function processed a request. RequestUri=%s', req.originalUrl);


  try {

    //Following is a code snippet to fetch values from config file:
    const myVal = config.configKey;

    //Following code snippet describes how to log messages within your code:
    /*
    logger.error('Runtime errors or unexpected conditions.');
    logger.warn('Runtime situations that are undesirable or unexpected, but not necessarily "wrong".');
    logger.info('Interesting runtime events (Eg. connection established, data fetched etc.)');
    logger.verbose('Generally speaking, most lines logged by your application should be written as verbose.');
    NOTE:  debug level is not supported by Azure
    */

    const sampleResponse = {
      "foo": "foo-value",
      "bar": "bar-value",
      "configKeys": myVal
    };

    //Your GET method should be handled here
    if (req && req.method && req.method === 'GET') {
      //sampleResponse.message = "Your Node Template GET Method executed successfully";
      logger.info(req);
      logger.info(context);

      logger.verbose(sampleResponse);
      context.res = {
        // status defaults to 200 */
        body: responseObj(sampleResponse, req.query)
      };
    }

		//Your POST method should be handled here
    if (req && req.method && req.method === 'POST') {
      //sampleResponse.message = "Your Node Template POST Method executed successfully";
      context.res = {
        // status defaults to 200 */
        body: responseObj(sampleResponse, req.body)
      };
    }


  } catch (e) {
    logger.error('Runtime errors or unexpected conditions.');
    //Sample Error response for internal server error
    context.res = {
      status: 400,
      body: JSON.stringify(errorHandler.throwInternalServerError("Sample error message"))
        };
    }


    //Sample Error response for Not Found Error
    //cb(JSON.stringify(errorHandler.throwNotFoundError("Sample message")));

    //Sample Error response for Input Validation Error
    //cb(JSON.stringify(errorHandler.throwInputValidationError("Sample message")));


    // if (req.query.name || (req.body && req.body.name)) {


    context.done();
};
