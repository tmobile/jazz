
var _create = require('./create.js');
var _update = require('./update.js');


module.exports = () => {
    return {
        create: _create,
        update: _update
    }
}