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

    const logLevelMessageTypes = {
      'error': `${timestamp}, 'ERROR \t', ${config.requestDetails}, ${message}`,
      'warn': `${timestamp}, 'WARN \t', ${config.requestDetails}, ${message}`,
      'info': `${timestamp}, 'INFO \t', ${config.requestDetails}, ${message}`,
      'verbose': `${timestamp}, 'VERBOSE \t', ${config.requestDetails}, ${message}`,
      'debug': `${timestamp}, 'DEBUG \t', ${config.requestDetails}, ${message}`,
      'log': `${timestamp}, ${level} \t', ${config.requestDetails}, ${message}`
    };
    /*
        @TODO: format message as per requirement.
        Will it be just a string / json. Should we except error object also?
    */
    try {
      console[level](logLevelMessageTypes[level]);
    } catch (ex) {
      console.log(logLevelMessageTypes.log);
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
