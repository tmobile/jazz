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

/**
    Nodejs Template Project
    @module: logger.js
    @description: a simple logging module for nodejs
    @author:
    @version: 1.0
**/

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
const init = (event, context) => {
  setLevel();
};

// To add request specific details, which will be prepended in all the logs for ease of debugging in CloudWatch logs
const setRequestDetails = (someContextSpecificId) => {
  return;
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
      error('error trying to access LOG_LEVEL');
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

module.exports = () => {
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
  }
};
