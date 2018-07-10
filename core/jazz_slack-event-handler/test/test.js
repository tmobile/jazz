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

const assert = require('chai').assert;
const expect = require('chai').expect;
const index = require('../index');
const request = require('request');
const sinon = require('sinon');
const configObj = require("../components/config.js");
const utils = require("../components/utils");
const rp = require('request-promise-native');

const event = {
  "Records": [{
    "kinesis": {
      "kinesisSchemaVersion": "1.0",
      "partitionKey": "VALIDATE_INPUT",
      "sequenceNumber": "49584481860528260622422554690105735408360629197594427394",
      "data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiIwODRmOGMzOC1hMDFiLTRhYzktOTQzZS0zNjVmNWRlOGViZTQifSwiVElNRVNUQU1QIjp7IlMiOiIyMDE4LTA1LTE2VDEyOjEyOjQyOjgyMSJ9LCJSRVFVRVNUX0lEIjp7Ik5VTEwiOnRydWV9LCJFVkVOVF9IQU5ETEVSIjp7IlMiOiJKRU5LSU5TIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNSRUFURV9ERVBMT1lNRU5UIn0sIlNFUlZJQ0VfTkFNRSI6eyJTIjoidGVzdC0wMiJ9LCJTRVJWSUNFX0lEIjp7IlMiOiIwOWVkMzI3OS1jOGI5LWUzNjAtMmE3OC00ZTFlZDA5M2U2YTcifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVQTE9ZTUVOVCJ9LCJVU0VSTkFNRSI6eyJTIjoic2VydmVybGVzc0B0LW1vYmlsZS5jb20ifSwiRVZFTlRfVElNRVNUQU1QIjp7IlMiOiIyMDE4LTA1LTE2VDEyOjEyOjQxOjA4MyJ9LCJTRVJWSUNFX0NPTlRFWFQiOnsiUyI6IntcInNlcnZpY2VfdHlwZVwiOlwiYXBpXCIsXCJicmFuY2hcIjpcIlwiLFwicnVudGltZVwiOlwibm9kZWpzXCIsXCJkb21haW5cIjpcImphenp0ZXN0XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmF3czppYW06OjE5MjAwNjE0NTgxMjpyb2xlL2dpdGxhYjE4MDUxNV9sYW1iZGEyX2Jhc2ljX2V4ZWN1dGlvbl8xXCIsXCJlbnZpcm9ubWVudFwiOlwiXCIsXCJyZWdpb25cIjpcInVzLWVhc3QtMVwiLFwibWVzc2FnZVwiOlwiaW5wdXQgdmFsaWRhdGlvbiBzdGFydHNcIixcImNyZWF0ZWRfYnlcIjpcInNlcnZlcmxlc3NAdC1tb2JpbGUuY29tXCJ9In19fQ==",
      "approximateArrivalTimestamp": 1526472764.125
    },
    "eventSource": "aws:abc",
    "eventVersion": "1.0",
    "eventID": "shardId-000000000000:49584481860528260622422554690105735408360629197594427394",
    "eventName": "aws:kinesis:record",
    "invokeIdentityArn": "arn:aws:iam::12345678:role/abc",
    "awsRegion": "abc",
    "eventSourceARN": "arn:aws:ktest:abc:100000002:teststream/test-events-hub-test"
  }]
};

const context = {
  "callbackWaitsForEmptyEventLoop": true,
  "logGroupName": "/aws/lambda/test-test-name",
  "logStreamName": "2018/05/16/temp_test0000012910",
  "functionName": "test-test-services-handler-prod",
  "memoryLimitInMB": "256",
  "functionVersion": "$LATEST",
  "invokeid": "00001-test-000001",
  "awsRequestId": "00001-test-000001",
  "invokedFunctionArn": "arn:aws:lambda:wst:100000001:function:test-test-services-handler-test"
};

const configData = configObj.getConfig(event, context);

describe("getTokenRequest", function () {
  it("should return Request token when called", () => {
    let result = index.getTokenRequest(configData);
    expect(result.uri).to.eq(configData.SERVICE_API_URL + configData.TOKEN_URL);
    expect(result.method).to.eq('post');
  });
});

