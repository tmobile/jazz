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

function validateBasicInput(userInput) {
  if (!userInput) {
    throw (errorHandlerModule.throwInternalServerError("Input parameters are missing"));
  }

  if (!userInput.method) {
    throw (errorHandlerModule.throwInputValidationError("Method is missing"));
  }

  if (!userInput.resourcePath) {
    throw (errorHandlerModule.throwInputValidationError("Missing the resource path"));
  }

  if (!userInput.principalId) {
    throw (errorHandlerModule.throwForbiddenError("You aren't authorized to access this resource"));
  }
}

function validateGetPoliciesInput(userInput) {
  if (!userInput.query.serviceId) {
    throw (errorHandlerModule.throwInputValidationError("Service Id is missing"));
  }
}

function validatePostPoliciesInput(userInput) {
  if (!userInput.body) {
    throw (errorHandlerModule.throwInternalServerError("Body is missing"));
  }

  if (!userInput.body.serviceId) {
    throw (errorHandlerModule.throwInputValidationError("Service Id is missing"));
  }

  if (!userInput.body.policies) {
    throw (errorHandlerModule.throwInputValidationError("Policy details are missing"));
  }

  if (userInput.body.policies && userInput.body.policies.length) {
    let missingFields = [];
    userInput.body.policies.forEach(policy => {
      if (!policy.userId) {
        missingFields.push("userId");
      }
      if (!policy.permission) {
        missingFields.push("permission");
      }
      if (!policy.category) {
        missingFields.push("category");
      }
    });
    if (missingFields.length) {
      throw (errorHandlerModule.throwInputValidationError(`Policy details are missing values for ${missingFields.join(', ')}`));
    }
  }
}

function validateGetCheckPermsInput(userInput) {
  if (!userInput.query.userId) {
    throw (errorHandlerModule.throwInputValidationError("User Id is missing"));
  }

  if (!userInput.query.serviceId) {
    throw (errorHandlerModule.throwInputValidationError("Service Id is missing"));
  }

  if (!userInput.query.permission) {
    throw (errorHandlerModule.throwInputValidationError("Permission is missing"));
  }

  if (!userInput.query.category) {
    throw (errorHandlerModule.throwInputValidationError("Category is is missing"));
  }
}

function validateGetServicesInput(userInput) {
  if (!userInput.query.userId) {
    throw (errorHandlerModule.throwInputValidationError("User Id is missing"));
  }
}

module.exports = {
  validateBasicInput,
  validateGetPoliciesInput,
  validatePostPoliciesInput,
  validateGetCheckPermsInput,
  validateGetServicesInput
};
