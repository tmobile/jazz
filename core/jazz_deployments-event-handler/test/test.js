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
const configModule = require("../components/config.js");
const rp = require('request-promise-native');
const utils = require("../components/utils.js");
var reqStub;
var event = {
  "Records": [{
    "kinesis": {
      "kinesisSchemaVersion": "1.0",
      "partitionKey": "VALIDATE_INPUT",
      "sequenceNumber": "49584481860528260622422554690105735408360629197594427394",
      "data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiIwODRmOGMzOC1hMDFiLTRhYzktOTQzZS0zNjVmNWRlOGViZTQifSwiVElNRVNUQU1QIjp7IlMiOiIyMDE4LTA1LTE2VDEyOjEyOjQyOjgyMSJ9LCJSRVFVRVNUX0lEIjp7Ik5VTEwiOnRydWV9LCJFVkVOVF9IQU5ETEVSIjp7IlMiOiJKRU5LSU5TIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNSRUFURV9ERVBMT1lNRU5UIn0sIlNFUlZJQ0VfTkFNRSI6eyJTIjoidGVzdC0wMiJ9LCJTRVJWSUNFX0lEIjp7IlMiOiIwOWVkMzI3OS1jOGI5LWUzNjAtMmE3OC00ZTFlZDA5M2U2YTcifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVQTE9ZTUVOVCJ9LCJVU0VSTkFNRSI6eyJTIjoic2VydmVybGVzc0B0LW1vYmlsZS5jb20ifSwiRVZFTlRfVElNRVNUQU1QIjp7IlMiOiIyMDE4LTA1LTE2VDEyOjEyOjQxOjA4MyJ9LCJTRVJWSUNFX0NPTlRFWFQiOnsiUyI6IntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJicmFuY2hcIjpcIlwiLFwicnVudGltZVwiOlwibm9kZWpzXCIsXCJkb21haW5cIjpcImphenp0ZXN0XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmF3czppYW06OjE5MjAwNjE0NTgxMjpyb2xlL2dpdGxhYjE4MDUxNV9sYW1iZGEyX2Jhc2ljX2V4ZWN1dGlvbl8xXCIsXCJlbnZpcm9ubWVudFwiOlwiXCIsXCJyZWdpb25cIjpcInVzLWVhc3QtMVwiLFwibWVzc2FnZVwiOlwiaW5wdXQgdmFsaWRhdGlvbiBzdGFydHNcIixcImNyZWF0ZWRfYnlcIjpcInNlcnZlcmxlc3NAdC1tb2JpbGUuY29tXCJ9In19fQ==",
      "approximateArrivalTimestamp": 1526472764.125
    },
    "eventSource": "aws:kinesis",
    "eventVersion": "1.0",
    "eventID": "shardId-000000000000:49584481860528260622422554690105735408360629197594427394",
    "eventName": "aws:kinesis:record",
    "invokeIdentityArn": "arn:aws:iam::12345678:role/gitlabtest10001_test01",
    "awsRegion": "us-east-1",
    "eventSourceARN": "arn:aws:kinesis:us-east-1:100000002:teststream/gitlab10001-events-hub-prod"
  }]
};
var context = {
  "callbackWaitsForEmptyEventLoop": true,
  "logGroupName": "/aws/lambda/gitlab1234567-test-name",
  "logStreamName": "2018/05/16/temp_test0000012910",
  "functionName": "gitlab001-test-services-handler-prod",
  "memoryLimitInMB": "256",
  "functionVersion": "$LATEST",
  "invokeid": "00001-test-000001",
  "awsRequestId": "00001-test-000001",
  "invokedFunctionArn": "arn:aws:lambda:us-east-1:100000001:function:gitlab001-test-services-handler-prod"
};
var configData = configModule.getConfig(event, context);
describe("getTokenRequest", function () {
  it("should return Request token when called", () => {
    let result = utils.getTokenRequest(configData);
    expect(result.uri).to.eq(configData.BASE_API_URL + configData.TOKEN_URL);
    expect(result.method).to.eq('post');
  })
})
describe("getAuthResponse", () => {
  beforeEach(() => {
    var result = {
      uri: configData.BASE_API_URL + configData.TOKEN_URL,
      method: 'post',
      json: {
        "username": configData.SERVICE_USER,
        "password": configData.TOKEN_CREDS
      },
      rejectUnauthorized: false,
      transform: (body, response, resolveWithFullResponse) => {
        return response;
      }
    };
  })
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

});
describe("checkforInterestedEvents", () => {
  it("should return object with parameter interested_event set to true", () => {
    var record = event.Records[0];
    var sequenceNumber = record.kinesis.sequenceNumber;
    var encodedPayload = record.kinesis.data;
    utils.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
      assert.isTrue(res.interested_event);
    });
  });
  it("should reject with parameter interested_event set to false", () => {
    var payload = {
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
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
      }
    };
    var encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    var sequenceNumber = "test_sequence01";
    var encodedPayload = encoded;
    utils.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
      assert.isFalse(res.interested_event);
    });
  });
});
describe("processEventRecords", () => {
  var  procesEventRecordStub;
  beforeEach(() => {

  });
  afterEach(() => {
    if (procesEventRecordStub) {
      procesEventRecordStub.restore();
    }
  });
  it("should resolve all for success scenario from processEventRecord",()=>{
    procesEventRecordStub = sinon.stub(index, "processEventRecord").resolves({
      "status":"succesfully processed Event Rcord"
    });
    index.processEventRecords(event,configData,"temp_auth").then((obj)=>{
      sinon.assert.calledOnce(procesEventRecordStub)
      for(let i=0;i<obj.length;i++){
        expect(obj[i].status).to.eq("succesfully processed Event Rcord")
      }
      procesEventRecordStub.restore();
    });
  });
  it("should reject all for Error case scenario from processEventRecord",()=>{
    procesEventRecordStub = sinon.stub(index, "processEventRecord").rejects({
      "status":"Process Event Record failed"
    });
    index.processEventRecords(event,configData,"temp_auth").catch((err)=>{
      sinon.assert.calledOnce(procesEventRecordStub)
      expect(err.status).to.eq("Process Event Record failed");
      procesEventRecordStub.restore()
    });
  });
});
describe("processEventRecord", () => {
  var payload;
  beforeEach(() => {
    payload = {
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
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
      }
    };
  });
  afterEach(() => {
    if (reqStub) {
      reqStub.restore();
    }
  });
  it("should call processEvent for intrested events", () => {
    let message = "Succesfully Updated Creation Event"
    let responseObject = {
      statusCode: 200,
      body: {
        data: {
          message: message
        }
      }
    };
    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    var checkForInterestedEventsStub = sinon.stub(utils, "checkForInterestedEvents").resolves({
      "interested_event": true,
      "payload": payload.Item
    });
    var processEventStub = sinon.stub(index, "processEvent")
    var tempAuth = "Auth_token"
    index.processEventRecord(event.Records[0], configData, tempAuth).then((obj) => {
      sinon.assert.calledOnce(processEventStub)
      checkForInterestedEventsStub.restore()
      processEventStub.restore()
    })
  })
  it("should Return success message when called with valid paramenters", () => {
    let message = "Succesfully Updated Creation Event"
    let responseObject = {
      statusCode: 200,
      body: {
        data: {
          message: message
        }
      }
    };
    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    })
    var checkForInterestedEventsStub = sinon.stub(utils, "checkForInterestedEvents").resolves({
      "interested_event": true,
      "payload": payload.Item
    })
    var tempAuth = "Auth_token"
    index.processEventRecord(event.Records[0], configData, tempAuth).then((obj) => {

      expect(obj).to.not.eq(null);
      expect(obj.data.message).to.eq(message)
      reqStub.restore()
      checkForInterestedEventsStub.restore()
    })
  })
  it("should return error message for not intrested events", () => {
    var message = "Not an interesting event";
    var checkForInterestedEventsStub = sinon.stub(utils, "checkForInterestedEvents").resolves({
      "interested_event": false,
      "payload": payload.Item
    })
    var tempAuth = "Auth_token";
    index.processEventRecord(event.Records[0], configData, tempAuth).then((obj) => {
      expect(obj.message).to.eq(message)
      sinon.assert.calledOnce(checkForInterestedEventsStub)
    })
  })
})
describe("getDeploymentPayload", () => {
  var svcContext;
  beforeEach(() => {
    svcContext = {
      "service_type": "api",
      "branch": "",
      "runtime": "nodejs",
      "domain": "jazztest",
      "iam_role": "arn:aws:iam::12345678:role/gitlabtest10001_test01",
      "environment": "",
      "region": "us-east-1",
      "message": "input validation starts",
      "created_by": "temp@testing.com",
      "environment_logical_id": "prod",
      "provider_build_url": "http://temp_testing/dccdw.com",
      "provider_build_id": "temp_build_id",
      "scm_commit_hash": "cdwcdwcdwcdcdc",
      "scm_url": "http://temp_testing/dccdw.com",
      "scm_branch": "master",
      "status": "in_progress",
      "request_id": "temp-reqid-0001"
    }
  })
  it("should return deploymentPayload with values passed by svcContext", () => {
    var deploymentPayload = utils.getDeploymentPayload(svcContext)
    expect(deploymentPayload.domain).to.eq(svcContext.domain);
    expect(deploymentPayload.environment_logical_id).to.eq(svcContext.environment_logical_id);
    expect(deploymentPayload.provider_build_id).to.eq(svcContext.provider_build_id);
    expect(deploymentPayload.provider_build_url).to.eq(svcContext.provider_build_url);
    expect(deploymentPayload.scm_commit_hash).to.eq(svcContext.scm_commit_hash);
    expect(deploymentPayload.scm_url).to.eq(svcContext.scm_url);
    expect(deploymentPayload.scm_branch).to.eq(svcContext.scm_branch);
    expect(deploymentPayload.request_id).to.eq(svcContext.request_id);
    expect(deploymentPayload.status).to.eq(svcContext.status);
  })
})
describe("processRequest", () => {
  afterEach(() => {
    if (reqStub) {
      reqStub.restore();
    }
  })
  it("should make a request with svcpayload and resolve the response body for success scenario", () => {
    var svcPayload = {
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
    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    index.processRequest(svcPayload).then((obj) => {
      expect(obj).not.null;
    })
  })
  it("should  call Error Handler function for error case scenarios (status code!-200)", () => {
    var svcPayload = {
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
    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    var handleErrorStub = sinon.stub(utils, "handleError")
    index.processRequest(svcPayload).catch((err) => {
      sinon.assert.calledOnce(handleErrorStub);
      handleErrorStub.restore()
    });
  })
})
describe("processCreateEvent", () => {
  var payload;
  beforeEach(() => {
    payload = {
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
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
      }
    }
  });
  afterEach(() => {
    if (reqStub) {
      reqStub.restore();
    }
  });
  it("should call processRequest with SvcPayload", () => {
    var processRequestStub = sinon.stub(index, "processRequest").resolves({
      x: 1
    })
    index.processCreateEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(processRequestStub)
      processRequestStub.restore()
    })
  });
  it("should call processRequest with SvcPayload and handle error when processRequest fails ", () => {
    var processRequestStub = sinon.stub(index, "processRequest").rejects({
      message: "process request failed"
    })
    index.processCreateEvent(payload.Item, configData, "tempAuth").catch((err) => {
      sinon.assert.calledOnce(processRequestStub)
      expect(err.message).to.eq("process request failed");
      processRequestStub.restore()
    })
  });
})
describe("processUpdateEvent", () => {
  var payload,temp;
  beforeEach(() => {
    temp = {
      "x": 1
    };

    payload = {
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
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
      }
    }
  })
  afterEach(() => {
    if (reqStub) {
      reqStub.restore();
    }
  })
  it("should call getDeployments for true case scenarios", () => {

    var getDeploymentsStub = sinon.stub(index, "getDeployments").resolves(temp);
    var updateDeploymentsStub = sinon.stub(index, "updateDeployments").resolves(temp);
    index.processUpdateEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(getDeploymentsStub)
      getDeploymentsStub.restore()
      updateDeploymentsStub.restore()
    })
  });
  it("should call updateDeployments when getDeployment resolves the promise and returns result", () => {

    var getDeploymentsStub = sinon.stub(index, "getDeployments").resolves(temp);
    var updateDeploymentsStub = sinon.stub(index, "updateDeployments").resolves(temp);
    index.processUpdateEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(updateDeploymentsStub);
      getDeploymentsStub.restore();
      updateDeploymentsStub.restore();
    })
  });
  it("should return error  when updateDeployment resolves the promise and returns result", () => {

    var getDeploymentsStub = sinon.stub(index, "getDeployments").resolves(temp)
    var updateDeploymentsStub = sinon.stub(index, "updateDeployments").rejects(temp)
    index.processUpdateEvent(payload.Item, configData, "tempAuth").catch((obj) => {
      assert.isNotNull(obj);
      sinon.assert.calledOnce(updateDeploymentsStub);
      sinon.assert.calledOnce(getDeploymentsStub);
      getDeploymentsStub.restore();
      updateDeploymentsStub.restore();
    })
  });
})
describe("getDeployments", () => {
  var deploymentPayload
  beforeEach(() => {
    deploymentPayload = {
      domain: 'jazztest',
      service_id: '00001-test-serivice-id-00001',
      service: 'test-02',
      environment_logical_id: 'temp_env_ID'
    }
  });
  it("should call process Events with deploymentpayload", () => {
    var processRequestStub = sinon.stub(index, "processRequest").resolves({
      x: 1
    })
    index.getDeployments(deploymentPayload, configData, "temp_auth").then((obj) => {
      sinon.assert.calledOnce(processRequestStub);
      processRequestStub.restore();

    });
  })
  it("should return error if processEvents returns unsuccesfull", () => {
    var processRequestStub = sinon.stub(index, "processRequest").rejects({
      message: "ProcessRequest Falied"
    });
    index.getDeployments(deploymentPayload, configData, "temp_auth").catch((obj) => {
      expect(obj.message).to.eq("ProcessRequest Falied");
      sinon.assert.calledOnce(processRequestStub);
      processRequestStub.restore();
    })
  })
  it("should throw error is enviornment_id is not defined in deploymentpayload passed", () => {

    deploymentPayload.environment_logical_id = undefined;
    index.getDeployments(deploymentPayload, configData, "temp_auth").catch((err) => {
      expect(err.failure_message).to.eq("Environment logical id is not defined");
    })
  })
})
describe("updateDeployments", () => {
  var res, deploymentpayload;
  beforeEach(() => {
    deploymentPayload = {
      domain: 'jazztest',
      service_id: '00001-test-serivice-id-00001',
      service: 'test-02',
      environment_logical_id: 'temp_env_ID',
      provider_build_url: "http://temp_testing/dccdw.com",
      provider_build_id: "temp_build_id",
      request_id: "temp-reqid-0001"
    };
    res = {
      "data": {
        "deployments": [{
          "deployment_id": "Temp_ID",
          "service_id": "00001-test-serivice-id-00001",
          "service": "deployments",
          "domain": "jazz",
          "environment_logical_id": "prod",
          "provider_build_url": "http://temp_testing/dccdw.com",
          "provider_build_id": "temp_build_id",
          "scm_commit_hash": "cdwcdwcdwcdcdc",
          "scm_url": "http://temp_testing/dccdw.com",
          "scm_branch": "master",
          "status": "in_progress",
          "request_id": "temp-reqid-0001"
        }]
      }
    };
  })

  it("should call processRequest for success scenario ", () => {
    var processRequestStub = sinon.stub(index, "processRequest").resolves({
      x: 1
    });
    index.updateDeployments(JSON.stringify(res), deploymentPayload, configData, "temp_auth").then((obj) => {
      sinon.assert.calledOnce(processRequestStub);
      processRequestStub.restore();
    })

  })
  it("should call return error if  processRequest is unsucesfull", () => {
    var processRequestStub = sinon.stub(index, "processRequest").rejects({
      message: "Process Request failed"
    });
    index.updateDeployments(JSON.stringify(res), deploymentPayload, configData, "temp_auth").catch((err) => {
      sinon.assert.calledOnce(processRequestStub);
      expect(err.message).to.eq("Process Request failed");
      processRequestStub.restore();
    })
  })
  it("should return error if deployment id is not defined", () => {
    res.data.deployments[0].deployment_id = undefined;
    index.updateDeployments(JSON.stringify(res), deploymentPayload, configData, "temp_auth").catch((err) => {
      expect(err.failure_message).to.eq('Deployment details not found!');
    });
  })
  it("should return error if deployments array is empty", () => {

    res.data.deployments = undefined;

    index.updateDeployments(JSON.stringify(res), deploymentPayload, configData, "temp_auth").catch((err) => {
      expect(err.failure_message).to.eq('Deployment details not found!');
    });
  })
})
describe("processEvent",()=>{
  var payload,tempobj,errObj
  beforeEach(()=>{
    payload = {
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
          S: 'UPDATE_DEPLOYMENT'
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
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
    }
    tempobj = {
      temp_param :"temp_param"
    }
    errObj ={
      message :"Process Failed"
    }
  })
  it("should call processCreateEvent when the event is create_deployment",()=>{
    payload.EVENT_NAME.S =  "CREATE_DEPLOYMENT";
    var processCreateEventStub = sinon.stub(index,'processCreateEvent').resolves(tempobj);
    index.processEvent(payload,configData,"temp_auth").then(()=>{
      sinon.assert.calledOnce(processCreateEventStub);
      processCreateEventStub.restore();
    })
  })
  it("should throw error when processCreateEvent returns error when the event is create_deployment",()=>{
    payload.EVENT_NAME.S =  "CREATE_DEPLOYMENT";
    var processCreateEventStub = sinon.stub(index,'processCreateEvent').rejects(errObj);
    index.processEvent(payload,configData,"temp_auth").catch((err)=>{
      sinon.assert.calledOnce(processCreateEventStub);
      expect(err.message).to.eq(errObj.message);
      processCreateEventStub.restore();
    })
  })
  it("should call processUpdateEvent when the event is create_deployment",()=>{
    var processUpdateEventStub = sinon.stub(index,'processUpdateEvent').resolves(tempobj);
    index.processEvent(payload,configData,"temp_auth").then(()=>{
      sinon.assert.calledOnce(processUpdateEventStub);
      processUpdateEventStub.restore();
    })
  })
  it("should throw an error when processUpdateEvent returns error ,and the event is create_deployment",()=>{
    var processUpdateEventStub = sinon.stub(index,'processUpdateEvent').rejects(errObj);
    index.processEvent(payload,configData,"temp_auth").catch((err)=>{
      sinon.assert.calledOnce(processUpdateEventStub);
      expect(err.message).to.eq(errObj.message);
      processUpdateEventStub.restore();
    })
  })
  it("should return error if service context is not defined in the payload",()=>{
    payload.SERVICE_CONTEXT =  undefined;
    index.processEvent(payload,configData,"temp_auth").catch((err)=>{
    expect(err.failure_message).to.eq("Service context is not defined");

  })
})

})
describe("handler",()=>{
  result = {
    result: "sample Resopnse"
  }
  record = {
		"processed_events": 3,
		"failed_events": 1
  }
  error ={
    message: "sample error message"
  }
  var rpStub,getTokenRequestStub,getAuthResponseStub,processEventRecordsStub,getEventProcessStatusStub;
  beforeEach(()=>{
   rpStub =   sinon.stub(rp, 'Request').returns(Promise.resolve(result));
   getTokenRequestStub =  sinon.stub(utils,"getTokenRequest").returns("sample URL");
   getAuthResponseStub =  sinon.stub(index,"getAuthResponse").resolves("sampleAuthToken");
   processEventRecordsStub =  sinon.stub(index,"processEventRecords").resolves(result);
   getEventProcessStatusStub =  sinon.stub(index,"getEventProcessStatus").returns(record);
  })
  afterEach(()=>{
    if(rpStub){rpStub.restore()}
    if(getTokenRequestStub){getTokenRequestStub.restore()}
    if(getAuthResponseStub){getAuthResponseStub.restore()}
    if(processEventRecordsStub){processEventRecordsStub.restore()}
    if(getEventProcessStatusStub){getEventProcessStatusStub.restore()}
  })
  it("Should send Request for authtoken ",()=>{
    index.handler(event,context,(error,records)=>{
      sinon.assert.calledOnce(rpStub)
    })
  })
  it("should call processEventRecord",()=>{
    index.handler(event,context,(error,records)=>{
      sinon.assert.calledOnce(processEventRecordsStub)
    })
  })
  it("should call getEventProcessStatus after processing Events ",()=>{
    index.handler(event,context,(error,records)=>{
      sinon.assert.calledOnce(getEventProcessStatusStub)
    })
  })

  it("should return the record of processed and falied events ",()=>{
    index.handler(event,context,(error,records)=>{
      expect(records.processed_events).to.eq(3)
      expect(records.failed_events).to.eq(1)
    })
  })
  it("should catch error and return records when processEventRecords throws error ",()=>{
    processEventRecordsStub.restore()
    processEventRecordsStub =  sinon.stub(index,"processEventRecords").rejects(result);
    index.handler(event,context,(error,records)=>{
      sinon.assert.calledOnce(processEventRecordsStub)
      expect(records.processed_events).to.eq(3)
      expect(records.failed_events).to.eq(1)
    })
  })
})
