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
const chaiAsPromised = require('chai-as-promised'); chai.use(chaiAsPromised);
const request = require('request');
const AWS = require('aws-sdk-mock');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const rp = require('request-promise-native');
const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
var testPayloads = require('./response_payloads.js')();
var kinesisPayload = require('./KINESIS_PAYLOAD');

var event, context, configData, authToken;
var reqStub;
var eventPayload;

describe('jazz asset handler tests: ', function () {

  let sandbox;
  beforeEach(function () {
    sandbox = sinon.createSandbox();
    event = {
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
    context = awsContext();
    context.functionName = context.functionName + "-test"
    configData = config.getConfig(event,context);
    authToken = testPayloads.tokenResponseObj200.body.data.token;
    eventPayload = {
      "EVENT_ID": {
          "S": "b5763a84-6c86-4b3b-a5f1-3a023829b8cb"
      },
      "TIMESTAMP": {
          "S": "2018-07-12T10:49:29:607"
      },
      "REQUEST_ID": {
          "S": "9ca1ff28-393b-4c39-ad66-67b8e8bcce65"
      },
      "EVENT_HANDLER": {
          "S": "JENKINS"
      },
      "EVENT_NAME": {
          "S": "CREATE_ASSET"
      },
      "SERVICE_NAME": {
          "S": "webbbbbb"
      },
      "SERVICE_ID": {
          "S": "804c2da9-f7ea-8f1b-23ce-dde37363e395"
      },
      "EVENT_STATUS": {
          "S": "COMPLETED"
      },
      "EVENT_TYPE": {
          "S": "SERVICE_DEPLOYMENT"
      },
      "USERNAME": {
          "S": "abc@sd.com"
      },
      "EVENT_TIMESTAMP": {
          "S": "2018-07-12T10:49:29:059"
      },
      "SERVICE_CONTEXT": {
          "S": "{\"service_type\":\"website\",\"branch\":\"master\",\"runtime\":\"n/a\",\"domain\":\"ossssssss\",\"iam_role\":\"arn:aws:iam::192006145812:role/jazz20180711_lambda2_basic_execution_1\",\"environment\":\"prod\",\"region\":\"us-east-1\",\"message\":\"create assets starts\",\"provider\":\"aws\",\"provider_id\":\"arn:aws:s3:::jazz20180711-prod-web-20180711112108792000000004/ossssssss-webbbbbb/prod/*\",\"type\":\"s3\",\"created_by\":\"suprita@moonraft.com\"}"
      }
    };
  });

  afterEach(function () {
    sandbox.restore();
    if (reqStub) {
      reqStub.restore();
    }
  });

  describe("getTokenRequest", function () {
    it("should return Request token when called", () => {
      let result = index.getTokenRequest(configData);
      expect(result.uri).to.eq(configData.BASE_API_URL + configData.TOKEN_URL);
      expect(result.method).to.eq('post');
    });
  })

  describe("getAuthResponse", function () {
    it("should return auth response when called", () => {
      let test = {
        statusCode:200,
        body:{
          data:{
            token:'sampletoken'
          }
        }
      };
      let result = index.getAuthResponse(test).then(result => {
        expect(result).to.eq(test.body.data.token);
      });
    });

    it("should give error message when fails", () => {
      let test = {
        statusCode:00,
        body:{
          data:{
            token:'sampletoken'
          }
        }
      };
      let result = index.getAuthResponse(test).catch(error => {
        expect(error.message).to.eq('Invalid token response from API');
      });
    });
  })

  describe('check if assets exists',() => {
    it('assets found',() => {
      let responseObject = {
        statusCode: 200,
        body: {
          data: {
            count:2,
            assets:["test1","test2"]}
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, JSON.stringify(responseObject.body));
      });

      index.checkIfAssetExists(eventPayload, configData, authToken).then(obj =>{
        sinon.assert.calledOnce(reqStub);
        expect(obj).to.eq(responseObject.body.data.assets[0]);
        reqStub.restore();
      });
    });

    it('assets not found',() => {
      let responseObject = {
        statusCode: 0,
        body: {
          data: [],
          message:"No Assets found"
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      let result = index.checkIfAssetExists(eventPayload, configData, authToken).catch(obj =>{
        sinon.assert.calledOnce(reqStub);
        expect(obj.details).to.eq('No Assets found');
        reqStub.restore();
      });
    });

    it('assets fails',() => {
      let responseObject = null;
      let errorObject = {
        message:"",
        type:"200"
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(errorObject, null, null);
      });
      let result = index.checkIfAssetExists(eventPayload, configData, authToken).catch(obj =>{
        sinon.assert.calledOnce(reqStub);
        expect(obj.type).to.eq('200');
        reqStub.restore();
      })
    });
  })

  describe("processUpdateAsset", function () {
    let responseObject, record;
    afterEach(() => {
      reqStub.restore();
    });
    it('process update asset success',() => {
      responseObject = {
        statusCode:200,
        body:{
          data:{
            key:"value"
          }
        }
      };
      record = {
        id:121212
      };

      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      index.processUpdateAsset(record, eventPayload, configData, authToken).then(result => {
        sinon.assert.calledOnce(reqStub);
        expect(result).to.eq(responseObject.body);
        reqStub.restore();
      });
    });

    it('process update asset error',() => {
      responseObject = {
        statusCode:0,
        body:{
          data:{
          },
        }
      };
      record = {
        id:121212
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      index.processUpdateAsset(record, eventPayload, configData, authToken).catch(err => {
        sinon.assert.calledOnce(reqStub);
        expect(err.error).to.eq('Error in updating assets. {"statusCode":0,"body":{"data":{}}}');
        reqStub.restore();
      });

    });

    it('process update asset error',() => {
      responseObject = {
        statusCode:0,
        body:{
          data:{},
        }
      };
      record = {
        id:121212
      };
      eventPayload.EVENT_STATUS.S = 'active';
      index.processUpdateAsset(record, eventPayload, configData, authToken).catch(err => {
        sinon.assert.calledOnce(reqStub);
        expect(err.details).to.eq(eventPayload.EVENT_STATUS.S);
        reqStub.restore();
      });

    });
  })

  describe("processCreateAsset", function (){
    let responseObject, record;
    it('process create asset success',() => {
      responseObject = {
        statusCode:200,
        body:{
          data:{
            key:"value"
          }
        }
      };
      record = {
        id:121212
      };

      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      index.processCreateAsset(eventPayload, configData, authToken).then(result => {
        sinon.assert.calledOnce(reqStub);
        expect(result).to.eq(responseObject.body);
        reqStub.restore();
      });
    });

    it('process create asset error',() => {
      responseObject = {
        statusCode:0,
        body:{
          data:{},
        }
      };
      record = {
        id:121212
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      index.processCreateAsset(eventPayload, configData, authToken).catch(err => {
        sinon.assert.calledOnce(reqStub);
        expect(err.error).to.eq('Error in creating assets. {"statusCode":0,"body":{"data":{}}}');
        reqStub.restore();
      });

    });

    it('process create asset error',() => {
      responseObject = {
        statusCode:0,
        body:{
          data:{
          },
        }
      };
      record = {
        id:121212
      };
      eventPayload.EVENT_STATUS.S = 'active';
      index.processCreateAsset(eventPayload, configData, authToken).catch(err => {
        sinon.assert.calledOnce(reqStub);
        expect(err.details).to.eq(eventPayload.EVENT_STATUS.S);
        reqStub.restore();
      });
    });
  })

  describe("processItem", function (){
    var checkIfAssetExistsStub,processUpdateAssetStub,processCreateAssetStub;
    it("Updating assets records success", () => {
      checkIfAssetExistsStub = sinon.stub(index, "checkIfAssetExists").resolves("test");
      processUpdateAssetStub = sinon.stub(index, "processUpdateAsset").resolves("test");
      index.processItem(eventPayload, configData, authToken).then( obj => {
        sinon.assert.calledOnce(checkIfAssetExistsStub);
        sinon.assert.calledOnce(processUpdateAssetStub);
        expect(obj).to.eq("test");
        checkIfAssetExistsStub.restore();
        processUpdateAssetStub.restore();
      });
    });

    it("Updating assets records error", () => {
      checkIfAssetExistsStub = sinon.stub(index, "checkIfAssetExists").resolves("test");
      processUpdateAssetStub = sinon.stub(index, "processUpdateAsset").rejects({"test":"test"});
      index.processItem(eventPayload, configData, authToken).catch( err => {
        sinon.assert.calledOnce(checkIfAssetExistsStub);
        sinon.assert.calledOnce(processUpdateAssetStub);
        expect(err.test).to.eq("test");
        checkIfAssetExistsStub.restore();
        processUpdateAssetStub.restore();
      });
    });

    it("Creating new asset record success", () => {
      checkIfAssetExistsStub = sinon.stub(index, "checkIfAssetExists").rejects("test");
      processCreateAssetStub = sinon.stub(index, "processCreateAsset").resolves("test");
      index.processItem(eventPayload, configData, authToken).then( obj => {
        sinon.assert.calledOnce(checkIfAssetExistsStub);
        sinon.assert.calledOnce(processCreateAssetStub);
        expect(obj).to.eq("test");
        checkIfAssetExistsStub.restore();
        processCreateAssetStub.restore();
      });
    });

    it("Creating new asset record error", () => {
      checkIfAssetExistsStub = sinon.stub(index, "checkIfAssetExists").rejects("test");
      processCreateAssetStub = sinon.stub(index, "processCreateAsset").rejects("test");
      index.processItem(eventPayload, configData, authToken).catch( err => {
        sinon.assert.calledOnce(checkIfAssetExistsStub);
        sinon.assert.calledOnce(processCreateAssetStub);
        checkIfAssetExistsStub.restore();
        processCreateAssetStub.restore();
      });
    });

    it("processUpdateAsset Success", () => {
      eventPayload.EVENT_NAME.S = "UPDATE_ASSET";
      checkIfAssetExistsStub = sinon.stub(index, "checkIfAssetExists").resolves("test");
      processUpdateAssetStub = sinon.stub(index, "processUpdateAsset").resolves("test");
      index.processItem(eventPayload, configData, authToken).then( obj => {
        sinon.assert.calledOnce(checkIfAssetExistsStub);
        sinon.assert.calledOnce(processUpdateAssetStub);
        expect(obj).to.eq("test");
        checkIfAssetExistsStub.restore();
        processUpdateAssetStub.restore();
      });
    })

    it("processUpdateAsset error", () => {
      eventPayload.EVENT_NAME.S = "UPDATE_ASSET";
      checkIfAssetExistsStub = sinon.stub(index, "checkIfAssetExists").resolves("test");
      processUpdateAssetStub = sinon.stub(index, "processUpdateAsset").rejects({"test":"test"});
      index.processItem(eventPayload, configData, authToken).catch( err => {
        sinon.assert.calledOnce(checkIfAssetExistsStub);
        sinon.assert.calledOnce(processUpdateAssetStub);
        expect(err.test).to.eq("test");
        checkIfAssetExistsStub.restore();
        processUpdateAssetStub.restore();
      });
    })

    it("checkIfAssetExists Error", () => {
      eventPayload.EVENT_NAME.S = "UPDATE_ASSET";
      checkIfAssetExistsStub = sinon.stub(index, "checkIfAssetExists").rejects({"test":"test"});
      index.processItem(eventPayload, configData, authToken).catch( err => {
        sinon.assert.calledOnce(checkIfAssetExistsStub);
        expect(err.test).to.eq("test");
        checkIfAssetExistsStub.restore();
      });
    })
  })

  describe("processeachEvent", function (){
    var checkForInterestedEventsStub, processItemStub;
    var payload = {
      "interested_event": true,
      "payload": "",
    }

    it("process each event success", () => {
      checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves(payload);
      processItemStub = sinon.stub(index, "processItem").resolves("success");
      index.processEachEvent(event.Records[0], configData, authToken).then(obj => {
        expect(obj).to.eq("success");
        sinon.assert.calledOnce(checkForInterestedEventsStub);
        sinon.assert.calledOnce(processItemStub);
        checkForInterestedEventsStub.restore();
        processItemStub.restore();
      });
    });

    it("process each event: not interested event", () => {
      payload.interested_event=false;
      checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves(payload);
      index.processEachEvent(event.Records[0], configData, authToken).then(obj => {
        expect(obj.message).to.eq("Not an interesting event");
        sinon.assert.calledOnce(checkForInterestedEventsStub);
        checkForInterestedEventsStub.restore();
      });
    });

    it("process each event error", () => {
      checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").rejects({
        "error":"message"
      });
      index.processEachEvent(event.Records[0], configData, authToken).catch(err => {
        expect(err.error).to.eq("message");
        sinon.assert.calledOnce(checkForInterestedEventsStub);
        checkForInterestedEventsStub.restore();
      });
    });
  })

  describe("checkForInterestedEvents", function () {
    it("checkForInterestedEvents", () => {
      index.checkForInterestedEvents(event.Records[0].kinesis.data, "0", configData).then(obj =>{
        expect(obj.interested_event).to.eq(false);
      });
    });
  })

  describe("processEvents", function () {
    it("processEvents success",() => {
      let authToken = 'abcdefgh';
      let result = index.processEvents(event, configData, authToken).then(res => {
        expect(res[0].message).to.eq('Not an interesting event');
      })
    })

    it("processEvents error",() => {
      let authToken = '';
      let result = index.processEvents(event, configData, authToken).catch(err => {
      })
    })
  });

  describe("handler",()=>{
    let result = {
      result: "sample Resopnse"
    };
    let tokenResponseObj = {
      statusCode: 200,
      body: {
        data: {
          token: "abc"
        }
      }
    };
    var rpStub, getTokenRequestStub, getAuthResponseStub, processEventsStub, getEventProcessStatusStub;

    it("Should send Request for authtoken ",()=>{
      rpStub = sinon.stub(rp, 'Request').returns(Promise.resolve(result));
      index.handler(event, context, (error, records)=>{
        sinon.assert.calledOnce(rpStub);
        rpStub.restore();
      })
    });

    it('index should resolve for not interested events', function () {
      tokenResponseObj.statusCode = 400;

      var message = 'User is not authorized to access this service';

      index.handler(event, context, (err, res) => {
          res.should.have.property('failed_events');
          return res;
      });

    });

    it('index should resolve with updating', function () {
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

      var responseObject = {
        statusCode: 200,
        body: {
          data: {
            "id": "ghd93-3240-2343"
          }
        }
      };

      index.handler(event, context, (err, res) => {
        res.should.have.property('processed_events');
      });
    });
  })

  describe("handleFailedEvents",()=>{
    it("handleFailedEvents", () => {
      index.handleFailedEvents(1, "failure_message", {}, 0);
    })
  });

  describe("handleProcessedEvents",()=>{
    it("handleProcessedEvents", () => {
      index.handleProcessedEvents(1, {});
    })
  });

  describe("getEventProcessStatus",()=>{
    it("getEventProcessStatus", () => {
      var res = index.getEventProcessStatus();
      expect(res.processed_events).to.eq(5);
      expect(res.failed_events).to.eq(2);
    })
  });

  describe("handleError",()=>{
    it("handleError", () => {
      var res = index.handleError('500','error');
      expect(res.failure_code).to.eq('500');
      expect(res.failure_message).to.eq(`error`);
    })
  });
});
