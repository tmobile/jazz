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
const index = require('../index');
const awsContext = require("aws-lambda-mock-context");
const sinon = require("sinon");
const uuid = require('uuid/v4');
const request = require('request');
const logger = require("../components/logger.js");


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

describe('delete-serverless-service', function() {

    beforeEach(function(){
      context = awsContext();
      event = {
        "stage" : "validTest",
        "headers" : {
          "Authorization" : "pr!ncessBubb1eGum"
        },
        "body" : {
          "service_name" : "candyKingdom",
          "domain" : "landOfOOO",
          "id" : "marcyAbadeer",
          "version" : "4.1.4"
        }
      };
      callback = (err,responseObj) => {
        if(err){
          return err;
        }
        else{
          return JSON.stringify(responseObj);
        }
      }
    });

    /*
    * Given a config json without a "DELETE_SERVICE_JOB_URL", handler() gives error message
    * @param {object} event, event.stage is assigned the name reference for the invalidTest config
    * @params {object, function} default aws-context object and callback function
    * @returns {string} error notification indicating there was an InternalServerError
    */
    it('should inform user of error if using a config json with no DELETE_SERVICE_JOB_URL', ()=>{
      var errMessage = "Service configuration missing JOB URL";
      var errType = "InternalServerError";
      var invalidConfigBool = checkCase("stage", null, "invalidTest", errMessage, errType);
      assert.isTrue(invalidConfigBool);
    });

    /*
    * Given an event with no event.body, handler() informs of invalid inputs
    * @param {object} event, containing no event.body
    * @params {object, function} default aws-context object and callback function
    * @returns {string} error notification indicating there was an InputValidationError
    */
    it("should inform user of missing inputs if given an event with no event.body", () => {
      var errMessage = "Service inputs not defined";
      var errType = "BadRequest";
      var bothCases = checkCase("body", null, null, errMessage, errType) &&
                      checkCase("body", null, undefined, errMessage, errType);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with no body.service_name, handler() informs service name is missing
    * @param {object} event, containing no body.service_name
    * @params {object, function} default aws-context object and callback function
    * @returns {string} error notification indicating there was an InputValidationError
    */
    it("should inform user of missing service name if given an event with no body.service_name", ()=>{
      var errMessage = "Service Name is missing in the input";
      var errType = "BadRequest";
      var bothCases = checkCase("body", "service_name", null, errMessage, errType) &&
                      checkCase("body", "service_name", undefined, errMessage, errType);
      assert.isTrue(bothCases);
    });


    /*
    * Given an event with no body.domain, handler() informs service domain is missing
    * @param {object} event, containing no body.doamin
    * @params {object, function} default aws-context object and callback function
    * @returns {string} error notification indicating there was an InputValidationError
    */
    it("should inform user of missing domain if given an event with no body.domain", () => {
      var errMessage = "Domain key is missing in the input";
      var errType = "BadRequest";
      var bothCases = checkCase("body", "domain", null, errMessage, errType) &&
                      checkCase("body", "domain", undefined, errMessage, errType);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with no body.id, handler() informs that database id is missing
    * @param {object} event, containing no body.id
    * @params {object, function} default aws-context object and callback function
    * @returns {string} error notification indicating there was an InputValidationError
    */
    it("should inform user of missing DB id if given an event with no body.id", () => {
      var errMessage = "DB ID is missing in the input";
      var errType = "BadRequest";
      var bothCases = checkCase("body", "id", null, errMessage, errType) &&
                      checkCase("body", "id", undefined, errMessage, errType);
      assert.isTrue(bothCases);
    });

    /*
    * Given valid input paramters, handler() should create a tracking_id as a uuid.v4
    * @param {object, object, function} default event, context, and callback as described in beforeEach
    */
    it("should create a new GUID value if given valid inputs", () => {
      //wrapping the uuid's v4 method
      stub = sinon.stub(uuid, 'v4', spy);

      //attempt to trigger the above with index.handler() call
      var callFunction = index.handler(event,context,callback);

      stub.restore();
      assert.isTrue(spy.called);
    });

    /*
    * Given valid input parameters, handler() should attempt to send an http request
    * @param {object, object, function} default event, context, and callback as described in beforeEach
    */
    it("should attempt to make an http request if given valid inputs", function(){
      //wrapping the Request() method that gets internally called by node request.js for any http method
      stub = sinon.stub(request, "Request", spy);
      //trigger the spy wrapping the request by calling handler() with valid params
      var callFunction = index.handler(event, context, callback);
      console.log(spy.args);
      stub.restore();
      assert.isTrue(spy.called);
    });

    /*
    * Given a failed http request, handler() informs that there was a request error
    * @param {object, object, function} default event, context, and callback as described in beforeEach
    * @returns {string} returns callback() with an error obj passed so the error is relayed as a message
    */
    it("should catch an error from sending request", function(){
      var err = {
        errorType : "tart",
        message : "This cosmic dance of bursting decadence"
      };
      var returnErrType = "InternalServerError";
      var returnErrMessage = "Internal error occurred";
      var loggerErrMessage = "request errored..: ";
      //wrapping the Request() method that gets internally called by node request.js for any request
      //the expected paramter only includes a requestLoad obj that has a callback function property
      stub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(err, null, null);
      });
      var loggerStub = sinon.stub(logger, "error", spy);
      //trigger both stubs by calling handler()
      var callFunction = index.handler(event, context, callback);
      var allChecks = stub.returnValues[0].includes(returnErrType) &&
                      stub.returnValues[0].includes(returnErrMessage) &&
                      loggerStub.args[0][0].includes(err.errorType) &&
                      loggerStub.args[0][0].includes(err.message) &&
                      loggerStub.args[0][0].includes(loggerErrMessage);
      stub.restore();
      loggerStub.restore();
      assert.isTrue(allChecks);
    });

    /*
    * Given a 200 response, handler() indicates successful request
    * @param {object, object, function} default event, context, and callback as described in beforeEach
    */
    it("should indicate success from 200 response", function(){
      var responseObject = {
        statusCode : 200
      };
      var loggerMessage = "success.";
      //wrapping the Request() method that gets internally called by node request.js for any request
      stub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, null);
      });
      var loggerStub = sinon.stub(logger, "info", spy);
      //trigger both stubs by calling handler()
      var callFunction = index.handler(event, context, callback);
      var bool = loggerStub.args[0][0].includes(loggerMessage);
      stub.restore();
      loggerStub.restore();
      assert.isTrue(bool);
    });

    /*
    * Given a 201 response, handler() indicates successful request
    * @param {object, object, function} default event, context, and callback as described in beforeEach
    */
    it("should indicate success from 201 response", function(){
      var responseObject = {
        statusCode : 201
      };
      var loggerMessage = "success.";
      //wrapping the Request() method that gets internally called by node request.js for any request
      stub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, null);
      });
      var loggerStub = sinon.stub(logger, "info", spy);
      //trigger both stubs by calling handler()
      var callFunction = index.handler(event, context, callback);
      var bool = loggerStub.args[0][0].includes(loggerMessage);
      stub.restore();
      loggerStub.restore();
      assert.isTrue(bool);
    });

    /*
    * Given a 401 response, handler() indicates user is not authorized and request failed
    * @param {object, object, function} default event, context, and callback as described in beforeEach
    */
    it("should indicate non authorization failure from 401 response", function(){
      var responseObject = {
        statusCode : 401
      };
      var loggerMessage = "Failed.";
      var errMessage = "Not authorized";
      var errType = "InternalServerError";
      //wrapping the Request() method that gets internally called by node request.js for any request
      stub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, null);
      });
      var loggerStub = sinon.stub(logger, "error", spy);
      //trigger both stubs by calling handler()
      var callFunction = index.handler(event, context, callback);
      var allChecks = loggerStub.args[0][0].includes(loggerMessage) &&
                      stub.returnValues[0].includes(errType) &&
                      stub.returnValues[0].includes(errMessage);
      stub.restore();
      loggerStub.restore();
      assert.isTrue(allChecks);
    });

    /*
    * Given any other statusCode response, handler() indicates failed request and internal error
    * @param {object, object, function} default event, context, and callback as described in beforeEach
    */
    it("should indicate internal error for any other statusCode response", function(){
      var responseObject = {
        statusCode : 400
      };
      var loggerMessage = "Failed.";
      var errMessage = "Internal error occurred";
      var errType = "InternalServerError";
      //wrapping the Request() method that gets internally called by node request.js for any request
      stub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, null);
      });
      var loggerStub = sinon.stub(logger, "error", spy);
      //trigger both stubs by calling handler()
      var callFunction = index.handler(event, context, callback);
      var allChecks = loggerStub.args[0][0].includes(loggerMessage) &&
                      stub.returnValues[0].includes(errType) &&
                      stub.returnValues[0].includes(errMessage);
      stub.restore();
      loggerStub.restore();
      assert.isTrue(allChecks);
    });
});
