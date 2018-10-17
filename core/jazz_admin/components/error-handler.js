/**
    Admin
  @module: error-handler.js
  @description: Defines functions raising API Errors in required format for API Gateway integration
	@author:
	@version: 1.0
**/

module.exports = () => {
    var errorObj = {
        throwInputValidationError: function (errorMessage) {
            return {
                errorType: "BadRequest",
                message: errorMessage.toString()
            };
        },
        throwForbiddenError: function (errorMessage) { //Raise not found exceptions
            return {
                errorType: "Forbidden",
                message: errorMessage.toString()
            };
        },
        throwUnauthorizedError: function (errorMessage) {
            return {
                errorType: "Unauthorized",
                message: errorMessage.toString()
            };
        },
        throwNotFoundError: function (errorMessage) {
            return {
                errorType: "NotFound",
                message: errorMessage.toString()
            };
        },
        throwInternalServerError: function (errorMessage) {
            return {
                errorType: "InternalServerError",
                message: errorMessage.toString()
            };
        }
    };
    return errorObj;
};
