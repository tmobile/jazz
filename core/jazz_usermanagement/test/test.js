const assert = require('chai').assert;
const expect = require('chai').expect;
const awsContext = require('aws-lambda-mock-context');
const AWSCognito = require('amazon-cognito-identity-js');
const sinon = require('sinon');
const index = require('../index');
const logger = require("../components/logger.js");
const errorHandlerModule = require("../components/error-handler.js");

var event, context, spy, callback, stub;

//Setting up a spy to wrap mocked cognito functions (stubs) for each test scenario
spy = sinon.spy();

describe('forget password', function() {
  
  
  //Setting up default values for the aws event and context needed for handler params
  beforeEach(function(){
    event = { "method" : "POST",
              "stage" : "test",
			  "resourcePath" : "reset",
              "body" : { "username" : "username",
                         "ClientId" : "123",
						  "email" : "abc@xyz.com"
                       }
            };
    context = awsContext();
	//console.log(context);
    callback = (value) => {
      return value;
    };
	
  });
  
  
  it('forget password handler', function(done) {

    // Add your test cases here.
    assert(true);
    done();
  });
  
    
  /*
  * Given an event with no method, handler() shows that a Bad Request has been made
  * @param {object} event containing only stage and body attributes
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing error type of Service operation not supported has occured
  */
  it("should throw a Service operation not supported error for undefined method", function(){
    event.method = undefined;
    var bool = index.handler(event,context,callback).includes("Service operation not supported") &&
                index.handler(event,context,callback).includes("101");
    assert.isTrue(bool);
  });
  
  /*
  * Given an event with no method, handler() shows that a undefined resourcePath
  * @param {object} event containing only stage and body attributes
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing error type of Service operation not supported has occured
  */
  it("should throw a Service operation not supported error for undefined resourcePath", function(){
    event.resourcePath = undefined;
    var bool = index.handler(event,context,callback).includes("Service operation not supported") &&
                index.handler(event,context,callback).includes("101");
    assert.isTrue(bool);
  });
  
  function validateResetParams(userInput) {
    return new Promise((resolve, reject) => {
  
      var errorHandler = errorHandlerModule();
  
      if (!userInput.email) {
        logger.info("no email address provided for password reset");
        reject(errorHandler.throwInputValidationError("102", "email is required field"));
      } else {
        resolve();
      }
    });
  }

  it('should return 102 error if not valid user email', function(){
    event.email = undefined;
    var isValid = validateResetParams(event).should.have.property("errorCode",102);
    console.log(isValid)
    //assert.isTrue(isValid);
  });
  
  
  
  
  
  
});


