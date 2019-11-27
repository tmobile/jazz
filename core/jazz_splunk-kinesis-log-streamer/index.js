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
	Custom Splunk cloudWatch logs streamer.
	@Author:
	@version: 1.0
**/

const SplunkLogger = require('splunk-logging').Logger;
const zlib = require('zlib');
const configData = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const utils = require("./components/utils.js"); //Import the utils module.
const global_config = require("./config/global-config.json");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function handler(event, context, callback) {

  logger.init (event, context);
  logger.debug('Received event:' + JSON.stringify(event));
  let errorHandler = errorHandlerModule();
  let config = configData.getConfig(event, context);
  let isSplunkEnabled = (global_config.ENABLE_SPLUNK && (global_config.ENABLE_SPLUNK).toString().toLowerCase() === 'true') ? true : false;

  if (isSplunkEnabled && event.Records && event.Records.length) {
    const loggerConfig = {
      url: config.SPLUNK_ENDPOINT,
      token: config.SPLUNK_TOKEN,
      maxBatchCount: 0, // Manually flush events
      maxRetries: 1 // Retry 1 times
    };

    const splunkLog = new SplunkLogger(loggerConfig);
    // Set common error handler for splunkLog.send() and splunkLog.flush()
    splunkLog.error = (error, context) => {
      logger.error('error:' + error + ', context:' + JSON.stringify(context));
      return callback(JSON.stringify(error));
    };

    try {

      for (let i = 0; i < event.Records.length; i++) {
        let eachRecord = event.Records[i];
        // CloudWatch Logs data is base64 encoded so decode here
        let payload = new Buffer(eachRecord.kinesis.data, 'base64');
        logger.debug("payload:" + JSON.stringify(payload));

        // CloudWatch Logs are gzip compressed so expand here
        zlib.gunzip(payload, (error, result) => {
          if (error) {
            logger.error("Not a valid Input. " + JSON.stringify(error));
            return callback(null, "Success");
          } else {
            // parse the result from JSON
            let awslogsData = JSON.parse(result.toString('ascii'));
            logger.debug('Decoded payload:' + JSON.stringify(awslogsData));
            exportable.sendSplunkEvent(awslogsData, splunkLog, config)
              .then((count) => {
                if (count) {
                  splunkLog.flush((err, resp, body) => {
                    // Request failure or valid response from Splunk with HEC error code
                    if (err || (body && body.code !== 0)) {
                      logger.error("Splunk error:" + JSON.stringify(err));
                      return callback(JSON.stringify(err || body));
                    } else {
                      // If succeeded, body will be { text: 'Success', code: 0 }
                      logger.debug('Response from Splunk:' + JSON.stringify(body));
                      logger.info(`Successfully processed ${count} log event(s).`);
                      return callback(null, count); // Return number of log events
                    }
                  });
                } else {
                  return callback(null, "Success");
                }

              })
              .catch(error => {
                logger.error(JSON.stringify(error));
                return callback(null, "Success");
              });
          }
        });
      }

    } catch (e) {
      logger.error("Error:" + JSON.stringify(e));
      return callback(null, "Success");
    }
  } else {
    logger.debug("No logs for Splunk forwarder.");
    return callback(null, "Success");
  }
}

function sendSplunkEvent(awslogsData, splunkLog, config) {
  return new Promise((resolve, reject) => {
    let count = 0;
    if (awslogsData.messageType === 'CONTROL_MESSAGE') {
      logger.debug('Received CONTROL MESSAGE.');
      resolve();
    } else if (awslogsData.logGroup.indexOf("API-Gateway-Execution-Logs") === 0) {
      utils.transformApiLogs(awslogsData)
        .then(splunkBulkData => {
          exportable.sendDataToSplunk(splunkLog, splunkBulkData, config);
          count++;
          resolve(count);
        })
        .catch(error => {
          logger.error(error);
          resolve();
        });
    } else if (awslogsData.logGroup.indexOf("/aws/lambda/") === 0) {
      utils.getCommonData(awslogsData, config)
        .then(commonData => {
          awslogsData.logEvents.forEach(logEvent => {
            utils.transformLambdaLogs(logEvent, commonData)
              .then(event => {
                exportable.sendDataToSplunk(splunkLog, event, config);
                count++;
                if (count === awslogsData.logEvents.length) {
                  resolve(count);
                }
              })
              .catch(error => {
                logger.error("Error in sendSplunkEvent:" + JSON.stringify(error));
                resolve();
              });
          });
        });

    } else {
      logger.debug('Received unsupported logEvents');
      resolve();
    }
  });
}

function sendDataToSplunk(splunkLog, eventData, config) {
  logger.debug("Send event data:" + JSON.stringify(eventData));
  let payload = {
    message: eventData.event,
    metadata: {
      sourcetype: eventData.sourcetype,
      index: config.SPLUNK_INDEX
    }
  };
  splunkLog.send(payload);
}

const exportable = {
  handler,
  sendSplunkEvent,
  sendDataToSplunk
};
module.exports = exportable;
