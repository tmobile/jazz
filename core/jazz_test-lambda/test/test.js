// =========================================================================
// Copyright ©  2017 T-Mobile USA, Inc.
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
const AWS = require('aws-sdk-mock');
var context, event;
describe('handler', () => {

  beforeEach(() => {
    event = {
      "method": "POST",
      "stage": "test",
      "query": {
        "service_name": "jazz-service",
        "username": "xyz",
        "last_evaluated_key": undefined
      },
      "body": {
        "functionARN": "arn:aws:lambda:us-east-1:000000000:function:jazz000001-jazztest-test01-prod:3",
        "inputJSON": {
          "name": "applesdadasdasd777"
        }
      }
    }
    context = {};
  })

  it("should throw error if method is not POST", (done) => {
    event.method = "GET";
    index.handler(event, context, (error, records) => {
      error = JSON.parse(error);
      expect(error.message).to.eq("Method not found");
      done();
    });
  })

  it("should throw error if request payload is empty", (done) => {
    event.body = null;
    index.handler(event, context, (error, records) => {
      error = JSON.parse(error);
      expect(error.message).to.eq("Request payload cannot be empty");
      done();
    });
  })

  it("should throw error if function ARN is invalid", (done) => {
    event.body.functionARN = "incorrect ARN";
    index.handler(event, context, (error, records) => {
      error = JSON.parse(error);
      expect(error.message).to.eq("Function ARN is invalid");
      done();
    });
  })

  it("should throw error if Input for function is not defined", (done) => {
    event.body.inputJSON = null;
    index.handler(event, context, (error, records) => {
      error = JSON.parse(error);
      expect(error.message).to.eq("Input for function is not defined");
      done();
    });
  })

  it("should throw error if Input for function is not defined", (done) => {
    event.body.inputJSON = null;
    index.handler(event, context, (error, records) => {
      error = JSON.parse(error);
      expect(error.message).to.eq("Input for function is not defined");
      done();
    });
  })

  it("should call invokeLambda for valid input", (done) => {
    var tempobj = {}
    var invokeLambdaStub = sinon.stub(index, 'invokeLambda').resolves(tempobj);
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(invokeLambdaStub);
      invokeLambdaStub.restore()
      done()
    });
  })

  it("should return execStatus success if lambda execution is succesfull", (done) => {
    var tempobj = {
      "StatusCode": 200,
      "payload": {
        "foo": "sample-value"
      }
    }
    var invokeLambdaStub = sinon.stub(index, 'invokeLambda').resolves(tempobj);
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(invokeLambdaStub);
      expect(records.data.execStatus).to.eq("Success");
      invokeLambdaStub.restore();
      done()
    });
  })

  it("should return execStatus handled error if lambda execution has handled error", (done) => {
    var tempobj = {
      "StatusCode": 200,
      "FunctionError": "Handled",
      "payload": {
        "foo": "sample-value"
      }
    }
    var invokeLambdaStub = sinon.stub(index, 'invokeLambda').resolves(tempobj);
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(invokeLambdaStub);
      expect(records.data.execStatus).to.eq("HandledError");
      invokeLambdaStub.restore();
      done()
    });
  })

  it("should return execStatus Unhandled error if lambda execution has unhandled error", (done) => {
    var tempobj = {
      "StatusCode": 200,
      "FunctionError": "Unhandled",
      "payload": {
        "foo": "sample-value"
      }
    }
    var invokeLambdaStub = sinon.stub(index, 'invokeLambda').resolves(tempobj);
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(invokeLambdaStub);
      expect(records.data.execStatus).to.eq("UnhandledError");
      invokeLambdaStub.restore();
      done()
    });
  })

  it("should return execStatus functionInvocationError if lambda invocationfailed ", (done) => {
    var tempobj = {
      "StatusCode": 404,
      "error": "function invocation failed"
    }
    var invokeLambdaStub = sinon.stub(index, 'invokeLambda').rejects(tempobj);
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(invokeLambdaStub);
      expect(records.data.execStatus).to.eq("FunctionInvocationError");
      invokeLambdaStub.restore();
      done()
    });
  })

  it("should return unknown error message if lambda invocation is succesfull but response has a statuscode not within the acceptable range ", (done) => {
    var tempobj = {
      "StatusCode": 404,
      "error": "function invocation failed"
    }
    var invokeLambdaStub = sinon.stub(index, 'invokeLambda').resolves(tempobj);
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(invokeLambdaStub);
      error = JSON.parse(error);
      expect(error.message).to.eq("Unknown internal error occurred when invoking " + event.body.functionARN);
      invokeLambdaStub.restore();
      done()
    });
  })
})
describe('invokeLambda', () => {

  var functionARN,region,inputJSON;

  beforeEach(() => {
    functionARN = "testARN";
    region = "testRegion";
    inputJSON = {
      "test01": "test-value"
    }
  })

  it("should return data if lambda is succefully invoked", (done) => {
    AWS.mock('Lambda', 'invoke', function (params, callback) {
      callback(null, "successfully invoked lambda");
    });
    index.invokeLambda(functionARN, inputJSON, region).then((data) => {
      expect(data).to.eq("successfully invoked lambda");
      AWS.restore("Lambda");
      done();
    })
  })

  it("should return error if lambda invokation failed", (done) => {
    AWS.mock('Lambda', 'invoke', function (params, callback) {
      callback("failed to invokelambda",null);
    });
    index.invokeLambda(functionARN, inputJSON, region).catch((data) => {
      expect(data).to.eq("failed to invokelambda");
      done();
    })
  })
})


