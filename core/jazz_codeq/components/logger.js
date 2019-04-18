// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

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

    if (level !== undefined && logLevels[level] !== undefined) {
      // If LOG_LEVEL if explicitly specified , set it as the curLogLevel
      config.curLogLevel = level;
      return level;
    } else {
      // Get LOG_LEVEL from the environment variables (if defined)
      try {
        level = process.env.LOG_LEVEL;
      } catch (e) {
        error('error trying to access LOG_LEVEL');
      }
      if (level !== undefined && logLevels[level] !== undefined) {
        config.curLogLevel = level;
        return level;
      }
    }
    return null;
  };

  const log = (level, message) => {
    /*
        @TODO: format message as per requirement.
        Will it be just a string / json. Should we except error object also?
    */
    let timestamp = new Date().toISOString();
    if (logLevels[level] >= logLevels[config.curLogLevel]) {
      if (level == 'error') {
        console.error(timestamp, 'ERROR \t', config.requestDetails, message);
        /*
            If required, add custom actions here; Such as send a mail, etc...
        */
      } else if (level == 'warn') {
        console.warn(timestamp, 'WARN  \t', config.requestDetails, message);
      } else if (level == 'info') {
        console.info(timestamp, 'INFO  \t', config.requestDetails, message);
      } else if (level == 'verbose') {
        console.info(timestamp, 'VERBOSE  \t', config.requestDetails, message);
      } else if (level == 'debug') {
        console.info(timestamp, 'DEBUG  \t', config.requestDetails, message);
      } else {
        console.log(timestamp, level, '\t', config.requestDetails, message);
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