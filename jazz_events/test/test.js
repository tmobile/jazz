// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
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
        //assign the correct aws service depending on the method to be used
        if(dynamoMethod == "scan" || dynamoMethod == "getItem"){
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
                "last_evaluated_key": undefined
            },
            "body": {
                "service_context" : {},
                "event_handler" : "JENKINS",
                "event_name" : "CREATE_SERVICE",
                "service_name" : "jazz-service",
                "event_status" : "COMPLETED",
                "event_type" : "test",
                "username" : "xyz",
                "event_timestamp" : "2018-01-23T10:28:10:136",
                "unimportant":"",
                "NULL":null
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
        
        //creating an object with the callback function in order to wrap and test callback parameters
        callbackObj = {
            "callback" : callback
        };
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
        var callFunction = index.handler(event, context, callbackObj.callback);
        //assigning the item filter values passed to DynamoDB.scan as values to check against
        var filterExp = spy.args[0][0].FilterExpression;
        var expAttrVals = spy.args[0][0].ExpressionAttributeValues;
        var allCases = filterExp.includes(filterUserName) && filterExp.includes(filterServiceName) &&
                        expAttrVals[scanParamBefore][dataType] == username &&
                        expAttrVals[scanParamAfter][dataType] == service_name;
        AWS.restore("DynamoDB");
        assert.isTrue(allCases);
    });

    it("should indicate Bad request if no query params", ()=>{
        event.method = "GET";
        logMessage = "error"
        var invalidArray = ["",null, undefined];
        errType = "BadRequest"
        var errMessage = "Bad request.";
        AWS.mock("DynamoDB", "scan", (params, cb)=>{
            return cb(null, dataObj);
        });
        stub = sinon.stub(callbackObj, "callback", spy);
        for(i in invalidArray){
            event.query = invalidArray[i];
            var callFunction = index.handler(event, context, callbackObj.callback);
            var cbResponse = stub.args[0][0];
            var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
        }
        AWS.restore("DynamoDB");
        stub.restore();
        assert.isTrue(cbCheck);
    });

    it("should indicate Bad request if invalid query params are provided", ()=>{
        event.method = "GET";
        event.query = {
            "invalid" : "test"
        };
        var dataObj = {
            "Items": [{
                SERVICE_CONTEXT :{ S: {}},
                EVENT_HANDLER : {S:"JENKINS"},
                EVENT_NAME : {S:"CREATE_SERVICE"},
                SERVICE_NAME: {S:'jazztest'},
                EVENT_STATUS : {S:"COMPLETED"},
                EVENT_TYPE : {S:"test"},
                USERNAME: {S:'xyz'},
                EVENT_TIMESTAMP : {S:"2018-01-23T10:28:10:136"}
            }]
        }
        errType = "BadRequest"
        var errMessage = "Bad request.";
        AWS.mock("DynamoDB", "scan", (params, cb)=>{
            return cb(null, dataObj);
        });
        stub = sinon.stub(callbackObj, "callback", spy);
        var callFunction = index.handler(event, context, callbackObj.callback);
        var cbResponse = stub.args[0][0];
        var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
        AWS.restore("DynamoDB");
        stub.restore();
        assert.isTrue(cbCheck);
    });

    it("should indicate success if method GET and query params are defined", ()=>{
        event.method = "GET";
        var dataObj = {
            "Items": [{
                SERVICE_CONTEXT :{ S: {}},
                EVENT_HANDLER : {S:"JENKINS"},
                EVENT_NAME : {S:"CREATE_SERVICE"},
                SERVICE_NAME: {S:'jazztest'},
                EVENT_STATUS : {S:"COMPLETED"},
                EVENT_TYPE : {S:"test"},
                USERNAME: {S:'xyz'},
                EVENT_TIMESTAMP : {S:"2018-01-23T10:28:10:136"},
                UNIMPORTANT:{NULL:''}
            }]
        }
        //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
        AWS.mock("DynamoDB", "scan", (params, cb)=>{
            return cb(null, dataObj);
        });
        stub = sinon.stub(callbackObj, "callback", spy);
        //trigger spy by calling index.handler()
        var callFunction = index.handler(event, context, callbackObj.callback);
        //assigning the item filter values passed to DynamoDB.scan as values to check against
        var cbResponse = stub.args[0][1];
        var cbCheck = cbResponse.input === event.query;
        AWS.restore("DynamoDB");
        stub.restore();
        assert.isTrue(cbCheck);
    });

    //POST handler starts from here//

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

    it("should indicate an InputValidationError occured if event.body.event_timestamp with invalid format", ()=>{
        event.method = "POST";
        errType = "BadRequest";
        errMessage = "error";
        event.body.event_timestamp = "2018-01-23T10:28:10:136z";
        //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
        AWS.mock("DynamoDB", "getItem", spy);
        //wrapping the logger and callback function to check for response messages
        stub = sinon.stub(callbackObj,"callback",spy);
        //trigger the mocked logic by calling handler()
        var callFunction = index.handler(event, context, callbackObj.callback);
        var cbResponse = stub.args[0][0];
        var cbCheck = cbResponse.includes(errMessage) && cbResponse.includes(errType);
        AWS.restore("DynamoDB");
        stub.restore();
        assert.isTrue(cbCheck);
    });

    it("should indicate an InternalServerError occured if DynamoDB.getItem fails during POST", ()=>{
        event.method = "POST";
        errType = "InternalServerError";
        errMessage = "An internal error occured";
        //mocking DynamoDB.scan, expecting callback to be returned with params (error,data)
        AWS.mock("DynamoDB", "getItem", (params, cb) => {
          return cb(err);
        });
        //wrapping the logger and callback function to check for response messages
        stub = sinon.stub(callbackObj,"callback",spy);
        //trigger the mocked logic by calling handler()
        var callFunction = index.handler(event, context, callbackObj.callback);
        var cbResponse = stub.args[0][0];
        var cbCheck = cbResponse.includes(errMessage);
        AWS.restore("DynamoDB");
        stub.restore();
        assert.isTrue(cbCheck);
    });

    it("should attempt to get item from DynamoDB by body prameters if POST method and body parameters are defined", function(){
        event.method = "POST";
        var attemptBool = dynamoCheck('getItem', spy);
        assert.isTrue(attemptBool);
    });

    it("should attempt to initiate kinesis putRecord if method POST and body parameters are defined",()=>{
        event.method = "POST";
        // mock kinesis putRecord with event.body parameters defined
        AWS.mock('DynamoDB', 'getItem',spy);
        AWS.mock("Kinesis","putRecord",spy);
        var callFunction = index.handler(event, context, callback);
        var bool = spy.called;
        AWS.restore('Kinesis');
        AWS.restore('DynamoDB');
        assert.isTrue(bool);
    });

    it("should indicate internalserver error  if document.getitems fail for method POST", ()=>{
        event.method = "POST";
        errType = 'InternalServerError';
        errMessage = 'internal error occured';
        logMessage = 'error';
        AWS.mock('DynamoDB', 'getItem', (params, cb)=>{
            return cb(err);
        });
        stub = sinon.stub(callbackObj, 'callback', spy);
        logStub = sinon.stub(logger, 'error', spy);
        var callFunction = index.handler(event, context, callbackObj.callback);
        var logResponse = logStub.args[0][0];
        var cbResponse = stub.args[0][0];
        var logCheck = logResponse.includes(logMessage);
        var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
        AWS.restore('DynamoDB');
        logStub.restore();
        assert.isTrue(cbCheck && logCheck);
    });

    it("should indicate badrequest error  if document.getitems return with empty obj for method POST", ()=>{
        event.method = "POST";
        errType = 'BadRequest';
        errMessage = 'Bad request.';
        logMessage = 'Invalid ';
        AWS.mock('DynamoDB', 'getItem', (params, cb)=>{
            return cb(null, {});
        });
        stub = sinon.stub(callbackObj, 'callback', spy);
        logStub = sinon.stub(logger, 'error', spy);
        var callFunction = index.handler(event, context, callbackObj.callback);
        var logResponse = logStub.args[0][0];
        var cbResponse = stub.args[0][0];
        var logCheck = logResponse.includes(logMessage);
        var cbCheck = cbResponse.includes(errType) && cbResponse.includes(errMessage);
        AWS.restore('DynamoDB');
        logStub.restore();
        assert.isTrue(cbCheck && logCheck);
    });


    it("should indicate success if method POST and body params are defined", ()=>{
        event.method = "POST";
        var dataObj = {
            "Item" : event.body
        };
        var kinesisObj = {
            "event_id": "id"
        }
        AWS.mock('DynamoDB', 'getItem',(params, cb)=>{
            return cb(null, dataObj);
        });
        AWS.mock('Kinesis', 'putRecord', (params, cb)=>{
            return cb(null, kinesisObj);
        });
        stub = sinon.stub(callbackObj, "callback", spy);
        var callFunction = index.handler(event, context, callbackObj.callback);
        var cbResponse = stub.args[0][1];
        var cbCheck = cbResponse.input === event.body;
        AWS.restore('Kinesis');
        AWS.restore('DynamoDB');
        stub.restore();
        assert.isTrue(cbCheck)
    });

    it("should indicate error while kinesis.putRecord fail for defined method POST and body params", ()=>{
        event.method = "POST";
        logMessage = 'kinesis error';
        errMessage = "Error storing event."
        var dataObj = {
            "Item" : event.body
        };
       
        AWS.mock('DynamoDB', 'getItem',(params, cb)=>{
            return cb(null, dataObj);
        });
        AWS.mock('Kinesis', 'putRecord', (params, cb)=>{
            return cb(err);
        });
        stub = sinon.stub(callbackObj, 'callback', spy);
        logStub = sinon.stub(logger, 'error', spy);
        var callFunction = index.handler(event, context, callbackObj.callback);
        var logResponse = logStub.args[0][0];
        var cbResponse = stub.args[0][0];
        var logCheck = logResponse.includes(logMessage);
        var cbCheck = cbResponse.includes(errMessage);
        AWS.restore('Kinesis');
        AWS.restore('DynamoDB');
        stub.restore();
        logStub.restore();
        assert.isTrue(logCheck && cbCheck)
    });

});
