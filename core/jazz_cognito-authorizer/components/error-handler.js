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

module.exports = () => {
    const errorObj = {
        throwInputValidationError: (errorMessage) => (
            {
                errorType: "BadRequest",
                message: errorMessage.toString(),
                allow:false
            }
        ),
        throwForbiddenError: (errorMessage) => (
            {
                errorType: "Forbidden",
                message: errorMessage.toString(),
                allow:false
            }
        ),
        throwUnauthorizedError: (errorMessage) => (
            {
                errorType: "Unauthorized",
                message: errorMessage.toString(),
                allow:false
            }
        ),
        throwNotFoundError: (errorMessage) => (
            {
                errorType: "NotFound",
                message: errorMessage.toString(),
                allow:false
            }
        ),
        throwInternalServerError: (errorMessage) => (
            {
                errorType: "InternalServerError",
                message: errorMessage.toString(),
                allow:false
            }
        )
    };

    return errorObj;
};
