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
  var spy, stub, err, errMessage, errType, event, context, callback, callbackObj, logMessage, logStub;

  /*
  * helper function for determining if dynamoDB service is used during function call
  * @param{string} dynamoMethod, determines whether to mock DocumentClient or a direct dynamo method
  * @param{object} sinonSpy, provide a wrapper to be used with the mocked service
  * @returns{boolean} bool, true if service was used, false otherwise
  */
  var dynamoCheck = function(dynamoMethod, sinonSpy){
    var serviceName;
    if(dynamoMethod == "get"){
      serviceName = "DynamoDB.DocumentClient";
    }
    else if(dynamoMethod == "scan"){
      serviceName = "DynamoDB";
    }
    //mocking DocumentClient from DynamoDB and wrapping with predefined spy
    AWS.mock(serviceName, dynamoMethod, sinonSpy);
    //trigger the spy by calling handler()
    var callFunction = index.handler(event, context, callback);
    AWS.restore(serviceName);
    var bool = sinonSpy.called;
    return bool;
  };

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
        "created_by" : "g10$saryck",
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
    err = {
      "errorType" : "svtfoe",
      "message" : "starco"
    };
    //creating an object with the callback function in order to wrap and test callback parameters
    callbackObj = {
      "callback" : callback
    };
  });

  /*
  * Given an event with no event.method, handler() informs of missing input error
  * @params{object} event -> event.method is null, undefined, or empty
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} callback response containing error message with details
  */
  it("should indicate that method is missing when given an event with no event.method", function(){
    errType = "BadRequest";
    errMessage = "method cannot be empty";
    var invalidArray = ["", null, undefined];
    var bool = true;
    //handler should indicate the above error information for method equaling any of the values in
    //"invalidArray", otherwise have bool be false
    for(i in invalidArray){
      event.method = invalidArray[i];
      returnMessage = index.handler(event, context, callback);
      if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
        bool = false;
      }
    };
    assert.isTrue(bool);
  });

  /*
  * Given a PUT/DELETE method and no path.id, handler informs of missing id
  * @params{object} event -> event.method is PUT/DELETE, event.path.id is undefined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} callback response containing error message with details
  */
  it("should indicate id is missing if given a PUT/DELETE method and no service id", ()=>{
    event.path.id = undefined;
    errType = "BadRequest";
    errMessage = "service id is required";
    var methodArray = ["PUT", "DELETE"];
    var returnMessage;
    var bool = true;
    //handler should indicate the above error information for method equaling any of the values in
    //"methodArray", otherwise have bool be false
    for(i in methodArray){
      event.method = methodArray[i];
      returnMessage = index.handler(event, context, callback);
      if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
        bool = false;
      }
    };
    assert.isTrue(bool);
  });

  /*
  * Given an event.method = "GET" and valid service_id, handler() attempts to get item info from DynamoDB
  * @param {object} event -> event.method is defined to be "GET", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to get item data from dynamoDB by id if 'GET' method and id are defined", function(){
    event.method = "GET";
    var attemptBool = dynamoCheck("get",spy);
    assert.isTrue(attemptBool);
  });

  /*
  * Given a failed attempt at fetching data from DynamoDB, handler() should inform of error
  * @param {object} event -> event.method is defined to be "GET", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate an InternalServerError occured if DynamoDB.DocumentClient.get fails for GET", ()=>{
    event.method = "GET";
    errType = "InternalServerError";
    errMessage = "Unexpected Error occured.";
    logMessage = "Error occured.";
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
  * @param {object} event -> event.method is defined to be "GET", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate a NotFoundError occured if no service with specified id is found", ()=>{
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
  * Given an event.method = "GET" and invalid service_id, handler() attempts to get all items that match
  * @param {object} event -> event.method is defined to be "GET", event.path.id is undefined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to get all/filtered items from dynamoDB if 'GET' method and no id are defined", function(){
    event.method = "GET";
    event.path.id = undefined;
    var attemptBool = dynamoCheck("scan",spy);
    assert.isTrue(attemptBool);
  });

  /*
  * Given an event.method = get and timestamp/update values to query, timstamp info should be added to the filter
  * @param {object} event->event.method="GET", event.path.id is undefined, query.last_update_before/after are defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should include update/timestamp info in dynamodb filter if given specific event props", ()=>{
    event.method = "GET";
    event.path.id = undefined;
    var before = "someDate";
    var after = "someTime";
    event.query.last_updated_after = after;
    event.query.last_updated_before = before;
    var scanParamBefore = ":BEFORE";
    var scanParamAfter = ":AFTER";
    var dataType = "S";
    var filterString = "SERVICE_TIMESTAMP" + " BETWEEN :BEFORE" + " AND :AFTER ";
    //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB", "scan", spy);
    //trigger spy by calling index.handler()
    var callFunction = index.handler(event, context, callback);
    //assigning the item filter values passed to DynamoDB.scan as values to check against
    var filterExp = spy.args[0][0].FilterExpression;
    var expAttrVals = spy.args[0][0].ExpressionAttributeValues;
    var allCases = filterExp.includes(filterString) &&
                    expAttrVals[scanParamBefore][dataType] == before &&
                    expAttrVals[scanParamAfter][dataType] == after;
    AWS.restore("DynamoDB");
    assert.isTrue(allCases);
  });

  /*
  * Given a userID that IS-NOT not listed among admin_users, dynamoDB only scans for specific user's services
  * @param {object} event->event.method="GET", event.path.id is undefined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should do something", function(){
    event.method = "GET";
    event.path.id = undefined;
    event.query.created_by = undefined;
    //user that is not listed among admin_users
    global.userId = "Mete0ra";
    var dataType = "S";
    var filterString = "SERVICE_CREATED_BY" + " = :" + "SERVICE_CREATED_BY";
    var scanParam = ":SERVICE_CREATED_BY";
    //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB", "scan", spy);
    //trigger spy by calling index.handler()
    var callFunction = index.handler(event, context, callback);
    //assigning the item filter values passed to DynamoDB.scan as values to check against
    var filterExp = spy.args[0][0].FilterExpression;
    var expAttrVals = spy.args[0][0].ExpressionAttributeValues;
    var allCases = filterExp.includes(filterString) &&
                    expAttrVals[scanParam][dataType] == global.userId;
    AWS.restore("DynamoDB");
    assert.isTrue(allCases);
  });

  /*
  * Given a userID that IS listed among admin_users, a filter is not used for only the user's services
  * @param {object} event->event.method="GET", event.path.id is undefined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should do something", function(){
    event.method = "GET";
    event.path.id = undefined;
    event.query.created_by = undefined;
    //user that is listed among admin_users
    global.userId = "ecl!psa";
    var filterString = "SERVICE_CREATED_BY" + " = :" + "SERVICE_CREATED_BY";
    var scanParam = ":SERVICE_CREATED_BY";
    //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB", "scan", spy);
    //trigger spy by calling index.handler()
    var callFunction = index.handler(event, context, callback);
    //assigning the item filter values passed to DynamoDB.scan as values to check against
    var filterExp = spy.args[0][0].FilterExpression;
    var expAttrVals = spy.args[0][0].ExpressionAttributeValues;
    var allCases = !filterExp.includes(filterString) && !expAttrVals[scanParam];
    AWS.restore("DynamoDB");
    assert.isTrue(allCases);
  });

  /*
  * Given a failed attempt at fetching data from DynamoDB, handler() should inform of error
  * @param {object} event -> event.method is defined to be "GET", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate an InternalServerError occured if DynamoDB.scan fails", ()=>{
    event.method = "GET";
    event.path.id = undefined;
    errType = "InternalServerError";
    errMessage = "unexpected error occured";
    logMessage = "Error occured. ";
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

  /*
  * Given an event.method = "PUT" and valid service_id, handler() attempts to get item info from DynamoDB
  * @param {object} event -> event.method is defined to be "PUT", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to get item data from dynamoDB by id if 'PUT' method and id are defined", function(){
    event.method = "PUT";
    var attemptBool = dynamoCheck("get",spy);
    assert.isTrue(attemptBool);
  });

  /*
  * Given a failed attempt at updating data in DynamoDB, handler() should inform of error
  * @param {object} event -> event.method is defined to be "PUT", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should inform of InternalServerError error if updating with dynamoDB.DocClient.get fails", ()=>{
    event.method = "PUT";
    errType = "InternalServerError";
    errMessage = "unexpected error occured";
    logMessage = "error occured while updating service";
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
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    logStub.restore();
    stub.restore();
    assert.isTrue(cbCheck && logCheck);
  });

  /*
  * Given a service id that doesn't point to an existing service to update, handler() indicates service not found
  * @param {object} event -> event.method is defined to be "PUT", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate a NotFoundError occured if no service with specified id is found", ()=>{
    event.method = "PUT";
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
});
