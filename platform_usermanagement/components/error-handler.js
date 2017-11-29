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
        throwForbiddenError: function(errorCode, errorMessage) { 
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "Forbidden",
                message: errorMessage.toString()
            };
        },
        throwUnauthorizedError: function(errorCode, errorMessage) {
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "Unauthorized",
                message: errorMessage.toString()
            };
        },
        throwNotFoundError: function(errorCode, errorMessage) { 
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "NotFound",
                message: errorMessage.toString()
            };
        },
        throwInternalServerError: function(errorCode, errorMessage) {
            return {
                errorCode: errorCodeNum.toString(),
                errorType: "InternalServerError",
                message: errorMessage.toString()
            };
        }
    };
    return errorObj;
};
