// =========================================================================
// Copyright ©  2017 T-Mobile USA, Inc.
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
API to test lambda function and send back execution status
@author:
@version: 1.0
 **/

'use strict';

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const utils = require("./components/utils.js");
const aws = require('aws-sdk');
const validateARN = utils.validateARN;
const execStatus = utils.execStatus();

var handler = (event, context, cb) => {
  //Initializations
  var errorHandler = errorHandlerModule();
  var config = configObj(event);
  logger.init(event, context);
  var awsRegion;
  try {
    var responseObject = {
      "execStatus": null,
      "payload": null,
    };
    if (!event && !event.method && event.method !== 'POST') {
      return cb(JSON.stringify(errorHandler.throwNotFoundError("Method not found")));
    }
    if (!event.body) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Request payload cannot be empty")));
    }
    if (!validateARN(event.body.functionARN)) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Function ARN is invalid")));
    }
    if (!event.body.inputJSON) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Input for function is not defined")));
    }
    var functionARN = event.body.functionARN;
    var arnvalues = functionARN.split(":");
    awsRegion = arnvalues[3]; //["arn","aws","lambda","us-east-1","000000""] spliting FunctionARN to get the aws-region
    var inputJSON = event.body.inputJSON;

    invokeLambda(functionARN, inputJSON, awsRegion).then((data) => {

      if (data && data.StatusCode >= 200 && data.StatusCode < 299) {
        responseObject.payload = data;
        if (!data.FunctionError) {
          responseObject.execStatus = execStatus.success;
        } else {
          if (data.FunctionError === "Handled") {
            responseObject.execStatus = execStatus.handledError;
          } else if (data.FunctionError === "Unhandled") {
            responseObject.execStatus = execStatus.unhandledError;
          }
        }
      } else {
        // Function Falied |Cause Unknown|TEST FAILED
        logger.error("Internal Error :", data);
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Unknown internal error occurred when invoking " + functionARN)));
      }
      responseObject.payload = data;
      return cb(null, responseObj(responseObject, event.body));
    }).catch((err) => {
      responseObject.execStatus = execStatus.functionInvocationError;
      responseObject.payload = err;
      return cb(null, responseObj(responseObject, event.body));
    });
  } catch (err) {
    return cb(JSON.stringify(errorHandler.throwInternalServerError("Unknown internal error occurred when invoking the function")));
  }
};
var invokeLambda = (functionARN, inputJSON, awsRegion) => {

  return new Promise((resolve, reject) => {
    try {
      var lambda = new aws.Lambda({
        region: awsRegion
      });
      lambda.invoke({
        FunctionName: functionARN,
        Payload: JSON.stringify(inputJSON)
      }, function (error, data) {
        if (error) {
          logger.error("Error in lambda execution:", error);
          reject(error);
        } else {
          logger.debug("Lambda executed successfully:", data);
          resolve(data);
        }
      });
    } catch (e) {
      logger.error(e);
      reject("Error in invoking lambda");
    }
  });
};

module.exports = {
  handler: handler,
  invokeLambda: invokeLambda
};
