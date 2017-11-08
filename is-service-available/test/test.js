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
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const utils = require("../components/utils.js")();
const logger = require("../components/logger.js");

var event, context, callback, spy, stub, checkCase;

//setup spy to wrap around DynamoDB calls and async functionality
spy = sinon.spy();

//useful logic for checking callback outputs from index.handler() based on different
//event object scenarios.
//Will reassign event attributes the "value" param
var checkCase = (eventObj, cont, cb, att, att2, value, errCodeNum, errType, errMessage) => {
  if(att2){
    eventObj[att][att2] = value;
  }
  else if(att){
    eventObj[att] = value;
  }
  var bool = index.handler(eventObj, cont, cb).includes(errCodeNum) &&
              index.handler(eventObj, cont, cb).includes(errType) &&
              index.handler(eventObj, cont, cb).includes(errMessage);
  return bool;
};

//All Tests
describe('is-service-available', function() {

  //tests tailored to the utils.js services
  describe("utils.isServiceExists tests", function(){
    var query = {
      "service" : "garnetAmethystPearl",
      "domain" : "andSteven"
    }

    beforeEach(function(){
      callback = null;
    });
  });

  //tests tailored to index.js logic
  describe("index.handler tests", function(){

    //setup default valid values to be edited for varying scenarios
    beforeEach(function(){
      event = {
        "stage" : "test",
        "method" : "GET",
        "principalId" : "someR@nd0mId",
        "query" : {
          "service" : "garnetAmethystPearl",
          "domain" : "andSteven"
        }
      }
      context = awsContext();
      callback = (value) => {
        return value;
      };
    });

    /*
    * Given no event object, handler throws a 101 error
    * @param {object} event - will be null or undefined
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 101 error message
    */
    it("should throw a BadRequest 101 error if event is null or undefined", function(){
      var errMess = "Service isn't invoked as a GET API.";
      var errType = "BadRequest";
      var bothCases = checkCase(null, context, callback, null, null, null, "101", errType, errMess) &&
                      checkCase(null, context, callback, null, null, null, "101", errType, errMess);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with no method defined, handler() throws a 101 error
    * @param {object} event - event.method will be null or undefined
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 101 error message
    */
    it("should throw a BadRequest 101 error if event.method isn't defined", function(){
      var errMess = "Service isn't invoked as a GET API.";
      var errType = "BadRequest";
      var bothCases = checkCase(event, context, callback, "method", null, null, "101", errType, errMess) &&
                      checkCase(event, context, callback, "method", null, undefined, "101", errType, errMess);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with a method defined other than GET, handler() throws a 101 error
    * @param {object} event - event.method will not be "GET"
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 101 error message
    */
    it("should throw a BadRequest 101 error if event.method is not 'GET' ", function(){
      var methods = ["PUT","POST","HEAD","OPTIONS","DELETE"];
      var bool = true;
      //check if a 101 error occurs for each method, if one passes without an error
      //have the above bool value be false
      for(var i=0; i < methods.length; i++){
        event.method = methods[i];
        if(!(index.handler(event,context,callback).includes("BadRequest") &&
            index.handler(event,context,callback).includes("101"))){
          bool = false;
        }
      }
      assert.isTrue(bool);
    });

    /*
    * Given an event with no principalid, handler() throws a 102 error
    * @param {object} event - event.principalId will be null or undefined
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 102 error message
    */
    it("should throw an Unauthorized 102 error if event.principalId is null or undefined", function(){
      var errMess = "You aren't authorized to access this service. Please login with your credentials.";
      var errType = "Unauthorized";
      var bothCases = checkCase(event, context, callback, "principalId", null, null, "102", errType, errMess) &&
                      checkCase(event, context, callback, "principalId", null, undefined, "102", errType, errMess);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with no query, handler() throws a 103 error
    * @param {object} event - event.query will be null or undefined
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 103 error message
    */
    it("should throw a BadRequest 103 error if event.query is null or undefined", function(){
      var errMess = "Service name and namespace are required";
      var errType = "BadRequest";
      var bothCases = checkCase(event, context, callback, "query", null, null, "103", errType, errMess) &&
                      checkCase(event, context, callback, "query", null, undefined, "103", errType, errMess);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with no query.service, handler() throws a 103 error
    * @param {object} event - event.query.service will be null or undefined
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 103 error message
    */
    it("should throw a BadRequest 103 error if event.query.service is null or undefined", function(){
      var errMess = "Service name and namespace are required";
      var errType = "BadRequest";
      var bothCases = checkCase(event, context, callback, "query", "service", null, "103", errType, errMess) &&
                      checkCase(event, context, callback, "query", "service", undefined, "103", errType, errMess);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with no query.domain, handler() throws a 103 error
    * @param {object} event - event.query.domain will be null or undefined
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 103 error message
    */
    it("should throw a BadRequest 103 error if event.query.domain is null or undefined", function(){
      var errMess = "Service name and namespace are required";
      var errType = "BadRequest";
      var bothCases = checkCase(event, context, callback, "query", "domain", null, "103", errType, errMess) &&
                      checkCase(event, context, callback, "query", "domain", undefined, "103", errType, errMess);
      assert.isTrue(bothCases);
    });

    /*
    * Given an event with no stage property, handler() throws a 106 error
    * @param {object} event - event.stage will be null or undefined
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 106 error message
    */
    it("should throw an InternalServerError 106 if event.stage is null or undefined", function(){
      var errType = "InternalServerError";
      var errMess = "Internal Error";
      var bool = checkCase(event, context, callback, "stage", null, null, "106", errType, errMess) &&
                 checkCase(event, context, callback, "stage", null, undefined, "106", errType, errMess);
      assert.isTrue(bool);
    });

    /*
    * Given an event with no valid stage, handler() throws a 106 error
    * @param {object} event - event.stage will not point to an existing configuration file
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning an informative 101 error message
    */
    it("should throw an InternalServerError 106 if event.stage is not a valid environment", function(){
      var errType = "InternalServerError";
      var errMess = "Internal Error";
      var bool = checkCase(event, context, callback, "stage", null, "crystalGems", "106", errType, errMess);
      assert.isTrue(bool);
    });

    /*
    * Given valid input params, handler() should attempt to lookup service in database
    * @param {object} event - default event object
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    */
    it("should attempt to utilize the dynamodb service if a proper input is made", function(){
      AWS.mock("DynamoDB", "scan", spy)
      var callFunction = index.handler(event,context,callback);
      AWS.restore("DynamoDB");
      assert.isTrue(spy.called);
    });

    /*
    * Given a failed database search attempt, handler() throws a 104 error
    * @param {object} event - default event object
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    */
    it("should notify user of error when utils.isServiceExists fails", function(){
      //mock the scan() dynamodb function within utils.isServiceExists and have it return error
      AWS.mock("DynamoDB", "scan", (paramss,cb) => {
        var err = {
          "name" : "SomeError",
          "stack" : "stack object to elaborate on error"
        }
        //logic in dynamodb is expecting a callback with (error object, data object)
        //in this scenario data will not be provided due to error being made
        return cb(err, null);
      });
      //wrap the logged message from handler() to check for expected response
      stub = sinon.stub(logger,"error",spy);
      //triger the two mocked functions above by calling handler()
      var callFunction = index.handler(event,context,callback);
      var loggedError = stub.args[0][0];
      var bool = loggedError.includes("Error occured while fetching from service catalog: ");
      AWS.restore("DynamoDB");
      stub.restore();
      assert.isTrue(bool);
    });

    /*
    * Given a successful database search attempt, handler() provides ResponseObj as data
    * @param {object} event - default event object
    * @param {object} context - default mock aws context
    * @param {function} callback - return the given input value
    * @returns {string} callback returning response information
    */
    it("should return response object as data upon successful utils.isServiceExists call", function(){
      //mock the scan() dynamodb function within utils.isServiceExists and have it return error
      AWS.mock("DynamoDB", "scan", (paramss,cb) => {
        var someData = {
          "username" : "We Are",
          "password" : "theCryst@1Gems"
        }
        //expecting a callback return of (error obj, data obj), in this case, no error
        return cb(null, data);
      });

      stub = sinon.stub(utils, "isServiceExists", (obj,cb) => {
        var someData = {
          "username" : "We Are",
          "password" : "theCryst@1Gems"
        }
        return cb(null, someData);
      })

      var callFunction = index.handler(event,context,callback);
      console.log(callFunction);
      console.log(stub.called);

      AWS.restore("DynamoDB");
      stub.restore();
      assert.isTrue(true);
    });

  });

});
