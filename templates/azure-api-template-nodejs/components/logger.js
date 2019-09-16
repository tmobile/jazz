/**
    Nodejs Template Project
    @module: logger.js
    @description: a simple logging module for nodejs
    @author:
    @version: 1.0
**/


/*
USAGE

    logger = require('./components/logger.js')

    logger.init(event, context); // by default logging level is info

    logger.warn('The following waring message will be logged');
    logger.verbose('The following waring message will not be logged')


    // Sample logging messages.
    logger.error('Runtime errors or unexpected conditions.');
    logger.warn('Runtime situations that are undesirable or unexpected, but not necessarily "wrong".');
    logger.info('Interesting runtime events (Eg. connection established, data fetched etc).');
    logger.verbose('Generally speaking, most lines logged by your application should be written as verbose.');
    logger.debug('Detailed information on the flow through the system.);

    // Alternate usage
    logger.log('error', 'message');
    logger.log('info', 'message');

*/
module.exports = function () {
    const logLevels = {
        error: 4,
        warn: 3,
        info: 2,
        verbose: 1,
        debug: 0
    };

    const config = {
        curLogLevel: 'info',
        requestDetails: ''
    };

    // set logLevel, RequestDetails
    const init = (event, context) => setLevel();

    // To add request specific details, which will be prepended in all the logs for ease of debugging in CloudWatch logs
    const setRequestDetails = (someContextSpecificId) => {
        return;

        // Timestamp and requestID are prepended in cloudwatch log by default; If any other details are required it can be done here.

        /*
        if (someContextSpecificId != undefined && someContextSpecificId != '') {
            config.someContextSpecificId = someContextSpecificId;
            config.requestDetails = 'someContextSpecificId : ' + someContextSpecificId + ' =>\t'
        } else{
            config.requestDetails = ''
        };
        */
    };

    // set current logLevel; Only logs which are above the curLogLevel will be logged;
    const setLevel = (level) => {
        // LOG_LEVEL is 'info' by default

        if (level && logLevels[level]) {
            // If LOG_LEVEL if explicitly specified , set it as the curLogLevel
            config.curLogLevel = level;
            return level;
        } else {
            // Get LOG_LEVEL from the environment variables (if defined)
            try {
                level = process.env.LOG_LEVEL;
            } catch (e) {
                error('Error trying to access LOG_LEVEL');
            }
            if (level && logLevels[level]) {
                config.curLogLevel = level;
                return level;
            }
        }

        return null;
    };

    const log = (level, message) => {
      const timestamp = new Date().toISOString();

      if (logLevels[level] >= logLevels[config.curLogLevel]) {
        if (level === 'error') {
            console.error('ERROR \t', config.requestDetails, message);
        } else if (level === 'warn') {
            console.warn('WARN  \t', config.requestDetails, message);
        } else if (level === 'info') {
            console.info('INFO  \t', config.requestDetails, message);
        } else if (level === 'verbose') {
            console.info('VERBOSE  \t', config.requestDetails, message);
        } else if (level === 'debug') {
            console.debug('DEBUG  \t', config.requestDetails, message);
        } else {
            console.log(level, '\t', config.requestDetails, message);
        }
      }

      return null;
    };

    const error = (message) => log('error', message);
    const warn = (message) => log('warn', message);
    const info = (message) => log('info', message);
    const verbose = (message) => log('verbose', message);
    const debug = (message) => log('debug', message);

    return {
        init: init,
        setLevel: setLevel,
        log: log,
        error: error,
        warn: warn,
        info: info,
        verbose: verbose,
        debug: debug,
        logLevel: config.curLogLevel
    };
}();
