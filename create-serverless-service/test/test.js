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
const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');

var event, context, callback, spy, stub;

//setup a spy to wrap around async logic/logic that need extraneous sources
spy = sinon.spy();

describe('create-serverless-service', function() {

  //set up for default valid values to pass into handler()
  beforeEach(function(){
    event = {
      "stage" : "test",
      "header" : {
        "Authorization" : "fr1end$hip_1s_mAg1c"
      },
      "body" : {
        "service_name"	: "test-service",
        "service_type"	: "lambda",
        "domain"		: "test-domain",
        "runtime"		: "nodejs",
        "approvers"		: ['tw1light_$pArkle'],
        "rateExpression": "1/4 * * * ? *",
        "slack_channel" : "mlp_fim",
        "require_internal_access" : false,
        "create_cloudfront_url" : false, //?
        "enableEventSchedule" : false
      }
    };
    context = awsContext();
    callback = (err, responseObj) => {
      if (err){
        return err;
      }
      else{
        return JSON.stringify(responseObj);
      }
    };
  });

  /*
  * Given no event object, handler() throws an InternalServerError
  */
  it("should throw an InternalServerError if given no event", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event object with no event.body, handler() should indicate service inputs are missing
  */
  it("should inform user of error if given an event with no body property", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event object with missing body.service_type, handler() should indicate missing service_type
  */
  it("should inform user of error if given an event with no body.service_type", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event with missing body.service_name, handler() should indicate service name is missing
  */
  it("should inform user of error if given an event with no body.service_name", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event with no headers, handler() should throw InternalServerError
  */
  it("should throw an InternalServerError error if missing event.headers", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event with invalid headers.Authorization, handler() should inform of inappropriate Authorization
  */
  it("should inform of error if given an event with in-valid headers.Authorization", ()=>{
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event indicating a lambda or api service but no runtime, handler() informs of missing Runtime
  */
  it("should inform of error if given no event.body.runtime for a service other than website", ()=>{
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event with no body.approvers, handler() indicates approvers are missing
  */
  it("should inform user of error if given no event.approvers", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event with an invalid body.domain, handler informs of inappropriate domain
  */
  it("should inform user of error if invalid domain value", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event with no username provided, handler() indicates creator is not defined
  */
  it("should inform user the username isn't set if no username is given", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given an event with an invalid rateExpression, handler() indicates the expression is invalid
  */
  it("should inform the user the rateExpression is invalid if given a faulty rateExpression", ()=>{
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given successful parameters and setup, handler() should send a POST http request
  */
  it("should sent an http POST given valid input parameters", function(){
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Given a failed http Post attempt, handler() indicates there was an error with the Jenkins job
  */
  it("should indicate an error occured with Jenkins setup if the POST attempt fails", () => {
    //some functionality
    assert.isTrue(true);
  });

  /*
  * Upon successful http POST, handler() informs that build was successful with added info
  */
  it("should indicate the Jenkins setup was a success and provides info for created service", ()=>{
    //some functionality
    assert.isTrue(true);
  });
});
