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
