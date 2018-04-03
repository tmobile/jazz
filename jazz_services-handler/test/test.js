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
const expect = require('chai').expect;
const should = require('chai').should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const sinon = require('sinon')
const sinonTest = require('sinon-test')(sinon, {useFakeTimers: false});
require('sinon-as-promised');
const request = require('request');
const rp = require('request-promise-native');
const AWS = require('aws-sdk-mock');
const awsContext = require('aws-lambda-mock-context');

const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
const crud = require('../components/crud')();


var  event, context,  configData;


describe('jazz_services-handler', function () {

	beforeEach(function () {
		event = {
			"stage": "test",
			"Records": [
				{
					"kinesis": {
						"kinesisSchemaVersion": "1.0",
						"partitionKey": "DEPLOY_TO_AWS",
						"sequenceNumber": "abc123",
						"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJkN2UyMmQyMC01OWUyLTQzNTMtYTYxZS1lYjRkODk2ZWJiZDAifSwiVElNRVNUQU1QIjp7IlMiOiIyMDE4LTAzLTE2VDE2OjUyOjU0OjQ1MyJ9LCJSRVFVRVNUX0lEIjp7IlMiOiJzYWRqYXNnZDEyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiRVZFTlRfTkFNRSI6eyJTIjoiTU9ESUZZX1RFTVBMQVRFIn0sIlNFUlZJQ0VfSUQiOnsiUyI6ImJhZmIyMjlmLThkYzMtNDU1MC1jZjYwLTZlNTFjNWRiMDQ3MyJ9LCJTRVJWSUNFX05BTUUiOnsiUyI6InRlc3QtbGFtYmRhLXNpbmktNiJ9LCJFVkVOVF9TVEFUVVMiOnsiUyI6IkNPTVBMRVRFRCJ9LCJFVkVOVF9UWVBFIjp7IlMiOiJTRVJWSUNFX0RFUExPWU1FTlQifSwiVVNFUk5BTUUiOnsiUyI6InNlcnZlcmxlc3NAdC1tb2JpbGUuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxOC0wMi0xNlQwNDo0MTo0Mzo5NDUifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcImxhbWJkYVwiLFwic2VydmljZV9pZFwiOlwiYmFmYjIyOWYtOGRjMy00NTUwLWNmNjAtNmU1MWM1ZGIwNDczXCIsXCJzZXJ2aWNlX25hbWVcIjpcInRlc3QtbGFtYmRhLXNpbmktNlwiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJ0ZXNpbmlcIixcImlhbV9yb2xlXCI6XCJhcm46YXdzOmlhbTo6MTkyMDA2MTQ1ODEyOnJvbGUvamF6ejIwMTgwMjI3X2xhbWJkYTJfYmFzaWNfZXhlY3V0aW9uXzFcIixcImVudmlyb25tZW50XCI6XCJOQVwiLFwicmVnaW9uXCI6XCJ1cy1lYXN0LTFcIixcIm1lc3NhZ2VcIjpcInNlcnZpY2UgIGNyZWF0aW9uIHN0YXJ0c1wiLFwibWV0YWRhdGFcIjp7XCJzdWJuZXQtaWRcIjpcInNhc2Zkc1wifSxcImNyZWF0ZWRfYnlcIjpcInNlcnZlcmxlc3NAdC1tb2JpbGUuY29tXCJ9In19fQ==",
						"approximateArrivalTimestamp": 1521219174.605
					},
					"eventSource": "abc",
					"eventVersion": "1.0",
					"eventID": "abc123",
					"eventName": "abc",
					"invokeIdentityArn": "abc",
					"awsRegion": "abc",
					"eventSourceARN": "abc"
				}
			]
		};
		context = awsContext();
		context.functionName = context.functionName + "-test"
		tokenResponseObj = {
			statusCode: 200,
			body: {
				data: {
					token: "abc"
				}
			}
		};
		configData = config(context);
	});

	

	it('getToken should give valid response ', function () {
		var authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		var getTokenPromise = index.getToken(configData);
		expect(rp(getTokenPromise).then((res) => {
			return res.statusCode;
		})).to.become(200);
		authStub.restore();
	});

	it('getToken should give invalid response for invalid status code', function () {
		tokenResponseObj.statusCode = 400;
		var authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		var getTokenPromise = index.getToken(configData);
		expect(rp(getTokenPromise).then((res) => {
			return res.statusCode;
		})).to.become(400);
		authStub.restore();
	});

	it('validateAuthToken should return success promise for response data with status code 200', function () {
		var validate = index.validateAuthToken(tokenResponseObj);
		expect(validate.then(function (res) {
			return res;
		})).to.become(tokenResponseObj.body.data.token);
	});

	it('validateAuthToken should reject for response data with status code 400', function () {
		tokenResponseObj.statusCode = 400;
		var message = "User is not authorized to access this service";
		var validate = index.validateAuthToken(tokenResponseObj);
		expect(validate.then(function (res) {
			return res;
		})).to.be.rejectedWith(message);
	});

	it('validateAuthToken should reject for response data with out response.body', function () {
		tokenResponseObj.body = {};
		var message = "User is not authorized to access this service";
		var validate = index.validateAuthToken(tokenResponseObj);
		expect(validate.then(function (res) {
			return res;
		})).to.be.rejectedWith(message);
	});

	it('validateAuthToken should reject for response  with out response.body.data', function () {
		tokenResponseObj.body.data = null;
		var message = "User is not authorized to access this service";
		var validate = index.validateAuthToken(tokenResponseObj);
		expect(validate.then(function (res) {
			return res;
		})).to.be.rejectedWith(message);
	});

	it('handleError should return error response json for valid input', function () {
		var errorJson = { "failure_code": 400, "failure_message": "Unauthorized" };
		var handleError = index.handleError(400, "Unauthorized");		
		assert(handleError,errorJson);
	});

	it('handleProcessedEvents should push valid events', function () {
		var sequenceNumber = event.Records[0].kinesis.sequenceNumber;
		var encodedPayload = event.Records[0].kinesis.data;
		var handleProcessedEvents = index.handleProcessedEvents(encodedPayload, sequenceNumber);
		expect(index.getEventProcessStatus()).to.have.property('processed_events');
	});

	it('handleFailedEvents should push valid events', function () {
		var sequenceNumber = event.Records[0].kinesis.sequenceNumber;
		var encodedPayload = event.Records[0].kinesis.data;
		var handleFailedEvents = index.handleFailedEvents(encodedPayload, sequenceNumber, "101", "failure");
		expect(index.getEventProcessStatus()).to.have.property('failed_events');
	});

	it('getEventProcessStatus should return failed/processed records length', function () {
		expect(index.getEventProcessStatus()).to.have.property('processed_events');
		expect(index.getEventProcessStatus()).to.have.property('failed_events');
		expect(index.getEventProcessStatus()).to.not.have.property('some_key');
	});

	it('checkInterest should resolve for valid input', function () {
		var sequenceNumber = event.Records[0].kinesis.sequenceNumber;
		var encodedPayload = event.Records[0].kinesis.data;
		var checkInterest = index.checkInterest(encodedPayload, sequenceNumber);
		expect(checkInterest.then(function (res) {
			return res.interested_event;
		})).to.become(true);
	});

	it('checkInterest should resolve with valid response for valid input', function () {
		var sequenceNumber = event.Records[0].kinesis.sequenceNumber;
		var encodedPayload = event.Records[0].kinesis.data;
		var checkInterest = index.checkInterest(encodedPayload, sequenceNumber);
		expect(checkInterest.then((res) => {
			return res;
		})).to.eventually.have.property('payload');
	});

	it('processEvent should reject error for empty payload', function () {
		var payload = {};
		var message = "Cannot read property \'S\' of undefined";
		var processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		expect(processEvent.then(function (res) {
			return res;
		})).to.be.rejectedWith(message);
	});

	it('processEvent should return response for invalid event name event type combination', function () {
		var payload = { "EVENT_ID": { "S": "abc123" },  "REQUEST_ID": { "S": "sadjasgd12" },  "EVENT_NAME": { "S": "MODIFY_TEMPLATE" }, "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"iam_role\":\"abc\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"abc\"},\"created_by\":\"abc@abc.com\"}" } };
		var processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		var message = "Not an interesting event to process";
		expect(processEvent.then(function (res) {
			return res.message;
		})).to.be.become(message);
	});

	it('processEvent should indicate error if kinesis data does not have proper EVENT_NMAE', function () {
		var payload = { "EVENT_ID": { "S": "abc123" }, "TIMESTAMP": { "S": "abc123" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME":  "MODIFY_TEMPLATE" , "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"sasfds\"},\"created_by\":\"abc@abc.com\"}" } };
		var processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		expect(processEvent.then(function (res) {
			return res.message;
		})).to.be.rejected;
	});

	it('processEvent should indicate error if kinesis data does not have proper EVENT_STATUS', function () {
		var payload = { "EVENT_ID": { "S": "abc123" }, "TIMESTAMP": { "S": "abc123" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME":  { "S": "MODIFY_TEMPLATE" } , "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": "COMPLETED", "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"sasfds\"},\"created_by\":\"abc@abc.com\"}" } };
		var processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		expect(processEvent.then(function (res) {
			return res.message;
		})).to.be.rejected;
	});

	it('processEvent should resolve with updating', function () {
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};
		var reqStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});
		var payload = { "EVENT_ID": { "S": "abc123" }, "TIMESTAMP": { "S": "abc123" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "DEPLOY_TO_AWS" }, "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"sasfds\"},\"created_by\":\"abc@abc.com\"}" } };
		var processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		var message = "updated service test-lambda in service catalog.";
		expect(processEvent.then(function (res) {
			return res.message;
		})).to.be.become(message);
		reqStub.restore();
	});

	it('processEvent should indicate error if crud.update fails for kinesis data with defined and completed endingEvent', function () {
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 400,
			body: {message : "Error updating service "}
		};
		var reqStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});
		var payload = {"EVENT_ID":{"S":"45fe8c82-ff1d-b31d-2aa5-a22d0911b7ec"},"SERVICE_ID": { "S": "abc123" }, "TIMESTAMP":{"S":"2017-06-26T17:54:26:086"},"SERVICE_CONTEXT":{"S":"{\"service_type\":\"api\",\"admin_group\":\"name=d&name=b&name=a&name=b&name=u&\"}"},"EVENT_HANDLER":{"S":"JENKINS"},"EVENT_NAME":{"S":"LOCK_MASTER_BRANCH"},"SERVICE_NAME":{"S":"test8"},"EVENT_STATUS":{"S":"COMPLETED"},"EVENT_TYPE":{"S":"SERVICE_CREATION"},"USERNAME":{"S":"svc_cpt_jnk_auth_prd"},"EVENT_TIMESTAMP":{"S":"2017-05-05T06:06:37:533"},"AAA":{"NULL":true},"BBB":{"S":"val"}};
		var processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		expect(processEvent.then(function (res) {
			return res;
		})).to.be.rejected;

		reqStub.restore();
	});

	it('processRecords should return response for invalid event name event type combination',sinonTest(  function () {
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};
		var reqStub = this.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		var processRecords = index.processRecords(event, configData, tokenResponseObj.body.data.token);
		var message = "Not an interesting event to process";
		expect(processRecords.then(function (res) {
			return res[0].message;
		})).to.be.become(message);
	}));

	it('processRecords should resolve with updating',sinonTest( async function () {
		event.Records =  [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "CALL_DELETE_WORKFLOW",
					"sequenceNumber": "abc1234",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJhMjFhNmIxNy02MDM1LTRiY2QtOTBlYi0xNGM3Nzg4NDMzYTUtMDA3In0sIlRJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xM1QwMToxODozNTo1NTYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcIm5vZGVqc1wiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJqYXp6XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmE6aWFtOjozMDI4OTA5MDEzNDA6cm9sZS9qYXp6X3BsYXRmb3JtX3NlcnZpY2VzXCIsXCJlbnZpcm9ubWVudFwiOlwiTkFcIixcInJlZ2lvblwiOlwidXMtd2VzdC0yXCIsXCJzZXJ2aWNlX2lkXCI6XCI1ZTU4ZDEwMS0yZTYyLWYzOWMtNjFjYS04M2QxZTRiNWU4MDlcIn0ifSwiVVNFUk5BTUUiOnsiUyI6InNpbmkud2lsc29uQHVzdC1nbG9iYWwuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xOFQxMzoxODozMjo2MDAifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNBTExfREVMRVRFX1dPUktGTE9XIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVMRVRJT04ifSwiU0VSVklDRV9OQU1FIjp7IlMiOiJlbWFpbC1ldmVudC1oYW5kbGVyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiU0VSVklDRV9JRCI6eyJTIjoiNWU1OGQxMDEtMmU2Mi1mMzljLTYxY2EtODNkMWU0YjVlODA5In19fQ==",
					"approximateArrivalTimestamp": 1521632408.682
				},
				"eventSource": "abc",
				"eventVersion": "1.0",
				"eventID": "abc",
				"eventName": "abc",
				"invokeIdentityArn": "abc",
				"awsRegion": "abc",
				"eventSourceARN": "abc"
			}
		];
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};
		reqStub = this.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		var processRecords = index.processRecords(event, configData, tokenResponseObj.body.data.token);
		var message = "updated service email-event-handler in service catalog.";
		expect(processRecords.then(function (res) {
			return res[0].message;
		})).to.be.become(message);
	}));

	it('processRecords should indicate error if crud.update fails for kinesis data with defined and completed endingEvent',sinonTest( async function () {
		event.Records =  [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "CALL_DELETE_WORKFLOW",
					"sequenceNumber": "abc1234",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJhMjFhNmIxNy02MDM1LTRiY2QtOTBlYi0xNGM3Nzg4NDMzYTUtMDA3In0sIlRJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xM1QwMToxODozNTo1NTYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcIm5vZGVqc1wiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJqYXp6XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmE6aWFtOjozMDI4OTA5MDEzNDA6cm9sZS9qYXp6X3BsYXRmb3JtX3NlcnZpY2VzXCIsXCJlbnZpcm9ubWVudFwiOlwiTkFcIixcInJlZ2lvblwiOlwidXMtd2VzdC0yXCIsXCJzZXJ2aWNlX2lkXCI6XCI1ZTU4ZDEwMS0yZTYyLWYzOWMtNjFjYS04M2QxZTRiNWU4MDlcIn0ifSwiVVNFUk5BTUUiOnsiUyI6InNpbmkud2lsc29uQHVzdC1nbG9iYWwuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xOFQxMzoxODozMjo2MDAifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNBTExfREVMRVRFX1dPUktGTE9XIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVMRVRJT04ifSwiU0VSVklDRV9OQU1FIjp7IlMiOiJlbWFpbC1ldmVudC1oYW5kbGVyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiU0VSVklDRV9JRCI6eyJTIjoiNWU1OGQxMDEtMmU2Mi1mMzljLTYxY2EtODNkMWU0YjVlODA5In19fQ==",
					"approximateArrivalTimestamp": 1521632408.682
				},
				"eventSource": "abc",
				"eventVersion": "1.0",
				"eventID": "abc",
				"eventName": "abc",
				"invokeIdentityArn": "abc",
				"awsRegion": "abc",
				"eventSourceARN": "abc"
			}
		];
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 400,
			body: {message : "Error updating service "}
		};
		reqStub = this.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		var processRecords = index.processRecords(event, configData, tokenResponseObj.body.data.token);
		var message = "updated service email-event-handler in service catalog.";
		expect(processRecords.then(function (res) {
			return res[0].message;
		})).to.be.rejected;
	}));
	
	it('getUpdateServiceStatus should return status for payload with interested events', function () {
		var payload = { "EVENT_ID": { "S": "abc123" }, "TIMESTAMP": { "S": "abc123" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "DEPLOY_TO_AWS" }, "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"sasfds\"},\"created_by\":\"abc@abc.com\"}" } };

		var statusResponse = { "status": "active", "interested_event": true };
		var getUpdateServiceStatus = index.getUpdateServiceStatus(payload, configData);
        assert(getUpdateServiceStatus, statusResponse);
	});

	it('getUpdateServiceStatus should return status false for payload with not interested events', function () {
		var payload = { "EVENT_ID": { "S": "abc123" }, "TIMESTAMP": { "S": "abc123" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "MODIFY_TEMPLATE" }, "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"sasfds\"},\"created_by\":\"abc@abc.com\"}" } };

		var statusResponse = { "status": "active", "interested_event": true };;
		var getUpdateServiceStatus = index.getUpdateServiceStatus(payload, configData);
        assert(getUpdateServiceStatus, statusResponse);
	});

	it('getServiceContext should return service context json for valid payload', function () {
		var payload = { "EVENT_ID": { "S": "abc123" }, "TIMESTAMP": { "S": "abc123" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "MODIFY_TEMPLATE" }, "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"sasfds\"},\"created_by\":\"abc@abc.com\"}" } };

		var svcContext = JSON.parse(payload.SERVICE_CONTEXT.S);
		var serviceContext = index.getServiceContext(svcContext);
		var resp = { "domain": "test",  "region": "abc", "type": "lambda", "metadata": { "name": "sasfds" } };
		assert(serviceContext, resp);
	});	

	it('processRecord should return response for invalid event name event type combination',sinonTest(  function () {
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};
		var reqStub = this.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		var processRecord = index.processRecord(event.Records[0], configData, tokenResponseObj.body.data.token);
		var message = "Not an interesting event to process";
		expect(processRecord.then(function (res) {
			return res.message;
		})).to.be.become(message);
	}));

	it('processRecord should resolve with updating',sinonTest( async function () {
		event.Records =  [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "CALL_DELETE_WORKFLOW",
					"sequenceNumber": "abc1234",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJhMjFhNmIxNy02MDM1LTRiY2QtOTBlYi0xNGM3Nzg4NDMzYTUtMDA3In0sIlRJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xM1QwMToxODozNTo1NTYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcIm5vZGVqc1wiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJqYXp6XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmE6aWFtOjozMDI4OTA5MDEzNDA6cm9sZS9qYXp6X3BsYXRmb3JtX3NlcnZpY2VzXCIsXCJlbnZpcm9ubWVudFwiOlwiTkFcIixcInJlZ2lvblwiOlwidXMtd2VzdC0yXCIsXCJzZXJ2aWNlX2lkXCI6XCI1ZTU4ZDEwMS0yZTYyLWYzOWMtNjFjYS04M2QxZTRiNWU4MDlcIn0ifSwiVVNFUk5BTUUiOnsiUyI6InNpbmkud2lsc29uQHVzdC1nbG9iYWwuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xOFQxMzoxODozMjo2MDAifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNBTExfREVMRVRFX1dPUktGTE9XIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVMRVRJT04ifSwiU0VSVklDRV9OQU1FIjp7IlMiOiJlbWFpbC1ldmVudC1oYW5kbGVyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiU0VSVklDRV9JRCI6eyJTIjoiNWU1OGQxMDEtMmU2Mi1mMzljLTYxY2EtODNkMWU0YjVlODA5In19fQ==",
					"approximateArrivalTimestamp": 1521632408.682
				},
				"eventSource": "abc",
				"eventVersion": "1.0",
				"eventID": "abc",
				"eventName": "abc",
				"invokeIdentityArn": "abc",
				"awsRegion": "abc",
				"eventSourceARN": "abc"
			}
		];
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};
		reqStub = this.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		var processRecord = index.processRecord(event.Records[0], configData, tokenResponseObj.body.data.token);
		var message = "updated service email-event-handler in service catalog.";
		expect(processRecord.then(function (res) {
			return res.message;
		})).to.be.become(message);
	}));

	it('processRecord should indicate error if crud.update fails for kinesis data with defined and completed endingEvent',sinonTest( async function () {
		event.Records =  [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "CALL_DELETE_WORKFLOW",
					"sequenceNumber": "abc1234",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJhMjFhNmIxNy02MDM1LTRiY2QtOTBlYi0xNGM3Nzg4NDMzYTUtMDA3In0sIlRJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xM1QwMToxODozNTo1NTYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcIm5vZGVqc1wiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJqYXp6XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmE6aWFtOjozMDI4OTA5MDEzNDA6cm9sZS9qYXp6X3BsYXRmb3JtX3NlcnZpY2VzXCIsXCJlbnZpcm9ubWVudFwiOlwiTkFcIixcInJlZ2lvblwiOlwidXMtd2VzdC0yXCIsXCJzZXJ2aWNlX2lkXCI6XCI1ZTU4ZDEwMS0yZTYyLWYzOWMtNjFjYS04M2QxZTRiNWU4MDlcIn0ifSwiVVNFUk5BTUUiOnsiUyI6InNpbmkud2lsc29uQHVzdC1nbG9iYWwuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xOFQxMzoxODozMjo2MDAifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNBTExfREVMRVRFX1dPUktGTE9XIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVMRVRJT04ifSwiU0VSVklDRV9OQU1FIjp7IlMiOiJlbWFpbC1ldmVudC1oYW5kbGVyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiU0VSVklDRV9JRCI6eyJTIjoiNWU1OGQxMDEtMmU2Mi1mMzljLTYxY2EtODNkMWU0YjVlODA5In19fQ==",
					"approximateArrivalTimestamp": 1521632408.682
				},
				"eventSource": "abc",
				"eventVersion": "1.0",
				"eventID": "abc",
				"eventName": "abc",
				"invokeIdentityArn": "abc",
				"awsRegion": "abc",
				"eventSourceARN": "abc"
			}
		];
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 400,
			body: {message : "Error updating service "}
		};
		reqStub = this.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		var processRecord = index.processRecord(event.Records[0], configData, tokenResponseObj.body.data.token);
		var message = "updated service email-event-handler in service catalog.";
		expect(processRecord.then(function (res) {
			return res.message;
		})).to.be.rejected;
	}));

	it('index should fail for invalid authentication', function () {
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 400,
			body: {"message" : "unautho"	}
		};

		var authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		var reqStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		index.handler(event, context, (err, res) => {
			if (err) {
				return err;
			} else {				
				res.should.have.property('processed_events');
				return res;
			}
		});

		authStub.restore();
		reqStub.restore();
	});

	it('index should resolve for not interested events', function () {
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		tokenResponseObj.statusCode = 400;

		var authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		var reqStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});
		var message = 'User is not authorized to access this service';
		index.handler(event, context, (err, res) => {
			if (err) {
				return err;
			} else {				
				res.should.have.property('failed_events');
				return res;
			}
		});

		authStub.restore();
		reqStub.restore();
	});

	it('index should resolve with updating', function () {
		event.Records =  [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "CALL_DELETE_WORKFLOW",
					"sequenceNumber": "abc1234",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJhMjFhNmIxNy02MDM1LTRiY2QtOTBlYi0xNGM3Nzg4NDMzYTUtMDA3In0sIlRJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xM1QwMToxODozNTo1NTYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcIm5vZGVqc1wiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJqYXp6XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmE6aWFtOjozMDI4OTA5MDEzNDA6cm9sZS9qYXp6X3BsYXRmb3JtX3NlcnZpY2VzXCIsXCJlbnZpcm9ubWVudFwiOlwiTkFcIixcInJlZ2lvblwiOlwidXMtd2VzdC0yXCIsXCJzZXJ2aWNlX2lkXCI6XCI1ZTU4ZDEwMS0yZTYyLWYzOWMtNjFjYS04M2QxZTRiNWU4MDlcIn0ifSwiVVNFUk5BTUUiOnsiUyI6InNpbmkud2lsc29uQHVzdC1nbG9iYWwuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xOFQxMzoxODozMjo2MDAifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNBTExfREVMRVRFX1dPUktGTE9XIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVMRVRJT04ifSwiU0VSVklDRV9OQU1FIjp7IlMiOiJlbWFpbC1ldmVudC1oYW5kbGVyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiU0VSVklDRV9JRCI6eyJTIjoiNWU1OGQxMDEtMmU2Mi1mMzljLTYxY2EtODNkMWU0YjVlODA5In19fQ==",
					"approximateArrivalTimestamp": 1521632408.682
				},
				"eventSource": "abc",
				"eventVersion": "1.0",
				"eventID": "abc",
				"eventName": "abc",
				"invokeIdentityArn": "abc",
				"awsRegion": "abc",
				"eventSourceARN": "abc"
			}
		];
		var callback = (err, responseObj) => {
			if (err) {
				return err;
			}
			else {
				return JSON.stringify(responseObj);
			}
		};

		var responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};

		var authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		var reqStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		index.handler(event, context, (err, res) => {
			if (err) {
				return err;
			} else {
				res.should.have.property('processed_events');
				return res;
			}
		});

	});
});  

