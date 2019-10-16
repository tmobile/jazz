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

const sinon = require('sinon');
const chai = require('chai');
const assert = require('chai').assert;
const expect = require('chai').expect;
const should = require('chai').should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const request = require('request');
const awsContext = require('aws-lambda-mock-context');
const rp = require('request-promise-native');

const index = require('../index');
const config = require('../components/config');
const testPayloads = require('./response_payloads.js')();
const kinesisPayload = require('./KINESIS_PAYLOAD');

let event, context, configData, authToken;

describe('jazz environment handler tests: ', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    context = awsContext();
    context.functionName = context.functionName + "-test";
    configData = config(context);
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
  it("should return object with paramenter interested_event set to true", () => {
    let event = { "Records": [testPayloads.eventPayload] }
    let record = event.Records[0];
    let sequenceNumber = record.kinesis.sequenceNumber;
    let encodedPayload = record.kinesis.data;
    index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
      assert.isTrue(res.interested_event);
    });
  });

  it("should reject with paramenter interested_event set to false", () => {
    let payload = {
      Item: {
        EVENT_ID: {
          S: '084f8c38-a01b-4ac9-943e-365f5de8ebe4'
        },
        TIMESTAMP: {
          S: '2018-05-16T12:12:42:821'
        },
        REQUEST_ID: {
          NULL: true
        },
        EVENT_HANDLER: {
          S: 'JENKINS'
        },
        EVENT_NAME: {
          S: 'CREATE_DEPLOYMENT'
        },
        SERVICE_NAME: {
          S: 'test-02'
        },
        SERVICE_ID: {
          S: '00001-test-serivice-id-00001'
        },
        EVENT_STATUS: {
          S: 'STARTED'
        },
        EVENT_TYPE: {
          S: 'NOT_SERVICE_DEPLOYMENT'
        },
        USERNAME: {
          S: 'temp@testing.com'
        },
        EVENT_TIMESTAMP: {
          S: '2018-05-16T12:12:41:083'
        },
        SERVICE_CONTEXT: {
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"test01","environment":"","region":"tst-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
      }
    };
    let encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    let sequenceNumber = "test_sequence01";
    let encodedPayload = encoded;
    index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
      assert.isFalse(res.interested_event);
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

  it('Verify processEachEvent for COMMIT_TEMPLATE event failed', () => {
    let event = require('./COMMIT_TEMPLATE');
    const statusCode = testPayloads.apiResponse.statusCode;
    testPayloads.apiResponse.statusCode = 400;
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
    });
    const service = { id: 1, type: "api", service: "test", domain: "tst" }

    index.manageProcessItem(event.Item, service, configData, authToken)
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

    const service = JSON.stringify({ data: { services: [{ id: 1, type: "api", service: "test", domain: "tst" }] } });
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
    });
    const serviceStub = sinon.stub(index, "getServiceDetails").resolves(service);
    const processServiceDetailsStub = sinon.stub(index, "processServiceDetails").resolves({ id: 1, type: "api", service: "test", domain: "tst" });

    index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
      .then((res) => {
        sinon.assert.calledOnce(serviceStub);
        sinon.assert.calledOnce(processServiceDetailsStub);
        processServiceDetailsStub.restore();
        serviceStub.restore();
        requestPromiseStub.restore()
        expect(res.data.message).to.include(resMsg);
      });
  });

  it('Verify processEachEvent for UPDATE_ENVIRONMENT event without logical id', () => {
    let event = require('./UPDATE_ENVIRONMENT_NOLOGICAL_ID');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;
    let resMsg = "Successfully Updated environment for service";

    testPayloads.apiResponse.body.data.environment = [{ 'physical_id': 'master' }];
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
    });
    const service = JSON.stringify({ data: { services: [{ id: 1, type: "api", service: "test", domain: "tst" }] } });
    const serviceStub = sinon.stub(index, "getServiceDetails").resolves(service);
    const processServiceDetailsStub = sinon.stub(index, "processServiceDetails").resolves({ id: 1, type: "api", service: "test", domain: "tst" });
    index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
      .then((res) => {
        sinon.assert.calledTwice(requestPromiseStub);
        sinon.assert.calledOnce(serviceStub);
        sinon.assert.calledOnce(processServiceDetailsStub);
        processServiceDetailsStub.restore();
        serviceStub.restore();
        requestPromiseStub.restore();
        expect(res.data.message).to.include(resMsg);
      });
  });

  it('Verify processEventUpdateEnvironment event returns status of 200', () => {
    let resMsg = "Successfully Updated environment for service";
    let environmentPayload = {};
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
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

    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
    });
    const service = JSON.stringify({ data: { services: [{ id: 1, type: "api", service: "test", domain: "tst" }] } });
    const serviceStub = sinon.stub(index, "getServiceDetails").resolves(service);
    const processServiceDetailsStub = sinon.stub(index, "processServiceDetails").resolves({ id: 1, type: "api", service: "test", domain: "tst" });
    index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
      .then((res) => {
        sinon.assert.calledOnce(requestPromiseStub);
        requestPromiseStub.restore();
        sinon.assert.calledOnce(serviceStub);
        sinon.assert.calledOnce(processServiceDetailsStub);
        processServiceDetailsStub.restore();
        serviceStub.restore();
        expect(res.data.message).to.include(resMsg);
      });
  });

  it('Verify processEachEvent for DELETE_ENVIRONMENT event whith event status as FAILED', () => {
    let event = require('./DELETE_ENVIRONMENT');
    event.Item.EVENT_STATUS.S = 'FAILED';

    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
    });
    const service = { id: 1, type: "api", service: "test", domain: "tst" }

    index.manageProcessItem(event.Item, service, configData, authToken)
      .then((res) => {
        sinon.assert.calledOnce(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.data.message).to.include('Successfully Updated environment for service');
      });
  });

  it('Verify processEachEvent for DELETE_ENVIRONMENT event whith event status as STARTED', () => {
    let event = require('./DELETE_ENVIRONMENT');
    event.Item.EVENT_STATUS.S = 'STARTED';

    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
    });
    const service = { id: 1, type: "api", service: "test", domain: "tst" }

    index.manageProcessItem(event.Item, service, configData, authToken)
      .then((res) => {
        sinon.assert.calledOnce(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.data.message).to.include('Successfully Updated environment for service');
      });
  });

  it('Verify processEachEvent for DELETE_ENVIRONMENT event whith event status as STARTED', () => {
    let event = require('./DELETE_BRANCH');

    testPayloads.apiResponse.body.data.environment = [{ 'physical_id': 'master' }];
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.apiResponse, testPayloads.apiResponse.body);
    });
    const service = { id: 1, type: "api", service: "test", domain: "tst" }

    index.manageProcessItem(event.Item, service, configData, authToken)
      .then((res) => {
        sinon.assert.calledTwice(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.data.message).to.include('Successfully Updated environment for service');
      });
  });

  it('Verify processEachEvent for CREATE_BRANCH event failed', () => {
    let event = require('./CREATE_BRANCH');
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.createBranchError, testPayloads.createBranchError.body);
    });
    const service = { id: 1, type: "api", service: "test", domain: "tst" }

    index.manageProcessItem(event.Item, service, configData, authToken)
      .catch((res) => {
        sinon.assert.calledOnce(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.details).to.include('error');
      });
  });

  it('Verify getEnvironmentLogicalId returns a valid logical Id for a branch', () => {
    let environmentPayload = testPayloads.environmentPayload
    let logical_id = "6knr9d33tt-dev";

    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
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
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
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

    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.processEventUpdateEnvironmentError, JSON.stringify(testPayloads.processEventUpdateEnvironmentError.body));
    });
    const serviceId = "test_id";
    index.processEventUpdateEnvironment(environmentPayload,serviceId, configData, authToken)
      .catch(res => {
        sinon.assert.calledOnce(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.details).to.eql('Error');
      })
  });

  it('Verify processEventCreateBranch rejects when there is an error and statusCode being returned which is not 200', () => {
    let environmentPayload = testPayloads.environmentPayload;
    environmentPayload.logicalId = "6knr9d33tt-dev";

    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.createBranchError, JSON.stringify(testPayloads.createBranchError.body));
    });
    const serviceId = "test_id";
    index.processEventCreateBranch(environmentPayload, serviceId, configData, authToken)
      .catch(res => {
        sinon.assert.calledOnce(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.details).to.eql('error');
      })
  });

  it('Verify processEventInitialCommit rejects when there is an error and statusCode being returned which is not 200', () => {
    let environmentPayload = testPayloads.environmentPayload;

    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.processEventInitialCommitError, JSON.stringify(testPayloads.processEventInitialCommitError.body));
    });
    const serviceID = "test_id";
    index.processEventInitialCommit(environmentPayload,serviceID, configData, authToken)
      .catch(res => {
        sinon.assert.calledTwice(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.details).to.eql('error');
      });
  });

  it('Verify processEventInitialCommit rejects when physical id is different', () => {
    let environmentPayload = testPayloads.environmentPayload;
    environmentPayload.physical_id = "physicalId";
    const serviceID = "test_id";
    index.processEventInitialCommit(environmentPayload,serviceID, configData, authToken)
      .catch(res => {
        expect(res).to.eql(`INITIAL_COMMIT event should be triggered by a master commit. physical_id is ${environmentPayload.physical_id}`);
      });
  });

  it('Verify processEventInitialCommit resolves with statusCode of 200', () => {
    let environmentPayload = testPayloads.environmentPayload;
    environmentPayload.physical_id = 'master';
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.processEventInitialCommitSuccess, testPayloads.processEventInitialCommitSuccess.body);
    });

    const serviceID = "test_id";
    index.processEventInitialCommit(environmentPayload,serviceID, configData, authToken)
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
    let requestPromiseStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, testPayloads.getEnvironmentLogicalId, testPayloads.getEnvironmentLogicalId.body);
    });

    index.processEventDeleteBranch(environmentPayload, configData, authToken)
      .catch(res => {
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
});

