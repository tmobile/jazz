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
  CRUD functions for service catalog
  @module: index.js
  @description: validate payload for create, update and search action.
  @author:
  @version: 1.0
**/

var validateCreatePayload = require('./validate_create_payload.js');
var validateSearchPayload = require('./validate_search_payload.js');
var validateUpdatePayload = require('./validate_update_payload');

module.exports = () => {
    return {
        validateCreatePayload: validateCreatePayload,
        validateSearchPayload: validateSearchPayload,
        validateUpdatePayload: validateUpdatePayload
    };
};