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

const errorHandlerModule = require("./error-handler.js")();

function genericInputValidation(event) {
  if (!event) {
    throw (errorHandlerModule.throwInternalServerError("Input parameters are missing."));
  }

  if (!event.method) {
    throw (errorHandlerModule.throwInputValidationError("Method is missing."));
  }

  if (event.method && event.method !== "GET") {
    throw (errorHandlerModule.throwInputValidationError("Unsupported request."));
  }

  if(!event.principalId) {
    throw (errorHandlerModule.throwUnauthorizedError("Unauthorized."));
  }

}

module.exports = {
  genericInputValidation
};
