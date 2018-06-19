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

module.exports = function () {
    var logLevels = {
        error: 4,
        warn: 3,
        info: 2,
        verbose: 1,
        debug: 0
    };

    var config = {
        curLogLevel: 'info',
        requestDetails: ''
    };

    // set logLevel, RequestDetails
    var init = function (event, context) {
        setLevel();
    };

    // To add request specific details, which will be prepended in all the logs for ease of debugging in CloudWatch logs
    var setRequestDetails = function (someContextSpecificId) {
        return;
    };

    // set current logLevel; Only logs which are above the curLogLevel will be logged;
    var setLevel = function (level) {
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

    var log = function (level, message) {
        /*
            @TODO: format message as per requirement.
            Will it be just a string / json. Should we except error object also?
        */
        var timestamp = new Date().toISOString();
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

    var error = function (message) {
        log('error', message);
    };
    var warn = function (message) {
        log('warn', message);
    };
    var info = function (message) {
        log('info', message);
    };
    var verbose = function (message) {
        log('verbose', message);
    };
    var debug = function (message) {
        log('debug', message);
    };

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
