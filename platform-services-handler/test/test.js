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
const crud = require('../components/crud')();


var spy, event, context, callback, errType, errMessage, logMessage, tokenDataObj, cllabakObj, stub, logStub, reqStub, configData;

describe('Platform_services-handler', function() {

  beforeEach(()=>{
    spy = sinon.spy();
    tokenDataObj = {
      statusCode:200,
      body:{
        data:{
          token:"access"
        }
      }
    };
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
    configData = config(context);
  });

  it("should attempt to make an http request if given valid inputs", function(){
    //wrapping the Request() method that gets internally called by node request.js for any http method
    reqStub = sinon.stub(request, "Request", spy);
    //trigger the spy wrapping the request by calling handler() with valid params
    var callFunction = index.handler(event, context, callback);
    reqStub.restore();
    assert.isTrue(spy.called);
  });

  it("should indicate error for failed response of  gettoken requset",()=>{
    tokenDataObj.statusCode = 400;
    tokenDataObj.body.message = "Error";
    errMessage = "Could not get authentication token for updating Service catalog."
    reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, tokenDataObj, tokenDataObj);
    });
    stub = sinon.stub(callbackObj, 'callback', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbResponse = stub.args[0][0];
    var cbCheck = cbResponse.error === errMessage && cbResponse.details === tokenDataObj.body.message;
    reqStub.restore();
    stub.restore();
    assert.isTrue(cbCheck);

  });

  it("should indicate success for success response of gettoken requset and processBatch is undefined if event.Records is not defined", ()=>{
    event.Records = undefined;
    reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    stub = sinon.stub(callbackObj, 'callback', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbResponse = stub.args[0][1];
    var cbCheck = cbResponse.getToken.auth_token === tokenDataObj.body.data.token && cbResponse.processBatch.processed_events === 0 && cbResponse.processBatch.failed_events === 0;
    reqStub.restore();
    stub.restore();
    assert.isTrue(cbCheck);
  });

  it('should indicate error if kinesis data does not have EVENT_TYPE', ()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICJlODI1ZWY3Yi1jOGI3LThhODQtZDNmMC1kNzNiZDdhOGQ1NjYiDQoJCX0sDQoJCSJTRVJWSUNFX05BTUUiOiB7DQoJCQkiUyI6ICJ0ZXN0OCINCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0NCn0=";
    logMessage = 'not interesting event';
    errMessage = 'Missing EVENT_TYPE';
    debgStub = sinon.stub(logger, 'debug', spy);
    stub = sinon.stub(callbackObj, 'callback', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbResponse =stub.args[0][1].processBatch;
    var cbCheck = (cbResponse.failed_events + cbResponse.processed_events) === event.Records.length;
    var logCheck = debgStub.args[0][0].includes(errMessage);
    debgStub.restore();
    reqStub.restore();
    stub.restore();
    assert.isTrue(logCheck && cbCheck);
  });

  it("should indicate validation error if kinesis record contain invalid EVENT_NAME or EVENT_STATUS", ()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    // kinesis.data contain invalid EVENT_NAME or EVENT_STATUS
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIiINCgkJfSwNCgkJIlNFUlZJQ0VfTkFNRSI6IHsNCgkJCSJTIjogInRlc3Q4Ig0KCQl9LA0KCQkiRVZFTlRfU1RBVFVTIjogew0KCQkJIlMiOiAiIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfQ1JFQVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInN2Y19jcHRfam5rX2F1dGhfcHJkIg0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0sDQoJCSJBQUEiOiB7DQoJCQkiTlVMTCI6IHRydWUNCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0sDQoJIlJldHVybkNvbnN1bWVkQ2FwYWNpdHkiOiAiVE9UQUwiLA0KCSJUYWJsZU5hbWUiOiAiRXZlbnRzX0RldiINCn0=";
    logMessage = "validation error. Either event name or event status is not properly defined.";
    logStub = sinon.stub(logger, 'error', spy);
    stub = sinon.stub(callbackObj, 'callback', spy);
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbCkeck = stub.args[0][0].error === logMessage;
    var logCheck = logStub.args[0][0].includes(logMessage);
    // AWS.restore("SQS");
    logStub.restore();
    stub.restore();
    reqStub.restore();
    assert.isTrue(logCheck && cbCkeck);
  });

  it("should indicate success from 200 response if kinesis data is defined for startingEvent", ()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    stub = sinon.stub(callbackObj, 'callback', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbResponse=stub.args[0][1].processBatch;
    var cbCheck = (cbResponse.failed_events + cbResponse.processed_events) === event.Records.length;
    reqStub.restore();
    stub.restore();
    assert.isTrue(cbCheck);
  });

  it("should indicate error from crud.create when kinesis data is defined for startingEvent", ()=>{
    var errObj={
      statusCode:400,
      body:{
        message:"Error creating service"
      }
    }
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "POST" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        return obj.callback(null, errObj, errObj.body);
      } else {
        return obj.callback(null, tokenDataObj, tokenDataObj.body);
      }
    });
    errMessage = "Error creating service";
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, "error", spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbCheck = stub.args[0][0].error.includes(errObj.body.message);
    var logCheck = logStub.args[0][0].includes(errMessage);
    reqStub.restore();
    stub.restore();
    logStub.restore();
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate error if crud.get fails for kinesis data is defined for failed EVENT_STATUS", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error finding service"}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)) 
      return obj.callback(null, responseObject, responseObject.body);
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIlBVU0hfVEVNUExBVEVfVE9fU0VSVklDRV9SRVBPIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9DUkVBVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAic3ZjX2NwdF9qbmtfYXV0aF9wcmQiDQoJCX0sDQoJCSJFVkVOVF9USU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA1LTA1VDA2OjA2OjM3OjUzMyINCgkJfSwNCgkJIkFBQSI6IHsNCgkJCSJOVUxMIjogdHJ1ZQ0KCQl9LA0KCQkiQkJCIjogew0KCQkJIlMiOiAidmFsIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfRGV2Ig0KfQ=="
    errMessage = 'Error finding service';
    
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    stub.restore();
    logStub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(logCheck && cbCheck);
  });

  it("should indicate error if crud.update fails for the kinesis data with failed EVENT_STATUS",()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error updating service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else if(obj.method === "PUT" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
      return obj.callback(null, responseObject, responseObject.body);
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIlBVU0hfVEVNUExBVEVfVE9fU0VSVklDRV9SRVBPIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9DUkVBVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAic3ZjX2NwdF9qbmtfYXV0aF9wcmQiDQoJCX0sDQoJCSJFVkVOVF9USU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA1LTA1VDA2OjA2OjM3OjUzMyINCgkJfSwNCgkJIkFBQSI6IHsNCgkJCSJOVUxMIjogdHJ1ZQ0KCQl9LA0KCQkiQkJCIjogew0KCQkJIlMiOiAidmFsIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfRGV2Ig0KfQ=="
    stub = sinon.stub(callbackObj, "callback", spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbCheck = stub.args[0][0].error.includes(responseObject.body.message);
    stub.restore();
    reqStub.restore();
    assert.isTrue(cbCheck)
  });

  it("should indicate success if crud.get and crud.update are success for the kinesis data with failed EVENT_STATUS",()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIlBVU0hfVEVNUExBVEVfVE9fU0VSVklDRV9SRVBPIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9DUkVBVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAic3ZjX2NwdF9qbmtfYXV0aF9wcmQiDQoJCX0sDQoJCSJFVkVOVF9USU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA1LTA1VDA2OjA2OjM3OjUzMyINCgkJfSwNCgkJIkFBQSI6IHsNCgkJCSJOVUxMIjogdHJ1ZQ0KCQl9LA0KCQkiQkJCIjogew0KCQkJIlMiOiAidmFsIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfRGV2Ig0KfQ=="
    stub = sinon.stub(callbackObj, "callback", spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var cbResponse = stub.args[0][1].processBatch;
    var cbCheck = (cbResponse.processed_events + cbResponse.failed_events) === event.Records.length;
    stub.restore();
    reqStub.restore();
    assert.isTrue(cbCheck)
  });

  it("should indicate error if crud.get fails for kinesis data with defined and complted endingEvent", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error finding service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
        return obj.callback(null, responseObject, JSON.stringify(responseObject.body));
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkxPQ0tfTUFTVEVSX0JSQU5DSCINCgkJfSwNCgkJIlNFUlZJQ0VfTkFNRSI6IHsNCgkJCSJTIjogInRlc3Q4Ig0KCQl9LA0KCQkiRVZFTlRfU1RBVFVTIjogew0KCQkJIlMiOiAiQ09NUExFVEVEIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfQ1JFQVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInN2Y19jcHRfam5rX2F1dGhfcHJkIg0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0sDQoJCSJBQUEiOiB7DQoJCQkiTlVMTCI6IHRydWUNCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0sDQoJIlJldHVybkNvbnN1bWVkQ2FwYWNpdHkiOiAiVE9UQUwiLA0KCSJUYWJsZU5hbWUiOiAiRXZlbnRzX0RldiINCn0=";
    errMessage = "Error finding service ";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate error if crud.update fails for kinesis data with defined and complted endingEvent", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error updating service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else if(obj.method === "PUT" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
      return obj.callback(null, responseObject, responseObject.body);
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkxPQ0tfTUFTVEVSX0JSQU5DSCINCgkJfSwNCgkJIlNFUlZJQ0VfTkFNRSI6IHsNCgkJCSJTIjogInRlc3Q4Ig0KCQl9LA0KCQkiRVZFTlRfU1RBVFVTIjogew0KCQkJIlMiOiAiQ09NUExFVEVEIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfQ1JFQVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInN2Y19jcHRfam5rX2F1dGhfcHJkIg0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0sDQoJCSJBQUEiOiB7DQoJCQkiTlVMTCI6IHRydWUNCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0sDQoJIlJldHVybkNvbnN1bWVkQ2FwYWNpdHkiOiAiVE9UQUwiLA0KCSJUYWJsZU5hbWUiOiAiRXZlbnRzX0RldiINCn0=";
    errMessage = "unknown error updating service";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate success if crud.get and crud.update are success for for kinesis data with defined and complted endingEvent", ()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkxPQ0tfTUFTVEVSX0JSQU5DSCINCgkJfSwNCgkJIlNFUlZJQ0VfTkFNRSI6IHsNCgkJCSJTIjogInRlc3Q4Ig0KCQl9LA0KCQkiRVZFTlRfU1RBVFVTIjogew0KCQkJIlMiOiAiQ09NUExFVEVEIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfQ1JFQVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInN2Y19jcHRfam5rX2F1dGhfcHJkIg0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0sDQoJCSJBQUEiOiB7DQoJCQkiTlVMTCI6IHRydWUNCgkJfSwNCgkJIkJCQiI6IHsNCgkJCSJTIjogInZhbCINCgkJfQ0KCX0sDQoJIlJldHVybkNvbnN1bWVkQ2FwYWNpdHkiOiAiVE9UQUwiLA0KCSJUYWJsZU5hbWUiOiAiRXZlbnRzX0RldiINCn0=";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    // logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    // var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbResponse = stub.args[0][1].processBatch;
    var cbCheck = (cbResponse.processed_events + cbResponse.failed_events) === event.Records.length;
    // logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck);
  });

  it("should indicate error if crud.get fails for kinesis data with defined and started event of service deletion", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error finding service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
        return obj.callback(null, responseObject, JSON.stringify(responseObject.body));
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkNBTExfREVMRVRFX1dPUktGTE9XIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJTVEFSVEVEIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfREVMRVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInh5eiINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfVGVzdCINCn0=";
    errMessage = "Error finding service ";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate error if crud.update fails for kinesis data with defined and started event of service deletion", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error updating service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else if(obj.method === "PUT" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
      return obj.callback(null, responseObject, responseObject.body);
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkNBTExfREVMRVRFX1dPUktGTE9XIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJTVEFSVEVEIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfREVMRVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInh5eiINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfVGVzdCINCn0=";
    errMessage = "unknown error updating service";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate success if crud.get and crud.update are success for for kinesis data with defined and started event of service deletion", ()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkNBTExfREVMRVRFX1dPUktGTE9XIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJTVEFSVEVEIg0KCQl9LA0KCQkiRVZFTlRfVFlQRSI6IHsNCgkJCSJTIjogIlNFUlZJQ0VfREVMRVRJT04iDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInh5eiINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfVGVzdCINCn0=";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    // logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    // var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbResponse = stub.args[0][1].processBatch;
    var cbCheck = (cbResponse.processed_events + cbResponse.failed_events) === event.Records.length;
    // logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck);
  });

  it("should indicate error if crud.get fails for kinesis data with defined and failed event status of service deletion", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error finding service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
        return obj.callback(null, responseObject, JSON.stringify(responseObject.body));
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkJBQ0tVUF9QUk9KRUNUIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9ERUxFVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAieHl6Ig0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19UZXN0Ig0KfQ==";
    errMessage = "Error finding service ";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate error if crud.update fails for kinesis data with defined and failed event status of service deletion", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error updating service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else if(obj.method === "PUT" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
      return obj.callback(null, responseObject, responseObject.body);
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkJBQ0tVUF9QUk9KRUNUIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9ERUxFVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAieHl6Ig0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19UZXN0Ig0KfQ==";
    errMessage = "Error updating service";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate success if crud.get and crud.update are success for for kinesis data with defined and failed event status of service deletion", ()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkJBQ0tVUF9QUk9KRUNUIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJGQUlMRUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9ERUxFVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAieHl6Ig0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19UZXN0Ig0KfQ==";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    // logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    // var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbResponse = stub.args[0][1].processBatch;
    var cbCheck = (cbResponse.processed_events + cbResponse.failed_events) === event.Records.length;
    // logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck);
  });

  it("should indicate error if crud.get fails for kinesis data with defined and completed event of service deletion", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error finding service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
        return obj.callback(null, responseObject, JSON.stringify(responseObject.body));
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkRFTEVURV9QUk9KRUNUIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJDT01QTEVURUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9ERUxFVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAieHl6Ig0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19UZXN0Ig0KfQ==";
    errMessage = "Error finding service ";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate error if crud.update fails for kinesis data with defined and completed event of service deletion", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error updating service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else if(obj.method === "PUT" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
      return obj.callback(null, responseObject, responseObject.body);
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkRFTEVURV9QUk9KRUNUIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJDT01QTEVURUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9ERUxFVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAieHl6Ig0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19UZXN0Ig0KfQ==";
    errMessage = "unknown error updating service";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate success if crud.get and crud.update are success for for kinesis data with defined and completed event of service deletion", ()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkRFTEVURV9QUk9KRUNUIg0KCQl9LA0KCQkiU0VSVklDRV9OQU1FIjogew0KCQkJIlMiOiAidGVzdDgiDQoJCX0sDQoJCSJFVkVOVF9TVEFUVVMiOiB7DQoJCQkiUyI6ICJDT01QTEVURUQiDQoJCX0sDQoJCSJFVkVOVF9UWVBFIjogew0KCQkJIlMiOiAiU0VSVklDRV9ERUxFVElPTiINCgkJfSwNCgkJIlVTRVJOQU1FIjogew0KCQkJIlMiOiAieHl6Ig0KCQl9LA0KCQkiRVZFTlRfVElNRVNUQU1QIjogew0KCQkJIlMiOiAiMjAxNy0wNS0wNVQwNjowNjozNzo1MzMiDQoJCX0NCgl9LA0KCSJSZXR1cm5Db25zdW1lZENhcGFjaXR5IjogIlRPVEFMIiwNCgkiVGFibGVOYW1lIjogIkV2ZW50c19UZXN0Ig0KfQ==";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    // logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    // var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbResponse = stub.args[0][1].processBatch;
    var cbCheck = (cbResponse.processed_events + cbResponse.failed_events) === event.Records.length;
    // logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck);
  });

  it("should indicate error if crud.get fails for kinesis data with defined and completed event of service deployment", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error finding service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
        return obj.callback(null, responseObject, JSON.stringify(responseObject.body));
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkRFUExPWV9UT19BV1MiDQoJCX0sDQoJCSJTRVJWSUNFX05BTUUiOiB7DQoJCQkiUyI6ICJ0ZXN0OCINCgkJfSwNCgkJIkVWRU5UX1NUQVRVUyI6IHsNCgkJCSJTIjogIkNPTVBMRVRFRCINCgkJfSwNCgkJIkVWRU5UX1RZUEUiOiB7DQoJCQkiUyI6ICJTRVJWSUNFX0RFUExPWU1FTlQiDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInh5eiINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfVGVzdCINCn0=";
    errMessage = "Error finding service ";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate error if crud.update fails for kinesis data with defined and completed event of service deployment", ()=>{
    var responseObject = {
      statusCode : 400,
      body:{message : "Error updating service "}
    };
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else if(obj.method === "PUT" && obj.uri.includes(configData.SERVICE_API_RESOURCE))
      return obj.callback(null, responseObject, responseObject.body);
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkRFUExPWV9UT19BV1MiDQoJCX0sDQoJCSJTRVJWSUNFX05BTUUiOiB7DQoJCQkiUyI6ICJ0ZXN0OCINCgkJfSwNCgkJIkVWRU5UX1NUQVRVUyI6IHsNCgkJCSJTIjogIkNPTVBMRVRFRCINCgkJfSwNCgkJIkVWRU5UX1RZUEUiOiB7DQoJCQkiUyI6ICJTRVJWSUNFX0RFUExPWU1FTlQiDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInh5eiINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfVGVzdCINCn0=";
    errMessage = "unknown error updating service";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbCheck = stub.args[0][0].error.includes(errMessage)
    logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck && logCheck);
  });

  it("should indicate success if crud.get and crud.update are success for for kinesis data with defined and completed event of service deployment", ()=>{
    reqStub = sinon.stub(request, "Request", (obj)=>{
      if(obj.method === "GET" && obj.uri.includes(configData.SERVICE_API_RESOURCE)){
        var item = {};
        tokenDataObj.body.data = [item];
        return obj.callback(null, tokenDataObj, JSON.stringify(tokenDataObj.body));
      }
      else return obj.callback(null, tokenDataObj, tokenDataObj.body);
    });
    event.Records[0].kinesis.data = "ew0KCSJJdGVtIjogew0KCQkiRVZFTlRfSUQiOiB7DQoJCQkiUyI6ICI0NWZlOGM4Mi1mZjFkLWIzMWQtMmFhNS1hMjJkMDkxMWI3ZWMiDQoJCX0sDQoJCSJUSU1FU1RBTVAiOiB7DQoJCQkiUyI6ICIyMDE3LTA2LTI2VDE3OjU0OjI2OjA4NiINCgkJfSwNCgkJIlNFUlZJQ0VfQ09OVEVYVCI6IHsNCgkJCSJTIjogIntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJydW50aW1lXCI6XCJub2RlanNcIixcImFkbWluX2dyb3VwXCI6XCJuYW1lPWQmbmFtZT1iJm5hbWU9YSZuYW1lPWImbmFtZT11JlwifSINCgkJfSwNCgkJIkVWRU5UX0hBTkRMRVIiOiB7DQoJCQkiUyI6ICJKRU5LSU5TIg0KCQl9LA0KCQkiRVZFTlRfTkFNRSI6IHsNCgkJCSJTIjogIkRFUExPWV9UT19BV1MiDQoJCX0sDQoJCSJTRVJWSUNFX05BTUUiOiB7DQoJCQkiUyI6ICJ0ZXN0OCINCgkJfSwNCgkJIkVWRU5UX1NUQVRVUyI6IHsNCgkJCSJTIjogIkNPTVBMRVRFRCINCgkJfSwNCgkJIkVWRU5UX1RZUEUiOiB7DQoJCQkiUyI6ICJTRVJWSUNFX0RFUExPWU1FTlQiDQoJCX0sDQoJCSJVU0VSTkFNRSI6IHsNCgkJCSJTIjogInh5eiINCgkJfSwNCgkJIkVWRU5UX1RJTUVTVEFNUCI6IHsNCgkJCSJTIjogIjIwMTctMDUtMDVUMDY6MDY6Mzc6NTMzIg0KCQl9DQoJfSwNCgkiUmV0dXJuQ29uc3VtZWRDYXBhY2l0eSI6ICJUT1RBTCIsDQoJIlRhYmxlTmFtZSI6ICJFdmVudHNfVGVzdCINCn0=";
    // AWS.mock("SQS","sendMessageBatch", (params, cb)=>{
    //   return cb(null, callbackObj)
    // });
    stub = sinon.stub(callbackObj, 'callback', spy);
    // logStub = sinon.stub(logger, 'error', spy);
    var callFunction = index.handler(event, context, callbackObj.callback);
    // var logCheck = logStub.args[0][0].includes(responseObject.body.message);
    var cbResponse = stub.args[0][1].processBatch;
    var cbCheck = (cbResponse.processed_events + cbResponse.failed_events) === event.Records.length;
    // logStub.restore();
    stub.restore();
    reqStub.restore();
    // AWS.restore("SQS");
    assert.isTrue(cbCheck);
  });

});
