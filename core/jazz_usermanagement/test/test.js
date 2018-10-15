const assert = require('chai').assert;
const expect = require('chai').expect;
const should = require('chai').should();
const awsContext = require('aws-lambda-mock-context');
const AWSCognito = require('amazon-cognito-identity-js');
const sinon = require('sinon');
const index = require('../index');
const logger = require("../components/logger.js");
const errorHandlerModule = require("../components/error-handler.js");
const scmFactory = require("../scm/scmFactory.js");
const configModule = require("../components/config.js");
const responseObj = require("../components/response.js")

var event, context, spy, callback, stub;

//Setting up a spy to wrap mocked cognito functions (stubs) for each test scenario
spy = sinon.spy();

describe('User Management', function() {
  
  
  //Setting up default values for the aws event and context needed for handler params
  beforeEach(function(){
    event = { "method" : "POST",
              "stage" : "test",
              "resourcePath" : "test/service/user/reset",
              "body" : { "username" : "username",
                          "userid"  : "username",
                         "verificationCode" : "123",
                         "email" : "abc@xyz.com"
                       }
            };
    context = awsContext();
    callback = (value) => {
      return value;
    };	
  });
  
  
  it('forget password handler', function(done) {

    // Add your test cases here.
    assert(true);
    done();
  });

  it('missing context should return 101 error', function(done) {

    event = undefined;
    context = undefined;
    var bool = index.handler(event,context,callback).includes("Internal error, please reach out to admins") &&
                index.handler(event,context,callback).includes("101");
                done();
    assert.isTrue(bool);
  });
  
    
  /*
  * Given an event with no method, handler() shows that a Bad Request has been made
  * @param {object} event containing only stage and body attributes
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing error type of Service operation not supported has occured
  */
  it("should throw a invalid or missing arguments for undefined method", function(){
    event = { "method" : undefined,
              "stage" : "test",
              "resourcePath" : "reset",
              "body" : { "username" : "username",
                         "verificationCode" : "123",
                         "email" : "abc@xyz.com"
                       }
            };
    context = awsContext();
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
    assert.isFalse(bool);
  });

  it("Should throw an error with errorcode 102", function(){
    event.email = undefined;
    index.validateResetParams(event)
    .then(res=> {
      expect(res).to.have.property('errorCode');
    });
  })

  

  it("Should throw an error with errorcode 102", function(){
    event.email = undefined;
    index.validateResetParams(event)
    .catch(res=> {
      expect(res).to.have.property('errorCode');
    });
  })
    
  it("should throw error Email is required field", function(){
    event.email = undefined;
    index.validateUpdatePasswordParams(event)
    .then(res=> { expect(res).to.have.property('102')
    });    
  });

  it('should throw error Email is required field', function () {
    event.email = undefined;
    let result = index.validateUpdatePasswordParams(event); 
    return result
      .catch(error => expect(error).to.include({
        errorCode:'102',
        errorType: 'BadRequest',
			  message: 'Email is required field'
      }));
  });


  it('should throw error verificationCode is required field', function () {
    event.verificationCode = undefined;
    event.email = 'abc@xyz.com';
    let result = index.validateUpdatePasswordParams(event); 
    return result
    .catch(error => expect(error).to.include({
      errorCode:'102',
      errorType: 'BadRequest',
      message: 'Verification code is required'
    }));
  });

  it('should throw error validateCreaterUserParams', function () {    
    config.required_fields = {'userid':'userid','email':'email','verificationCode':'verificationCode','param':'param'}
    let result = index.validateCreaterUserParams(config,event.body);
    return result
    .catch(error => expect(error).to.include({
      errorCode: '102',
      errorType: 'BadRequest',
      message: 'Following field(s) are required - param'
    }));
  });

  it('should throw error 102 Following field(s) are required userid', function () {   
    config.required_fields = ['userid','email','verificationCode'];
      event.body = {  "username" : "username",
                      "userid" : "",
                      "verificationCode" : "123",
                      "email" : "abc@xyz.com"
                 }
    // 
    let result = index.validateCreaterUserParams(config,event.body);
    return result
    .catch(error => expect(error).to.include({
        errorCode: '102',
        errorType: 'BadRequest',
        message: 'userid\'s value cannot be empty'
    })); 

  });

  it('should throw Invalid User Registration Code', function () {   
    config.required_fields = ['userid','email','usercode'];
      event.body = {  "username" : "username",
                      "userid" : "userid",
                      "usercode" : "aabd123",
                      "email" : "abc@xyz.com"
                    }
    config.reg_codes = ['AAB123'];
    // 
    let result = index.validateCreaterUserParams(config,event.body);
    return result
    .catch(error => expect(error).to.include({
        errorCode: '103',
        errorType: 'BadRequest',
        message: 'Invalid User Registration Code'
    })); 

  });

  it('should not throw any error in validateCreaterUserParams', function () {   
    config.required_fields = ['userid','email','usercode'];
      event.body = {  "username" : "username",
                      "userid" : "userid",
                      "usercode" : "aab123",
                      "email" : "abc@xyz.com"
                    }
    config.reg_codes = ['AAB123'];
    // 
    let result = index.validateCreaterUserParams(config,event.body);
    return result
    .then(res => expect(res).to.include({ username: 'username',
    userid: 'userid',
    usercode: 'AAB123',
    email: 'abc@xyz.com' })); 

  });


  it('should throw error getRequestToCreateSCMUser function', function () {    
    let result = index.getRequestToCreateSCMUser(config,event.body); 
    return result
    .catch(res=> { expect(res).to.have.property('102') 
    });
  });


  it('should throw error forgotPassword function', function () {    
    let result = index.forgotPassword(config,event.body); 
    return result
    .then(res=> { expect(res).to.have.property('102') 
    });
  });


  it('should throw error password is required field', function () {
    event.password = undefined;
    event.verificationCode = 'S3cret';
    event.email = 'abc@xyz.com';
    let result = index.validateUpdatePasswordParams(event); 
    return result
    .catch(error => expect(error).to.include({
      errorCode:'102',
      errorType: 'BadRequest',
      message: 'Password is required'
    }));     
  });

  it('should not throw any error', function () {
    event.password = 'P@ssword';
    event.verificationCode = 'S3cret';
    event.email = 'abc@xyz.com';
    let result = index.validateUpdatePasswordParams(event); 
    return result
      .then(rslt => expect(rslt).to.be.equal('success'))
  });

  // Inside handler for subpath reset //
  it("should should call validateResetParams with Failed while resetting user password", function(){    
    var responseObj = { result: "success", errorCode: "0", message: "Password reset was successful for user: " + event.email }
    const validateResetParams = sinon.stub(index, "validateResetParams").resolves(null);
    const forgotPassword = sinon.stub(index, "forgotPassword").resolves(null);
    index.handler( event,context,callback)
    .then(res => { 
       
      sinon.assert.calledOnce(validateResetParams);
      sinon.assert.calledOnce(forgotPassword);
      expect(res).to.be.eq(err);
      validateResetParams.restore();
      forgotPassword.restore();    
    })
    .done();
    
  }); 

 // Inside handler for subpath updatepwd //
 it("should should call validateResetParams with Failed while update user password", function(){    
  event.resourcePath = "test/service/user/reset";
  var responseObj = { result: "success", errorCode: "0", message: "Password reset was successful for user: " + event.email }
  
  const updatePassword = sinon.stub(index, "updatePassword").rejects(null);
  index.handler( event,context,callback)
  .catch(res => {
    expect(res).to.be.eq(responseObj)
    sinon.assert.calledOnce(validateResetParams);
    sinon.assert.calledOnce(updatePassword);
    validateResetParams.restore();
    updatePassword.restore(); 
  })  
  .done();
  
}); 


});