describe("getServiceDetails", () => {
  let responseObject, svcPayload, reqStub, handleErrorStub, processRequestStub, getServiceDetailsStub;
  let body = {
    data: {
      services: [{
        id: "00001-test-serivice-id-00001",
        type: "function",
        service: "test",
        domain: "testing"
      }]
    }
  };
  responseObject = {
    statusCode: 200,
    body: JSON.stringify(body)
  };
  svcPayload = {
    headers: {
      'content-type': "application/json",
      'authorization': "abc"
    },
    uri: "temp_uri",
    rejectUnauthorized: false,
    method: "GET"
  };

  beforeEach(() => {
    reqStub = sinon.stub(request, "Request")
    handleErrorStub = sinon.stub(index, "handleError");
    processRequestStub = sinon.stub(index, "processRequest").resolves(responseObject.body);
    getServiceDetailsStub = sinon.stub(index, "getServiceDetails").resolves(responseObject.body);
  });

  afterEach(() => {
    if (processRequestStub) { processRequestStub.restore(responseObject.body); }
    if (reqStub) { reqStub.restore(); }
    if (handleErrorStub) { handleErrorStub.restore(); }
    if (getServiceDetailsStub) { getServiceDetailsStub.restore(responseObject.body); }
  });

  it("should call process Request with svcPayload", () => {
    index.getServiceDetails(svcPayload, configData, "temp_auth").then((obj) => {
      let output = JSON.parse(obj);
      expect(output.data.services[0].service).to.eq("test");
    });
  });

  it("should  call Error Handler function for the response not having bodys", () => {
    let svcPayload = {
      headers: {
        'content-type': "application/json",
        'authorization': "abc"
      },
      rejectUnauthorized: false
    };
    let responseObject = {
      statusCode: 401
    };
    reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    processRequestStub.rejects({
      message: "ProcessRequest Falied"
    });
    index.getServiceDetails(svcPayload).catch((err) => {
      sinon.assert.calledOnce(handleErrorStub);
    });
  });

  it("should return error if processRequest returns unsuccesfull", () => {
    processRequestStub.restore();
    processRequestStub = sinon.stub(index, "processRequest").rejects({
      message: "ProcessRequest Falied"
    });
    index.getServiceDetails(svcPayload, configData, "temp_auth").catch((obj) => {
      expect(obj.message).to.eq("ProcessRequest Falied");
      sinon.assert.calledOnce(processRequestStub);
      processRequestStub.restore();
    });
  });

  it("should  call Error Handler function for error case scenarios (status code!-200)", () => {
    let svcPayload = {
      headers: {
        'content-type': "application/json",
        'authorization': "abc"
      },
      rejectUnauthorized: false
    };
    let responseObject = {
      statusCode: 401,
      body: {
        data: {}
      }
    };
    reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    processRequestStub.rejects({
      message: "ProcessRequest Falied"
    });
    index.getServiceDetails(svcPayload).catch((err) => {
      sinon.assert.calledOnce(handleErrorStub);
    });
  });
});

