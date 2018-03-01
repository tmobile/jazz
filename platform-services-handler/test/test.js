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
const awsContext = require('aws-lambda-mock-context');
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const index = require('../index');
const logger = require('../components/logger');
const request = require('request');
const config = require('../components/config');


var spy, event, context, callback, errType, errMessage, logMessage, dataObj, cllabakObj, stub, logStub, reqStub, checkCase;

describe('Platform_services-handler', function() {

  beforeEach(()=>{
    spy = sinon.spy();
    let  kinesisObj= {
      "kinesis": {
        "kinesisSchemaVersion": "1.0",
        "partitionKey": "VALIDATE_INPUT",
        "sequenceNumber": "49574219880753003597816065353678073460941546253285588994",
        "data": "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkNBTExfT05CT0FSRElOR19XT1JLRkxPVyINCgkJfSwNCgkJIlNFUlZJQ0VfTkFNRSI6IHsNCgkJCSJTIjogInRlc3Q4Ig0KCQl9LA0KCQkiRVZFTlRfU1RBVFVTIjogew0KCQkJIlMiOiAiQ09NUExFVEVEIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfQ1JFQVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInN2Y19jcHRfam5rX2F1dGhfcHJkIg0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0sDQoJCSJBQUEiOiB7DQoJCQkiTlVMTCI6IHRydWUNCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0sDQoJIlJldHVybkNvbnN1bWVkQ2FwYWNpdHkiOiAiVE9UQUwiLA0KCSJUYWJsZU5hbWUiOiAiRXZlbnRzX0RldiINCn0==",
        "approximateArrivalTimestamp": "1498499666.218"
      },
      "eventSource": "aws:kinesis",
      "eventVersion": "1.0",
      "eventID": "shardId-000000000000:49574219880753003597816065353678073460941546253285588994",
      "eventName": "aws:kinesis:record",
      "invokeIdentityArn": "arn:aws:iam::xxx:role/lambda_basic_execution",
      "awsRegion": "us-west-2",
      "eventSourceARN": "arn:aws:kinesis:us-west-2:xxx:stream/serverless-events-hub-dev"
    }
    event = {
      "Records":[ kinesisObj ],
      "MillisBehindLatest":24000,
      "NextShardIterator":"AAAAAAAAAAEDOW3ugseWPE4503kqN1yN1UaodY8unE0sYslMUmC6lX9hlig5+t4RtZM0/tALfiI4QGjunVgJvQsjxjh2aLyxaAaPr+LaoENQ7eVs4EdYXgKyThTZGPcca2fVXYJWL3yafv9dsDwsYVedI66dbMZFC8rPMWc797zxQkv4pSKvPOZvrUIudb8UkH3VMzx58Is="
    };
    context = awsContext();
    context.functionName = context.functionName+"-test"
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
    callbackObj = {
      "callback" : callback
    };
  });

  it("should attempt to make an http request if given valid inputs", function(){
    //wrapping the Request() method that gets internally called by node request.js for any http method
    reqStub = sinon.stub(request, "Request", spy);
    //trigger the spy wrapping the request by calling handler() with valid params
    var callFunction = index.handler(event, context, callback);
    reqStub.restore();
    assert.isTrue(spy.called);
  });

  it("should indicate error if event.Record is undefined", ()=>{
    event.Records = undefined;
    logMessage = "events failed";
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'verbose', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(logMessage);
    var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === 0;
    stub.restore();
    logStub.restore();
    assert.isTrue(logCheck && cbCheck);
  })

  it("should indicate error if partitionKey is undefined from kinesis record", ()=>{
    var invalidArrya = ["", null, undefined];
    logMessage = 'partitionKey not available';
    errMessage = 'push un-interesting event to processed queue';
    logStub = sinon.stub(logger, 'debug', spy);
    var callFunction, logResponse, logCheck;
    for(i in invalidArrya){
      event.Records[0].kinesis.partitionKey = invalidArrya[i];
      callFunction = index.handler(event, context, callback);
      logResponse = logStub.args;
      logCheck = logResponse[0][0].includes(logMessage) && logResponse[1][0].includes(errMessage);
    }
    logStub.restore();
    assert.isTrue(logCheck)
  });

  it('should indicate error if kinesis data does not have EVENT_NAME as SERVICE_CREATION', ()=>{
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICJlODI1ZWY3Yi1jOGI3LThhODQtZDNmMC1kNzNiZDdhOGQ1NjYiDQoJCX0sDQoJCSJTRVJWSUNFX05BTUUiOiB7DQoJCQkiUyI6ICJ0ZXN0OCINCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0NCn0=";
    logMessage = 'not interesting event';
    errMessage = 'push un-interesting event to processed queue';
    logStub = sinon.stub(logger, 'error',spy);
    debgStub = sinon.stub(logger, 'debug', spy);
    var callFunction = index.handler(event, context, callback);
    var logCheck = logStub.args[0][0].includes(logMessage) && debgStub.args[0][0].includes(errMessage);
    logStub.restore();
    debgStub.restore();
    assert.isTrue(logCheck);
  });


  it("should indicate SQS error if SQS.sendMessageBatch fails", ()=>{
    // kinesis.data contain invalid EVENT_NAME or EVENT_STATUS
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIiINCgkJfSwNCgkJIlNFUlZJQ0VfTkFNRSI6IHsNCgkJCSJTIjogInRlc3Q4Ig0KCQl9LA0KCQkiRVZFTlRfU1RBVFVTIjogew0KCQkJIlMiOiAiIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfQ1JFQVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInN2Y19jcHRfam5rX2F1dGhfcHJkIg0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0sDQoJCSJBQUEiOiB7DQoJCQkiTlVMTCI6IHRydWUNCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0sDQoJIlJldHVybkNvbnN1bWVkQ2FwYWNpdHkiOiAiVE9UQUwiLA0KCSJUYWJsZU5hbWUiOiAiRXZlbnRzX0RldiINCn0=";
    logMessage = "SQS error";
    logStub = sinon.stub(logger, 'error', spy);
    stub = sinon.stub(callbackObj, "callback", spy);
    AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
      return cb(err)
    });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[logStub.args.length-1][0].includes(logMessage);
    var cbCheck = stub.args[0][0].errorType === err.errorType && stub.args[0][0].message === err.message
    AWS.restore("SQS");
    logStub.restore();
    stub.restore();
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate validation error if kinesis record contain invalid EVENT_NAME or EVENT_STATUS", ()=>{
    // kinesis.data contain invalid EVENT_NAME or EVENT_STATUS
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIiINCgkJfSwNCgkJIlNFUlZJQ0VfTkFNRSI6IHsNCgkJCSJTIjogInRlc3Q4Ig0KCQl9LA0KCQkiRVZFTlRfU1RBVFVTIjogew0KCQkJIlMiOiAiIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfQ1JFQVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInN2Y19jcHRfam5rX2F1dGhfcHJkIg0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0sDQoJCSJBQUEiOiB7DQoJCQkiTlVMTCI6IHRydWUNCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0sDQoJIlJldHVybkNvbnN1bWVkQ2FwYWNpdHkiOiAiVE9UQUwiLA0KCSJUYWJsZU5hbWUiOiAiRXZlbnRzX0RldiINCn0=";
    logMessage = "validation error. Either event name or event status is not properly defined.";
    logStub = sinon.stub(logger, 'error', spy);
    stub = sinon.stub(callbackObj, 'callback', spy);
    AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
      return cb(null, callbackObj)
    });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbCkeck = stub.args[0][1].failed_events === event.Records.length;
    var logCheck = logStub.args[0][0].includes(logMessage);
    AWS.restore("SQS");
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCkeck);
  });

  it("should indicate success from 200 response if kinesis data is defined for startingEvent", ()=>{
    var responseObject = {
      statusCode : 200
    };
    var bodyObj = {
      data : "hello"
    }
    logMessage = 'created a new service in service catalog';
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger,'verbose', spy);
    reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObject, bodyObj);
    });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(logMessage);
    var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
    logStub.restore();
    reqStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  it("should indicate error for 200 response with body.data undefined and kinesis data is defined for startingEvent", ()=>{
    var responseObject = {
      statusCode : 200
    };
    var invalidArray = ["", null];
    var bodyObj={
      data:""
    };
    stub = sinon.stub(callbackObj, 'callback', spy);
    logMessage = 'Unknown error while creating a new service';
    logStub = sinon.stub(logger,'error', spy);
    AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
      return cb(null, callbackObj)
    });
    for(i in invalidArray){
      reqStub = sinon.stub(request, "Request", (obj) => {
        bodyObj.data = invalidArray[i];
        return obj.callback(null, responseObject, bodyObj);
      });
      var callFunction = index.handler(event, context, callbackObj.callback);
      var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
      var logCheck = logStub.args[0][0].includes(logMessage);
      reqStub.restore();
    }
    stub.restore();
    logStub.restore();
    AWS.restore("SQS");
    assert.isTrue(logCheck && cbCheck);
  });

  it("should indicate error if response status code is not 200 and kinesis data is defined for startingEvent", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "error creating a new service in service catalog"}
      
    };
    logMessage = 'Processing error while creating a new service';
    logStub = sinon.stub(logger,'error', spy);
    stub = sinon.stub(callbackObj, 'callback', spy);
    AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
      return cb(null, callbackObj)
    });
    reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObject, null);
    });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(logMessage);
    var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
    logStub.restore();
    reqStub.restore();
    stub.restore();
    AWS.restore("SQS");
    assert.isTrue(logCheck && cbCheck);
  });

  it("should indicate error if response status code is not 200 and kinesis data is defined for failed EVENT_STATUS", ()=>{
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIlBVU0hfVEVNUExBVEVfVE9fU0VSVklDRV9SRVBPIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9DUkVBVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAic3ZjX2NwdF9qbmtfYXV0aF9wcmQiDQoJCX0sDQoJCSJFVkVOVF9USU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA1LTA1VDA2OjA2OjM3OjUzMyINCgkJfSwNCgkJIkFBQSI6IHsNCgkJCSJOVUxMIjogdHJ1ZQ0KCQl9LA0KCQkiQkJCIjogew0KCQkJIlMiOiAidmFsIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfRGV2Ig0KfQ=="
    logMessage = 'error finding service';
    var responseObject = {
      statusCode : 400,
      body:{message : "error finding service"}
    };
    AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
      return cb(null, callbackObj)
    });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, responseObject, null);
    });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(logMessage);
    var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
    stub.restore();
    logStub.restore();
    reqStub.restore();
    AWS.restore("SQS");
    assert.isTrue(logCheck && cbCheck);
  });

  it("should indicate error if response status code is 200 with body.data undefined and kinesis data is defined for failed EVENT_STATUS", ()=>{
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIlBVU0hfVEVNUExBVEVfVE9fU0VSVklDRV9SRVBPIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9DUkVBVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAic3ZjX2NwdF9qbmtfYXV0aF9wcmQiDQoJCX0sDQoJCSJFVkVOVF9USU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA1LTA1VDA2OjA2OjM3OjUzMyINCgkJfSwNCgkJIkFBQSI6IHsNCgkJCSJOVUxMIjogdHJ1ZQ0KCQl9LA0KCQkiQkJCIjogew0KCQkJIlMiOiAidmFsIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfRGV2Ig0KfQ=="
    logMessage = 'error finding service';
    var responseObject = {
      statusCode : 200
    };
    var invalidArray = ["", null, undefined];
    var bodyObj="{\"data\":[]}";
    AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
      return cb(null, callbackObj)
    });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    for(i in invalidArray){
      reqStub = sinon.stub(request, "Request", (obj) => {
        bodyObj.data = invalidArray[i];
        var body = JSON.stringify(bodyObj);
        return obj.callback(null, responseObject, bodyObj);
      });
      var callFunction = index.handler(event, context, callbackObj.callback);
      var logCheck = logStub.args[0][0].includes(logMessage);
      var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
      reqStub.restore();
    }
    AWS.restore("SQS");
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  it("should indicate sucess from 200 response for the kinesis data with failed EVENT_STATUS",()=>{
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIlBVU0hfVEVNUExBVEVfVE9fU0VSVklDRV9SRVBPIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9DUkVBVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAic3ZjX2NwdF9qbmtfYXV0aF9wcmQiDQoJCX0sDQoJCSJFVkVOVF9USU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA1LTA1VDA2OjA2OjM3OjUzMyINCgkJfSwNCgkJIkFBQSI6IHsNCgkJCSJOVUxMIjogdHJ1ZQ0KCQl9LA0KCQkiQkJCIjogew0KCQkJIlMiOiAidmFsIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfRGV2Ig0KfQ=="
    logMessage = 'updated service ';
    var responseObjectGET = {
      statusCode : 200
    };
    var bodyObj = "{\"data\":\"hello\"}";
    var responseObjectPUT = {
      statusCode: 400,
      "message":"error updating service "
    };
    logStub = sinon.stub(logger, 'verbose', spy);
    stub = sinon.stub(callbackObj, "callback", spy);
    getReqStub = sinon.stub(request,'Request', (obj)=>{
      return obj.callback(null, responseObjectGET, bodyObj);
    });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(logMessage);
    var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
    logStub.restore();
    stub.restore();
    getReqStub.restore();
    assert.isTrue(logCheck && cbCheck)
  });

  it("should indicate error if response code is not 200 and kinesis data is defined for complted endingEvent", ()=>{
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIk9OQk9BUkRJTkciDQoJCX0sDQoJCSJTRVJWSUNFX05BTUUiOiB7DQoJCQkiUyI6ICJ0ZXN0OCINCgkJfSwNCgkJIkVWRU5UX1NUQVRVUyI6IHsNCgkJCSJTIjogIkNPTVBMRVRFRCINCgkJfSwNCgkJIkVWRU5UX1RZUEUiOiB7DQoJCQkiUyI6ICJTRVJWSUNFX0NSRUFUSU9OIg0KCQl9LA0KCQkiVVNFUk5BTUUiOiB7DQoJCQkiUyI6ICJzdmNfY3B0X2pua19hdXRoX3ByZCINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9LA0KCQkiQUFBIjogew0KCQkJIk5VTEwiOiB0cnVlDQoJCX0sDQoJCSJCQkIiOiB7DQoJCQkiUyI6ICJ2YWwiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19EZXYiDQp9";
    logMessage = "error finding service ";
    var responseObject = {
      statusCode : 400,
      body:{message : "error finding service"}
    };
    AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
      return cb(null, callbackObj)
    });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, responseObject, null);
    });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(logMessage);
    var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
    logStub.restore();
    stub.restore();
    reqStub.restore();
    AWS.restore("SQS");
    assert.isTrue(logCheck && cbCheck);
  });
  
  it("should indicate error if response status code is 200 with body.data undefined and kinesis data is defined for complted endingEvent", ()=>{
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIk9OQk9BUkRJTkciDQoJCX0sDQoJCSJTRVJWSUNFX05BTUUiOiB7DQoJCQkiUyI6ICJ0ZXN0OCINCgkJfSwNCgkJIkVWRU5UX1NUQVRVUyI6IHsNCgkJCSJTIjogIkNPTVBMRVRFRCINCgkJfSwNCgkJIkVWRU5UX1RZUEUiOiB7DQoJCQkiUyI6ICJTRVJWSUNFX0NSRUFUSU9OIg0KCQl9LA0KCQkiVVNFUk5BTUUiOiB7DQoJCQkiUyI6ICJzdmNfY3B0X2pua19hdXRoX3ByZCINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9LA0KCQkiQUFBIjogew0KCQkJIk5VTEwiOiB0cnVlDQoJCX0sDQoJCSJCQkIiOiB7DQoJCQkiUyI6ICJ2YWwiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19EZXYiDQp9"
    logMessage = 'error finding service ';
    var responseObject = {
      statusCode : 200
    };
    var invalidArray = ["", null, undefined];
    var bodyObj="{\"data\":[]}";
    AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
      return cb(null, callbackObj)
    });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    for(i in invalidArray){
      reqStub = sinon.stub(request, "Request", (obj) => {
        bodyObj.data = invalidArray[i];
        var body = JSON.stringify(bodyObj);
        return obj.callback(null, responseObject, bodyObj);
      });
      var callFunction = index.handler(event, context, callbackObj.callback);
      var logCheck = logStub.args[0][0].includes(logMessage);
      var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
      reqStub.restore();
    };
    AWS.restore("SQS");
    logStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  it("should indicate sucess from 200 response for the kinesis data with completed endingEvent",()=>{
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIk9OQk9BUkRJTkciDQoJCX0sDQoJCSJTRVJWSUNFX05BTUUiOiB7DQoJCQkiUyI6ICJ0ZXN0OCINCgkJfSwNCgkJIkVWRU5UX1NUQVRVUyI6IHsNCgkJCSJTIjogIkNPTVBMRVRFRCINCgkJfSwNCgkJIkVWRU5UX1RZUEUiOiB7DQoJCQkiUyI6ICJTRVJWSUNFX0NSRUFUSU9OIg0KCQl9LA0KCQkiVVNFUk5BTUUiOiB7DQoJCQkiUyI6ICJzdmNfY3B0X2pua19hdXRoX3ByZCINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9LA0KCQkiQUFBIjogew0KCQkJIk5VTEwiOiB0cnVlDQoJCX0sDQoJCSJCQkIiOiB7DQoJCQkiUyI6ICJ2YWwiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19EZXYiDQp9"
    logMessage = 'updated service ';
    var responseObjectGET = {
      statusCode : 200
    };
    var bodyObj = "{\"data\":\"hello\"}";
    var responseObjectPUT = {
      statusCode: 400,
      "message":"error updating service "
    };
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'verbose', spy);
    getReqStub = sinon.stub(request,'Request', (obj)=>{
      return obj.callback(null, responseObjectGET, bodyObj);
    });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(logMessage);
    var cbCheck = (stub.args[0][1].failed_events + stub.args[0][1].processed_events) === event.Records.length;
    logStub.restore();
    stub.restore();
    getReqStub.restore();
    assert.isTrue(logCheck)
  });

});
