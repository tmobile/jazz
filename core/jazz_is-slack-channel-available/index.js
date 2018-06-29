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
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js")();
const request = require('request');

module.exports.handler = (event, context, cb) => {

  //Initializations
  var errorHandler = errorHandlerModule();
  var config = configModule.getConfig(event, context);
  logger.init(event, context);
  logger.info(event);

  var resObj = {
    'is_available': false
  };

  try {
    genericInputValidation(event)
      .then((res) => requestToChannels(config, resObj, res))
      .then((res) => {
        cb(null, responseObj(res, event.query));
      })
      .catch(error => {
        if (error.result === 'inputError') {
          return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
        } else if (error.result === 'unauthorized') {
          return cb(JSON.stringify(errorHandler.throwUnauthorizedError(error.message)));
        } else {
          cb(JSON.stringify(errorHandler.throwInternalServerError("Unhandled error.")));
        }
      });
  } catch (e) {
    cb(JSON.stringify(errorHandler.throwInternalServerError("Unhandled error.")));
  }
};

function genericInputValidation(event) {
  logger.info("inside genericInputValidation");
  return new Promise((resolve, reject) => {
    if (!event || !event.method) {
      reject({
        result: "inputError",
        message: "method cannot be empty"
      });
    }

    if (event.method !== 'GET') {
      reject({
        result: "inputError",
        message: "Unsupported method/request"
      });
    }

    if (event.method === 'GET' && (!event.query || !Object.keys(event.query).includes('slack_channel') || !event.query.slack_channel)) {
      reject({
        result: "inputError",
        message: "Missing input parameter slack_channel"
      });
    }

    if (!event.principalId) {
      reject({
        result: "unauthorized",
        message: "Unauthorized."
      });
    }

    resolve(event.query.slack_channel);
  });
}

function requestToChannels(config, resObj, channel_name) {
  logger.info("Inside requestToChannels:" + channel_name);
  return new Promise((resolve, reject) => {
    var slack_token = "token=" + config.slack_channel_token;
    //Pull endpoints from config file
    var public_channel_url = config.public_channel_endpoint + slack_token;
    var priv_channel_url = config.priv_channel_endpoint + slack_token;
    var urlList = [];
    urlList.push(get_response(public_channel_url, channel_name));
    urlList.push(get_response(priv_channel_url, channel_name));

    Promise.all(urlList)
      .then(res => {
        if (res.includes('true')) {
          resObj.is_available = true;
        } else {
          resObj.is_available = false;
        }
        resolve(resObj);
      })
      .catch(error => {
        logger.error("error: " + JSON.stringify(error));
        reject(error);
      });
  });
}

function get_response(channel_url, channel_name) {
  logger.info("Inside get_response:" + channel_url + ",channel_name:" + channel_name);
  return new Promise((resolve, reject) => {
    var params = {
      method: 'GET',
      uri: channel_url,
      rejectUnauthorized: false
    };

    request(params, (error, response, body) => {
      if (error) {
        logger.error(error);
        reject(error);
      } else {
        var data = JSON.parse(response.body);
        logger.info("Channels data: " + JSON.stringify(data));
        if (data.ok) {
          var list = data.channels ? data.channels : data.groups;
          if (list.length) {
            var count = 0;
            for (let i in list) {
              if (list[i].name === channel_name) {
                resolve('true');
              } else {
                count++;
                if (count === list.length) {
                  resolve('false');
                }
              }
            }
          } else {
            resolve('false');
          }
        } else {
          resolve('false');
        }
      }
    });
  });
}
