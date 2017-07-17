/**
	CRUD functions for service catalog
  @module: index.js
  @description: create, get by id, get all, filter, update, delete.
	@author: Sunil Fernandes
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
