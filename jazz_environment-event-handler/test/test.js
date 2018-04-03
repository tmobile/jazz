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
const request = require('request');
const AWS = require('aws-sdk-mock');
const awsContext = require('aws-lambda-mock-context');
const async = require("async");
const sinon = require('sinon')

const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
const errorHandlerModule = require("../components/error-handler.js");
const utils = require("../components/utils.js")(); //Import the utils module.

var  event, context, configData;

describe('jazz environment handler test suits - ', function() {
  var sandbox;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();

    // set event here. Convert payload to base64 encoded and attach to event for processing
    // @TODO

    context = awsContext();
		context.functionName = context.functionName + "-dev"
		tokenResponseObj = {
			statusCode: 200,
			body: {
				data: {
					token: "auth_token_from_service"
				}
			}
		};
		configData = config(context);

  });


  afterEach(function() {
    sandbox.restore();
  });

 
  it('Check jazz modules are loaded & initialized', function() {
    var callback = sinon.spy();
    //var spylogger = sinon.stub(logger);
    //var spyutil = sinon.stub(utils);
    //var spyConfig = sinon.spy(config, "config");
    //var spyerrorHandler = sinon.spy(errorHandlerModule);

    //var response = index.handler(event, context, callback);

    //assert(spylogger.called);
    //assert(spyutil.called);
    //assert(spyconfig.called);
    //assert(spyerrorHandler.called);

  });

	it('getToken should give valid response ', function () {
    var asyncspy = sinon.spy();
    var callback = sinon.spy();

		var asyncStub = sinon.stub(async, "series", asyncspy);
    var response = index.handler(event, context, callback);
   
    console.log(asyncspy);
    //console.log(response);

    assert(asyncspy.called);
    //assert(callback.called);
  });


  it('Process events - COMMIT_TEMPLATE', function () {
    var callback = sinon.spy();
    //var response = index.handler(event, context, callback);
    //@TODO
    
  });

  it('Process events - CREATE_BRANCH', function () {
    var callback = sinon.spy();
    //var response = index.handler(event, context, callback);
    //@TODO
    
  });

  it('Process events - UPDATE_ENVIRONMENT', function () {
    var callback = sinon.spy();
    //var response = index.handler(event, context, callback);
    //@TODO
    
  });

  it('Process events - DELETE_BRANCH', function () {
    var callback = sinon.spy();
    //var response = index.handler(event, context, callback);
    //@TODO
    
  });

  it('Process events - DELETE_ENVIRONMENT', function () {
    var callback = sinon.spy();
    //var response = index.handler(event, context, callback);
    //@TODO
    
  });

});
