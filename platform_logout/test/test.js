// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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

const assert = require('chai').assert;
const expect = require('chai').expect;
const awsContext = require('aws-lambda-mock-context');
const AWSCognito = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const index = require('../index');
const logger = require('../components/logger.js');

var event, context, spy, callback;

//Setting up a spy to wrap mocked cognito functions (stubs) for each test scenario
spy = sinon.spy();

describe('Logout handler', function() {

  //Setting up default values for the aws event and context needed for handler params
  beforeEach(function(){
    event = { "method" : "POST",
              "stage" : "test",
              "headers" : { "Authorization" : "s0m3_Rand0m_acc3s_t0ken"
                       }
            };
    context = awsContext();
    callback = (value) => {
      return value;
    };
  });

  /*
  * Given an event with no Authorization token defined, handler() shows that an inputValidation error occured
  * @param {object} event without Authorization token
  * @param {object} aws context
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing authorization token was not found
  */
  it("should throw an inputValidation error for missing AuthorizationToken", function(){
    event.headers.Authorization = undefined;
    var bool = index.handler(event,context,callback).includes("Authorization token not provided.");
    assert.isTrue(bool);
  });

  /*
  * Upon unsuccesfful user lookup, handler() throws an Error with stack info
  * @param {object} event with Authorization token
  * @param {object} aws context
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing error and the stack property from error
  */
  it("should show error information upon unsuccessful user lookup", function(){
    //mocking the CognitoIdentityServiceProvider functionality
    var mock = AWS.mock("CognitoIdentityServiceProvider","getUser", (paramss, cb) => {
      var err = {
        "name" : "SomeError",
        "stack" : "stack object to elaborate on error"
      }
      //logic in index is expecting a callback with (error object, user data)
      //in this scenario user data will not be provided due to error being made
      return cb(err, null);
    });
    //wrap the logged output with a spy to test if error message is received
    var stub = sinon.stub(logger,"info",spy);
    //trigger the mocked service which will trigger the logged output
    var callFunction = index.handler(event,context, callback);
    stub.restore();
    //the error message should be received as an input paramter for the logger.info
    var returnValues = stub.args[0][0];
    console.log(returnValues);
    AWS.restore("CognitoIdentityServiceProvider");
    var bool = returnValues.includes("Couldnot identify user from the available token") &&
                returnValues.includes("stack object to elaborate on error");
    assert.isTrue(bool);
  });

  /*
  * Given a valid event object, handler() should invoke getUser() from CognitoIdentityServiceProvider
  */
  it('should attempt to get user data from Cognito Service Provider', function() {
    //mocking the CognitoIdentityServiceProvider functionality
    AWS.mock("CognitoIdentityServiceProvider","getUser",spy);
    var returned = index.handler(event,context,callback);
    AWS.restore("CognitoIdentityServiceProvider");
    assert.isTrue(spy.called);
    //expect(() => index.handler(event,context)).to.throw();
  });

  /*
  * Given a valid event object, handler() should invoke globalSignOut() from CognitoIdentityServiceProvider
  */
  it('should attempt to signout user from all devices', function() {
    //mocking multiple CognitoIdentityServiceProvider functionalities
    AWS.mock("CognitoIdentityServiceProvider","getUser", (paramss, cb) => {
      cb(null, "successfully identified user");
    });
    AWS.mock("CognitoIdentityServiceProvider","globalSignOut",spy);
    var returned = index.handler(event,context,callback);
    AWS.restore("CognitoIdentityServiceProvider");
    assert.isTrue(spy.called);
    //expect(() => index.handler(event,context)).to.throw();
  });
});
