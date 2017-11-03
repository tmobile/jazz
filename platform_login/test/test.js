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

var event, context, stub, spy;

//Setting up a spy to wrap mocked cognito functions (stubs) for each test scenario
spy = sinon.spy();

describe('Login handler', function() {

  //Setting up default values for the aws event and context needed for handler params
  beforeEach(function(){
    event = { "method" : "",
              "stage" : "",
              "body" : ""
            };
    context = awsContext();
  });

  /*
  * Given a valid event object, handler() should invoke cognito's authenticateUser()
  */
  it('should pass in user data for authentication', function() {
    //mocking "authenticateUser" function
    stub = sinon.stub(AWSCognito.CognitoUser.prototype, "authenticateUser", spy);
    event.method = "POST";
    event.stage = "test";
    event.body = { "username" : "whatTimeIsIt",
                   "password" : "AdventureT1me!"
                 };
    var returned = index.handler(event,context);
    stub.restore();
    assert.isTrue(spy.called);
    //expect(() => index.handler(event,context)).to.throw();
  });
});
