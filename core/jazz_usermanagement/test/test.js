const assert = require('chai').assert;
const expect = require('chai').expect;
const should = require('chai').should();
const awsContext = require('aws-lambda-mock-context');
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const index = require('../index');
const logger = require("../components/logger.js");
const errorHandlerModule = require("../components/error-handler.js");
const scmFactory = require("../scm/scmFactory.js");
const configModule = require("../components/config.js");
const responseObj = require("../components/response.js")

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
      config = configModule.getConfig(event, context);
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

    it("should throw a Service operation not supported error for undefined resourcePath", function(){
      event.resourcePath = undefined;
      var bool = index.handler(event,context,callback).includes("Service operation not supported") &&
                  index.handler(event,context,callback).includes("101");
      assert.isFalse(bool);
    });

    it('missing context should return 101 error', function(done) {
      event = undefined;
      context = undefined;
      var bool = index.handler(event,context,callback).includes("Internal error, please reach out to admins") &&
                  index.handler(event,context,callback).includes("101");
                  done();
      assert.isTrue(bool);
    });
    it("should throw a invalid or missing arguments", function(){
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


});

describe("inside index handler", function(){
  beforeEach(function(){
    spy = sinon.spy();
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
    config = configModule.getConfig(event, context);
     callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
    };
       
  });
  it('Should return forgotPassword success ', function(done) {            
    AWS.mock('CognitoIdentityServiceProvider', 'forgotPassword', function(params, callback) {
      callback(null, 'success');
    });
    index.handler(event, context, (err, res) => {
      done();
      expect(res.data.result).to.eq("success");
      return res;
    });
  });

  it('Should return forgotPassword fail ', function() {  
    let responseObj = { errorCode: '106',
          errorType: 'InternalServerError',
          message: 'Failed while resetting user password for: abc@xyz.com' 
        }      
    AWS.mock('CognitoIdentityServiceProvider', 'forgotPassword', function(params, callback) {
      callback('fail', null);
    });
    index.handler(event, context, (err, res) => { 
      expect(err).to.include(responseObj);
      return err;
    });
  });

  it('Should return email require error validateResetParams ', function() {
    event.body.email = undefined;
    let responseObj = { errorCode: '102',
                errorType: 'BadRequest',
                message: 'email is required field' 
              }

    index.validateResetParams(event.body, config)
        .catch((error) => {
          expect(error).to.include(responseObj);
      
    });
  }); 
});

describe("inside index handler updatepwd", function(){
  beforeEach(function(){
    spy = sinon.spy();
    event = { "method" : "POST",
              "stage" : "test",
              "resourcePath" : "test/service/user/updatepwd",
              "body" : { "username" : "username",
                          "userid"  : "username",
                         "verificationCode" : "123",
                         "email" : "abc@xyz.com",
                         "password" : "Passord"
                       }
            };
    context = awsContext();
    config = configModule.getConfig(event, context);
     callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
    };
       
  });
  it('Should return update password success ', function(done) {            
    AWS.mock('CognitoIdentityServiceProvider', 'confirmForgotPassword', function(params, callback) {
      callback(null, 'success');
    });
    index.handler(event, context, (err, res) => {
      done();
      expect(res.data.result).to.eq("success");
      return res;
    });
  });

  it('Should return updated password failure', function(done) {            
    AWS.mock('CognitoIdentityServiceProvider', 'confirmForgotPassword', function(params, callback) {
      callback(null, 'success');
    });
    event.body.password = undefined;
    index.handler(event, context, (err, res) => { 
      done();
      expect(err).to.includes("errorCode");
      err.code = err.errorCode;
      return err;
    });
  });

  it('Should return email require error validateUpdatePasswordParams ', function() {
    event.body.email = undefined;
    let responseObj = { errorCode: '102',
                errorType: 'BadRequest',
                message: 'Email is required field' 
              }

    index.validateUpdatePasswordParams(event.body)
        .catch((error) => {
          expect(error).to.include(responseObj);
      
    });
  });

  it('Should return verificationCode require error validateUpdatePasswordParams ', function() {
    event.body.verificationCode = undefined;
    let responseObj = { errorCode: '102',
                errorType: 'BadRequest',
                message: 'Verification code is required' 
              }

    index.validateUpdatePasswordParams(event.body)
        .catch((error) => {
          expect(error).to.include(responseObj);
      
    });
  });  
})

describe("inside index handler else condition", function(){
  beforeEach(function(){
    spy = sinon.spy();
    event = { "method" : "POST",
              "stage" : "test",
              "resourcePath" : "test/service/user/something",
              "body" : { "username" : "username",
                          "userid"  : "username",
                         "usercode" : "123",
                         "email" : "abc@xyz.com",
                         "userpassword" : "Passord"
                       }
            };
    context = awsContext();
    config = configModule.getConfig(event, context);
     callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
    };
       
  });
  it('Should return createUser ', function(done) {
    var cognitoParams = {
			ClientId: config.USER_CLIENT_ID,
			Username: event.body.userid.toLowerCase(),
			Password: event.body.userpassword,
			UserAttributes: [{ Name: "custom:reg-code", "Value": event.body.usercode }],
			ValidationData: []
		};

    AWS.mock('CognitoIdentityServiceProvider', 'signUp', function(cognitoParams, callback) {
      callback(null, 'success');
    });
    const getRequestToCreateSCMUser = sinon.stub(index, "getRequestToCreateSCMUser").resolves("success")
    index.handler(event, context, (err, res) => { 
      done();
      expect(res).to.be.eq('success');
      return res;
    });
  });
});

it('test should call subscribers with message as first argument', function(done) {
  var message = "an example message";
  var spy = sinon.spy();

  PubSub.subscribe(message, spy);
  PubSub.publishSync(message, "some payload");

  sinon.assert.calledOnce(spy);
  sinon.assert.calledWith(spy, message);
}
