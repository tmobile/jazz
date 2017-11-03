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
const sinon = require('sinon');
const index = require('../index');

var event, context, stub, spy, callback;

//Setting up a spy to wrap mocked cognito functions (stubs) for each test scenario
spy = sinon.spy();

describe('Login handler', function() {

  //Setting up default values for the aws event and context needed for handler params
  beforeEach(function(){
    event = { "method" : "POST",
              "stage" : "test",
              "body" : { "username" : "whatTimeIsIt",
                         "password" : "AdventureT1me!"
                       }
            };
    context = awsContext();
    callback = (value) => {
      return value;
    };
  });

  /*
  * Given an event with no method, handler() shows that a Bad Request has been made
  * @param {object} event containing only stage and body attributes
  * @param {object} aws context
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing error type of badrequest has occured
  */
  it("should throw a BadRequest error for undefined method", function(){
    event.method = undefined;
    var bool = index.handler(event,context,callback).includes("Bad Request");
    assert.isTrue(bool);
  });

  /*
  * Given an event with non POST method, handler() shows that a Bad Request has been made
  * @param {object} event containing a non POST method
  * @param {object} aws context
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing error type of badrequest has occured
  */
  it("should throw a BadRequest error for method other than POST", function(){
    var methods = ["PUT","GET","HEAD","OPTIONS","DELETE"];
    var badRequestBool = true;
    //check if BadRequest occurs for each http method, if one passes without a bad request error
    //have the above bool value be false
    for(var i=0; i < methods.length; i++){
      event.method = methods[i];
      if(!index.handler(event,context,callback).includes("Bad Request")){
        badRequestBool = false;
      }
    }
    assert.isTrue(badRequestBool);
  });

  /*
  * Given an event with no username, handler() shows that a 101 error has been made
  * @param {object} event without username information
  * @param {object} aws context
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing username was not provided
  */
  it("should throw a 101 error for missing username", function(){
    event.body.username = undefined;
    var bool = index.handler(event,context,callback).includes("101");
    assert.isTrue(bool);
  });

  /*
  * Given an event with no password, handler() shows that a 102 error has been made
  * @param {object} event without password information
  * @param {object} aws context
  * @param {function} callback function that returns what was passed
  * @returns {string} callback function showing password was not provided for given user
  */
  it("should throw a 102 error for missing password", function(){
    event.body.password = undefined;
    var bool = index.handler(event,context,callback).includes("102");
    assert.isTrue(bool);
  });

  /*
  * Given a valid event object, handler() should invoke cognito's authenticateUser()
  */
  it('should pass in user data for authentication', function() {
    //mocking "authenticateUser" function
    stub = sinon.stub(AWSCognito.CognitoUser.prototype, "authenticateUser", spy);
    var returned = index.handler(event,context);
    stub.restore();
    assert.isTrue(spy.called);
    //expect(() => index.handler(event,context)).to.throw();
  });
});