describe("getTokenRequest", function () {
  let tokenResponseObj;
  beforeEach(() => {
    tokenResponseObj = {
      statusCode: 200,
      body: {
        data: {
          token: "abc"
        }
      }
    };
  });

  it("should return Request token when called", () => {
    let result = index.getTokenRequest(configData);
    expect(result.uri).to.eq(configData.BASE_API_URL + configData.TOKEN_URL);
    expect(result.method).to.eq('post');
  });

  it('getToken should give valid response ', function () {
    let authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
    let getTokenPromise = index.getTokenRequest(configData);
    expect(rp(getTokenPromise).then((res) => {
      return res.statusCode;
    })).to.become(200);
    authStub.restore();
  });

  it('getToken should give invalid response for invalid status code', function () {
    tokenResponseObj.statusCode = 400;
    let authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
    let getTokenPromise = index.getTokenRequest(configData);
    expect(rp(getTokenPromise).then((res) => {
      return res.statusCode;
    })).to.become(400);
    authStub.restore();
  });
});

describe("getAuthResponse", () => {
  let tokenResponseObj;
  beforeEach(() => {
    tokenResponseObj = {
      statusCode: 200,
      body: {
        data: {
          token: "abc"
        }
      }
    };
  });

  it("should give return auth token when called with valid parameters", () => {
    let result = {
      statusCode: 200,
      body: {
        data: {
          "token": "ghd93-3240-2343"
        }
      }
    };
    index.getAuthResponse(result).then((auth) => {
      expect(auth).to.eq(result.body.data.token);
    });
  });

  it("should give error message when authentication fails ", () => {
    let result = {
      statusCode: 401,
      body: {}
    };
    index.getAuthResponse(result).catch((err) => {
      expect(err.message).to.eq('Invalid token response from API');
    });
  });

  it('should return success promise for response data with status code 200', function () {
    let validate = index.getAuthResponse(tokenResponseObj);
    expect(validate.then(function (res) {
      return res;
    })).to.become(tokenResponseObj.body.data.token);
  });

  it('should reject for response data with status code 400', function () {
    tokenResponseObj.statusCode = 400;
    let message = "Invalid token response from API";
    let validate = index.getAuthResponse(tokenResponseObj);
    expect(validate.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
  });

  it('should reject for response data with out response.body', function () {
    tokenResponseObj.body = {};
    let message = "Invalid token response from API";
    let validate = index.getAuthResponse(tokenResponseObj);
    expect(validate.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
  });

  it('should reject for response  with out response.body.data', function () {
    tokenResponseObj.body.data = null;
    let message = "Invalid token response from API";
    let validate = index.getAuthResponse(tokenResponseObj);
    expect(validate.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
  });
});

describe('handler', () => {
  let sandbox, requestPromiseStub, processRequestStub, getServiceDetailsStub, triggerBuildJobStub, processBuildStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    context = awsContext();
    context.functionName = context.functionName + "-test";
    configData = config(context);
    authToken = testPayloads.tokenResponseObj200.body.data.token;
    requestPromiseStub = sinon.stub(request, "Request");
    processRequestStub = sinon.stub(index, "processRequest");
    getServiceDetailsStub = sinon.stub(index, "getServiceDetails");
    triggerBuildJobStub = sinon.stub(index, "triggerBuildJob");
    processBuildStub = sinon.stub(index, "processBuild");
  });

  afterEach(() => {
    sandbox.restore();
    if (requestPromiseStub) { requestPromiseStub.restore(); }
    if (processRequestStub) { processRequestStub.restore(); }
    if (getServiceDetailsStub) { getServiceDetailsStub.restore(); }
    if (triggerBuildJobStub) { triggerBuildJobStub.restore(); }
    if (processBuildStub) { processBuildStub.restore(); }
  });

  it('handleError should return error response json for valid input', function () {
    let errorJson = { "failure_code": 400, "failure_message": "Unauthorized" };
    let handleError = index.handleError(400, "Unauthorized");
    assert(handleError, errorJson);
  });

  it('handleProcessedEvents should push valid events', function () {
    let event = { "Records": [testPayloads.eventPayload] }
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let handleProcessedEvents = index.handleProcessedEvents(encodedPayload, sequenceNumber);
    expect(index.getEventProcessStatus()).to.have.property('processed_events');
  });

  it('handleFailedEvents should push valid events', function () {
    let event = { "Records": [testPayloads.eventPayload] }
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let handleFailedEvents = index.handleFailedEvents(encodedPayload, sequenceNumber, "101", "failure");
    expect(index.getEventProcessStatus()).to.have.property('failed_events');
  });

  it('getEventProcessStatus should return failed/processed records length', function () {
    expect(index.getEventProcessStatus()).to.have.property('processed_events');
    expect(index.getEventProcessStatus()).to.have.property('failed_events');
    expect(index.getEventProcessStatus()).to.not.have.property('some_key');
  });
  it('checkForInterestedEvents should resolve for valid input', function () {
    let event = { "Records": [testPayloads.eventPayload] }
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let checkForInterestedEvents = index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData);
    expect(checkForInterestedEvents.then(function (res) {
      return res.interested_event;
    })).to.become(true);
  });

  it('checkForInterestedEvents should resolve with valid response for valid input', function () {
    let event = { "Records": [testPayloads.eventPayload] }
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let checkForInterestedEvents = index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData);
    expect(checkForInterestedEvents.then((res) => {
      return res;
    })).to.eventually.have.property('payload');
  });

  it('Verify processEachEvent for CREATE_BRANCH event', () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;
    let resMsg = "success";
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };

    requestPromiseStub.onFirstCall().callsFake((obj) => {
      return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
    });

    requestPromiseStub.onSecondCall().callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    processRequestStub.resolves(responseObject.body);
    getServiceDetailsStub.resolves(responseObject.body);
    triggerBuildJobStub.resolves();
    processBuildStub.resolves();
    let processEventCreateBranchStub = sinon.stub(index, "processEventCreateBranch").resolves(testPayloads.createBranchSuccess.body);

    index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
      .then((res) => {
        sinon.assert.calledOnce(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.data.result).to.include(resMsg);
        processEventCreateBranchStub.restore();
      });
  });

  it('Verify processEachEvent for COMMIT_TEMPLATE event', () => {
    let event = require('./COMMIT_TEMPLATE');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;
    let resMsg = "Stage and Prod environments are created successfully";
    requestPromiseStub.onFirstCall().callsFake((obj) => {
      return obj.callback(null, testPayloads.envCreationResponseSuccess, testPayloads.envCreationResponseSuccess.body);
    });
    requestPromiseStub.onSecondCall().callsFake((obj) => {
      return obj.callback(null, testPayloads.envCreationResponseSuccess, testPayloads.envCreationResponseSuccess.body);
    });

    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(responseObject.body);
    getServiceDetailsStub.resolves(responseObject.body);
    triggerBuildJobStub.resolves();
    processBuildStub.resolves();
    let processEventInitialCommitStub = sinon.stub(index, "processEventInitialCommit").resolves(testPayloads.envCreationResponseSuccess.body);

    index.processEachEvent(kinesisPayload.Records[0], configData, authToken)
      .then((res) => {
        sinon.assert.calledTwice(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res.message).to.include(resMsg);
        processEventInitialCommitStub.restore();
      });
  });

  it('Verify processEvents is able to create enviroments', () => {
    let event = { "Records": [testPayloads.eventPayload] }

    requestPromiseStub.onFirstCall().callsFake((obj) => {
      return obj.callback(null, testPayloads.processEventInitialCommitSuccess, testPayloads.processEventInitialCommitSuccess.body);
    });
    requestPromiseStub.onSecondCall().callsFake((obj) => {
      return obj.callback(null, testPayloads.processEventInitialCommitSuccess, testPayloads.processEventInitialCommitSuccess.body);
    });

    index.processEvents(event, configData, authToken)
      .then(res => {
        sinon.assert.calledTwice(requestPromiseStub);
        requestPromiseStub.restore();
        expect(res[0].message).to.eql('Stage and Prod environments are created successfully');
      });
  });
  it('handleError should return error response json for valid input', function () {
    let errorJson = { "failure_code": 400, "failure_message": "Unauthorized" };
    let handleError = index.handleError(400, "Unauthorized");
    assert(handleError, errorJson);
  });

  it('handleProcessedEvents should push valid events', function () {
    let event = { "Records": [testPayloads.eventPayload] }
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let handleProcessedEvents = index.handleProcessedEvents(encodedPayload, sequenceNumber);
    expect(index.getEventProcessStatus()).to.have.property('processed_events');
  });

  it('handleFailedEvents should push valid events', function () {
    let event = { "Records": [testPayloads.eventPayload] }
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let handleFailedEvents = index.handleFailedEvents(encodedPayload, sequenceNumber, "101", "failure");
    expect(index.getEventProcessStatus()).to.have.property('failed_events');
  });

  it('getEventProcessStatus should return failed/processed records length', function () {
    expect(index.getEventProcessStatus()).to.have.property('processed_events');
    expect(index.getEventProcessStatus()).to.have.property('failed_events');
    expect(index.getEventProcessStatus()).to.not.have.property('some_key');
  });

  it('handler should fail for invalid authentication', function () {
    let event = { "Records": [testPayloads.eventPayload] }
    let responseObject = {
      statusCode: 400,
      body: { "message": "unautho" }
    };

    let authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(responseObject));
    requestPromiseStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    index.handler(event, context, (err, res) => {
      res.should.have.property('processed_events');
      return res;
    });

    authStub.restore();
    requestPromiseStub.restore();
  });

  it('handler should resolve for not interested events', function () {
    let event = { "Records": [testPayloads.eventPayload] }
    let responseObject = {
      statusCode: 400,
      body: { "message": "unautho" }
    };

    let authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(responseObject));
    requestPromiseStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    let message = 'User is not authorized to access this service';
    index.handler(event, context, (err, res) => {
      res.should.have.property('failed_events');
      return res;
    });

    authStub.restore();
    requestPromiseStub.restore();
  });


  it('handler should resolve with valid response', function () {
    let event = require('./CREATE_BRANCH');

    let responseObject = {
      statusCode: 200,
      body: {
        data: {
          "id": "ghd93-3240-2343"
        }
      }
    };

    let authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(responseObject));
    requestPromiseStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    index.handler(event, context, (err, res) => {
      res.should.have.property('processed_events');
      return res;
      authStub.restore();
    });
  });

  it('should indicate error if status code not equal to 200', () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;
    let responseObject = {
      statusCode: 400,
      body: { message: "Error fetching service" }
    };
    requestPromiseStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    let processEvents = index.processEvents(kinesisPayload.Records[0], configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });

  it("getServiceDetails will give valid response with svcPayload", () => {
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    let svcPayload = {
      headers: {
        'content-type': "application/json",
        'authorization': "abc"
      },
      uri: "temp_uri",
      rejectUnauthorized: false,
      method: "GET"
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);

    index.getServiceDetails(svcPayload, configData, "temp_auth").then((obj) => {
      let output = JSON.parse(obj);
      expect(output.data.services[0].id).to.eq("00001-test-serivice-id-00001");
    });
  });

  it('should indicate error if service look up fails', () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    let responseObject = {
      statusCode: 200,
      body: {}
    };
    requestPromiseStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    let processEvents = index.processEvents(kinesisPayload.Records[0], configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });

  it('should return error if service look up fails with status 500', () => {
    let responseObject = {
      statusCode: 500,
      body: {}
    };
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    requestPromiseStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    let processEvents = index.processEvents(kinesisPayload.Records[0], configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });

  it("should give success message if jenkins job triggered successfully for create branch", () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    let jenkins_job_responseObject = {
      statusCode: 200,
      body: { message: "success" }
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);

    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
      }
    });

    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.resolve;
  });

  it("should give success message if jenkins job triggered successfully with response status code 201", () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    let jenkins_job_responseObject = {
      statusCode: 201,
      body: { message: "success" }
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);
    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.resolve;
  });

  it("should give success message if jenkins job triggered successfully for commit", () => {
    let event = require('./COMMIT_TEMPLATE');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    let jenkins_job_responseObject = {
      statusCode: 200,
      body: { message: "success" }
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);
    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.resolve;
  });

  it("should give error if jenkins job triggering fails with status code 500", () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;
    let jenkins_job_responseObject = {
      statusCode: 500,
      body: {}
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);
    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });

  it("should give error if jenkins job triggering fails with status code 404", () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;
    let jenkins_job_responseObject = {
      statusCode: 404,
      body: {}
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);

    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });

  it("should give error if jenkins job triggering fails with status code 401", () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;
    let jenkins_job_responseObject = {
      statusCode: 401,
      body: { message: "401 UNAUTHORIZED Jenkins Job Not triggered" }
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);

    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });

  it("should give success message if jenkins job triggered successfully for initial commit", () => {
    let event = require('./COMMIT_TEMPLATE');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    let jenkins_job_responseObject = {
      statusCode: 200,
      body: { message: "success" }
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);

    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.processEventInitialCommitSuccess, testPayloads.processEventInitialCommitSuccess.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.resolve;
  });

  it("should failed to trigger jenkins job while service look up fails", () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    let jenkins_job_responseObject = {
      statusCode: 201,
      body: { message: "success" }
    };
    let body = {};
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);
    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.createBranchSuccess, testPayloads.createBranchSuccess.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });

  it("should failed to trigger jenkins job while create branch fails", () => {
    let event = require('./CREATE_BRANCH');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    let jenkins_job_responseObject = {
      statusCode: 201,
      body: { message: "success" }
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);
    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.createBranchError, testPayloads.createBranchError.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });
  it("should failed to trigger jenkins job while initial commit fails", () => {
    let event = require('./COMMIT_TEMPLATE');
    let event_BASE64 = new Buffer(JSON.stringify(event)).toString("base64");
    kinesisPayload.Records[0].kinesis.data = event_BASE64;

    let jenkins_job_responseObject = {
      statusCode: 201,
      body: { message: "success" }
    };
    let body = {
      data: {
        services: [{
          id: "00001-test-serivice-id-00001",
          type: "function",
          service: "test",
          domain: "testing"
        }]
      }
    };
    let service_responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    processRequestStub.resolves(service_responseObject.body);
    getServiceDetailsStub.resolves(service_responseObject.body);
    requestPromiseStub.callsFake((obj) => {
      if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/prod/jazz/services?service=test-env-oss-3&domain=jazztesting&isAdmin=true") {
        return obj.callback(null, service_responseObject, service_responseObject.body);
      } else if (obj.url == "{conf-jenkins-host}/job/build-pack-function/buildWithParameters?token={job_token}&service_name=test&domain=testing&scm_branch=master") {
        return obj.callback(null, jenkins_job_responseObject, jenkins_job_responseObject.body);
      } else if (obj.uri == "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/environments") {
        return obj.callback(null, testPayloads.processEventInitialCommitError, testPayloads.processEventInitialCommitError.body);
      }
    });
    let processEvents = index.processEvents(kinesisPayload, configData, "token");
    expect(processEvents.then(function (res) {
      return res;
    })).to.be.rejected;
  });
});