describe("getAuthResponse", () => {
  beforeEach(() => {
    let result = {
      uri: configData.SERVICE_API_URL + configData.TOKEN_URL,
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
});

describe("checkforInterestedEvents", () => {
  let payload;
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
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"test01","environment":"","region":"tst-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
      }
    };
  });

  it("should return object with paramenter interested_event set to true", () => {
    let record = event.Records[0];
    let sequenceNumber = record.kinesis.sequenceNumber;
    let encodedPayload = record.kinesis.data;
    index.checkInterest(encodedPayload, sequenceNumber, configData).then((res) => {
      assert.isTrue(res.interested_event);
    });
  });

  it("should reject with paramenter interested_event set to false", () => {
    let encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    let sequenceNumber = "test_sequence01";
    let encodedPayload = encoded;
    index.checkInterest(encodedPayload, sequenceNumber, configData).then((res) => {
      assert.isFalse(res.interested_event);
    });
  });

  it("should return error message for not intrested events", () => {
    let message = "Not an interesting event";
    let checkForInterestedEventsStub = sinon.stub(index, "checkInterest").resolves({
      "interested_event": false,
      "payload": payload.Item
    });
    let tempAuth = "Auth_token";
    index.processRecord(event.Records[0], configData, tempAuth).then((obj) => {
      expect(obj.message).to.eq(message);
      sinon.assert.calledOnce(checkForInterestedEventsStub);
      checkForInterestedEventsStub.restore()
    });
  });
});

describe("processRecords", () => {
  it("should resolve all for success scenario from processEventRecord", () => {
    let procesRecordStub = sinon.stub(index, "processRecord").resolves({
      "status": "succesfully processed event record"
    });
    index.processRecords(event, configData, "temp_auth").then((obj) => {
      sinon.assert.calledOnce(procesRecordStub);
      for (let i = 0; i < obj.length; i++) {
        expect(obj[i].status).to.eq("succesfully processed event record");
      }
      procesRecordStub.restore();
    });
  });

  it("should reject all for Error case scenario from processEventRecord", () => {
    let procesRecordStub = sinon.stub(index, "processRecord").rejects({
      "status": "Process Event Record failed"
    });
    index.processRecords(event, configData, "temp_auth").catch((err) => {
      sinon.assert.calledOnce(procesRecordStub);
      expect(err.status).to.eq("Process Event Record failed");
      procesRecordStub.restore();
    });
  });
});

describe("processRecord", () => {
  let payload;
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
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"test01","environment":"","region":"tst-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
      }
    };
  });

  it("should call processEvent for intrested events", () => {
    let message = "Succesfully processed events";
    let responseObject = {
      statusCode: 200,
      body: {
        data: {
          message: message
        }
      }
    };
    let reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    let checkForInterestedEventsStub = sinon.stub(index, "checkInterest").resolves({
      "interested_event": true,
      "payload": payload.Item
    });
    let processEventStub = sinon.stub(index, "processEvent");
    let tempAuth = "Auth_token";
    index.processRecord(event.Records[0], configData, tempAuth).then((obj) => {
      sinon.assert.calledOnce(processEventStub);
      processEventStub.restore();
      reqStub.restore();
      checkForInterestedEventsStub.restore();
    })
  });

  it("should Return success message when called with valid parameters", () => {
    let body = {
      data: {
        id: "00001-test-serivice-id-00001",
        domain: "test",
        slack_channel: "test"
      }
    };
    let responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    let checkForInterestedEventsStub = sinon.stub(index, "checkInterest").resolves({
      "interested_event": true,
      "payload": payload.Item
    });
    let getNotificationMessageStub = sinon.stub(utils, "getNotificationMessage").returns({ "Service deployment notification for service": "compconsted" });
    let formatSlackTemplateStub = sinon.stub(utils, "formatSlackTemplate").returns({ "Stage": "update_deployment" });
    let notifySlackChannelStub = sinon.stub(index, "notifySlackChannel").resolves({
      "message": "Notification send successfully."
    });
    let getServiceDetailsStub = sinon.stub(index, "getServiceDetails").resolves(responseObject.body);
    let tempAuth = "Auth_token";
    index.processRecord(event.Records[0], configData, tempAuth).then((obj) => {
      expect(obj).to.not.eq(null);
      checkForInterestedEventsStub.restore();
      getNotificationMessageStub.restore();
      formatSlackTemplateStub.restore();
      notifySlackChannelStub.restore();
      getServiceDetailsStub.restore();
    });
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
    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    index.processRequest(svcPayload).then((obj) => {
      expect(obj).not.null;
      reqStub.restore();
    });
  });
});

