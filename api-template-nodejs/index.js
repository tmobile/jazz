/**
Nodejs Template Project
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const secretHandlerModule = require("./components/secret-handler.js"); //Import the secret-handler module.


module.exports.handler = (event, context, cb) => {

  //Initializations
  var errorHandler = errorHandlerModule();
  var config = configObj(event);
  var secretHandler = secretHandlerModule();
  logger.init(event, context);

  try {

    //Following is a code snippet to fetch values from config file:
    //var myVal = config.configKey;

    //Following is a code snippet to fetch plaintext for your secret:
    /*
		logger.info("config.mysecret: " + JSON.stringify(config.mysecret));
    var decryptObj = secretHandler.decryptSecret(config.mysecret);
    var plaintext = "";
    var decryptionerror = "";
    if (decryptObj.error !== undefined && decryptObj.error === true) {
      decryptionerror = decryptObj.message;
      logger.info("decryptionerror: " + decryptionerror);

    } else {
      plaintext = decryptObj.message;
      logger.info("plaintext: " + plaintext);
    }
		*/


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

    //Your GET method should be handled here
    if (event !== undefined && event.method !== undefined && event.method === 'GET') {
      //sampleResponse.message = "Your Node Template GET Method executed successfully";
      logger.info(event);
      logger.info(context);

      logger.verbose(sampleResponse);
      cb(null, responseObj(sampleResponse, event.query));
    }

		//Your POST method should be handled here
    if (event !== undefined && event.method !== undefined && event.method === 'POST') {
      //sampleResponse.message = "Your Node Template POST Method executed successfully";
      cb(null, responseObj(sampleResponse, event.body));
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
