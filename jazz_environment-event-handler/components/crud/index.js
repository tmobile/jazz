
var _get = require('./get.js');
var _create = require('./create.js');
var _update = require('./update.js');


module.exports = () => {
    return {
        get: _get,
        create: _create,
        update: _update
    }
}