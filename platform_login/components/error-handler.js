/**
	@module: error-handler.js
	@description: Defines functions raising API Errors in required format for API Gateway integration
	@author:
	@version: 1.0
**/

module.exports = (logger) => {
    
	var errorObj = {
        throwInputValidationError: function(errorMessage) { //Raise a  bad requests exception
            logger.error(errorMessage);
			return {
                errorType: "BadRequest",
                message: errorMessage.toString()
            };
        },
        throwNotFoundError: function(errorMessage) { //Raise not found exceptions
            logger.error(errorMessage);
			return {
                errorType: "NotFound",
                message: errorMessage.toString()
            };
        },
        throwInternalServerError: function(errorMessage) { //Raise internal server exceptions
            logger.error(errorMessage);
			return {
                errorType: "InternalServerError",
                message: errorMessage.toString()
            };
        },
		throwUnauthorizedError: function(errorMessage) { //Raise Authentication Failure exceptions
            logger.error(errorMessage);
			return {
                errorType: "Unauthorized",
                message: errorMessage.toString()
            };
        },
		throwForbiddenError: function(errorMessage) { //Raise Access Denied exceptions
            logger.error(errorMessage);
			return {
                errorType: "Forbidden",
                message: errorMessage.toString()
            };
        }
    };
    return errorObj;
};
