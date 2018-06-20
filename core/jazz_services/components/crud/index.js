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
    @description: create, get by id, get all, filter, update, delete.
	@author: 
	@version: 1.0
**/

var _get = require('./get.js');
var _getList = require('./getList.js');
var _create = require('./create.js');
var _delete = require('./delete.js');
var _update = require('./update.js');


module.exports = () => {
    return {
        get: _get,
        getList: _getList,
        create: _create,
        delete: _delete,
        update: _update
    }
}
