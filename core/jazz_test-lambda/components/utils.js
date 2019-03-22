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

/**
    Helper functions for Events
    @module: utils.js
    @author:
    @version: 1.0
**/

var validateARN = (arn) => {
  if (arn) {
    var arnvalues = arn.split(":");
    var isarnvalid = true;
    //validate if arn is a valid Lambda
    if (arn.indexOf("arn:aws:lambda") !== 0 || arnvalues[5] !== "function" || arnvalues.length > 8)
      isarnvalid = false;
    return isarnvalid;
  } else {
    return false;
  }

};

var validateEndpoint = (endpoint) => {
  if (endpoint && endpoint.startsWith("http")) {
    return true;
  } else {
    return validateARN(endpoint);
  }

};

var execStatus = () => {
  return {
    "success": "Success",
    "handledError": "HandledError",
    "unhandledError": "UnhandledError",
    "functionInvocationError": "FunctionInvocationError"
  }
}

module.exports = {
  validateEndpoint,
  execStatus
};
