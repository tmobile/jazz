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

const sinon = require('sinon');
const chai = require('chai');
const assert = require('chai').assert;
const expect = require('chai').expect;
const should = require('chai').should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const index = require('../index');
const request = require('request');
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
    expect(result.uri).to.eq(configData.SERVICE_API_URL + configData.TOKEN_URL);
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

  it('should resolve for valid input', function () {
		let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
		let encodedPayload = event.Records[0].kinesis.data;
		let checkInterest = index.checkInterest(encodedPayload, sequenceNumber,configData);
		expect(checkInterest.then(function (res) {
			return res.interested_event;
		})).to.become(true);
	});

	it('should resolve with valid response for valid input', function () {
		let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
		let encodedPayload = event.Records[0].kinesis.data;
		let checkInterest = index.checkInterest(encodedPayload, sequenceNumber,configData);
		expect(checkInterest.then((res) => {
			return res;
		})).to.eventually.have.property('payload');
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

  beforeEach(() => {
    tokenResponseObj = {
      statusCode: 200,
      body: {
        data: {
          token: "abc"
        }
      }
    };

    reqStub = sinon.stub(request, "Request")
    processRequestStub = sinon.stub(index, "processRequest").resolves(responseObject.body);
    getServiceDetailsStub = sinon.stub(index, "getServiceDetails").resolves(responseObject.body);
    getNotificationMessageStub = sinon.stub(utils, "getNotificationMessage").returns({ "Service deployment notification for service": "compconsted" });
    formatSlackTemplateStub = sinon.stub(utils, "formatSlackTemplate").returns({ "Stage": "update_deployment" });
    notifySlackChannelStub = sinon.stub(index, "notifySlackChannel").resolves({
      "message": "Notification send successfully."
    });
  });

  afterEach(() => {
    if (reqStub) { reqStub.restore(); }
    if (processRequestStub) { processRequestStub.restore(); }
    if (getServiceDetailsStub) { getServiceDetailsStub.restore(); }
    if (notifySlackChannelStub) { notifySlackChannelStub.restore(); }
    if (getNotificationMessageStub) { getNotificationMessageStub.restore(); }
    if (formatSlackTemplateStub) { formatSlackTemplateStub.restore(); }
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
    reqStub.callsFake((obj) => {
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
    getServiceDetailsStub.restore();
    notifySlackChannelStub.restore();
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
    let processEventStub = sinon.stub(index, "processEvent");
    getNotificationMessageStub.restore();
    formatSlackTemplateStub.restore();
    getServiceDetailsStub = sinon.stub(index, "getServiceDetails").resolves(responseObject.body);
    getNotificationMessageStub = sinon.stub(utils, "getNotificationMessage").returns({ "Service deployment notification for service": "compconsted" });
    formatSlackTemplateStub = sinon.stub(utils, "formatSlackTemplate").returns({ "Stage": "update_deployment" });
    notifySlackChannelStub = sinon.stub(index, "notifySlackChannel").resolves({
      "message": "Notification send successfully."
    });

    let tempAuth = "Auth_token";
    index.processRecord(event.Records[0], configData, tempAuth).then((obj) => {
      expect(obj).to.not.eq(null);
      checkForInterestedEventsStub.restore();
      getNotificationMessageStub.restore();
      formatSlackTemplateStub.restore();
      notifySlackChannelStub.restore();
      getServiceDetailsStub.restore();
      processEventStub.restore();
    });
  });

  it('processRecords should return response for invalid event name event type combination', () => {
		let responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};
    reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

		let processRecords = index.processRecords(event, configData, tokenResponseObj.body.data.token);
		let message = "Not an interesting event to process";
		expect(processRecords.then(function (res) {
			return res;
		})).to.be.not.null;
	});

	it('processRecords should resolve with valid response', () =>{
		event.Records =  [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "CALL_DELETE_WORKFLOW",
					"sequenceNumber": "abc1234",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJhMjFhNmIxNy02MDM1LTRiY2QtOTBlYi0xNGM3Nzg4NDMzYTUtMDA3In0sIlRJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xM1QwMToxODozNTo1NTYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcIm5vZGVqc1wiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJqYXp6XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmE6aWFtOjozMDI4OTA5MDEzNDA6cm9sZS9qYXp6X3BsYXRmb3JtX3NlcnZpY2VzXCIsXCJlbnZpcm9ubWVudFwiOlwiTkFcIixcInJlZ2lvblwiOlwidXMtd2VzdC0yXCIsXCJzZXJ2aWNlX2lkXCI6XCI1ZTU4ZDEwMS0yZTYyLWYzOWMtNjFjYS04M2QxZTRiNWU4MDlcIn0ifSwiVVNFUk5BTUUiOnsiUyI6InNpbmkud2lsc29uQHVzdC1nbG9iYWwuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xOFQxMzoxODozMjo2MDAifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNBTExfREVMRVRFX1dPUktGTE9XIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVMRVRJT04ifSwiU0VSVklDRV9OQU1FIjp7IlMiOiJlbWFpbC1ldmVudC1oYW5kbGVyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiU0VSVklDRV9JRCI6eyJTIjoiNWU1OGQxMDEtMmU2Mi1mMzljLTYxY2EtODNkMWU0YjVlODA5In19fQ==",
					"approximateArrivalTimestamp": 1521632408.682
				},
				"eventSource": "abc",
				"eventVersion": "1.0",
				"eventID": "abc",
				"eventName": "abc",
				"invokeIdentityArn": "abc",
				"awsRegion": "abc",
				"eventSourceARN": "abc"
			}
		];
	let responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};
		reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
		let processRecords = index.processRecords(event, configData, tokenResponseObj.body.data.token);
		let message = "updated service email-event-handler in service catalog.";
		expect(processRecords.then(function (res) {
			return res;
		})).to.be.not.null;
	});

	it('processRecords should indicate error if request fails for kinesis data with defined and completed endingEvent', () => {
		event.Records =  [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "CALL_DELETE_WORKFLOW",
					"sequenceNumber": "abc1234",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJhMjFhNmIxNy02MDM1LTRiY2QtOTBlYi0xNGM3Nzg4NDMzYTUtMDA3In0sIlRJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xM1QwMToxODozNTo1NTYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcIm5vZGVqc1wiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJqYXp6XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmE6aWFtOjozMDI4OTA5MDEzNDA6cm9sZS9qYXp6X3BsYXRmb3JtX3NlcnZpY2VzXCIsXCJlbnZpcm9ubWVudFwiOlwiTkFcIixcInJlZ2lvblwiOlwidXMtd2VzdC0yXCIsXCJzZXJ2aWNlX2lkXCI6XCI1ZTU4ZDEwMS0yZTYyLWYzOWMtNjFjYS04M2QxZTRiNWU4MDlcIn0ifSwiVVNFUk5BTUUiOnsiUyI6InNpbmkud2lsc29uQHVzdC1nbG9iYWwuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xOFQxMzoxODozMjo2MDAifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNBTExfREVMRVRFX1dPUktGTE9XIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVMRVRJT04ifSwiU0VSVklDRV9OQU1FIjp7IlMiOiJlbWFpbC1ldmVudC1oYW5kbGVyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiU0VSVklDRV9JRCI6eyJTIjoiNWU1OGQxMDEtMmU2Mi1mMzljLTYxY2EtODNkMWU0YjVlODA5In19fQ==",
					"approximateArrivalTimestamp": 1521632408.682
				},
				"eventSource": "abc",
				"eventVersion": "1.0",
				"eventID": "abc",
				"eventName": "abc",
				"invokeIdentityArn": "abc",
				"awsRegion": "abc",
				"eventSourceARN": "abc"
			}
		];

		let responseObject = {
			statusCode: 401
		};

    reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject);
    });

		let processRecords = index.processRecords(event, configData, tokenResponseObj.body.data.token);
		expect(processRecords.then(function (res) {
			return res;
		})).to.be.not.null;
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
  tempobj = {
    temp_param: "temp_param"
  };
  errObj = {
    message: "Process Failed"
  };

  beforeEach(() => {
    tokenResponseObj = {
      statusCode: 200,
      body: {
        data: {
          token: "abc"
        }
      }
    };

    reqStub = sinon.stub(request, "Request");
    processRequestStub = sinon.stub(index, "processRequest");
    getServiceDetailsStub = sinon.stub(index, "getServiceDetails");
    getNotificationMessageStub = sinon.stub(utils, "getNotificationMessage");
    formatSlackTemplateStub = sinon.stub(utils, "formatSlackTemplate");
    notifySlackChannelStub = sinon.stub(index, "notifySlackChannel")
  });

  afterEach(() => {
    if (reqStub) { reqStub.restore(responseObject.body); }
    if (processRequestStub) { processRequestStub.restore(responseObject.body); }
    if (getServiceDetailsStub) { getServiceDetailsStub.restore(responseObject.body); }
    if (getNotificationMessageStub) { getNotificationMessageStub.restore(); }
    if (formatSlackTemplateStub) { formatSlackTemplateStub.restore(); }
    if (notifySlackChannelStub) { notifySlackChannelStub.restore(); }
  });

  it("should call processRequest with SvcPayload and handle error when processRequest fails ", () => {
    processRequestStub.resolves(responseObject.body);
    getServiceDetailsStub.resolves(responseObject.body);
    getNotificationMessageStub.returns({ "Service deployment notification for service": "compconsted" });
    formatSlackTemplateStub.returns({ "Stage": "update_deployment" });
    notifySlackChannelStub.resolves({
      "message": "Notification send successfully."
    });
    let payload = {Item: {EVENT_ID: { S: '084f8c38-a01b-4ac9-943e-365f5de8ebe4' },TIMESTAMP: { S: '2018-05-16T12:12:42:821' }, REQUEST_ID: { NULL: true }, EVENT_HANDLER: { S: 'JENKINS' },  EVENT_NAME: { S: 'CREATE_DEPLOYMENT' }, SERVICE_NAME: { S: 'test-02' }, SERVICE_ID: { S: '00001-test-serivice-id-00001' },  EVENT_STATUS: { S: 'STARTED' }, EVENT_TYPE: { S: 'NOT_SERVICE_DEPLOYMENT' },  USERNAME: { S: 'temp@testing.com' },  EVENT_TIMESTAMP: { S: '2018-05-16T12:12:41:083' }, SERVICE_CONTEXT: { S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'  } }};
    index.getServiceDetails(payload.Item, configData, "tempAuth").catch((err) => {
      sinon.assert.calledOnce(processRequestStub);
      processRequestStub.restore();
    });
  });

  it("should return error if slack channel is not defined in the service details", () => {
    let body = {};
    let data = {
      id: "00001-test-serivice-id-00001",
      domain: "test"
    };
    let responseObject = {};
    body.data = data;
    responseObject.body = JSON.stringify(body);
    processRequestStub.resolves(responseObject.body);
    getServiceDetailsStub.resolves(responseObject.body);
    getNotificationMessageStub.returns({ "Service deployment notification for service": "compconsted" });
    formatSlackTemplateStub.returns({ "Stage": "update_deployment" });
    notifySlackChannelStub.resolves({
      "message": "Notification send successfully."
    });
    let payload = {Item: {EVENT_ID: { S: '084f8c38-a01b-4ac9-943e-365f5de8ebe4' },TIMESTAMP: { S: '2018-05-16T12:12:42:821' }, REQUEST_ID: { NULL: true }, EVENT_HANDLER: { S: 'JENKINS' },  EVENT_NAME: { S: 'CREATE_DEPLOYMENT' }, SERVICE_NAME: { S: 'test-02' }, SERVICE_ID: { S: '00001-test-serivice-id-00001' },  EVENT_STATUS: { S: 'STARTED' }, EVENT_TYPE: { S: 'NOT_SERVICE_DEPLOYMENT' },  USERNAME: { S: 'temp@testing.com' },  EVENT_TIMESTAMP: { S: '2018-05-16T12:12:41:083' }, SERVICE_CONTEXT: { S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'  } }};
    index.processEvent(payload.Item, configData, "temp_auth").catch((err) => {
      expect(err.failure_code).to.eq("SLACK_CHANNEL_INFO");
    });
  });

  it("should call processRequest with SvcPayload", () => {
    processRequestStub.resolves(responseObject.body);
    getServiceDetailsStub.resolves(responseObject.body);
    getNotificationMessageStub.returns({ "Service deployment notification for service": "compconsted" });
    formatSlackTemplateStub.returns({ "Stage": "update_deployment" });
    notifySlackChannelStub.resolves({
      "message": "Notification send successfully."
    });
    let payload = {Item: {EVENT_ID: { S: '084f8c38-a01b-4ac9-943e-365f5de8ebe4' },TIMESTAMP: { S: '2018-05-16T12:12:42:821' }, REQUEST_ID: { NULL: true }, EVENT_HANDLER: { S: 'JENKINS' },  EVENT_NAME: { S: 'CREATE_DEPLOYMENT' }, SERVICE_NAME: { S: 'test-02' }, SERVICE_ID: { S: '00001-test-serivice-id-00001' },  EVENT_STATUS: { S: 'STARTED' }, EVENT_TYPE: { S: 'NOT_SERVICE_DEPLOYMENT' },  USERNAME: { S: 'temp@testing.com' },  EVENT_TIMESTAMP: { S: '2018-05-16T12:12:41:083' }, SERVICE_CONTEXT: { S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'  } }};
    index.processEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(processRequestStub);
    });
  });

  it('processEvent should reject error for empty payload', function () {
		let payload = {};
		let message = "Cannot read property \'S\' of undefined";
		let processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		expect(processEvent.then(function (res) {
			return res;
		})).to.be.rejectedWith(message);
	});

	it('processEvent should indicate error if kinesis data does not have proper EVENT_NMAE', function () {
		let payload = { "EVENT_ID": { "S": "abc123" }, "TIMESTAMP": { "S": "abc123" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME":  "MODIFY_TEMPLATE" , "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": { "S": "COMPLETED" }, "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"sasfds\"},\"created_by\":\"abc@abc.com\"}" } };
		let processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		expect(processEvent.then(function (res) {
			return res.message;
		})).to.be.rejected;
	});

	it('processEvent should indicate error if kinesis data does not have proper EVENT_STATUS', function () {
		let payload = { "EVENT_ID": { "S": "abc123" }, "TIMESTAMP": { "S": "abc123" }, "REQUEST_ID": { "S": "sadjasgd12" }, "EVENT_HANDLER": { "S": "JENKINS" }, "EVENT_NAME":  { "S": "MODIFY_TEMPLATE" } , "SERVICE_ID": { "S": "abc123" }, "SERVICE_NAME": { "S": "test-lambda" }, "EVENT_STATUS": "COMPLETED", "EVENT_TYPE": { "S": "SERVICE_DEPLOYMENT" }, "USERNAME": { "S": "abc@abc.com" }, "EVENT_TIMESTAMP": { "S": "abc123" }, "SERVICE_CONTEXT": { "S": "{\"service_type\":\"lambda\",\"service_id\":\"abc123\",\"service_name\":\"test-lambda\",\"branch\":\"master\",\"domain\":\"test\",\"environment\":\"NA\",\"region\":\"abc\",\"message\":\"service  creation starts\",\"metadata\":{\"name\":\"sasfds\"},\"created_by\":\"abc@abc.com\"}" } };
		let processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		expect(processEvent.then(function (res) {
			return res.message;
		})).to.be.rejected;
	});

	it('processEvent should indicate error if crud.update fails for kinesis data with defined and completed endingEvent', function () {
		let responseObject = {
			statusCode: 400,
			body: {message : "Error updating service "}
		};
		reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
		payload = {"EVENT_ID":{"S":"45fe8c82-ff1d-b31d-2aa5-a22d0911b7ec"},"SERVICE_ID": { "S": "abc123" }, "TIMESTAMP":{"S":"2017-06-26T17:54:26:086"},"SERVICE_CONTEXT":{"S":"{\"service_type\":\"api\",\"admin_group\":\"name=d&name=b&name=a&name=b&name=u&\"}"},"EVENT_HANDLER":{"S":"JENKINS"},"EVENT_NAME":{"S":"LOCK_MASTER_BRANCH"},"SERVICE_NAME":{"S":"test8"},"EVENT_STATUS":{"S":"COMPLETED"},"EVENT_TYPE":{"S":"SERVICE_CREATION"},"USERNAME":{"S":"svc_cpt_jnk_auth_prd"},"EVENT_TIMESTAMP":{"S":"2017-05-05T06:06:37:533"},"AAA":{"NULL":true},"BBB":{"S":"val"}};
		let processEvent = index.processEvent(payload, configData, tokenResponseObj.body.data.token);
		expect(processEvent.then(function (res) {
			return res;
		})).to.be.rejected;
  });

});

describe("notifySlack", () => {
  let payload;
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

  beforeEach(() => {
    processRequestStub = sinon.stub(index, "processRequest");
    getServiceDetailsStub = sinon.stub(index, "getServiceDetails");
    getNotificationMessageStub = sinon.stub(utils, "getNotificationMessage");
    formatSlackTemplateStub = sinon.stub(utils, "formatSlackTemplate");
    notifySlackChannelStub = sinon.stub(index, "notifySlackChannel");
    checkForInterestedEventsStub = sinon.stub(index, "checkInterest");
  });

  afterEach(() => {
    if (processRequestStub) { processRequestStub.restore(responseObject.body); }
    if (getServiceDetailsStub) { getServiceDetailsStub.restore(responseObject.body); }
    if (getNotificationMessageStub) { getNotificationMessageStub.restore(); }
    if (formatSlackTemplateStub) { formatSlackTemplateStub.restore(); }
    if (notifySlackChannelStub) { notifySlackChannelStub.restore(); }
    if (checkForInterestedEventsStub) { checkForInterestedEventsStub.restore(); }
  });

  it("should call notifySlackChannel for true case scenarios", () => {
    processRequestStub.resolves(responseObject.body);
    getServiceDetailsStub.resolves(responseObject.body);
    getNotificationMessageStub.returns({ "Service deployment notification for service": "compconsted" });
    formatSlackTemplateStub.returns({ "Stage": "update_deployment" });
    notifySlackChannelStub.resolves({
      "message": "Notification send successfully."
    });
    checkForInterestedEventsStub.resolves({
      "interested_event": true,
      "payload": payload.Item
    });
    index.processEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(getServiceDetailsStub);
    });
  });

  it("getServiceDetails will give valid response with svcPayload", () => {
    processRequestStub.resolves(responseObject.body);
    getServiceDetailsStub.resolves(responseObject.body);
    getNotificationMessageStub.returns({ "Service deployment notification for service": "compconsted" });
    formatSlackTemplateStub.returns({ "Stage": "update_deployment" });
    notifySlackChannelStub.resolves({
      "message": "Notification send successfully."
    });
    index.getServiceDetails(svcPayload, configData, "temp_auth").then((obj) => {
      let output = JSON.parse(obj);
      expect(output.data.slack_channel).to.eq("test");
    });
  });

  it("should call notifySlackChannel when getServiceDetails resolves the promise and returns result", () => {
    processRequestStub.resolves(responseObject.body);
    getServiceDetailsStub.resolves(responseObject.body);
    getNotificationMessageStub.returns({ "Service deployment notification for service": "compconsted" });
    formatSlackTemplateStub.returns({ "Stage": "update_deployment" });
    notifySlackChannelStub.resolves({
      "message": "Notification send successfully."
    });
    index.processEvent(payload.Item, configData, "tempAuth").then(() => {
      sinon.assert.calledOnce(getServiceDetailsStub);
    });
  });
});

describe("getServiceDetails", () => {
  let responseObject, svcPayload;
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
      expect(output.data.slack_channel).to.eq("test");
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
    reqStub = sinon.stub(request, "Request");
    rpStub = sinon.stub(rp, 'Request').returns(Promise.resolve(result));
    getTokenRequestStub = sinon.stub(index, "getTokenRequest").returns("sample URL");
    getAuthResponseStub = sinon.stub(index, "getAuthResponse").resolves("sampleAuthToken");
    processEventRecordsStub = sinon.stub(index, "processRecords").resolves(result);
    getEventProcessStatusStub = sinon.stub(index, "getEventProcessStatus").returns(record);
  });

  afterEach(() => {
    if (reqStub) { reqStub.restore() }
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

  it("should successfully process interested events ", () => {
    index.handler(event, context, (error, records) => {
      expect(records).to.have.property("processed_events");
      expect(records).to.have.property("failed_events");
    });
  });

  it('handleError should return error response json for valid input', function () {
    let errorJson = { "failure_code": 400, "failure_message": "Unauthorized" };
    let handleError = index.handleError(400, "Unauthorized");
    assert(handleError, errorJson);
  });

  it('handleProcessedEvents should push valid events', function () {
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let handleProcessedEvents = index.handleProcessedEvents(encodedPayload, sequenceNumber);
    expect(index.getEventProcessStatus()).to.have.property('processed_events');
  });

  it('handleFailedEvents should push valid events', function () {
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

  it('checkInterest should resolve for valid input', function () {
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let checkInterest = index.checkInterest(encodedPayload, sequenceNumber, configData);
    expect(checkInterest.then(function (res) {
      return res.interested_event;
    })).to.become(true);
  });

  it('checkInterest should resolve with valid response for valid input', function () {
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let checkInterest = index.checkInterest(encodedPayload, sequenceNumber, configData);
    expect(checkInterest.then((res) => {
      return res;
    })).to.eventually.have.property('payload');
  });

  it('processEvent should reject error for empty payload', function () {
    let payload = {};
    let message = "Cannot read property \'S\' of undefined";
    let processEvent = index.processEvent(payload, configData, "token");
    expect(processEvent.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
  });
});

describe("slack-handler", () => {
  it('handleError should return error response json for valid input', function () {
    let errorJson = { "failure_code": 400, "failure_message": "Unauthorized" };
    let handleError = index.handleError(400, "Unauthorized");
    assert(handleError, errorJson);
  });

  it('handleProcessedEvents should push valid events', function () {
    let sequenceNumber = event.Records[0].kinesis.sequenceNumber;
    let encodedPayload = event.Records[0].kinesis.data;
    let handleProcessedEvents = index.handleProcessedEvents(encodedPayload, sequenceNumber);
    expect(index.getEventProcessStatus()).to.have.property('processed_events');
  });

  it('handleFailedEvents should push valid events', function () {
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
		let responseObject = {
			statusCode: 400,
			body: {"message" : "unautho"	}
		};

		let authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

		index.handler(event, context, (err, res) => {
			if (err) {
				return err;
			} else {
				res.should.have.property('processed_events');
				return res;
			}
		});

		authStub.restore();
		reqStub.restore();
	});

	it('handler should resolve for not interested events', function () {
		tokenResponseObj.statusCode = 400;

		let authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
    reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });
		let message = 'User is not authorized to access this service';
		index.handler(event, context, (err, res) => {
			if (err) {
				return err;
			} else {
				res.should.have.property('failed_events');
				return res;
			}
		});

		authStub.restore();
		reqStub.restore();
	});

	it('handler should resolve with updating', function () {
		event.Records =  [
			{
				"kinesis": {
					"kinesisSchemaVersion": "1.0",
					"partitionKey": "CALL_DELETE_WORKFLOW",
					"sequenceNumber": "abc1234",
					"data": "eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJhMjFhNmIxNy02MDM1LTRiY2QtOTBlYi0xNGM3Nzg4NDMzYTUtMDA3In0sIlRJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xM1QwMToxODozNTo1NTYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJzZXJ2aWNlX3R5cGVcIjpcIm5vZGVqc1wiLFwiYnJhbmNoXCI6XCJtYXN0ZXJcIixcInJ1bnRpbWVcIjpcIm5vZGVqczQuM1wiLFwiZG9tYWluXCI6XCJqYXp6XCIsXCJpYW1fcm9sZVwiOlwiYXJuOmE6aWFtOjozMDI4OTA5MDEzNDA6cm9sZS9qYXp6X3BsYXRmb3JtX3NlcnZpY2VzXCIsXCJlbnZpcm9ubWVudFwiOlwiTkFcIixcInJlZ2lvblwiOlwidXMtd2VzdC0yXCIsXCJzZXJ2aWNlX2lkXCI6XCI1ZTU4ZDEwMS0yZTYyLWYzOWMtNjFjYS04M2QxZTRiNWU4MDlcIn0ifSwiVVNFUk5BTUUiOnsiUyI6InNpbmkud2lsc29uQHVzdC1nbG9iYWwuY29tIn0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxNy0wNy0xOFQxMzoxODozMjo2MDAifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJTVEFSVEVEIn0sIkVWRU5UX05BTUUiOnsiUyI6IkNBTExfREVMRVRFX1dPUktGTE9XIn0sIkVWRU5UX1RZUEUiOnsiUyI6IlNFUlZJQ0VfREVMRVRJT04ifSwiU0VSVklDRV9OQU1FIjp7IlMiOiJlbWFpbC1ldmVudC1oYW5kbGVyIn0sIkVWRU5UX0hBTkRMRVIiOnsiUyI6IkpFTktJTlMifSwiU0VSVklDRV9JRCI6eyJTIjoiNWU1OGQxMDEtMmU2Mi1mMzljLTYxY2EtODNkMWU0YjVlODA5In19fQ==",
					"approximateArrivalTimestamp": 1521632408.682
				},
				"eventSource": "abc",
				"eventVersion": "1.0",
				"eventID": "abc",
				"eventName": "abc",
				"invokeIdentityArn": "abc",
				"awsRegion": "abc",
				"eventSourceARN": "abc"
			}
		];

		let responseObject = {
			statusCode: 200,
			body: {
				data: {
					"id": "ghd93-3240-2343"
				}
			}
		};

		let authStub = sinon.stub(rp, 'Request').returns(Promise.resolve(tokenResponseObj));
		reqStub.callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

		index.handler(event, context, (err, res) => {
			if (err) {
				return err;
			} else {
				res.should.have.property('processed_events');
				return res;
			}
		});
	});
});
