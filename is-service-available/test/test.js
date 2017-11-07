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
const expect = require('chai').expect;
const index = require('../index');
const sinon = require('sinon');

var event, context, callback, spy, stub;

//setup spy to wrap around DynamoDB calls and async functionality
spy = sinon.spy();

describe('is-service-available', function() {

  describe("utils.isServiceExists tests", function(){

    var query = {
      "service" : "garnetAmethystPearl",
      "domain" : "andSteven"
    }

    beforeEach(function(){
      callback = null;
    });

  });

  describe("index.handler tests", function(){

    //setup default valid values to be edited for varying scenarios
    beforeEach(function(){
      event = {
        "stage" : "test",
        "method" : "GET",
        "principalId" : "someR@nd0mId",
        "query" : {
          "service" : "garnetAmethystPearl",
          "domain" : "andSteven"
        }
      }
      context = null;
      callback = null;
    });

    /*
    * Given no event object, handler throws a 101 error
    */
    it("should throw a BadRequest 101 error if event is null or undefined", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given an event with no method defined, handler() throws a 101 error
    */
    it("should throw a BadRequest 101 error if event.method isn't defined", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given an event with a method defined other than GET, handler() throws a 101 error
    */
    it("should throw a BadRequest 101 error if event.method is not 'GET' ", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given an event with no principalid, handler() throws a 102 error
    */
    it("should throw an Unauthorized 102 error if event.principalId is null or undefined", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given an event with no query, handler() throws a 103 error
    */
    it("should throw a BadRequest 103 error if event.query is null or undefined", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given an event with no query.service, handler() throws a 103 error
    */
    it("should throw a BadRequest 103 error if event.query.service is null or undefined", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given an event with no query.domain, handler() throws a 103 error
    */
    it("should throw a BadRequest 103 error if event.query.domain is null or undefined", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given an event with no stage, handler() throws a 106 error
    */
    it("should throw an InternalServerError 106 if event.stage is null or undefined", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given an event with no valid stage, handler() throws a 106 error
    */
    it("should throw an InternalServerError 106 if event.stage is not a valid environment", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given valid input params, handler() should attempt to lookup service in database
    */
    it("should call utils.isServiceExists() if a proper input is made", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given a failed database search attempt, handler() throws a 104 error
    */
    it("should throw an InternalServerError 104 if utils.isServiceExists fails", function(){
      //some functionality
      assert.isTrue(true);
    });

    /*
    * Given a successful database search attempt, handler() provides ResponseObj as data
    */
    it("should return response object as data upon successful utils.isServiceExists call", function(){
      //some functionality
      assert.isTrue(true);
    });

  });

});
