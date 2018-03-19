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

const chai = require('chai');
const assert = require('chai').assert;
const awsContext = require('aws-lambda-mock-context');
const AWS = require('aws-sdk-mock');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = require('chai').expect;
var should = require('chai').should;
const sinon = require('sinon')
require('sinon-as-promised');
const request = require('request');
const rp = require('request-promise-native');

const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
const crud = require('../components/crud')();


var spy, event, context, callback, errType, errMessage, logMessage, tokenDataObj, cllabakObj, stub, logStub, reqStub, configData;



describe('jazz_services-handler', function() {

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

	it('should mock up a  function getToken', function() {
 		spy = sinon.spy(index.getToken);
		var callFunction = index.handler(event, context, callback);		
		expect(spy.calledWith(configData));
	});
	
	it('should mock up a  function validateAuthToken', function() {
 		spy = sinon.spy(index.validateAuthToken);
		var callFunction = index.handler(event, context, callback);
		expect(spy.calledWith(configData));
	});
	
	it('should invoke function processRecords', function() {
 		spy = sinon.spy(index.processRecords);	
		var callFunction = index.handler(event, context, callback);
		expect(spy.calledWith(configData));
	});
	
	it('should mock up a  function handleError', function() {
 		spy = sinon.spy(index.handleError);	
		var callFunction = index.handler(event, context, callback);
		expect(spy.calledWith(configData));
	});
	
	it('should invoke function checkInterest', function() {
 		spy = sinon.spy(index.checkInterest);
		var callFunction = index.handler(event, context, callback);
		expect(spy.calledWith(configData));
	});
	
	it('should mock up a  function processEvent', function() {
 		spy = sinon.spy(index.processEvent);	
		var callFunction = index.handler(event, context, callback);		
		expect(spy.calledWith(configData));
	});
	
	it('should invoke function getUpdateServiceStatus', function() {
 		spy = sinon.spy(index.checkInterest);	
		var callFunction = index.handler(event, context, callback);		
		expect(spy.calledWith(configData));
	});

	it('should mock up a  function getServiceContext', function() {
 		spy = sinon.spy(index.getServiceContext);
		var callFunction = index.handler(event, context, callback);
		expect(spy.calledWith(configData));
	});

	it('should mock up a  function handleFailedEvents', function() {
 		spy = sinon.spy(index.handleFailedEvents);
		var callFunction = index.handler(event, context, callback);
		expect(spy.calledWith(configData));
	});

	it('should mock up a  function handleProcessedEvents', function() {
 		spy = sinon.spy(index.handleProcessedEvents);
		var callFunction = index.handler(event, context, callback);
		expect(spy.calledWith(configData));
	});
	
	it("should not attempt to make an http request", function(){
		reqStub = sinon.stub(request, "Request", spy);
		var callFunction = index.handler(event, context, callback);
		reqStub.restore();
		assert.isFalse(spy.called);
	});
		
	it('should mock up a request-promise POST call resolve', function() {
		var rpStub = sinon.stub(rp, 'post'); 	
		rpStub.returns(Promise.resolve('a success'));
		rpStub.restore();
	});
	
	it('should mock up a request-promise POST call rejected with a proper message', function() {
		var rpStub = sinon.stub(rp, 'post'); 
		var callFunction = index.handler(event, context, callback);		
		var message = 'Rubber baby buggy bumpers';
		var p = Promise.reject(message);
		rpStub.restore();
		return expect(p).to.be.rejectedWith(message);		
	});
	
	it('should mock up a request-promise POST call rejected with a specific error type', function() {
		var rpStub = sinon.stub(rp, 'post'); 
		var callFunction = index.handler(event, context, callback);		
		var p = Promise.reject(new TypeError('unhandled error'));
		rpStub.restore();
		return expect(p).to.be.rejectedWith(TypeError);		
	});
	
	it('should mock up a request-promise GET call resolve', function() {
		var rpStub = sinon.stub(rp, 'get'); 
		var callFunction = index.handler(event, context, callback);
		rpStub.returns(Promise.resolve('a success'));
		rpStub.restore();
	});
	
	it('should mock up a request-promise GET call rejected with a proper message', function() {
		var rpStub = sinon.stub(rp, 'get'); 
		var callFunction = index.handler(event, context, callback);
		var message = 'Rubber baby buggy bumpers';
		var p = Promise.reject(message);		
		rpStub.restore();
		return expect(p).to.be.rejectedWith(message);
	});
	
	it('should mock up a request-promise GET call rejected with a specific error type', function() {
		var rpStub = sinon.stub(rp, 'get'); 
		var callFunction = index.handler(event, context, callback);		
		var p = Promise.reject(new TypeError('unhandled error'));		
		rpStub.restore();
		return expect(p).to.be.rejectedWith(TypeError);
	});
	
	it('should indicate success for success response code of gettoken requset', function() {
		var rpStub = sinon.stub(rp, 'post'); 		
		var callFunction = index.handler(event, context, callback);
		var p = Promise.resolve(tokenDataObj);		
		rpStub.restore();
		return expect(p.then(function(res) {return res.statusCode; })).to.become(200);
	});
	
	it('should indicate success for success response of gettoken requset', function() {
		var rpStub = sinon.stub(rp, 'post'); 		
		var callFunction = index.handler(event, context, callback);
		var p = Promise.resolve(tokenDataObj);		
		rpStub.restore();
		return expect(p.then(function(res) {return res.body.data.token; })).to.become(tokenDataObj.body.data.token);
	});
	
	it("should indicate error for failed response of  gettoken requset",()=>{
		tokenDataObj.statusCode = 400;
		tokenDataObj.body.message = "Error";
		errMessage = "Could not get authentication token for updating Service catalog."
		var rpStub = sinon.stub(rp, 'post'); 		
		var callFunction = index.handler(event, context, callback);
		var p = Promise.reject(new TypeError(errMessage));		
		rpStub.restore();
		return expect(p).to.be.rejectedWith(TypeError);
	});	


});  

