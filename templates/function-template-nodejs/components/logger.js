/**
 Nodejs Template Project for Azure
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

    // Alternate usage
    logger.log('error', 'message');
    logger.log('info', 'message');

*/
module.exports = function () {
  const logLevels = {
    error: 4,
    warn: 3,
    info: 2,
    verbose: 1
  };

  const config = {
    curLogLevel: 'info',
    requestDetails: ''
  };
  let context;
  // set logLevel, RequestDetails
  const init = (event, context) => setLevel('info', context);

  // set current logLevel; Only logs which are above the curLogLevel will be logged;
  const setLevel = (level, context) => {
    // LOG_LEVEL is 'info' by default
    this.context = context;
    // this.config.requestDetails = context.invocationId;

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

    if (logLevels[level] >= logLevels[config.curLogLevel]) {
      if (level === 'error') {
        this.context.log.error(this.context.invocationId, message);
      } else if (level === 'warn') {
        this.context.log.warn(this.context.invocationId, message);
      } else if (level === 'info') {
        this.context.log.info(this.context.invocationId, message);
      } else if (level === 'verbose') {
        this.context.log.verbose(this.context.invocationId, message);
      } else {
        this.context.log(this.context.invocationId, message);
      }
    }

    return null;
  };

  const error = (message) => log('error', message);
  const warn = (message) => log('warn', message);
  const info = (message) => log('info', message);
  const verbose = (message) => log('verbose', message);

  return {
    init: init,
    setLevel: setLevel,
    log: log,
    error: error,
    warn: warn,
    info: info,
    verbose: verbose,
    logLevel: config.curLogLevel
  };
}();
