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
  @module: error-handler.js
  @description: Defines functions raising API Errors in required format for API Gateway integration
  @author:
  @version: 1.0
**/

module.exports = () => {
  const errorObj = {
    throwInputValidationError: (errorMessage) => (
      {
        errorType: "BadRequest",
        errorCode: 400,
        message: errorMessage
      }
    ),
    throwUnauthorizedError: (errorMessage) => (
      {
        errorType: "Unauthorized",
        errorCode: 401,
        message: errorMessage
      }
    ),
    throwForbiddenError: (errorMessage) => (
      {
        errorType: "Forbidden",
        errorCode: 403,
        message: errorMessage
      }
    ),
    throwNotFoundError: (errorMessage) => (
      {
        errorType: "NotFound",
        errorCode: 404,
        message: errorMessage
      }
    ),
    throwInternalServerError: (errorMessage) => (
      {
        errorType: "InternalServerError",
        errorCode: 500,
        message: errorMessage
      }
    ),
    throwMissingParamsError: (errorMessage) => (
      {
        errorType: "MissingRequiredParams",
        errorCode: 400,
        message: errorMessage
      }
    ),
    throwCommonLambdaError: (errorMessage) => (
      {
        errorType: "LambdaIntegrationError",
        errorCode: 500,
        message: errorMessage
      }
    )
  };

  return errorObj;
};
