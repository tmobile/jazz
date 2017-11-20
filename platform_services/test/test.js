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
const chai = require('chai');
//const chaiAsPromised = require('chai-as-promised');
//chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect;
const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const logger = require("../components/logger.js");
const AWS = require("aws-sdk-mock");
//const async = require('async');


describe('platform_services', function() {
  var spy, stub, errMessage, errType, event, context, callback, logMessage, logStub;

  beforeEach(function(){
    //setup spy to wrap async/extraneous functions
    spy = sinon.spy();
    event = {
      "stage" : "test",
      "method" : "",
      "path" : {
        "id" : "k!ngd0m_0f_Mewni"
      },
      "query" : {
        "service" : "mAg!c",
        "domain" : "k!ngd0m",
        "region" : "mewni",
        "type" : "mewm@n",
        "runtime" : "m0n$ter",
        "created_by" : "g10$saRyck",
        "status" : "mewbErTy"
      },
      "body" : {
        "foo" : "bar"
      }
    };
    context = awsContext();
    callback = (err, responseObj) => {
      if(err){
        return err;
      }
      else{
        return JSON.stringify(responseObj);
      }
    };
  });

  /*
  * Given an event.method = "GET" and valid service_id, handler() attempts to get item info from DynamoDB
  * @param {object} event -> event.method is defined to be "GET", event.path.id is truthy
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to get item data from dynamoDB by id if 'GET' method and id are defined", function(){
    event.method = "GET";
    //mocking DocumentClient from DynamoDB and wrapping with predefined spy
    AWS.mock("DynamoDB.DocumentClient", "get", spy);
    //trigger the spy by calling index.handler() with desired params
    var callFunction = index.handler(event, context, callback);
    AWS.restore("DynamoDB.DocumentClient");
    assert.isTrue(spy.called);
  });

  /*
  * Given a failed attempt at fetching data from DynamoDB, handler() should inform of error
  * @param {object} event -> event.method is defined to be "GET", event.path.id is truthy
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate an InternalServerError occured if DynamoDB.DocumentClient.get fails", ()=>{
    //creating an object with the callback function in order to wrap and test callback parameters
    var callbackObj = {
      "callback" : callback
    };
    event.method = "GET";
    errType = "InternalServerError";
    errMessage = "Unexpected Error occured.";
    logMessage = "Error occured.";
    var err = {
      "errorType" : "svtfoe",
      "message" : "starco"
    };
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(err, null);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj,"callback",spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage) && logResponse.includes(err.errorType) &&
                    logResponse.includes(err.message);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given a service id that doesn't point to an existing service, handler() indicates service not found
  * @param {object} event -> event.method is defined to be "GET", event.path.id is truthy
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate a NotFoundError occured if no service with specified id is found", ()=>{
    //creating an object with the callback function in order to wrap and test callback parameters
    var callbackObj = {
      "callback" : callback
    };
    event.method = "GET";
    errType = "NotFound";
    errMessage = "Cannot find service with id: ";
    logMessage = "Cannot find service with id: ";
    //define an object to be returned with empty serviceCatalog
    var dataObj = {
      "getServiceByID" : {}
    };
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj,"callback",spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given a service id that points to existing service, handler() indicates successful get
  * @param {object} event -> event.method is defined to be "GET", event.path.id is truthy
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
/*  it("should indicate getting service was a success if service found with matching id", (done)=>{
    event.method = "GET";
    logMessage = "Get Success.";
    var dataObj = {
      "getServiceByID" : {
        "k!ngd0m_0f_Mewni" : {},
        1 : "b",
        2 : "c"
      }
    };
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    //wrapping the logger to check for response messages
    logStub = sinon.stub(logger, "verbose", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callback);
    console.log(logStub.called);
    //var logResponse = logStub.args[0][0];
    //var logCheck = logResponse.includes(logMessage);
    AWS.restore("DynamoDB.DocumentClient");
    logStub.restore();
    assert.isTrue(true);
    done();
  }); */

  /*
  * Given an event.method = "GET" and invalid service_id, handler() attempts to get all items that match
  * @param {object} event -> event.method is defined to be "GET", event.path.id is undefined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to get all/filtered items from dynamoDB if 'GET' method and no id are defined", function(){
    event.method = "GET";
    event.path.id = undefined;
    //mocking DynamoDB's scan function and wrapping with predefined spy
    var mockDynamo = AWS.mock("DynamoDB", "scan", spy);
    //trigger the spy by calling index.handler() with desired params
    var callFunction = index.handler(event, context, callback);
    AWS.restore("DynamoDB");
    assert.isTrue(spy.called);
  });

  /*
  * Given a failed attempt at fetching data from DynamoDB, handler() should inform of error
  * @param {object} event -> event.method is defined to be "GET", event.path.id is truthy
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate an InternalServerError occured if DynamoDB.scan fails", ()=>{
    //creating an object with the callback function in order to wrap and test callback parameters
    var callbackObj = {
      "callback" : callback
    };
    event.method = "GET";
    event.path.id = undefined;
    errType = "InternalServerError";
    errMessage = "unexpected error occured";
    logMessage = "Error occured. ";
    var err = {
      "errorType" : "svtfoe",
      "message" : "starco"
    };
    //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB", "scan", (params, cb) => {
      return cb(err);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj,"callback",spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage) && logResponse.includes(err.errorType) &&
                    logResponse.includes(err.message);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB");
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });
});
