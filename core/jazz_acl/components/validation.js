const errorHandlerModule = require("./error-handler.js");

function validateInput(userInput) {

	return new Promise((resolve, reject) => {

		if (!userInput || !userInput.method) {
			return reject(errorHandlerModule.throwInputValidationError("Invalid or missing arguments"));
    }

    if (!userInput.resourcePath) {
			return reject(errorHandlerModule.throwInputValidationError("Missing the resource path"));
		}

		if (!userInput.principalId) {
			return reject(errorHandlerModule.throwForbiddenError("You aren't authorized to access this resource"));
		}

		resolve(userInput);
	});
}

module.exports = {
  validateInput
};
