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

const AWS = require('aws-sdk');
const errorHandlerModule = require("./components/error-handler.js");
const logger = require("./components/logger.js");
const validation = require("./components/validation.js");

module.exports.handler = (event, context, callback) => {
  logger.init(event, context);
  const errorHandler = errorHandlerModule();

  try {
    validation.validateEvent(event)
      .then(function (result) {
        AWS.config.region = event.region;
        const lambda = new AWS.Lambda();

        //Defining the payload object
        const payload = {
          body: event.body,
          query: event.queryStringParameters,
          headers: event.headers,
          method: event.httpMethod,
          path: event.path,
          resource: event.resource,
          pathParameters: event.pathParameters
        };

        logger.verbose(`payload : ${JSON.stringify(payload)}`);
        const params = {
          FunctionName: event.functionName,
          InvocationType: 'RequestResponse',
          LogType: 'Tail',
          Payload: JSON.stringify(payload)
        };
        return lambda.invoke(params).promise();
      })
      .then(function (result) {
        const responseObj = JSON.parse(result.Payload);
        if (!responseObj) {
          logger.error(`No payload response received.`);
          return callback(errorHandler.throwInternalServerError(`No payload response received.`));
        }
        else if (!responseObj.errorMessage && !responseObj.message) {
          logger.verbose(`Successfully invoked lambda : ${JSON.stringify(responseObj)}`);
          return callback(null, responseObj);
        } else {
          if (responseObj.errorMessage) {
            errorMessage = (typeof responseObj === 'string') ? JSON.parse(responseObj.errorMessage) : responseObj.errorMessage;
            logger.error(`Unhandled error reported in underlying lambda : ${errorMessage}`);
          } else {
            errorMessage = (typeof responseObj === 'string') ? JSON.parse(responseObj.message) : responseObj.message;
            logger.error(`Error reported in underlying lambda : ${errorMessage}`);
          }

          const errorType = errorMessage.errorType;
          switch (errorType) {
            case 'BadRequest':
              return callback(JSON.stringify(errorHandler.throwInputValidationError(errorMessage)));
              break;
            case 'Forbidden':
              return callback(JSON.stringify(errorHandler.throwForbiddenError(errorMessage)));
              break;
            case 'Unauthorized':
              return callback(JSON.stringify(errorHandler.throwUnauthorizedError(errorMessage)));
              break;
            case 'NotFound':
              return callback(JSON.stringify(errorHandler.throwNotFoundError(errorMessage)));
              break;
            case 'InternalServerError':
            default:
              return callback(JSON.stringify(errorHandler.throwInternalServerError(errorMessage)));
          }
        }
      })
      .catch(function (error) {
        if (error.result === "inputError") {
          return callback(JSON.stringify(errorHandler.throwMissingParamsError(error.message)));
        } else {
          logger.error(`Error invoking lambda proxy : ${JSON.stringify(error)}`);
          return callback(JSON.stringify(errorHandler.throwCommonLambdaError(error.message)));
        }
      })
  } catch (e) {
    logger.error("Internal server error:" + JSON.stringify(e));
    return callback(JSON.stringify(errorHandler.throwInternalServerError("Unexpected error occurred")));
  }
};
