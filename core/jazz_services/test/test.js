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
  var spy, stub, err, errMessage, errType, dataObj, event, context, callback, callbackObj, logMessage, logStub;

  /*
  * helper function for determining if dynamoDB service is used during function call
  * @param{string} dynamoMethod, determines whether to mock DocumentClient or a direct dynamo method
  * @param{object} sinonSpy, provide a wrapper to be used with the mocked service
  * @returns{boolean} bool, true if service was used, false otherwise
  */
  var dynamoCheck = function(dynamoMethod, sinonSpy){
    var serviceName;
    var docClientMethods = ["get", "update", "delete", "put"];
    //assign the correct aws service depending on the method to be used
    if(docClientMethods.includes(dynamoMethod)){
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
        "type" : "api",
        "runtime" : "nodejs",
        "created_by" : "g10$saryck",
        "status" : "active"
      },
      "body" : {
        "description" : "g0nna_GET_a-L!tt1e_we!rd",
        "email" : "gonnaGetALittle@Wild.com",
		    "metadata":{"service":"test-service2","securityGroupIds":"sg-cdb65db9"}
      },
      "principalId": "g10$saryck"
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
    //define an object to be returned by dynamo upon mocked success
    dataObj = {
        "Item" : {}
    };
    Object.assign(dataObj.Item, event.query);
    dataObj.Item.SERVICE_ID = "b100dM00n";
    dataObj.Item.TIMESTAMP = "Ba11";
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
    var attemptBool = dynamoCheck("get", spy);
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
    errMessage = "unexpected error occured";
    logMessage = "Error occured.";
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(err, null);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage) && logResponse.includes(err.errorType) &&
                    logResponse.includes(err.message);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
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
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given a GET request that returns a service for a specific id from dynamo, handler() indicates Success
  * @param {object} event -> event.method is defined to be "GET", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response with data from service and message indicating success
  */
  it("should inform of successful service lookup for specific id for GET request", ()=>{
    event.method = "GET";
    logMessage = "Get Success";
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    var awsMock = AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    //wrapping the logger to check for response messages
    logStub = sinon.stub(logger,"verbose",spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(logStub);
    logStub.restore();
    assert.isTrue(logCheck);
  });

  /*
  * Given an event.method = "GET" and invalid service_id, handler() attempts to get all items that match
  * @param {object} event -> event.method is defined to be "GET", event.path.id is undefined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to get all/filtered items from dynamoDB if 'GET' method and no id are defined", function(){
    event.method = "GET";
    event.path.id = undefined;
    var attemptBool = dynamoCheck("scan", spy);
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
  it("should return only the user's relevant service data if user is not an admin", function(){
    event.method = "GET";
    event.path.id = undefined;
    event.query.created_by = undefined;

    //user that is not listed among admin_users
    var userId = "Mete0ra";

    event.principalId = userId;
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
                    expAttrVals[scanParam][dataType] == userId;
    AWS.restore("DynamoDB");
    assert.isTrue(allCases);
  });

  /*
  * Given a userID that IS listed among admin_users, a filter is not used for only the user's services
  * @param {object} event->event.method="GET", event.path.id is undefined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should return all relevant service data without filtering userID if user is an admin", function(){
    event.method = "GET";
    event.path.id = undefined;
    event.query.created_by = undefined;
    event.query.isAdmin = true;

    //user that is listed among admin_users
    event.principalId = "ecl!psa";

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



  it("should indicate an InternalServerError occured if DynamoDB.scan fails during GET", ()=>{
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
      stub = sinon.stub(callbackObj, "callback", spy);
      logStub = sinon.stub(logger, "error", spy);
      //trigger the mocked logic by calling handler()
      var callFunction = index.handler(event, context, callbackObj.callback);
      var logResponse = logStub.args[0][0];
      var cbResponse = stub.args[0][0];
      var logCheck = logResponse.includes(logMessage) && logResponse.includes(err.errorType) &&
                      logResponse.includes(err.message);
      var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
      AWS.restore("DynamoDB");
      sinon.assert.called(stub);
      sinon.assert.called(logStub);
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
    var attemptBool = dynamoCheck("get", spy);
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
    logMessage = "Unknown error occured. ";
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
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
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
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given a successful service lookup with Dynamo for PUT request, handler() should attempt to validate the update
  * @param {object} event -> event.method is defined to be "PUT", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to validate service update data if service info is successfully retrieved", ()=>{
    event.method = "PUT";
    logMessage = "validateInputData";
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    //wrapping the logger to check for response messages
    logStub = sinon.stub(logger, "info", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args;
    //should indicate function is validating info in event.body for the update in log notifications
    var logCheck = logResponse[8][0].includes(event.body.description) && logResponse[8][0].includes(event.body.email)
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(logStub);
    logStub.restore();
    assert.isTrue(logCheck);
  });

  /*
  * Given successful service lookup for PUT req - but empty event.body, handler() informs of empty update-data
  * @param {object} event -> event.method is defined to be "PUT", event.path.id is defined, event.body is falsy
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should inform that there is no update-data info provided if event.body is invalid", ()=>{
    event.method = "PUT";
    var invalidBodies = [{}, "", null, undefined];
    errType = "BadRequest";
    errMessage = "Input payload cannot be empty";
    logMessage = "Input payload cannot be empty";
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    var allCases = true;
    //check if expected response occurs for every invalid event.body scenario, if not, have allCases be false
    for(i in invalidBodies){
      event.body = invalidBodies[i];
      //trigger the mocked logic by calling handler()
      var callFunction = index.handler(event, context, callbackObj.callback);
      var logResponse = logStub.args[i*3][0];
      var cbResponse = stub.args[i][0];
      if(!logResponse.includes(logMessage) || !cbResponse.includes(errType) ||
          !cbResponse.includes(errMessage)){
        allCases = false;
      }
    }
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(allCases);
  });

  /*
  * Given an event.body with props not allowed to be changed in service, handler() informs that changes aren't allowed
  * @param {object} event -> event.method = "PUT", event.path.id is defined, event.body has unallowed props
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should inform that update is not allowed due to additional event.body properties", ()=>{
    event.method = "PUT";
    logMessage = "The following field\'s value/type is not valid -";
    errType = "BadRequest";
    errMessage = "The following field\'s value/type is not valid -";
    var errMessage2 = ". Only following fields can be updated ";
    event.body.newProperty = "Ludo!";
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    //wrapping the callback function and logger to check for response messages
    logStub = sinon.stub(logger, "error", spy);
    stub = sinon.stub(callbackObj, "callback", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given an event.body with props that have no value, handler() informs that there is no input data
  * @param {object} event -> event.method = "PUT", event.path.id is defined, event.body has valueless props
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should inform that there is no input data to update with if all event.body props are empty", ()=>{
    event.method = "PUT";
    logMessage = "Following field(s) value cannot be empty -";
    errType = "BadRequest";
    errMessage = "Following field(s) value cannot be empty -";
    event.body.description = undefined;
    event.body.email = null;
    event.body.metadata = null;

    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    //wrapping the callback function and logger to check for response messages
    logStub = sinon.stub(logger, "error", spy);
    stub = sinon.stub(callbackObj, "callback", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given an event.method = "PUT" and defined service_id, handler() attempts to update service in DynamoDB
  * @param {object} event -> event.method is defined to be "PUT", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to update service in dynamo if event.method = PUT and event.path.id is defined", () => {
    event.method = "PUT";
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    var attemptBool = dynamoCheck("update",spy);
    assert.isTrue(attemptBool);
  });

  /*
  * Given a failed attempt at a dynamo service update, handler() should inform of error
  * @param {object} event -> event.method is defined to be "PUT", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should indicate an InternalServerError occured if DynamoDB.DocumentClient.update fails", () =>{
    event.method = "PUT";
    errType = "InternalServerError";
    errMessage = "Error Updating Item ";
    logMessage = "Error Updating Item ";
    //mocking DocumentClient from DynamoDB, get is mocked with successful return, update returns error
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
      return cb(err);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[1][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(cbCheck && logCheck);
  });

  /*
  * Given a successful attempt at a dynamo service update, handler() should indicate update success
  * @param {object} event -> event.method is defined to be "PUT", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should indicate that service was updated upon successful documentClient.update()", () =>{
    event.method = "PUT";
    logMessage = "Updated service";
    //mocking DocumentClient from DynamoDB, get is mocked with successful return, update returns error
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
      dataObj.updateServiceByID = "heckAp00";
      return cb(null, dataObj);
    });
    //wrapping the logger to check for response messages
    logStub = sinon.stub(logger,"info",spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[9][0];
    var logCheck = logResponse.includes(logMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    assert.isTrue(logCheck);
  });

  /*
  * Given an event.method = "DELETE" and valid service_id, handler() attempts to get item info from DynamoDB
  * @param {object} event -> event.method is defined to be "DELETE", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to get item data from dynamoDB by id if 'DELETE' method and id are defined", function(){
    event.method = "DELETE";
    var attemptBool = dynamoCheck("get", spy);
    assert.isTrue(attemptBool);
  });

  /*
  * Given a failed attempt at getting data for deletion, handler() should inform of error
  * @param {object} event -> event.method is defined to be "DELETE", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate an InternalServerError occured if DynamoDB.DocumentClient.get fails for DELETE", ()=>{
    event.method = "DELETE";
    errType = "InternalServerError";
    errMessage = "unexpected error occured";
    logMessage = "Error in DeleteItem";
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(err, null);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType); //&& cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given a service id that doesn't point to an existing service to delete, handler() indicates service not found
  * @param {object} event -> event.method is defined to be "DELETE", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate a NotFoundError occured if no service with specified id is found", ()=>{
    event.method = "DELETE";
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
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given an event.method = "DELETE" and defined service_id, handler() attempts to delete service in DynamoDB
  * @param {object} event -> event.method is defined to be "DELETE", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to deleted service in dynamo if event.method = DELETE and event.path.id is defined", () => {
    event.method = "DELETE";
    //mocking DocumentClient from DynamoDB, get is expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    var attemptBool = dynamoCheck("delete", spy);
    assert.isTrue(attemptBool);
  });

  /*
  * Given a failed attempt at a dynamo service deletion, handler() should inform of error
  * @param {object} event -> event.method is defined to be "DELETE", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should indicate an InternalServerError occured if DynamoDB.DocumentClient.delete fails", () =>{
    event.method = "DELETE";
    errType = "InternalServerError";
    errMessage = "unexpected error occured";
    logMessage = "Error in DeleteItem:";
    //mocking DocumentClient from DynamoDB, get is mocked with successful return, delete returns error
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    AWS.mock("DynamoDB.DocumentClient", "delete", (params, cb) => {
      return cb(err);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(cbCheck && logCheck);
  });

  /*
  * Given a successful attempt at a dynamo service deletion, handler() should indicate delete success
  * @param {object} event -> event.method is defined to be "DELETE", event.path.id is defined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should indicate that service was updated upon successful documentClient.update()", () =>{
    event.method = "DELETE";
    logMessage = "DeleteItem succeeded";
    //mocking DocumentClient from DynamoDB, get is mocked with successful return, update returns error
    AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
      return cb(null, dataObj);
    });
    AWS.mock("DynamoDB.DocumentClient", "delete", (params, cb) => {
      dataObj.updateServiceByID = "heckAp00";
      return cb(null, dataObj);
    });
    //wrapping the logger to check for response messages
    logStub = sinon.stub(logger, "info", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[2][0];
    var logCheck = logResponse.includes(logMessage);
    AWS.restore("DynamoDB.DocumentClient");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    assert.isTrue(logCheck);
  });

  /*
  * Given an event.method = POST and no event.body or event.path.id, handler() informs of missing input data
  * @params{object} event -> event.method is POST, event.body is undefined, null or empty
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} callback response containing error message with details
  */
  it("should indicate that input data is missing when given a POST with no event.body", ()=>{
    event.method = "POST";
    event.path.id = undefined;
    errType = "inputError";
    errMessage = "Input payload cannot be empty";
    var invalidArray = [{}, null, undefined];
    var bool = true;
    //handler() should issue the above error messages for any invalid value for the body
    for(i in invalidArray){
      //wrap the logger responses
      stub = sinon.stub(logger, "error", spy);
      event.body = invalidArray[i];
      //trigger stub/spy by calling handler
      var callfunction = index.handler(event, context, callback);
      var cbMessage = JSON.stringify(stub.args[0][0]);
      sinon.assert.called(stub);
      stub.restore();
      if(!cbMessage.includes(errType) || !cbMessage.includes(errMessage)){
        bool = false;
      };
    };
    assert.isTrue(bool);
  });

  /*
  * Given an event.method = POST and an event.body missing required fields, handler() informs of missing field data
  * @params{object} event -> event.method is POST, event.body has missing required fields
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} callback response containing error message with details
  */
  it("should indicate that input data is missing given a POST with an event.body missing required fields", ()=>{
    event.method = "POST";
    event.path.id = undefined;
    errType = "inputError";
    errMessage = "Following field(s) are required -";
    var invalidArray = ["", null, undefined];
    var bool = true;
    //handler() should issue the above error messages for any invalid value for the body fields
    for(i in invalidArray){
      //wrap the logger responses
      stub = sinon.stub(logger, "error", spy);
      event.body.status = invalidArray[i];
      //trigger stub/spy by calling handler
      var callfunction = index.handler(event, context, callback);
      var cbMessage = JSON.stringify(spy.args[0][0]);
      sinon.assert.called(stub);
      stub.restore();
      if(!cbMessage.includes(errType) || !cbMessage.includes(errMessage)){
        bool = false;
      };
    };
    assert.isTrue(bool);
  });

  /*
  * Given an event.method = POST and an event.body with invalid fields, handler() informs of invalid fields
  * @params{object} event -> event.method is POST, event.body has additional fields, path.id is undefined
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} callback response containing error message with details
  */
  it("should indicate that input data is missing given a POST with an event.body missing required fields", ()=>{
    //query has all required fields, cloning these properties will get us past first check
    Object.assign(event.body, event.query);
    event.body.newProperty = "Ludo!";
    event.method = "POST";
    event.path.id = undefined;
    errType = "inputError";
    errMessage = "Following fields are invalid :  ";
    //wrap the logger responses
    stub = sinon.stub(logger, "error", spy);
    //trigger stub/spy by calling handler
    var callfunction = index.handler(event, context, callback);
    var cbMessage = JSON.stringify(spy.args[0][0]);
    var cbCheck = cbMessage.includes(errType) && cbMessage.includes(errMessage);
    sinon.assert.called(stub);
    stub.restore();
    assert.isTrue(cbCheck);
  });

  /*
  * Given an event.method = "POST", unspecified id, and valid body, handler() attempts to search for existing service
  * @param {object} event -> event.method = "POST", event.path.id is undefined, event.body has required fields
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt dynamoDB scan for matching services given a POST with valid body data", ()=>{
    //query has all required fields, cloning required fields to body
    Object.assign(event.body, event.query);
    event.body.region = ["east", "west"];
    event.method = "POST";
    event.path.id = undefined;
    var attemptBool = dynamoCheck("scan",spy);
    assert.isTrue(attemptBool);
  });

  /*
  * Given a failed attempt at searching services with DynamoDB, handler() should inform of error
  * @param {object} event -> event.method = "POST", event.path.id is undefined, event.body has required props
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which is an error message
  */
  it("should indicate an InternalServerError occured if DynamoDB.scan fails during POST", ()=>{
    //query has all required fields, cloning required fields to body
    Object.assign(event.body, event.query);
    event.body.region = ["east", "west"];
    event.method = "POST";
    event.path.id = undefined;
    errType = "InternalServerError";
    errMessage = "unexpected error occured";
    logMessage = "error occured while adding new service";
    //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB", "scan", (params, cb) => {
      return cb(err);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[1][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  /*
  * Given a non empty return obj after searching for services, handler() aborts and states service already exists
  * @param {object} event -> event.method = "POST", event.path.id is undefined, event.body has required props
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  * @returns {string} should return the callback response which states service exists
  */
  it("should indicate service already exists if return obj from dynamoDB scan is non-empty", ()=>{
    //query has all required fields, cloning required fields to body
    Object.assign(event.body, event.query);
    event.body.region = ["east", "west"];
    event.method = "POST";
    event.path.id = undefined;
    errType = "BadRequest";
    errMessage = "Service name in the specified domain already exists.";
    logMessage = "Service name in the specified domain already exists.";
    //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB", "scan", (params, cb) => {
      var item = {};
      Object.assign(item, dataObj.Item);
      dataObj.Items = [item];
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
    AWS.restore("DynamoDB");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(cbCheck && logCheck);
  });

  /*
  * Given a successful POST, handler() attempts to add service in dynamoDB
  * @param {object} event -> event.method = "POST", event.path.id is undefined, event.body has required props
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should attempt to add service in dynamo for successful POST", function(){
    //query has all required fields, cloning required fields to body
    Object.assign(event.body, event.query);
    event.body.region = ["east", "west"];
    event.method = "POST";
    event.path.id = undefined;
    //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB", "scan", (params, cb) => {
      dataObj.Items = [];
      return cb(null, dataObj);
    });
    var attemptBool = dynamoCheck("put",spy);
    AWS.restore("DynamoDB");
    assert.isTrue(attemptBool);
  });

  /*
  * Given a failed attempt at a dynamo service addition, handler() should inform of error
  * @param {object} event -> event.method = "POST", event.path.id is undefined, event.body has required props
  * @params {object, function} default aws context, and callback function as defined in beforeEach
  */
  it("should indicate an InternalServerError occured if DynamoDB.DocumentClient.put fails", () =>{
    //query has all required fields, cloning required fields to body
    Object.assign(event.body, event.query);
    event.body.region = ["east", "west"];
    event.method = "POST";
    event.path.id = undefined;
    errType = "InternalServerError";
    errMessage = "Error adding Item to dynamodb ";
    logMessage = "error occured while adding new service";
    //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    AWS.mock("DynamoDB", "scan", (params, cb) => {
      dataObj.Items = [];
      return cb(null, dataObj);
    });
    AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
      return cb(err);
    });
    //wrapping the logger and callback function to check for response messages
    stub = sinon.stub(callbackObj, "callback", spy);
    logStub = sinon.stub(logger, "error", spy);
    //trigger the mocked logic by calling handler()
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logResponse = logStub.args[0][0];
    var cbResponse = stub.args[0][0];
    var logCheck = logResponse.includes(logMessage);
    var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
    AWS.restore("DynamoDB.DocumentClient");
    AWS.restore("DynamoDB");
    sinon.assert.called(stub);
    sinon.assert.called(logStub);
    logStub.restore();
    stub.restore();
    assert.isTrue(cbCheck && logCheck);
  });
});
