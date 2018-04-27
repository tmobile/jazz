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
const chaiAsPromised = require('chai-as-promised'); chai.use(chaiAsPromised);
const request = require('request');
const AWS = require('aws-sdk-mock');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon')
const sinonTest = require('sinon-test')(sinon, { useFakeTimers: false });
require('sinon-as-promised');
const rp = require('request-promise-native');
const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
const testPayloads = require('./response_payloads.js')();
const kinesisPayload = require('./KINESIS_PAYLOAD');

let event, context, configData, authToken;

describe('jazz environment handler tests: ', () => {
	let sandbox;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		context = awsContext();
		context.functionName = context.functionName + "-test";
		configData = config(context);
		authToken = testPayloads.tokenResponseObj200.body.data.token;
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('Verify getToken returns a valid 200 response ', () => {
		let requestPromiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(testPayloads.tokenResponseObj200));
		let getTokenRequest = index.getTokenRequest(configData);

		let verified = rp(getTokenRequest)
			.then(res => {
				let status = res.statusCode;
				expect(status, "Invalid status Code from getToken").to.eql(200);
				sinon.assert.calledOnce(requestPromiseStub);
			});

		requestPromiseStub.restore();
	});

	it('Verify getToken returns an unauthorized 401 response ', () => {
		let requestPromiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(testPayloads.tokenResponseObj401));
		let getTokenRequest = index.getTokenRequest(configData);

		let verified = rp(getTokenRequest)
			.then(res => {
				let status = res.statusCode
				expect(status, "Error code is not 401/Unauthorized").to.eql(401);
				sinon.assert.calledOnce(requestPromiseStub);
			});

		requestPromiseStub.restore();
	});

	it('Verify getTokenRequest returns a json response ', () => {
		let getTokenRequest = index.getTokenRequest(configData);
		let expectedOutput = '{"uri":"https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/login","method":"post","json":{"username":"{jazz_admin}","password":"{jazz_admin_creds}"},"rejectUnauthorized":false}';
		
		expect(JSON.stringify(getTokenRequest)).to.eql(expectedOutput);
	});

	it('Verify getAuthResponse returns invalid response when data is missing ', () => {
		index.getAuthResponse(testPayloads.tokenResponseObjInvalid)
			.catch(err => {
				let msg = "Invalid token response from API";
				expect(err.message, "Promise should be rejected").to.eql(msg);
		});
	});

	it('Verify getAuthResponse returns an invalid response when body is null', () => {
		index.getAuthResponse(testPayloads.tokenResponseObj401)
			.catch(err => {
				let msg = "Invalid token response from API";
				expect(err.message, "Promise should be rejected").to.eql(msg);
		});
	});

	it('Verify processEachEvent for COMMIT_TEMPLATE event', () => {
		let event = require('./COMMIT_TEMPLATE');
		let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		let resMsg = "Stage and Prod environments are created successfully";
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.envCreationResponseSuccess, testPayloads.envCreationResponseSuccess.body);
		});

		let processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		
		processEachEvent.then((res) => {
			sinon.assert.calledTwice(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.message).to.include(resMsg);;
		});
	});

	it('Verify processEachEvent for UPDATE_ENVIRONMENT event', () => {
		let event = require('./UPDATE_ENVIRONMENT');
		let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		let resMsg = "Successfully Updated environment for service";

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		let processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		
		processEachEvent.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
		 	expect(res.data.message).to.include(resMsg);;
		});
	});

	it('Verify processEventUpdateEnvironment event', () => {
		let resMsg = "Successfully Updated environment for service";
		let environmentPayload = {};
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		let processEachEvent = index.processEventUpdateEnvironment(environmentPayload, configData, authToken);
		
		processEachEvent.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.message).to.include(resMsg);;
		});
	});

	it('processEachEvent for DELETE_ENVIRONMENT event', () => {
		let event = require('./DELETE_ENVIRONMENT');
		let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		let resMsg = "Successfully Updated environment for service";

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		let processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		processEachEvent.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.message).to.include(resMsg);;
		});
	});

	it('processEachEvent for CREATE_BRANCH event', () => {
		let event = require('./CREATE_BRANCH');
		let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		let resMsg = "success";

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
		});

		let processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		processEachEvent.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.result).to.include(resMsg);
		});
	});
});