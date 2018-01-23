/**
	Nodejs Template Project
  @module: error-handler.js
  @description: Defines functions raising API Errors in required format for API Gateway integration
	@author:
	@version: 1.0
**/

module.exports = () => {
    var errorObj = {
        throwInputValidationError: function(errorCodeNum, errorMessage) { 
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "BadRequest",
                message: errorMessage.toString()
            };
        },
        throwForbiddenError: function(errorCodeNum, errorMessage) { 
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "Forbidden",
                message: errorMessage.toString()
            };
        },
        throwUnauthorizedError: function(errorCodeNum, errorMessage) {
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "Unauthorized",
                message: errorMessage.toString()
            };
        },
        throwNotFoundError: function(errorCodeNum, errorMessage) { 
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "NotFound",
                message: errorMessage.toString()
            };
        },
        throwInternalServerError: function(errorCodeNum, errorMessage) {
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "InternalServerError",
                message: errorMessage.toString()
            };
        }
    };
    return errorObj;
};
