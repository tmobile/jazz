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
const request = require('request');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const logger = require("../components/logger.js");
var event = {
    "method": "GET",
    "stage": "test",
    "query": {
        "service_name": "jazz-service",
        "username": "xyz",
        "last_evaluated_key": undefined
    },
    "body": {
      "functionARN": "arn:aws:lambda:us-east-1:192006145812:function:jazz20180621-jazztest-test01-prod:3",
      "inputJSON" : {
        "name":"applesdadasdasd777"
      }
    }
}
var context = awsContext();


describe('handler',()=>{
  it("should throw error if method is not POST",()=>{
    index.handler(event,context,(error,records)=>{
      console.log(error);
      expect(error).to.be.null
    })
  })
})
