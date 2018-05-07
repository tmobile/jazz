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
    Validation functions for Events catalog
    @module: index.js
    @description: validate event_type, event_name, event_handler, event_status and event_timestamp.
	@author: 
	@version: 1.0
**/

var _validate_event_data = require("./validate_event_data.js");

module.exports = () => {
    return {
        validateEventData: _validate_event_data
    };
};
