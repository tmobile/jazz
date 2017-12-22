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
const request = require('request');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const logger = require("../components/logger.js");
const CronParser = require("../components/cron-parser.js");

var event, context, callback, spy, stub, checkCase;

//setup a spy to wrap around async logic/logic that need extraneous sources
spy = sinon.spy();

//setup a helper function to check for expected outputs given different input parameters
checkCase = (eventProp, eventProp2, propValue, errMessage, errType) => {
  //if there is a second prop defined, than the value to be changed is in a nested object
  if(eventProp2){
    event[eventProp][eventProp2] = propValue;
  }
  else if(eventProp){
    event[eventProp] = propValue;
  }
  //check if handler returns error notification with expected error type and message
  var bool = index.handler(event,context,callback).includes(errMessage) &&
              index.handler(event,context,callback).includes(errType);
  return bool;
};

describe('create-serverless-service', function() {

  describe("cron-parser.js", function() {
    var validCronExp;

    beforeEach(function(){
      validCronExp = "1 * * * ? *";
    });

    it("should return null if given an empty or missing expression", function(){
      var bool = true;
      var invalidValues = [null,undefined,""];
      //if cronParser states any of the above values are defined, have this test fail
      for (i in invalidValues){
        if (CronParser.isDefined(invalidValues[i]) != null){
          bool = false;
        }
      };
      assert.isTrue(bool);
    });

    it("should return 'valid' if given a valid expression", function(){
      var bool = false;
      if(CronParser.validateCronExpression(validCronExp).result == 'valid'){
        bool = true;
      }
      assert.isTrue(bool);
    });
  });

  describe("index.handler", function(){

    //set up for default valid values to pass into handler()
    beforeEach(function(){
      event = {
        "stage" : "test",
        "headers" : {
          "Authorization" : "fr1end$hip_1s_mAg1c"
        },
        "principalId" : "@pp1eJack",
        "body" : {
          "service_name"	: "test-service",
          "service_type"	: "lambda",
          "domain"		: "test-domain",
          "runtime"		: "nodejs",
          "approvers"		: ['tw1light_$pArkle'],
          "rateExpression": "1 * * * ? *",
          "slack_channel" : "mlp_fim",
          "require_internal_access" : false,
          "create_cloudfront_url" : false//, //?
          //"enableEventSchedule" : false
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
    * Given an event object with no event.body, handler() should indicate service inputs are missing
    * @param {object} event, contains a null or undefined body property
    * @params {object, function} default aws context and callback function as assigned above respectively
    * @returns index.handler() should return an InternalServerError notification
    */
    it("should inform user of error if given an event with no body property", function(){
      var errMessage = "Service inputs are not defined";
      var errType = "BadRequest";
      var bothCases = checkCase("body", null, null, errMessage, errType) &&
                      checkCase("body", null, undefined, errMessage, errType);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event object with missing body.service_type, handler() should indicate missing service_type
    * @param {object} event, contains an event.body.service_type that is either undefined or null
    * @params {object, function} default aws context and callback function as assigned above respectively
    * @returns index.handler() should return an InternalServerError notification
    */
    it("should inform user of error if given an event with no body.service_type", function(){
      var errMessage = "'service_type' is not defined";
      var errType = "BadRequest";
      var bothCases = checkCase("body", "service_type", null, errMessage, errType) &&
                      checkCase("body", "service_type", null, errMessage, errType);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with an invalid body.service_name, handler() should indicate service name has specified issues
    * @param {object} event, contains either a missing or invalid body.service_name property
    * @params {object, function} default aws context and callback function as assigned above respectively
    * @returns index.handler() should return a descriptive InternalServerError notification
    */
    it("should inform user of error if given an event with an invalid body.service_name", function(){
      //no characters
      var invalidName1 = "";
      //contains a non-alphanumeric character
      var invalidName2 = "Rar!ty";
      var nameValues = [null, undefined, invalidName1, invalidName2];
      var errMessage = "'service_name' is not defined or has invalid characters";
      var errType = "BadRequest";
      var allCases = true;
      //if checkCase() returns false for any of the nameValues assigned above, have allCases be false
      for (i in nameValues){
        if(!checkCase("body","service_name",nameValues[i],errMessage,errType)){
          allCases = false;
        }
      }
      assert.isTrue(allCases);
    });

    /*
    * Given an event with missing headers/headers.Authorization, handler() should throw InternalServerError
    * @param {object} event, contains a null or undefined headers or headers.Authorization
    * @params {object, function} default aws context and callback function as assigned above respectively
    * @returns index.handler() should return an InternalServerError notification
    */
    it("should throw an InternalServerError error if missing event.headers", function(){
      var errMessage = "'headers' is missing";
      var errType = "BadRequest";
      var allCases = checkCase("headers", "Authorization", null, errMessage, errType) &&
                      checkCase("headers", "Authorization", undefined, errMessage, errType) &&
                      checkCase("headers", null, null, errMessage, errType) &&
                      checkCase("headers", null, undefined, errMessage, errType);
      assert.isTrue(allCases);
    });

    /*
    * Given an event indicating a lambda or api service but no runtime, handler() informs of missing Runtime
    * @param {object} event, contains a service type that isn't "website", and no body.runtime
    * @params {object, function} default aws context and callback function as assigned above respectively
    * @returns index.handler() should return an InternalServerError notification
    */
    it("should inform of error if given no event.body.runtime for a service other than website", ()=>{
      var runtime = "";
      var errType = "BadRequest";
      var errMessage = "'runtime' is not defined";
      var allCases = checkCase("body","runtime",runtime,errMessage,errType) &&
                      checkCase("body", "runtime", null, errMessage, errType) &&
                      checkCase("body", "runtime", undefined, errMessage, errType);
      assert.isTrue(allCases);
    });

    /*
    * Given an event with an invalid body.domain, handler informs of inappropriate domain
    * @param {object} event, contains a domain that has one or more invalid characters
    * @params {object, function} default aws context and callback function as assigned above respectively
    * @returns index.handler() should return an InternalServerError notification
    */
    it("should inform user of error if invalid domain value", function(){
      //invalid if containing a non-alphanumeric character
      var invalidName2 = "f!utterShy";
      var errMessage = "Namespace is not appropriate";
      var errType = "BadRequest";
      var invalidCase = checkCase("body", "domain", invalidName2, errMessage, errType);
      assert.isTrue(invalidCase);
    });

    /*
    * Given an event with no principalId provided, handler() indicates user isn't authorized
    * @param {object} event, contains a principalId value that is either undefined or null
    * @params {object, function} default aws context and callback function as assigned above respectively
    * @returns index.handler() should return an UnAuthorized error notification
    */
    it("should state the user isn't authorized if no principalId is given", function(){
      var errMessage = "User is not authorized to access this service";
      var errType = "Forbidden";
      var bothCases = checkCase("principalId", null, null, errMessage, errType) &&
                      checkCase("principalId", null, undefined, errMessage, errType);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with an invalid rateExpression, handler() indicates the expression is invalid
    * @param {object} event, contains a body.rateExpression that is empty, null, or invalid
    * @params {object, function} default aws context and callback function as assigned above respectively
    * @returns index.handler() should return a descriptive InternalServer error notification
    */
    it("should inform the user the rateExpression is invalid if given a faulty rateExpression", ()=>{
      var cronValues = [null, "", "P!nk!e_P!e"];
      var errMessage1 = "Empty Cron expression.";
      var errMessage2 = "Invalid Cron expression. ";
      var errType = "InternalServerError";
      var allCases = checkCase("body", "rateExpression", cronValues[0], errMessage1, errType) &&
                      checkCase("body", "rateExpression", cronValues[1], errMessage1, errType) &&
                      checkCase("body", "rateExpression", cronValues[2], errMessage2, errType);
      assert.isTrue(allCases);
    });

    /*
    * Given successful parameters and setup, handler() should send a POST http request
    * @params {object, object, function} default event, aws context, callback
    * @returns index.handler() should attempt an http POST if given valid paramters
    */
    it("should send an http POST given valid input parameters", function(){
      //wrapping the Request() method that gets internally called by node request.js for any http method
      stub = sinon.stub(request, "Request", spy);
      //trigger the spy wrapping the request by calling handler() with valid params
      var callFunction = index.handler(event, context, callback);
      console.log(JSON.stringify(spy.args[0][0]));
      stub.restore();
      assert.isTrue(spy.called);
    });

    /*
    * Given a failed http Post attempt, handler() indicates there was an error with the Jenkins job
    * @params {object, object, function} default event, aws context, callback
    * @returns index.handler() should return a descriptive error message concerning a failed Jenkins Job
    */
    it("should indicate an error occured with Jenkins setup if the POST attempt fails", () => {
      //wrapping the logger messages to console to check for error message
      stub = sinon.stub(logger, "error", spy);
      //trigger the spy wrapping the logger by calling handler() with valid params
      var callFunction = index.handler(event, context, callback);
      stub.restore();
      //spy has already been called for previous case, so the arguments passed to the logger.error()
      //are contained in an array at spy.args[1]
      var bool = spy.args[1][0].includes("Error while starting Jenkins job: ");
      assert.isTrue(bool);
    });
  })
});
