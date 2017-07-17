const assert = require('chai').assert;
const index = require('../index');

describe('Sample', function() {
	// this.timeout(60000);
    it('test case : service not available', function(done) {

        index.handler({
            method: 'GET',
            stage: "dev",
            query: {
            	service: "is-service-available"
            }
        }, {}, function(error, result) {
        	if (error) {
        		console.log("ERROR : ",error);
        	} else{
              console.log("SUCCESS!! : ",result);
          }

        	assert.equal(result.data.available, false);
            done();
        });
    });

    it('test case : service is available', function(done) {

        index.handler({
            method: 'GET',
            stage: "dev",
            query: {
                domain: "blah",
                service: "is-service-available"
            }
        }, {}, function(error, result) {
            if (error) {
              console.log("ERROR : ",error);
            } else{
                console.log("SUCCESS!! : ",result);
            }
            assert.equal(result.data.available, true);
            done();
        });
    });
});
