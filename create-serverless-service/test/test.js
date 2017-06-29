const assert = require('chai').assert;
const index = require('../index');

describe('Sample', function() {
    it('tests handler', function(done) {

    	var event = {
    		body : {
	            "serviceName"	: "test-service",
	            "serviceType"	: "lambda",
	            "domain"		: "test-domain",
	            "runtime"		: "nodejs",
	            "approvers"		: ['aanand12'],
	            "rateExpression": "1/4 * * * ? *"
	        }
    	};

    	index.handler(event, context, function(argument) {})

        //Test cases to be added here.
        assert(true);
        done();
    });
});
