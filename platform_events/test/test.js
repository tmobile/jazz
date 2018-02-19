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
const awsContext = require('aws-lambda-mock-context');
const logger = require('../components/logger.js');
const sinon = require('sinon');
const AWS = require('aws-sdk-mock');

var event, context, callback, err, errMessage, errType, logMessage, dataObj, callbackObj, logStub;

describe('platform_events', function() {

    var dynamoCheck = function(dynamoMethod, sinonSpy){
        var serviceName;
        var docClientMethods = ["get", "put"];
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
        spy = sinon.spy();
        event = {
            "method" : "",
            "stage" : "test",
            "query" : {
                "service_name" : "jazz-service",
                "username" : "xyz",
                "last_eveluated_key" : "last-time"
            },
            "body": {
                "service_context" : {},
                "event_handler" : "JENKINS",
                "event_name" : "CREATE_SERVICE",
                "service_name" : "jazz-service",
                "event_status" : "COMPLETED",
                "event_type" : "SERVICE_CREATION",
                "username" : "xyz",
                "event_timestamp" : ""
            }
        };
        callback = (err, responseObj) => {
            if(err){
              return err;
            }
            else{
              return JSON.stringify(responseObj);
            }
        };
        context = awsContext();
        err = {
            "errorType" : "svtfoe",
            "message" : "starco"
        };
        // define an object to be returned by dynamo upon mocked success
        dataObj = {
            "Item" : {}
        };
        Object.assign(dataObj.Item);
        dataObj.Item.username = "xyz";
        dataObj.Item.FilterExpression = "Ba11";
        //creating an object with the callback function in order to wrap and test callback parameters
        callbackObj = {
            "callback" : callback
        };
    });

    it("should indicate that method is missing when given an event with no event.method", ()=>{
        errType = "BadRequest";
        errMessage = "method cannot be empty";
        var returnMessage;
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

    it("should attempt to get item data from dynamoDB by query params if 'GET' method and query params are defined", ()=>{
        event.method = "GET";
        var attemptBool = dynamoCheck("scan",spy);
        assert.isTrue(attemptBool);
    });

    it("should indicate an InternalServerError occured if DynamoDB.scan fails during GET", ()=>{
        event.method = "GET";
        errType = "InternalServerError";
        errMessage = "error occured";
        //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
        AWS.mock("DynamoDB", "scan", (params, cb) => {
          return cb(err);
        });
        //wrapping the and callback function to check for response messages
        stub = sinon.stub(callbackObj,"callback",spy);
        //trigger the mocked logic by calling handler()
        var callFunction = index.handler(event, context, callbackObj.callback);
        var cbResponse = stub.args[0][0];
        var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
        AWS.restore("DynamoDB");
        stub.restore();
        assert.isTrue(cbCheck);
    });

    it("should include username and service_name info in dynamodb filter if given specific event props", ()=>{
        event.method = "GET";
        var username = "xyz";
        var service_name = "jazz-service";
        event.query.username = username;
        event.query.service_name = service_name;
        var scanParamBefore = ":USERNAME";
        var scanParamAfter = ":SERVICE_NAME";
        var dataType = "S";
        var filterUserName = "USERNAME =";
        var filterServiceName = "SERVICE_NAME =";
        //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
        AWS.mock("DynamoDB", "scan", spy);
        //trigger spy by calling index.handler()
        var callFunction = index.handler(event, context, callback);
        //assigning the item filter values passed to DynamoDB.scan as values to check against
        var filterExp = spy.args[0][0].FilterExpression;
        var expAttrVals = spy.args[0][0].ExpressionAttributeValues;
        var allCases = filterExp.includes(filterUserName) && filterExp.includes(filterServiceName) &&
                        expAttrVals[scanParamBefore][dataType] == username &&
                        expAttrVals[scanParamAfter][dataType] == service_name;
        AWS.restore("DynamoDB");
        assert.isTrue(allCases);
    });

    it("should indicate that body is missing when an event with no event.body", ()=>{
        event.method = "POST";
        event.body = undefined;
        errType = "InternalServerError";
        errMessage = "inputs not defined";
        var bool = true;
        var returnMessage = index.handler(event, context, callback);
        if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
            bool = false;
        };
        assert.isTrue(bool);
    });

    it("should indicate that input service_context is missing when an event with no event.body.service_context", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "not provided";
        var returnMessage;
        var invalidArray = ["", undefined];
        var bool = true;
        for(i in invalidArray){
            event.body.service_context = invalidArray[i];
            returnMessage = index.handler(event, context, callback);
            if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
                bool = false
            };
        };
       assert.isTrue(bool);
    });

    it("should indicate that input event_handler is missing when an event with no event.body.event_handler", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "not provided";
        var returnMessage;
        var invalidArray = ["", undefined];
        var bool = true;
        for(i in invalidArray){
            event.body.event_handler = invalidArray[i];
            returnMessage = index.handler(event, context, callback);
            if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
                bool = false
            };
        };
       assert.isTrue(bool);
    });

    it("should indicate that input event_name is missing when an event with no event.body.event_name", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "not provided";
        var returnMessage;
        var invalidArray = ["", undefined];
        var bool = true;
        for(i in invalidArray){
            event.body.event_name = invalidArray[i];
            returnMessage = index.handler(event, context, callback);
            if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
                bool = false
            };
        };
       assert.isTrue(bool);
    });

    it("should indicate that input service_name is missing when an event with no event.body.service_name", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "not provided";
        var returnMessage;
        var invalidArray = ["", undefined];
        var bool = true;
        for(i in invalidArray){
            event.body.service_name = invalidArray[i];
            returnMessage = index.handler(event, context, callback);
            if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
                bool = false
            };
        };
       assert.isTrue(bool);
    });

    it("should indicate that input event_status is missing when an event with no event.body.event_status", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "not provided";
        var returnMessage;
        var invalidArray = ["", undefined];
        var bool = true;
        for(i in invalidArray){
            event.body.event_status = invalidArray[i];
            returnMessage = index.handler(event, context, callback);
            if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
                bool = false
            };
        };
       assert.isTrue(bool);
    });

    it("should indicate that input event_type is missing when an event with no event.body.event_type", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "not provided";
        var returnMessage;
        var invalidArray = ["", undefined];
        var bool = true;
        for(i in invalidArray){
            event.body.event_type = invalidArray[i];
            returnMessage = index.handler(event, context, callback);
            if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
                bool = false
            };
        };
       assert.isTrue(bool);
    });

    it("should indicate that input username is missing when an event with no event.body.username", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "not provided";
        var returnMessage;
        var invalidArray = ["", undefined];
        var bool = true;
        for(i in invalidArray){
            event.body.username = invalidArray[i];
            returnMessage = index.handler(event, context, callback);
            if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
                bool = false
            };
        };
       assert.isTrue(bool);
    });

    it("should indicate that input event_timestamp is missing when an event with no event.body.event_timestamp", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "not provided";
        var returnMessage;
        var invalidArray = ["", undefined];
        var bool = true;
        for(i in invalidArray){
            event.body.event_timestamp = invalidArray[i];
            returnMessage = index.handler(event, context, callback);
            if(!returnMessage.includes(errType) || !returnMessage.includes(errMessage)){
                bool = false
            };
        };
       assert.isTrue(bool);
    });

    // it("should indicate an InputValidationError occured if DynamoDB.scan fails during POST", ()=>{
    //     event.method = "POST";
    //     errType = "BadRequest";
    //     errMessage = "error";
    //     //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    //     AWS.mock("DynamoDB", "scan", (params, cb) => {
    //       return cb(err);
    //     });
    //     //wrapping the logger and callback function to check for response messages
    //     stub = sinon.stub(callbackObj,"callback",spy);
    //     //trigger the mocked logic by calling handler()
    //     var callFunction = index.handler(event, context, callbackObj.callback);
    //     var cbResponse = stub.args[0][0];
    //     var cbCheck = cbResponse.includes(errMessage) && cbResponse.includes(errType);
    //     AWS.restore("DynamoDB");
    //     stub.restore();
    //     assert.isTrue(cbCheck);
    // });

    // it("should indicate an InternalServerError occured if DynamoDB.scan fails during POST", ()=>{
    //     event.method = "POST";
    //     event.body.service_context = {
    //         "service_type": "api",
    //         "repository": "",
    //         "domain": "oss",
    //         "runtime": "nodejs",
    //         "admin_groups": "name=xyz&",
    //         "is_public_endpoint": true
    //     };
    //     event.body.event_timestamp = "2018-01-23T10:28:10:136";
    //     errType = "InternalServerError";
    //     errMessage = "internal error occured";
    //     //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
    //     AWS.mock("DynamoDB", "scan", (params, cb) => {
    //       return cb(err);
    //     });
    //     //wrapping the logger and callback function to check for response messages
    //     stub = sinon.stub(callbackObj,"callback",spy);
    //     //trigger the mocked logic by calling handler()
    //     var callFunction = index.handler(event, context, callbackObj.callback);
    //     var cbResponse = stub.args[0][0];
    //     var cbCheck = cbResponse.includes(errMessage) && cbResponse.includes(errType);
    //     AWS.restore("DynamoDB");
    //     stub.restore();
    //     assert.isTrue(cbCheck);
    // });

    it("should attempt to add service in dynamo for successful POST", function(){
        //query has all required fields, cloning required fields to body
        event.method = "POST";
        //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
        AWS.mock("DynamoDB", "scan", (params, cb) => {
          dataObj.Items = [];
          return cb(null, dataObj);
        });
        var attemptBool = dynamoCheck("scan", spy);
        AWS.restore("DynamoDB");
        assert.isTrue(attemptBool);
      });
    
    

    // it('tests handler', function(done) {

    // 	index.handler({method:'GET'},{},function() {})

    //     //Test cases to be added here.
    //     assert(true);
    //     done();
    // });
});