describe("processEvent", () => {
  let payload,processRequestStub;
  beforeEach(() => {
    payload = { Item: {EVENT_ID: {S: '084f8c38-a01b-4ac9-943e-365f5de8ebe4'},
        TIMESTAMP: {S: '2018-05-16T12:12:42:821' },
        REQUEST_ID: { NULL: true },
        EVENT_HANDLER: { S: 'JENKINS' },
        EVENT_NAME: { S: 'CREATE_DEPLOYMENT' },
        SERVICE_NAME: { S: 'test-02' },
        SERVICE_ID: { S: '00001-test-serivice-id-00001' },
        EVENT_STATUS: { S: 'STARTED' },
        EVENT_TYPE: { S: 'NOT_SERVICE_DEPLOYMENT' },
        USERNAME: { S: 'temp@testing.com' },
        EVENT_TIMESTAMP: { S: '2018-05-16T12:12:41:083' },
        SERVICE_CONTEXT: {
          S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'
        }
      }
    };
    tempobj = {
      temp_param: "temp_param"
    };
    errObj = {
      message: "Process Failed"
    };
  });

  afterEach(() => {
    if (processRequestStub) { processRequestStub.restore();  }
  });

  it("should call processRequest with SvcPayload and handle error when processRequest fails ", () => {
    let body = {};
    const data = {
      id: "00001-test-serivice-id-00001",
      domain: "test",
      slack_channel: "test-channel"
    };
    body.data = data;
    let responseObject = {};
    responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    const processRequestStub = sinon.stub(index, "processRequest").resolves(responseObject.body);
    index.getServiceDetails(payload.Item, configData, "tempAuth").catch((err) => {
      sinon.assert.calledOnce(processRequestStub);
      processRequestStub.restore();
    });
  });

  it("should return error if slack channel is not defined in the service details", () => {
    let body = {};
    const data = {
      id: "00001-test-serivice-id-00001",
      domain: "test"
    };
    let responseObject = {};
    body.data = data;
    responseObject.body = JSON.stringify(body);
    const processRequestStub = sinon.stub(index, "processRequest").resolves(responseObject.body);
    const getServiceDetailsStub = sinon.stub(index, "getServiceDetails").resolves(responseObject.body);
    index.processEvent(payload, configData, "temp_auth").catch((err) => {
      expect(err.failure_code).to.eq("SLACK_CHANNEL_INFO");
      processRequestStub.restore();
      getServiceDetailsStub.restore();
    });
  });

  it("should call processRequest with SvcPayload", () => {
    let body = {};
    const data = {
      id: "00001-test-serivice-id-00001",
      domain: "test",
      slack_channel: "test-channel"
    };
    body.data = data;
    let responseObject = {};
    responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
    };
    const processRequestStub = sinon.stub(index, "processRequest").resolves(responseObject.body);
    index.processEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(processRequestStub);
      processRequestStub.restore();
    });
  });
});

