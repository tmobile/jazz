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
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = require('chai').expect;
const should = require('chai').should();
const sinon = require('sinon')
require('sinon-as-promised');
const request = require('request');
const rp = require('request-promise-native');

const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
const crud = require('../components/crud')();


var spy, event, context, stub, configData;



describe('jazz_services-handler', function () {

	beforeEach(function () {
		spy = sinon.spy();
		event = {
			"method": "POST",
			"stage": "test",
			"Records": [
				{
					"kinesis": {
						"kinesisSchemaVersion": "1.0",
						"partitionKey": "DEPLOY_TO_AWS",
						"sequenceNumber": "49582572405427780489171511215494788341040101909881421826",
						"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJkN2UyMmQyMC01OWUyLTQzNTMtYTYxZS1lYjRkODk2ZWJiZDAifSwiVElNRVNUQU1QIjp7IlMiOiIyMDE4LTAzLTE2VDE2OjUyOjU0OjQ1MyJ9LCJSRVFVRVNUX0lEIjp7IlMiOiJzYWRqYXNnZDEyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiRVZFTlRfTkFNRSI6eyJTIjoiTU9ESUZZX1RFTVBMQVRFIn0sIlNFUlZJQ0VfSUQiOnsiUyI6ImJhZmIyMjlmLThkYzMtNDU1MC1jZjYwLTZlNTFjNWRiMDQ3MyJ9LCJTRVJWSUNFX05BTUUiOnsiUyI6InRlc3QtbGFtYmRhLXNpbmktNiJ9LCJFVkVOVF9TVEFUVVMiOnsiUyI6IkNPTVBMRVRFRCJ9LCJFVkVOVF9UWVBFIjp7IlMiOiJTRVJWSUNFX0RFUExPWU1FTlQifSwiVVNFUk5BTUUiOnsiUyI6InNlcnZlcmxlc3NAdC1tb2JpbGUuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxOC0wMi0xNlQwNDo0MTo0Mzo5NDUifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcImxhbWJkYVwiLFwic2VydmljZV9pZFwiOlwiYmFmYjIyOWYtOGRjMy00NTUwLWNmNjAtNmU1MWM1ZGIwNDczXCIsXCJzZXJ2aWNlX25hbWVcIjpcInRlc3QtbGFtYmRhLXNpbmktNlwiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJ0ZXNpbmlcIixcImlhbV9yb2xlXCI6XCJhcm46YXdzOmlhbTo6MTkyMDA2MTQ1ODEyOnJvbGUvamF6ejIwMTgwMjI3X2xhbWJkYTJfYmFzaWNfZXhlY3V0aW9uXzFcIixcImVudmlyb25tZW50XCI6XCJOQVwiLFwicmVnaW9uXCI6XCJ1cy1lYXN0LTFcIixcIm1lc3NhZ2VcIjpcInNlcnZpY2UgIGNyZWF0aW9uIHN0YXJ0c1wiLFwibWV0YWRhdGFcIjp7XCJzdWJuZXQtaWRcIjpcInNhc2Zkc1wifSxcImNyZWF0ZWRfYnlcIjpcInNlcnZlcmxlc3NAdC1tb2JpbGUuY29tXCJ9In19fQ==",
						"approximateArrivalTimestamp": 1521219174.605
					},
					"eventSource": "aws:kinesis",
					"eventVersion": "1.0",
					"eventID": "shardId-000000000000:49582572405427780489171511215494788341040101909881421826",
					"eventName": "aws:kinesis:record",
					"invokeIdentityArn": "arn:aws:iam::192006145812:role/gitlab180314_lambda2_basic_execution_1",
					"awsRegion": "us-east-1",
					"eventSourceARN": "arn:aws:kinesis:us-east-1:192006145812:stream/gitlab180314-events-hub-prod"
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
		var stub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		var getTokenPromise = index.getToken(configData);
		expect(rp(getTokenPromise).then((res) => {
			return res.statusCode;
		})).to.become(200);
		stub.restore();
	});

	it('getToken should give invalid response for invalid status code', function () {
		tokenResponseObj.statusCode = 400;
		var stub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		var getTokenPromise = index.getToken(configData);
		expect(rp(getTokenPromise).then((res) => {
			return res.statusCode;
		})).to.become(400);
		stub.restore();
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
		var stub = sinon.stub(index, "handleError");
		stub.withArgs(400, "Unauthorized").returns(errorJson);
		stub.restore();
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
		var payload = { "EVENT_ID": { "S": "d7e22d20-59e2-4353-a61e-eb4d896ebbd0" }, "TIMESTAMP": { "S": "2018-03-16T16:52:54:453" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "MODIFY_TEMPLATE" }, "SERVICE_ID": { "S": "bafb229f-8dc3-4550-cf60-6e51c5db0473" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "serverless@t-mobile.com" }, "EVENT_TIMESTAMP": { "S": "2018-02-16T04:41:43:945" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"bafb229f-8dc3-4550-cf60-6e51c5db0473\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"runtime\":\"nodejs4.3\",\"domain\":\"test\",\"iam_role\":\"arn:aws:iam::192006145812:role/jazz20180227_lambda2_basic_execution_1\",\"environment\":\"NA\",\"region\":\"us-east-1\",\"message\":\"service  creation starts\",\"metadata\":{\"subnet-id\":\"sasfds\"},\"created_by\":\"serverless@t-mobile.com\"}" } };
		var processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		var message = "Not an interesting event to process";
		expect(processEvent.then(function (res) {
			return res.message;
		})).to.be.become(message);
	});

	it('processEvent should resolve wih updating service for valid event name event type combination', function () {
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
		var stub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});
		var payload = { "EVENT_ID": { "S": "d7e22d20-59e2-4353-a61e-eb4d896ebbd0" }, "TIMESTAMP": { "S": "2018-03-16T16:52:54:453" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "DEPLOY_TO_AWS" }, "SERVICE_ID": { "S": "bafb229f-8dc3-4550-cf60-6e51c5db0473" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "serverless@t-mobile.com" }, "EVENT_TIMESTAMP": { "S": "2018-02-16T04:41:43:945" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"bafb229f-8dc3-4550-cf60-6e51c5db0473\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"runtime\":\"nodejs4.3\",\"domain\":\"test\",\"iam_role\":\"arn:aws:iam::192006145812:role/jazz20180227_lambda2_basic_execution_1\",\"environment\":\"NA\",\"region\":\"us-east-1\",\"message\":\"service  creation starts\",\"metadata\":{\"subnet-id\":\"sasfds\"},\"created_by\":\"serverless@t-mobile.com\"}" } };
		var processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		var message = "updated service test-lambda in service catalog.";
		expect(processEvent.then(function (res) {
			return res.message;
		})).to.be.become(message);
		stub.restore();
	});

	it('processRecords should return response for invalid event name event type combination', function () {
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
		var stub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		var processRecords = index.processRecords(event, configData, tokenResponseObj.body.data.token);
		var message = "Not an interesting event to process";
		expect(processRecords.then(function (res) {
			return res.message;
		})).to.be.become(message);
		stub.restore();
	});

	it('getUpdateServiceStatus should return status for payload with interested events', function () {
		var payload = { "EVENT_ID": { "S": "d7e22d20-59e2-4353-a61e-eb4d896ebbd0" }, "TIMESTAMP": { "S": "2018-03-16T16:52:54:453" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "DEPLOY_TO_AWS" }, "SERVICE_ID": { "S": "bafb229f-8dc3-4550-cf60-6e51c5db0473" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "serverless@t-mobile.com" }, "EVENT_TIMESTAMP": { "S": "2018-02-16T04:41:43:945" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"bafb229f-8dc3-4550-cf60-6e51c5db0473\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"runtime\":\"nodejs4.3\",\"domain\":\"test\",\"iam_role\":\"arn:aws:iam::192006145812:role/jazz20180227_lambda2_basic_execution_1\",\"environment\":\"NA\",\"region\":\"us-east-1\",\"message\":\"service  creation starts\",\"metadata\":{\"subnet-id\":\"sasfds\"},\"created_by\":\"serverless@t-mobile.com\"}" } };

		var statusResponse = { "status": "active", "interested_event": true };
		var getUpdateServiceStatus = index.getUpdateServiceStatus(payload, configData);
        assert(getUpdateServiceStatus, statusResponse);
	});

	it('getUpdateServiceStatus should return status false for payload with not interested events', function () {
		var payload = { "EVENT_ID": { "S": "d7e22d20-59e2-4353-a61e-eb4d896ebbd0" }, "TIMESTAMP": { "S": "2018-03-16T16:52:54:453" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "MODIFY_TEMPLATE" }, "SERVICE_ID": { "S": "bafb229f-8dc3-4550-cf60-6e51c5db0473" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "serverless@t-mobile.com" }, "EVENT_TIMESTAMP": { "S": "2018-02-16T04:41:43:945" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"bafb229f-8dc3-4550-cf60-6e51c5db0473\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"runtime\":\"nodejs4.3\",\"domain\":\"test\",\"iam_role\":\"arn:aws:iam::192006145812:role/jazz20180227_lambda2_basic_execution_1\",\"environment\":\"NA\",\"region\":\"us-east-1\",\"message\":\"service  creation starts\",\"metadata\":{\"subnet-id\":\"sasfds\"},\"created_by\":\"serverless@t-mobile.com\"}" } };

		var statusResponse = { "status": "active", "interested_event": true };;
		var getUpdateServiceStatus = index.getUpdateServiceStatus(payload, configData);
        assert(getUpdateServiceStatus, statusResponse);
	});

	it('getServiceContext should return service context json for valid payload', function () {
		var payload = { "EVENT_ID": { "S": "d7e22d20-59e2-4353-a61e-eb4d896ebbd0" }, "TIMESTAMP": { "S": "2018-03-16T16:52:54:453" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME": { "S": "MODIFY_TEMPLATE" }, "SERVICE_ID": { "S": "bafb229f-8dc3-4550-cf60-6e51c5db0473" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "serverless@t-mobile.com" }, "EVENT_TIMESTAMP": { "S": "2018-02-16T04:41:43:945" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"bafb229f-8dc3-4550-cf60-6e51c5db0473\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"runtime\":\"nodejs4.3\",\"domain\":\"test\",\"iam_role\":\"arn:aws:iam::192006145812:role/jazz20180227_lambda2_basic_execution_1\",\"environment\":\"NA\",\"region\":\"us-east-1\",\"message\":\"service  creation starts\",\"metadata\":{\"subnet-id\":\"sasfds\"},\"created_by\":\"serverless@t-mobile.com\"}" } };

		var svcContext = JSON.parse(payload.SERVICE_CONTEXT.S);
		var serviceContext = index.getServiceContext(svcContext);
		var resp = { "domain": "test", "runtime": "nodejs4.3", "region": "us-east-1", "type": "lambda", "metadata": { "subnet-id": "sasfds" } };
		assert(serviceContext, resp);
	});

	it('index should resolve wih updating service for valid event name event type combination', function () {

		event.Records = [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "MODIFY_TEMPLATE",
					"sequenceNumber": "49582572405427780489171511215494788341040101909881421826",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJkN2UyMmQyMC01OWUyLTQzNTMtYTYxZS1lYjRkODk2ZWJiZDAifSwiVElNRVNUQU1QIjp7IlMiOiIyMDE4LTAzLTE2VDE2OjUyOjU0OjQ1MyJ9LCJSRVFVRVNUX0lEIjp7IlMiOiJzYWRqYXNnZDEyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiRVZFTlRfTkFNRSI6eyJTIjoiTU9ESUZZX1RFTVBMQVRFIn0sIlNFUlZJQ0VfSUQiOnsiUyI6ImJhZmIyMjlmLThkYzMtNDU1MC1jZjYwLTZlNTFjNWRiMDQ3MyJ9LCJTRVJWSUNFX05BTUUiOnsiUyI6InRlc3QtbGFtYmRhLXNpbmktNiJ9LCJFVkVOVF9TVEFUVVMiOnsiUyI6IkNPTVBMRVRFRCJ9LCJFVkVOVF9UWVBFIjp7IlMiOiJTRVJWSUNFX0RFUExPWU1FTlQifSwiVVNFUk5BTUUiOnsiUyI6InNlcnZlcmxlc3NAdC1tb2JpbGUuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxOC0wMi0xNlQwNDo0MTo0Mzo5NDUifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcImxhbWJkYVwiLFwic2VydmljZV9pZFwiOlwiYmFmYjIyOWYtOGRjMy00NTUwLWNmNjAtNmU1MWM1ZGIwNDczXCIsXCJzZXJ2aWNlX25hbWVcIjpcInRlc3QtbGFtYmRhLXNpbmktNlwiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJ0ZXNpbmlcIixcImlhbV9yb2xlXCI6XCJhcm46YXdzOmlhbTo6MTkyMDA2MTQ1ODEyOnJvbGUvamF6ejIwMTgwMjI3X2xhbWJkYTJfYmFzaWNfZXhlY3V0aW9uXzFcIixcImVudmlyb25tZW50XCI6XCJOQVwiLFwicmVnaW9uXCI6XCJ1cy1lYXN0LTFcIixcIm1lc3NhZ2VcIjpcInNlcnZpY2UgIGNyZWF0aW9uIHN0YXJ0c1wiLFwibWV0YWRhdGFcIjp7XCJzdWJuZXQtaWRcIjpcInNhc2Zkc1wifSxcImNyZWF0ZWRfYnlcIjpcInNlcnZlcmxlc3NAdC1tb2JpbGUuY29tXCJ9In19fQ==",
					"approximateArrivalTimestamp": 1521219174.605
				},
				"eventSource": "aws:kinesis",
				"eventVersion": "1.0",
				"eventID": "shardId-000000000000:49582572405427780489171511215494788341040101909881421826",
				"eventName": "aws:kinesis:record",
				"invokeIdentityArn": "arn:aws:iam::192006145812:role/gitlab180314_lambda2_basic_execution_1",
				"awsRegion": "us-east-1",
				"eventSourceARN": "arn:aws:kinesis:us-east-1:192006145812:stream/gitlab180314-events-hub-prod"
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
		var stub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		index.handler(event, context, (err, responseObj) => {
			if (err) {
				return err;
			} else {
				(responseObj.processed_events).should.equal(1);
				return responseObj;
			}
		});

		authStub.restore();
		stub.restore();
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

		var responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};

		var authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		var stub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, responseObject, responseObject.body);
		});

		index.handler(event, context, (err, responseObj) => {
			if (err) {
				return err;
			} else {
				responseObj.should.have.property('processed_events')
				return responseObj;
			}
		});

		authStub.restore();
		stub.restore();
	});


});  
