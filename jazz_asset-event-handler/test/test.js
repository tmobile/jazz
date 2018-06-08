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
var testPayloads = require('./response_payloads.js')();
var kinesisPayload = require('./KINESIS_PAYLOAD');

var event, context, configData, authToken

describe('jazz asset handler tests: ', function () {

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

  // More Test cases to be added. 

});
