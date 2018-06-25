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
'use strict';

const chai = require('chai');
const expect = require('chai').expect;
const chaiAsPromised = require('chai-as-promised'); chai.use(chaiAsPromised);
const request = require('request');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
require('sinon-as-promised');
const rp = require('request-promise-native');
const index = require('../index');
const configModule = require("../components/config.js");
const testPayloads = require('./response_payloads.js')();
const kinesisPayload = require('./KINESIS_PAYLOAD');

let event, context, configData, authToken;

describe('jazz environment handler tests: ', () => {
	let sandbox;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		context = awsContext();
		context.functionName = context.functionName + "-test";
		configData = configModule.getConfig(event, context);
		authToken = testPayloads.tokenResponseObj200.body.data.token;
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('Verify getToken returns a valid 200 response ', () => {
		let requestPromiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(testPayloads.tokenResponseObj200));
		let getTokenRequest = index.getTokenRequest(configData);

		rp(getTokenRequest)
		.then(res => {
			let status = res.statusCode;
			expect(status, "Invalid status Code from getToken").to.eql(200);
			requestPromiseStub.restore();
			sinon.assert.calledOnce(requestPromiseStub);
		});
	});

	it('Verify getToken returns an unauthorized 401 response ', () => {
		let requestPromiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(testPayloads.tokenResponseObj401));
		let getTokenRequest = index.getTokenRequest(configData);

		rp(getTokenRequest)
		.then(res => {
			let status = res.statusCode;
			expect(status, "Error code is not 401/Unauthorized").to.eql(401);
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
		});
	});

	it('Verify getTokenRequest returns a json response ', () => {
		let getTokenRequest = index.getTokenRequest(configData);
		let expectedOutput = '{"uri":"https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/login","method":"post","json":{"username":"{jazz_admin}","password":"{jazz_admin_creds}"},"rejectUnauthorized":false}';

		expect(JSON.stringify(getTokenRequest)).to.eql(expectedOutput);
	});

	it('Verify getAuthResponse returns invalid response when data is missing ', () => {
		index.getAuthResponse(testPayloads.tokenResponseObj200)
		.then(res => {
			expect(res).to.eql('JAZZLOGINTOKENTEST');
		});
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

		index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
		.then((res) => {
			sinon.assert.calledTwice(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.message).to.include(resMsg);
		});
	});

	it('Verify processEachEvent for COMMIT_TEMPLATE event failed', () => {
		let event = require('./COMMIT_TEMPLATE');
		const statusCode = testPayloads.apiResponse.statusCode;
		testPayloads.apiResponse.statusCode = 400;
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		index.processItem(event.Item, configData, authToken)
		.catch((res) => {
			sinon.assert.calledTwice(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.error).to.include('Error creating');
			testPayloads.apiResponse.statusCode = statusCode;
		});
	});

	it('Verify processEachEvent for INVALID EVENT event', () => {
		let event = require('./INVALID_EVENT');
		let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;

		index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
		.then((res) => {
			expect(res.message).to.include('Not an interesting event');
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

		index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
		.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
		 	expect(res.data.message).to.include(resMsg);
		});
	});

	it('Verify processEachEvent for UPDATE_ENVIRONMENT event without logical id', () => {
		let event = require('./UPDATE_ENVIRONMENT_NOLOGICAL_ID');
		let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		let resMsg = "Successfully Updated environment for service";

		testPayloads.apiResponse.body.data.environment = [{'physical_id': 'master'}];
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
		.then((res) => {
			sinon.assert.calledTwice(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.message).to.include(resMsg);
		});
	});

	it('Verify processEventUpdateEnvironment event returns status of 200', () => {
		let resMsg = "Successfully Updated environment for service";
		let environmentPayload = {};
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		index.processEventUpdateEnvironment(environmentPayload, configData, authToken)
		.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.message).to.include(resMsg);
		});
	});

	it('Verify processEachEvent for DELETE_ENVIRONMENT event', () => {
		let event = require('./DELETE_ENVIRONMENT');
		let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		let resMsg = "Successfully Updated environment for service";

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
		.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.message).to.include(resMsg);
		});
	});

	it('Verify processEachEvent for DELETE_ENVIRONMENT event whith event status as FAILED', () => {
		let event = require('./DELETE_ENVIRONMENT');
		event.Item.EVENT_STATUS.S = 'FAILED';

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		index.processItem(event.Item, configData, authToken)
		.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.message).to.include('Successfully Updated environment for service');
		});
	});

	it('Verify processEachEvent for DELETE_ENVIRONMENT event whith event status as STARTED', () => {
		let event = require('./DELETE_ENVIRONMENT');
		event.Item.EVENT_STATUS.S = 'STARTED';

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		index.processItem(event.Item, configData, authToken)
		.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.message).to.include('Successfully Updated environment for service');
		});
	});

	it('Verify processEachEvent for DELETE_ENVIRONMENT event whith event status as STARTED', () => {
		let event = require('./DELETE_BRANCH');

		testPayloads.apiResponse.body.data.environment = [{'physical_id': 'master'}];
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		index.processItem(event.Item, configData, authToken)
		.then((res) => {
			sinon.assert.calledTwice(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.message).to.include('Successfully Updated environment for service');
		});
	});

	it('Verify processEachEvent for CREATE_BRANCH event', () => {
		let event = require('./CREATE_BRANCH');
		let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		let resMsg = "success";

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
		});

		index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
		.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.data.result).to.include(resMsg);
		});
	});

	it('Verify processEachEvent for CREATE_BRANCH event failed', () => {
		let event = require('./CREATE_BRANCH');
		const statusCode = testPayloads.createBranchSuccess.statusCode;
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.createBranchError, testPayloads.createBranchError.body);
		});

		index.processItem(event.Item, configData, authToken)
		.catch((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.details).to.include('error');
		});
	});

	it('Verify getEnvironmentLogicalId returns a valid logical Id for a branch', () => {
		let environmentPayload = testPayloads.environmentPayload
		let logical_id = "6knr9d33tt-dev";

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.getEnvironmentLogicalId, JSON.stringify(testPayloads.getEnvironmentLogicalId.body));
		});

		index.getEnvironmentLogicalId(environmentPayload, configData, authToken)
		.then((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res).to.eql(logical_id);
		});
	});

	it('Verify getEnvironmentLogicalId throws error when status code is 400', () => {
		let environmentPayload = testPayloads.environmentPayload
		const statusCode = testPayloads.getEnvironmentLogicalId.statusCode;
		testPayloads.getEnvironmentLogicalId.statusCode = 400;
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.getEnvironmentLogicalId, JSON.stringify(testPayloads.getEnvironmentLogicalId.body));
		});

		index.getEnvironmentLogicalId(environmentPayload, configData, authToken)
		.catch((res) => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			testPayloads.getEnvironmentLogicalId.statusCode = statusCode
			expect(res.error).to.eql('Could not get environment Id for service and domain');
		});
	});

	it('Verify processEventUpdateEnvironment rejects with statusCode of 400', () => {
		let environmentPayload = testPayloads.environmentPayload;
		environmentPayload.friendlyName = "FriendlyName";
		environmentPayload.logicalId = "6knr9d33tt-dev";

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.processEventUpdateEnvironmentError, JSON.stringify(testPayloads.processEventUpdateEnvironmentError.body));
		});

		index.processEventUpdateEnvironment(environmentPayload, configData, authToken)
		.catch(res => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.details).to.eql('Error');
		})
	});

	it('Verify processEventCreateBranch rejects when there is an error and statusCode being returned which is not 200', () => {
		let environmentPayload = testPayloads.environmentPayload;
		environmentPayload.logicalId = "6knr9d33tt-dev";

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.createBranchError, JSON.stringify(testPayloads.createBranchError.body));
		});

		index.processEventCreateBranch(environmentPayload, configData, authToken)
		.catch(res => {
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.details).to.eql('error');
		})
	});

	it('Verify processEventInitialCommit rejects when there is an error and statusCode being returned which is not 200', () => {
		let environmentPayload = testPayloads.environmentPayload;

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.processEventInitialCommitError, JSON.stringify(testPayloads.processEventInitialCommitError.body));
		});

		index.processEventInitialCommit(environmentPayload, configData, authToken)
		.catch(res => {
			sinon.assert.calledTwice(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.details).to.eql('error');
		});
	});

	it('Verify processEventInitialCommit rejects when physical id is different', () => {
		let environmentPayload = testPayloads.environmentPayload;
		environmentPayload.physical_id = "physicalId";

		index.processEventInitialCommit(environmentPayload, configData, authToken)
		.catch(res => {
			expect(res).to.eql(`INITIAL_COMMIT event should be triggered by a master commit. physical_id is ${environmentPayload.physical_id}`);
		});
	});

	it('Verify processEventInitialCommit resolves with statusCode of 200', () => {
		let environmentPayload = testPayloads.environmentPayload;
		environmentPayload.physical_id = 'master';
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.processEventInitialCommitSuccess, testPayloads.processEventInitialCommitSuccess.body);
		});

		index.processEventInitialCommit(environmentPayload, configData, authToken)
		.then(res => {
			sinon.assert.calledTwice(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.message).to.eql('Stage and Prod environments are created successfully');
		});
	});

	it('Verify processEventDeleteBranch rejects when unable to delete environment due to bad statusCode', () => {
		let environmentPayload = testPayloads.environmentPayload;
		environmentPayload.physical_id = 'master';
		testPayloads.getEnvironmentLogicalId.statusCode = 400;
		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.getEnvironmentLogicalId, testPayloads.getEnvironmentLogicalId.body);
		});

		index.processEventDeleteBranch(environmentPayload, configData, authToken)
		.catch(res => {
			console.log(res);
			sinon.assert.calledOnce(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res.error).to.include('Could not get environment Id');
		});
	});

	it('Verify handleError captures errorType and message', () => {
		let error = index.handleError('errorType', 'errorMessage');
		expect(error.failure_code).to.eq('errorType');
		expect(error.failure_message).to.eq('errorMessage');
	});

	it('Verify processEvents is able to create enviroments', () => {
		let event = {"Records": [testPayloads.eventPayload]}

		let requestPromiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.processEventInitialCommitSuccess, testPayloads.processEventInitialCommitSuccess.body);
		});

		index.processEvents(event, configData, authToken)
		.then(res => {
			sinon.assert.calledTwice(requestPromiseStub);
			requestPromiseStub.restore();
			expect(res[0].message).to.eql('Stage and Prod environments are created successfully');
		});
	});
});
