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
const async = require("async");
const sinon = require('sinon')
const sinonTest = require('sinon-test')(sinon, { useFakeTimers: false });
require('sinon-as-promised');
const rp = require('request-promise-native');
const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
var testPayloads = require('./response_payloads.js')();
var kinesisPayload = require('./KINESIS_PAYLOAD');

var event, context, configData, authToken

describe('jazz environment handler tests: ', function () {
	var sandbox;
	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		context = awsContext();
		context.functionName = context.functionName + "-test"
		configData = config(context);
		authToken = testPayloads.tokenResponseObj200.body.data.token

	});

	afterEach(function () {
		sandbox.restore();
	});

	it('Verified getToken returned a valid 200 response ', function () {
		var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(testPayloads.tokenResponseObj200));
		var getTokenRequest = index.getTokenRequest(configData);

		var verified = rp(getTokenRequest)
			.then(res => {
				var status = res.statusCode;
				expect(status, "Invalid status Code from getToken").to.eql(200);
			});

		requestPromoiseStub.restore();
		return verified;
	});


	it('Verified getToken returned a Unauthorized 401 response ', function () {
		var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(testPayloads.tokenResponseObj401));
		var getTokenRequest = index.getTokenRequest(configData);

		var verified = rp(getTokenRequest)
			.then(res => {
				var status = res.statusCode
				expect(status, "Error code is not 401/Unauthorized").to.eql(401);
			});

		requestPromoiseStub.restore();
		return verified;
	});


	it('Verified getToken returned a Invalid response ', function () {
		var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(testPayloads.tokenResponseObjInvalid));
		var getTokenRequest = index.getTokenRequest(configData);

		var verified = rp(getTokenRequest)
			.then(result => {
				return index.getAuthResponse(result);
			})
			.catch(err => {
				var msg = "Invalid token response from API";
				expect(err.message, "Promise should be rejected").to.eql(msg);
			});

		requestPromoiseStub.restore();
		return verified;
	});


	it('Verified getToken returned a Invalid response - body is null', function () {
		var invalidPayload = testPayloads.tokenResponseObjInvalid;
		invalidPayload.body = null;
		var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(invalidPayload));
		var getTokenRequest = index.getTokenRequest(configData);

		var verified = rp(getTokenRequest)
			.then(result => {
				return index.getAuthResponse(result);
			})
			.catch(err => {
				var msg = "Invalid token response from API";
				return expect(err.message, "Promise should be rejected").to.eql(msg);
			});

		requestPromoiseStub.restore();
		return verified;
	});

	it('processEachEvent for COMMIT_TEMPLATE event', function () {
		var event = require('./COMMIT_TEMPLATE');
		var event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		var resMsg = "Stage and Prod environments are created successfully";

		var requestPromoiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.envCreationResponseSuccess, testPayloads.envCreationResponseSuccess.body);
		});

		var processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		return processEachEvent.then((res) => {
			requestPromoiseStub.restore();
			return expect(res.message).to.include(resMsg);;
		});
	});

	it('processEachEvent for UPDATE_ENVIRONMENT event', function () {
		var event = require('./UPDATE_ENVIRONMENT');
		var event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		var resMsg = "Successfully Updated environment for service";

		var requestPromoiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		var processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		return processEachEvent.then((res) => {
			requestPromoiseStub.restore();
			return expect(res.data.message).to.include(resMsg);;
		});
	});

	it('process_UPDATE_ENVIRONMENT event', function () {
		var resMsg = "Successfully Updated environment for service";
		var environmentPayload = {};
		var requestPromoiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		var processEachEvent = index.process_UPDATE_ENVIRONMENT(environmentPayload, configData, authToken);
		return processEachEvent.then((res) => {
			requestPromoiseStub.restore();
			return expect(res.data.message).to.include(resMsg);;
		});
	});

	it('processEachEvent for DELETE_ENVIRONMENT event', function () {
		var event = require('./DELETE_ENVIRONMENT');
		var event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		var resMsg = "Successfully Updated environment for service";

		var requestPromoiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
		});

		var processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		return processEachEvent.then((res) => {
			requestPromoiseStub.restore();
			return expect(res.data.message).to.include(resMsg);;
		});
	});

	it('processEachEvent for CREATE_BRANCH event', function () {
		var event = require('./CREATE_BRANCH');
		var event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		var resMsg = "success";

		var requestPromoiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
		});

		var processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		return processEachEvent.then((res) => {
			requestPromoiseStub.restore();
			console.log(res);
			return expect(res.data.result).to.include(resMsg);
		});
	});

	it('processEachEvent for DELETE_BRANCH event', function () {
		var event = require('./DELETE_BRANCH');
		var event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
		kinesisPayload.Records[0].kinesis.data = event_BASE64;
		var resMsg = "success";

		var requestPromoiseStub = sinon.stub(request, "Request", (obj) => {
			return obj.callback(null, testPayloads.deleteBranchSuccess, testPayloads.deleteBranchSuccess.body);
		});
		var processEachEvent = index.processEachEvent(kinesisPayload.Records[0], configData, authToken);
		requestPromoiseStub.restore();
		// return processEachEvent.then((res) => {
		// 	//processStub.restore();
		// 	console.log("==========="+res);
		// 	return expect(res.data.result).to.include(resMsg);
		// });
		// TODO
	});


	

});


