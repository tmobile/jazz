/**
	Nodejs Template Project
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
                message: errorMessage.toString()
            }
        ),
        throwForbiddenError: (errorMessage) => (
            {
                errorType: "Forbidden",
                message: errorMessage.toString()
            }
        ),
        throwUnauthorizedError: (errorMessage) => (
            {
                errorType: "Unauthorized",
                message: errorMessage.toString()
            }
        ),
        throwNotFoundError: (errorMessage) => (
            {
                errorType: "NotFound",
                message: errorMessage.toString()
            }
        ),
        throwInternalServerError: (errorMessage) => (
            {
                errorType: "InternalServerError",
                message: errorMessage.toString()
            }
        )
    };

    return errorObj;
};
