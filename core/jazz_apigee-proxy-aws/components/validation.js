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

module.exports.validateEvent = (event) => {
    return new Promise((resolve, reject) => {
        // event.method cannot be empty, throw error
        if (!event.region) {
            reject({
                result: "inputError",
                message: "Required parameter 'region' is missing"
            })
        }

        if (!event.httpMethod) {
            reject({
                result: "inputError",
                message: "Required parameter 'httpMethod' is missing"
            })
        }

        if (!event.functionName) {
            reject({
                result: "inputError",
                message: "Required parameter 'functionName' is missing"
            })
        }

        resolve();
    });
}
