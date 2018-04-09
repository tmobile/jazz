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
    Validate functions for service catalog
    @module: index.js
    @description: Validation Utility functions.
	@author: 
	@version: 1.0
**/

var _validateCreatePayload = require("./validate_create_payload");
var _validateUpdatePayload = require("./validate_update_payload");
var _validateServiceWithServiceId = require("./validate_service");

module.exports = () => {
    return {
        validateCreatePayload: _validateCreatePayload,
        validateUpdatePayload: _validateUpdatePayload,
        validateServiceWithServiceId: _validateServiceWithServiceId
    };
};