describe("getSvcPayload", () => {
  let svcPayload;
  beforeEach(() => {
    svcPayload = {
      token: "tempToken",
      uri: "apiEndpoint",
      method: "GET"
    }
  });

  it("should return payload with values passed by getSvcPayload", () => {
    let payload = index.getSvcPayload("GET", null, "apiEndpoint", "tempToken");
    expect(payload.uri).to.eq(svcPayload.uri);
    expect(payload.headers.authorization).to.eq(svcPayload.token);
    expect(payload.method).to.eq(svcPayload.method);
  });


  it("should return invalid payload with json data by getSvcPayload", () => {
    svcPayload.method = "POST";
    let payload = index.getSvcPayload("GET", null, "apiEndpoint", "tempToken");
    expect(payload.uri).to.eq(svcPayload.uri);
    expect(payload.headers.authorization).to.eq(svcPayload.token);
    expect(payload.method).to.not.eq(svcPayload.method);
  });

  it("should return payload with json data for POST passed by getSvcPayload", () => {
    let data = { "service_name": "test", "domain": "tt" };
    svcPayload.data = data;
    svcPayload.method = "POST";
    let payload = index.getSvcPayload("POST", data, "apiEndpoint", "tempToken");
    expect(payload.uri).to.eq(svcPayload.uri);
    expect(payload.headers.authorization).to.eq(svcPayload.token);
    expect(payload.method).to.eq(svcPayload.method);
    expect(payload.json).to.eq(svcPayload.data);
  });
});

describe("processRequest", () => {
  it("should make a request with svcpayload and resolve the response body for success scenario", () => {
    let svcPayload = {
      headers: {
        'content-type': "application/json",
        'authorization': "abc"
      },
      rejectUnauthorized: false
    };
    let responseObject = {
      statusCode: 200,
      body: {
        data: {}
      }
    };
    let reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    index.processRequest(svcPayload).then((obj) => {
      expect(obj).not.null;
      reqStub.restore();
    });
  });

  it("should make a request with svcpayload and resolve the response body for error scenario", () => {
    let svcPayload = {
      headers: {
        'content-type': "application/json",
        'authorization': "abc"
      },
      rejectUnauthorized: false
    };
    let responseObject = {
      statusCode: 500,
      body: {
        data: {}
      }
    };
    let reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    expect(index.processRequest(svcPayload).then((obj) => {
      reqStub.restore();
    })).to.be.rejected;
  });
});
