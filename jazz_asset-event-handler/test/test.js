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
const _ = require('lodash');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon')
const sinonTest = require('sinon-test')(sinon, {useFakeTimers: false});
require('sinon-as-promised');
const request = require('request');
const rp = require('request-promise-native');
const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
const mockData = require('./mock-data/index');

var event, context, configData, authToken, sandbox;

describe('jazz asset handler tests: ', function () {
  before(function () {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function () {
    sandbox.stub(logger);
    context = awsContext();
    context.functionName = context.functionName + "-test";
    configData = config(context);
    authToken = mockData.tokenResponseObj200.body.data.token
  });

  afterEach(function () {
    sandbox.restore();
  });


  describe.only('processItem', function() {

    beforeEach(function () {
        this.payload = _.cloneDeep(mockData.eventPayload);
    });

    // it('verify creates asset on create asset event', function () {
    //   this.payload.EVENT_STATUS.S = 'CREATE_EVENT';
    //   sinon.stub(index.processUpdateAsset).resolves();
    // });


    it('verify create asset updates if exists', function () {
      this.payload.EVENT_NAME.S = 'CREATE_ASSET';
      sinon.stub(index, 'checkIfAssetExists').rejects();
      sinon.stub(index, 'processCreateAsset').resolves();

      var response = index.processItem(this.payload, configData, authToken);

      sinon.assert.called(index.processCreateAsset);
      // sinon.assert.called(logger.error);
      // return expect(response).to.eventually.be.rejected;
    });

  });



  describe('responds to successful http', function () {
    beforeEach(function () {
      sandbox.stub(request, 'Request', function (options) {
        options.callback.apply(this, mockData.requestSuccessCallback);
      });
    });

    it('Verify CREATE ASSET successful', function () {
      var response = index.processCreateAsset(mockData.eventPayload, configData, authToken);

      return expect(response).to.eventually.be.resolved;
    });

    it('Verify UPDATE ASSET successful', function () {
      var response = index.processUpdateAsset(mockData.recordsPayload.Records[0], mockData.eventPayload, configData, authToken);

      return expect(response).to.eventually.be.resolved;
    });

    it('Verify CheckIfAssetExits asset exists', function () {
      var response = index. checkIfAssetExists(mockData.eventPayload, configData, authToken);

      return expect(response).to.eventually.be.resolved;
    });

  });

  describe('responds to unsuccessful http', function() {
    beforeEach(function () {
      sandbox.stub(request, 'Request', function (options) {
        options.callback.apply(this, mockData.requestInternalErrorCallback);
      });
    });

    it('Verify CREATE ASSET unsuccessful', function () {
      var response = index.processCreateAsset(mockData.eventPayload, configData, authToken);

      sinon.assert.called(logger.error);
      return expect(response).to.eventually.be.rejected;
    });

    it('Verify UPDATE ASSET successful', function () {
      var response = index.processUpdateAsset(mockData.recordsPayload.Records[0], mockData.eventPayload, configData, authToken);

      sinon.assert.called(logger.error);
      return expect(response).to.eventually.be.rejected;
    });

    it('Verify CheckIfAssetExits asset exists', function () {
      var response = index. checkIfAssetExists(mockData.eventPayload, configData, authToken);

      sinon.assert.called(logger.error);
      return expect(response).to.eventually.be.rejected;
    });

  });

  describe('incorrect event status', function() {
    beforeEach(function () {
      this.payload = _.cloneDeep(mockData.eventPayload);
      this.payload.EVENT_STATUS.S = 'NON_RELEVENT_STATUS';
    });

    it('verify create asset fails', function () {
      var response = index.processCreateAsset(this.payload, configData, authToken);

      return expect(response).to.eventually.be.rejected;
    });

    it('verify create asset fails', function () {
      var response = index.processUpdateAsset(mockData.recordsPayload.Records[0], this.payload, configData, authToken);

      return expect(response).to.eventually.be.rejected;
    });

  });
  
});
