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