describe("notifySlack", () => {
  let payload, responseObject;
  beforeEach(() => {
    let body = {
      data: {
        id: "00001-test-serivice-id-00001",
        domain: "test",
        slack_channel: "test"
      }
    };
    responseObject = {
      statusCode: 200,
      body: JSON.stringify(body)
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
  });

  it("should call notifySlackChannel for true case scenarios", () => {
    let getServiceDetailsStub = sinon.stub(index, "getServiceDetails").resolves(responseObject.body);
    let notifySlackChannelStub = sinon.stub(index, "notifySlackChannel").resolves({ 'message': "slack notification send successfully" });
    index.processEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(notifySlackChannelStub);
      notifySlackChannelStub.restore();
      getServiceDetailsStub.restore();
    });
  });

  it("should call notifySlackChannel when getServiceDetails resolves the promise and returns result", () => {
    let getServiceDetailsStub = sinon.stub(index, "getServiceDetails").resolves({ "data": "msg" });
    let getNotificationMessageStub = sinon.stub(utils, "getNotificationMessage").returns({ "Service deployment notification for service": "compconsted" });
    let formatSlackTemplateStub = sinon.stub(utils, "formatSlackTemplate").returns({ "Stage": "update_deployment" });
    let notifySlackChannelStub = sinon.stub(index, "notifySlackChannel").resolves({
      "message": "Notification send successfully."
    });
    index.processEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(notifySlackChannelStub);
      getNotificationMessageStub.restore();
      formatSlackTemplateStub.restore();
      notifySlackChannelStub.restore();
      getServiceDetailsStub.restore();
    });
  });
});

describe("getServiceDetails", () => {
  let responseObject,svcPayload;
  beforeEach(() => {
    let body = {
      data: {
        id: "00001-test-serivice-id-00001",
        domain: "test",
        slack_channel: "test"
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
  });

  it("should call process Request with svcPayload", () => {
    let processRequestStub = sinon.stub(index, "processRequest").resolves(responseObject.body);
    index.getServiceDetails(svcPayload, configData, "temp_auth").then((obj) => {
      let output = JSON.parse(obj);
      expect(output.data.slack_channel).to.eq("test");
      processRequestStub.restore();
    });
  });

  it("should return error if processRequest returns unsuccesfull", () => {
    let processRequestStub = sinon.stub(index, "processRequest").rejects({
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
    let reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
    let handleErrorStub = sinon.stub(index, "handleError");
    let processRequestStub = sinon.stub(index, "processRequest").rejects({
      message: "ProcessRequest Falied"
    });
    index.getServiceDetails(svcPayload).catch((err) => {
      sinon.assert.calledOnce(handleErrorStub);
      handleErrorStub.restore();
      processRequestStub.restore();
      reqStub.restore();
    });
  });
});

describe("handler", () => {
  result = {
    result: "sample Resopnse"
  };
  record = {
    "processed_events": 3,
    "failed_events": 1
  };
  error = {
    message: "sample error message"
  };
  beforeEach(() => {
    rpStub = sinon.stub(rp, 'Request').returns(Promise.resolve(result));
    getTokenRequestStub = sinon.stub(index, "getTokenRequest").returns("sample URL");
    getAuthResponseStub = sinon.stub(index, "getAuthResponse").resolves("sampleAuthToken");
    processEventRecordsStub = sinon.stub(index, "processRecords").resolves(result);
    getEventProcessStatusStub = sinon.stub(index, "getEventProcessStatus").returns(record);
  });

  afterEach(() => {
    if (rpStub) { rpStub.restore() }
    if (getTokenRequestStub) { getTokenRequestStub.restore(); }
    if (getAuthResponseStub) { getAuthResponseStub.restore(); }
    if (processEventRecordsStub) { processEventRecordsStub.restore(); }
    if (getEventProcessStatusStub) { getEventProcessStatusStub.restore(); }
  });

  it("Should send Request for authtoken ", () => {
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(rpStub);
    });
  });

  it("should call processEventRecord", () => {
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(processEventRecordsStub);
    });
  });

  it("should call getEventProcessStatus after processing Events ", () => {
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(getEventProcessStatusStub);
    });
  });

  it("should return the record of processed and failed events ", () => {
    index.handler(event, context, (error, records) => {
      expect(records.processed_events).to.eq(3);
      expect(records.failed_events).to.eq(1);
    });
  });

  it("should catch error and return records when processEventRecords throws error ", () => {
    processEventRecordsStub.restore();
    processEventRecordsStub = sinon.stub(index, "processRecords").rejects(result);
    index.handler(event, context, (error, records) => {
      sinon.assert.calledOnce(processEventRecordsStub);
      expect(records.processed_events).to.eq(3);
      expect(records.failed_events).to.eq(1);
    });
  });
});
