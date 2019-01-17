/**
	Nodejs Template Project
  @module: error-handler.js
  @description: Defines functions raising API Errors in required format for API Gateway integration
	@author:
	@version: 1.0
**/

module.exports = () => {
    const errorObj = {
        throwInputValidationError: (errorMessage) => ( //Raise a  bad requests exception
            {
                errorType: "BadRequest",
                message: errorMessage.toString()
            }
        ),
        throwForbiddenError: (errorMessage) => ( //Raise not found exceptions
            {
                errorType: "Forbidden",
                message: errorMessage.toString()
            }
        ),
        throwUnauthorizedError: (errorMessage) => ( //Raise not found exceptions
            {
                errorType: "Unauthorized",
                message: errorMessage.toString()
            }
        ),
        throwNotFoundError: (errorMessage) => ( //Raise not found exceptions
            {
                errorType: "NotFound",
                message: errorMessage.toString()
            }
        ),
        throwInternalServerError: (errorMessage) => ( //Raise internal server exceptions
            {
                errorType: "InternalServerError",
                message: errorMessage.toString()
            }
        )
    };

    return errorObj;
};
