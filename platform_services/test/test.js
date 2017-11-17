// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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

const assert = require('chai').assert;
const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const logger = require("../components/logger.js");
const AWS = require("aws-sdk-mock");
const utils = require('../components/utils.js')();

//all tests
describe('platform_services', function() {
    var spy, stub, errMessage, errType;

    //setup spy to wrap async/extraneous functions
    spy = sinon.spy();

    //utils tests
    describe('utils.js', function() {
      it("should do something", function(){
        console.log(typeof utils);
        assert.isTrue(true);
      });
    });

    //handler tests
    describe('index.handler()', function(){
      var event, context, callback;

      beforeEach(function(){
        event = {
          "stage" : "test",
          "method" : "",
          "path" : {
            "id" : null
          }
          "query" : {
            "foo" : null
          };
          "body" : {
            "bar" : null
          };
        };
        context = awsContext();
        callback = (err, responseObj) => {
          if(err){
            return JSON.stringify(err);
          }
          else{
            return JSON.stringify(responseObj);
          }
        };
      });

      it("should do something", function(){
        //do something
        assert.isTrue(true);
      });
    });
});
