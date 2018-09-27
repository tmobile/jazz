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

var https = require('https');
var zlib = require('zlib');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js"); //Import the Configuration module.
const utils = require("./components/utils.js"); //Import the utils module.
const logger = require("./components/logger.js");

/**
	Custom Cloud logs Streamer (to ES)
	@author:
	@version: 1.0
**/

function handler(input, context, cb) {

  let errorHandler = errorHandlerModule();
  let config = configObj.getConfig(input, context)
  logger.init(input, context);
  logger.debug("event:" + JSON.stringify(input));

  try {
    if (input && input.Records && input.Records.length) {
      input.Records.forEach(eachRecord => {
        // decode input from base64
        let zippedInput = new Buffer(eachRecord.kinesis.data, 'base64');

        zlib.gunzip(zippedInput, function (error, buffer) {
          if (error) {
            logger.debug("Skipping this record since message is not in supported format (gzip). Raw message: " + zippedInput);
            return cb(null, responseObj("Success", input));
          } else {
            // parse the input from JSON
            let awslogsData = JSON.parse(buffer.toString('utf8'));

            // transform the input to Elasticsearch documents
            logger.debug("logs raw data..: " + JSON.stringify(awslogsData));
            utils.transform(awslogsData)
              .then(elasticsearchBulkData => {
                // post documents to the Amazon Elasticsearch Service
                exportable.post(config, elasticsearchBulkData, function (error, success, statusCode, failedItems) {
                  logger.debug('Response code from ES: ' + JSON.stringify({
                    "statusCode": statusCode
                  }));

                  if (error) {
                    logger.error('Error: ' + JSON.stringify(error, null, 2));

                    if (failedItems && failedItems.length > 0) {
                      logger.error("Failed Items: " +
                        JSON.stringify(failedItems, null, 2));
                    }
                    return cb(JSON.stringify(errorHandler.throwInternalServerError(JSON.stringify(error))));
                  } else {
                    logger.info('Success: ' + JSON.stringify(success));
                    return cb(null, responseObj("Success", input));
                  }
                });
              })
              .catch(error => {
                logger.error('Error:' + JSON.stringify(error));
                return cb(null, responseObj("Success", input));
              });
          }
        });
      });
    } else {
      logger.debug("No input or empty records from kinesis stream.");
      return cb(null, responseObj("Success", input));
    }
  } catch (err) {
    logger.error(err);
    return cb(JSON.stringify(errorHandler.throwInternalServerError(JSON.stringify(err.message))));
  }
};

function post(config, body, callback) {
  let requestParams = utils.buildRequest(config.ES_ENDPOINT, body);
  let request = https.request(requestParams, function (response) {
    let responseBody = '';
    response.on('data', function (chunk) {
      responseBody += chunk;
    });
    logger.debug("response from post..:" + JSON.stringify(responseBody));
    response.on('end', function () {
      let failedItems, success, info = JSON.parse(responseBody);

      if (response.statusCode >= 200 && response.statusCode < 299) {
        failedItems = info.items.filter(item => item.index.status >= 300);

        success = {
          "attemptedItems": info.items.length,
          "successfulItems": info.items.length - failedItems.length,
          "failedItems": failedItems.length
        };
      }

      let error = response.statusCode !== 200 || info.errors === true ? {
        "statusCode": response.statusCode,
        "responseBody": responseBody
      } : null;
      return callback(error, success, response.statusCode, failedItems);
    });
  }).on('error', function (e) {
    logger.error("e: " + jSON.stringify(e));
    return callback(e);
  });
  request.end(requestParams.body);
}

const exportable = {
  handler,
  post
};

module.exports = exportable;
