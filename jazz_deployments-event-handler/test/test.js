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
//const CronParser = require("../components/cron-parser.js");
const configObj = require("../components/config.js");

var reqStub
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
    "invokeIdentityArn": "arn:aws:iam::192006145812:role/gitlab180515_lambda2_basic_execution_1",
    "awsRegion": "us-east-1",
    "eventSourceARN": "arn:aws:kinesis:us-east-1:192006145812:stream/gitlab180515-events-hub-prod"
  }]
}
var context = {
  "callbackWaitsForEmptyEventLoop": true,
  "logGroupName": "/aws/lambda/gitlab180515-jazz-services-handler-prod",
  "logStreamName": "2018/05/16/[$LATEST]2beb5567c06b42dabe390268cfca8427",
  "functionName": "gitlab180515-jazz-services-handler-prod",
  "memoryLimitInMB": "256",
  "functionVersion": "$LATEST",
  "invokeid": "bb61d7b3-d439-4efe-9c6d-4ea78d7349d9",
  "awsRequestId": "bb61d7b3-d439-4efe-9c6d-4ea78d7349d9",
  "invokedFunctionArn": "arn:aws:lambda:us-east-1:192006145812:function:gitlab180515-jazz-services-handler-prod"
}
var configData = configObj(context);
describe("getTokenRequest", function () {
  it("should return Request token when called", () => {
    let result = index.getTokenRequest(configData);
    expect(result.uri).to.eq(configData.BASE_API_URL + configData.TOKEN_URL)
    expect(result.method).to.eq('post')
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
  it("should give return auth token when called with valid paramentes", () => {
    let result = {
      statusCode: 200,
      body: {
        data: {
          "token": "ghd93-3240-2343"
        }
      }
    }
    index.getAuthResponse(result).then((auth) => {
      expect(auth).to.eq(result.body.data.token);
    })
  })
  it("should give error message when authentication fails ", () => {
    let result = {
      statusCode: 401,
      body: {}
    }
    index.getAuthResponse(result).catch((err) => {
      expect(err.message).to.eq('Invalid token response from API');
    })
  })

})
describe("checkforIntrestedEvents", () => {
  it("should return object with paramenter interested_event set to true", () => {
    var record = event.Records[0];
    var sequenceNumber = record.kinesis.sequenceNumber;
    var encodedPayload = record.kinesis.data;
    index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
      assert.isTrue(res.interested_event);
    })
  })
  it("should reject with paramenter interested_event set to false", () => {
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
          S: '09ed3279-c8b9-e360-2a78-4e1ed093e6a7'
        },
        EVENT_STATUS: {
          S: 'STARTED'
        },
        EVENT_TYPE: {
          S: 'NOT_SERVICE_DEPLOYMENT'
        },
        USERNAME: {
          S: 'serverless@t-mobile.com'
        },
        EVENT_TIMESTAMP: {
          S: '2018-05-16T12:12:41:083'
        },
        SERVICE_CONTEXT: {
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::192006145812:role/gitlab180515_lambda2_basic_execution_1","environment":"","region":"us-east-1","message":"input validation starts","created_by":"serverless@t-mobile.com"}'
        }
      }
    }
    var encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    var sequenceNumber = "test_sequence01";
    var encodedPayload = encoded;
    index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
      assert.isFalse(res.interested_event);
    })
  })
})
describe("processEventRecord", () => {
  var payload
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
          S: '09ed3279-c8b9-e360-2a78-4e1ed093e6a7'
        },
        EVENT_STATUS: {
          S: 'STARTED'
        },
        EVENT_TYPE: {
          S: 'NOT_SERVICE_DEPLOYMENT'
        },
        USERNAME: {
          S: 'serverless@t-mobile.com'
        },
        EVENT_TIMESTAMP: {
          S: '2018-05-16T12:12:41:083'
        },
        SERVICE_CONTEXT: {
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::192006145812:role/gitlab180515_lambda2_basic_execution_1","environment":"","region":"us-east-1","message":"input validation starts","created_by":"serverless@t-mobile.com"}'
        }
      }
    }
  })
  afterEach(() => {
    if (reqStub) {
      reqStub.restore();
    }
  })
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
    })
    var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
      "interested_event": true,
      "payload": payload.Item
    })
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
    var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
      "interested_event": true,
      "payload": payload.Item
    })
    var tempAuth = "Auth_token"
    index.processEventRecord(event.Records[0], configData, tempAuth).then((obj) => {
      console.log(obj);
      expect(obj).to.not.eq(null);
      expect(obj.data.message).to.eq(message)
      reqStub.restore()
      checkForInterestedEventsStub.restore()
    })
  })
  it("should return error message for not intrested events", () => {
    var message = "Not an interesting event";
    var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
      "interested_event": false,
      "payload": payload.Item
    })
    var tempAuth = "Auth_token";
    index.processEventRecord(event.Records[0], configData, tempAuth).then((obj) => {
      expect(obj.message).to.eq(message)
    })
  })
})
describe("getDeploymentPayload", () => {
  var svcContext
  beforeEach(() => {
    svcContext = {
      "service_type": "api",
      "branch": "",
      "runtime": "nodejs",
      "domain": "jazztest",
      "iam_role": "arn:aws:iam::192006145812:role/gitlab180515_lambda2_basic_execution_1",
      "environment": "",
      "region": "us-east-1",
      "message": "input validation starts",
      "created_by": "serverless@t-mobile.com"
    }
  })
  it("should return deploymentPayload with values passed by svcContext", () => {
    var deploymentPayload = index.getDeploymentPayload(svcContext)
    expect(deploymentPayload.domain).to.eq(svcContext.domain);
  })
})
describe("procesRequest", () => {
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
    }
    let responseObject = {
      statusCode: 200,
      body: {
        data: {}
      }
    };
    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    })
    index.procesRequest(svcPayload).then((obj) => {
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
    }
    let responseObject = {
      statusCode: 401,
      body: {
        data: {}
      }
    };
    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    })
    var handleErrorStub = sinon.stub(index, "handleError")
    index.procesRequest(svcPayload).catch((err) => {
      sinon.assert.calledOnce(handleErrorStub);
      handleErrorStub.restore()
    })
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
          S: '09ed3279-c8b9-e360-2a78-4e1ed093e6a7'
        },
        EVENT_STATUS: {
          S: 'STARTED'
        },
        EVENT_TYPE: {
          S: 'NOT_SERVICE_DEPLOYMENT'
        },
        USERNAME: {
          S: 'serverless@t-mobile.com'
        },
        EVENT_TIMESTAMP: {
          S: '2018-05-16T12:12:41:083'
        },
        SERVICE_CONTEXT: {
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::192006145812:role/gitlab180515_lambda2_basic_execution_1","environment":"","region":"us-east-1","message":"input validation starts","created_by":"serverless@t-mobile.com"}'
        }
      }
    }
  })
  afterEach(() => {
    if (reqStub) {
      reqStub.restore();
    }
  })
  it("should call processEvents with SvcPayload", () => {
    var procesRequestStub = sinon.stub(index, "procesRequest").resolves({
      x: 1
    })
    index.processCreateEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(procesRequestStub)
      procesRequestStub.restore()
    })
  })
})
describe("processUpdateEvent", () => {
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
          S: '09ed3279-c8b9-e360-2a78-4e1ed093e6a7'
        },
        EVENT_STATUS: {
          S: 'STARTED'
        },
        EVENT_TYPE: {
          S: 'NOT_SERVICE_DEPLOYMENT'
        },
        USERNAME: {
          S: 'serverless@t-mobile.com'
        },
        EVENT_TIMESTAMP: {
          S: '2018-05-16T12:12:41:083'
        },
        SERVICE_CONTEXT: {
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::192006145812:role/gitlab180515_lambda2_basic_execution_1","environment":"","region":"us-east-1","message":"input validation starts","created_by":"serverless@t-mobile.com"}'
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
    var temp = {
      "x": 1
    }
    var getDeploymentsStub = sinon.stub(index, "getDeployments").resolves(temp)
    var updateDeploymentsStub = sinon.stub(index, "updateDeployments").resolves(temp)
    index.processUpdateEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(getDeploymentsStub)
      getDeploymentsStub.restore()
      updateDeploymentsStub.restore()
    })
  })
  it("should call updateDeployments when getDeployment resolves the promise and returns result", () => {
    var temp = {
      "x": 1
    }
    var getDeploymentsStub = sinon.stub(index, "getDeployments").resolves(temp)
    var updateDeploymentsStub = sinon.stub(index, "updateDeployments").resolves(temp)
    index.processUpdateEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(updateDeploymentsStub);
      getDeploymentsStub.restore()
      updateDeploymentsStub.restore()
    })
  })
  it("should return error  when updateDeployment resolves the promise and returns result", () => {
    var temp = {
      "x": 1
    }
    var getDeploymentsStub = sinon.stub(index, "getDeployments").resolves(temp)
    var updateDeploymentsStub = sinon.stub(index, "updateDeployments").rejects(temp)
    index.processUpdateEvent(payload.Item, configData, "tempAuth").catch((obj) => {
      assert.isNotNull(obj);
      getDeploymentsStub.restore()
      updateDeploymentsStub.restore()
    })
  })
})
describe("getDeployments", () => {
  var deploymentPayload
  beforeEach(() => {
    deploymentPayload = {
      domain: 'jazztest',
      service_id: '09ed3279-c8b9-e360-2a78-4e1ed093e6a7',
      service: 'test-02',
      environment_logical_id: 'temp_env_ID'
    }
  })
  it("should call process Events with deploymentpayload", () => {
    var procesRequestStub = sinon.stub(index, "procesRequest").resolves({
      x: 1
    })
    index.getDeployments(deploymentPayload, configData, "temp_auth").then((obj) => {
      console.log(obj);
      sinon.assert.calledOnce(procesRequestStub)
      procesRequestStub.restore()

    })
  })
  it("should return error if processEvents returns unsuccesfull", () => {
    var procesRequestStub = sinon.stub(index, "procesRequest").rejects({
      message: "ProcessRequest Falied"
    })
    index.getDeployments(deploymentPayload, configData, "temp_auth").catch((obj) => {
      expect(obj.message).to.eq("ProcessRequest Falied");
      procesRequestStub.restore()
    })
  })
  it("should throw error is enviornment_id is not defined in deploymentpayload passed", () => {
    var procesRequestStub = sinon.stub(index, "procesRequest").resolves({
      x: 1
    })
    deploymentPayload.environment_logical_id = undefined;
    index.getDeployments(deploymentPayload, configData, "temp_auth").catch((err) => {
      expect(err.failure_message).to.eq("Environment logical id is not defined");
      procesRequestStub.restore()
    })
  })
})
describe("updateDeployments", () => {
  var res, deploymentpayload
  beforeEach(() => {
    deploymentPayload = {
      domain: 'jazztest',
      service_id: '09ed3279-c8b9-e360-2a78-4e1ed093e6a7',
      service: 'test-02',
      environment_logical_id: 'temp_env_ID',
      provider_build_url: "http://xdwxdwcdwc/dccdw.com",
      provider_build_id: "xdwxdwcdc"
    }
    res = {
      "data": {
        "deployments": [
          { "deployment_id": "Temp_ID",
            "service_id": "54c65c47-ce38-49b8-8eef-62017088eadb",
            "service": "deployments",
            "domain": "jazz",
            "environment_logical_id": "prod",
            "provider_build_url": "http://xdwxdwcdwc/dccdw.com",
            "provider_build_id": "xdwxdwcdc",
            "scm_commit_hash": "cdwcdwcdwcdcdc",
            "scm_url": "http://xdwxdwcdwc/dccdw.com",
            "scm_branch": "master",
            "status": "in_progress",
            "request_id": "984a1083-7fef-4107-bf3b-b0cb0eb245cc"
          }
        ]
      }

    }
  })

  it("should call processRequest for success scenario ", () => {
    var procesRequestStub = sinon.stub(index, "procesRequest").resolves({
      x: 1
    })
    index.updateDeployments(JSON.stringify(res), deploymentPayload, configData, "temp_auth").then((obj) => {
      sinon.assert.calledOnce(procesRequestStub)
      procesRequestStub.restore()
    })
  })
  it("should call return error if  processRequest is unsucesfull", () => {
    var procesRequestStub = sinon.stub(index, "procesRequest").rejects({
      message: "Process Request failed"
    })
    index.updateDeployments(JSON.stringify(res), deploymentPayload, configData, "temp_auth").catch((err) => {
      sinon.assert.calledOnce(procesRequestStub)
      expect(err.message).to.eq("Process Request failed")
      procesRequestStub.restore()
    })
  })
  it("should return error if deployment id is  processRequest for success scenario ", () => {
    var procesRequestStub = sinon.stub(index, "procesRequest").resolves({
      x: 1
    })
    res.data.deployments[0].deployment_id = undefined;
    index.updateDeployments(JSON.stringify(res), deploymentPayload, configData, "temp_auth").catch((err) => {
      expect(err.failure_message).to.eq('Deployment details not found!')
      procesRequestStub.restore()
    })
  })
})