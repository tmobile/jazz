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
 * @module: error-handler.js
 * @description: Defines functions raising API Errors in required format for API
 *               Gateway integration
 * @author:
 * @version: 1.0
 */

module.exports = (logger) => {

    var errorObj = {
        throwInputValidationError: function (errorCodeNum, errorMessage) { //Raise a  bad requests exception
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "BadRequest",
                message: errorMessage.toString()
            };
        },
        throwForbiddenError: function (errorCodeNum, errorMessage) { //Raise not found exceptions
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "Forbidden",
                message: errorMessage.toString()
            };
        },
        throwUnauthorizedError: function (errorCodeNum, errorMessage) { //Raise not found exceptions
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "Unauthorized",
                message: errorMessage.toString()
            };
        },
        throwNotFoundError: function (errorCodeNum, errorMessage) { //Raise not found exceptions
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "NotFound",
                message: errorMessage.toString()
            };
        },
        throwInternalServerError: function (errorCodeNum, errorMessage) { //Raise internal server exceptions
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "InternalServerError",
                message: errorMessage.toString()
            };
        }
    };
    return errorObj;
};
