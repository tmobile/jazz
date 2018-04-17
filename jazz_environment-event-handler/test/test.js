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
const rp = require('request-promise-native');
const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
const fs = require('fs');

var event, context, configData, tokenResponseObj, kinesisPayload;

describe('jazz environment handler tests: ', function () {
	var sandbox;
	beforeEach(function () {
		sandbox = sinon.sandbox.create();

		context = awsContext();
		context.functionName = context.functionName + "-test"
		var payloadFormat = fs.readFileSync('test/KINESIS_PAYLOAD.json');
		kinesisPayload = JSON.parse(payloadFormat);
		tokenResponseObj200 = {
			"statusCode": 200,
			"body": {
				"data": {
					"user_id": "JazzAdmin",
					"name": "Jazz Admin",
					"email": "jazz@serverless.com",
					"token": "JAZZLOGINTOKENTEST"
				},
				"input": {
					"usrname": "jazzAdmin"
				}
			}
		};

		tokenResponseObj401 = {
			"statusCode": 401,
			"message": {
				"errorMessage": "401 - {\"errorCode\":\"100\",\"errorType\":\"Unauthorized\",\"message\":\"Authentication Failed for user: jazzAdmin- with message: 80090308: LdapErr: DSID-0C0903D0, comment: AcceptSecurityContext error, data 52e, v2580\\u0000\"}",
				"errorType": "StatusCodeError",
				"stackTrace": [
					"new StatusCodeError (test message)"
				]
			}
		};

		tokenResponseObjInvalid = {
			"statusCode": 200,
			"body": {
				"data": "",
				"input": {
					"usrname": "jazzAdmin"
				}
			}
		};
		configData = config(context);

	});

	afterEach(function () {
		sandbox.restore();
	});


	it('Verified getToken returned a valid 200 response ', function () {
		var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj200));
		var getTokenRequest = index.getTokenRequest(configData);

		rp(getTokenRequest)
			.then(res => {
				var status = res.statusCode
				expect(status, "Invalid status Code from getToken").to.eql(200)
			})
		requestPromoiseStub.restore()
	});


	it('Verified getToken returned a Unauthorized 401 response ', function () {
		var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj401));
		var getTokenRequest = index.getTokenRequest(configData);

		rp(getTokenRequest)
			.then(res => {
				var status = res.statusCode
				expect(status, "Error code is not 401/Unauthorized").to.eql(401)
			})

		requestPromoiseStub.restore()
	});


	it('Verified getToken returned a Invalid response ', function () {
		var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObjInvalid));
		var getTokenRequest = index.getTokenRequest(configData);

		rp(getTokenRequest)
			.then(result => {
				return index.getAuthResponse(result);
			})
			.catch(err => {
				var msg = "Invalid token response from API";
				expect(err.message, "Promise should be rejected").to.eql(msg);
			});

		requestPromoiseStub.restore()
	});

	it('Verified getToken returned a Invalid response ', function () {
		tokenResponseObjInvalid.body = null
		var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObjInvalid));
		var getTokenRequest = index.getTokenRequest(configData);

		rp(getTokenRequest)
			.then(result => {
				return index.getAuthResponse(result);
			})
			.catch(err => {
				var msg = "Invalid token response from API";
				expect(err.message, "Promise should be rejected").to.eql(msg);
			});

		requestPromoiseStub.restore()
	});

	it('Process events - COMMIT_TEMPLATE', function () {
		var event_COMMIT_TEMPLATE = fs.readFileSync('test/COMMIT_TEMPLATE.json');
		var event_COMMIT_TEMPLATE_64 = new Buffer(event_COMMIT_TEMPLATE).toString("base64");

		kinesisPayload.Records[0].data = event_COMMIT_TEMPLATE_64;
		//console.log(kinesisPayload);


		//var response = index.handler(event, context, callback);
		//@TODO

	});

	it('Process events - CREATE_BRANCH', function () {
		var event_CREATE_BRANCH = fs.readFileSync('test/CREATE_BRANCH.json');
		var event_CREATE_BRANCH_64 = new Buffer(event_CREATE_BRANCH).toString("base64");

		kinesisPayload.Records[0].data = event_CREATE_BRANCH_64;
		//console.log(kinesisPayload);
		//var response = index.handler(event, context, callback);
		//@TODO

	});

	it('Process events - UPDATE_ENVIRONMENT', function () {
		var event_UPDATE_ENVIRONMENT = fs.readFileSync('test/UPDATE_ENVIRONMENT.json');
		var event_UPDATE_ENVIRONMENT_64 = new Buffer(event_UPDATE_ENVIRONMENT).toString("base64");

		kinesisPayload.Records[0].data = event_UPDATE_ENVIRONMENT_64;
		//console.log(kinesisPayload);
		//var response = index.handler(event, context, callback);
		//@TODO

	});

	it('Process events - DELETE_BRANCH', function () {
		var event_DELETE_BRANCH = fs.readFileSync('test/DELETE_BRANCH.json');
		var event_DELETE_BRANCH_64 = new Buffer(event_DELETE_BRANCH).toString("base64");

		kinesisPayload.Records[0].data = event_DELETE_BRANCH_64;
		//console.log(kinesisPayload);
		//var response = index.handler(event, context, callback);
		//@TODO

	});

	it('Process events - DELETE_ENVIRONMENT', function () {
		var event_DELETE_ENVIRONMENT = fs.readFileSync('test/DELETE_ENVIRONMENT.json');
		var event_DELETE_ENVIRONMENT_64 = new Buffer(event_DELETE_ENVIRONMENT).toString("base64");

		kinesisPayload.Records[0].data = event_DELETE_ENVIRONMENT_64;
		//console.log(kinesisPayload);
		//var response = index.handler(event, context, callback);
		//@TODO

	});

	it('Process events - INVALID_EVENT', function () {
		var event_INVALID_EVENT = fs.readFileSync('test/INVALID_EVENT.json');
		var event_INVALID_EVENT_64 = new Buffer(event_INVALID_EVENT).toString("base64");

		kinesisPayload.Records[0].data = event_INVALID_EVENT_64;
		//console.log(kinesisPayload);
		//var response = index.handler(event, context, callback);
		//@TODO

	});

	it('Process events - INVALID_EVENT_TYPE', function () {
		var event_INVALID_EVENT_TYPE = fs.readFileSync('test/INVALID_EVENT_TYPE.json');
		var event_INVALID_EVENT_TYPE_64 = new Buffer(event_INVALID_EVENT_TYPE).toString("base64");

		kinesisPayload.Records[0].data = event_INVALID_EVENT_TYPE_64;
		//console.log(kinesisPayload);
		//var response = index.handler(event, context, callback);
		//@TODO

	});

	it('processEachEvent should reject for invalid event name and event type combination', function () {
		var event_UPDATE_ENVIRONMENT = fs.readFileSync('test/UPDATE_ENVIRONMENT.json');
		var event_UPDATE_ENVIRONMENT_64 = new Buffer(event_UPDATE_ENVIRONMENT).toString("base64");
		kinesisPayload.Records[0].data = event_UPDATE_ENVIRONMENT_64;

		var processEvent = index.processItem(event_UPDATE_ENVIRONMENT, configData, tokenResponseObj200.body.data.token);


	});

});
