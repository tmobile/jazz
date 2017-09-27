const assert = require('chai').assert;
const index = require('../index');

describe('Sample', function() {
    it('tests handler', function(done) {

    	index.handler({method:'GET'},{},function() {})

        //Test cases to be added here.
        assert(true);
        done();
    });
});
