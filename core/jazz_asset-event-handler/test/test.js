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
const sinon = require('sinon')
const sinonTest = require('sinon-test')(sinon, { useFakeTimers: false });
// require('sinon-as-promised');
const rp = require('request-promise-native');
const index = require('../index');
const logger = require('../components/logger');
const config = require('../components/config');
var testPayloads = require('./response_payloads.js')();
var kinesisPayload = require('./KINESIS_PAYLOAD');

var event, context, configData, authToken;
var reqStub;

describe('jazz asset handler tests: ', function () {

  var sandbox;
  beforeEach(function () {
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
    // sandbox = sinon.sandbox.create();
    context = awsContext();
    context.functionName = context.functionName + "-test"
    configData = config.getConfig(event,context);
    authToken = testPayloads.tokenResponseObj200.body.data.token

  });

  afterEach(function () {
    // sandbox.restore();
    if (reqStub) {
      reqStub.restore();
    }
  });

  describe("getTokenRequest", function () {
    it("should return Request token when called", () => {
      let result = index.getTokenRequest(configData);
      expect(result.uri).to.eq(configData.BASE_API_URL + configData.TOKEN_URL);
      expect(result.method).to.eq('post');
    })
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
      }
      let result = index.getAuthResponse(test).then(result => {
         expect(result).to.eq(test.body.data.token);
      })     
    });

    it("should give error message when fails", () => {
      let test = {
        statusCode:00,
        body:{
          data:{
            token:'sampletoken'
          }
        }
      }
      let result = index.getAuthResponse(test).catch(error => {
        expect(error.message).to.eq('Invalid token response from API');
      })      
    })
  })

  // describe("processEvents", function () {
    
  //   it("processEvents success",() => {
  //     let authToken = 'abcdefgh'
  //     let result = index.processEvents(event,configData,authToken).then(res => {
  //       console.log('test results',res)
  //     }).catch(err => {
  //       console.log('test err',err)
  //     }) 
  //   })
  // })

  describe("checkforInterestedEvents", () => {
    it("should return object with paramenter interested_event set to true", () => {
      var record = event.Records[0];
      var sequenceNumber = record.kinesis.sequenceNumber;
      var encodedPayload = record.kinesis.data;
      index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
        assert.isTrue(res.interested_event);
      });
    });
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
      index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
        assert.isFalse(res.interested_event);
      });
    });
  });

  describe("processEvents", () => {
    var  procesEventRecordStub;
    beforeEach(() => {
  
    });
    afterEach(() => {
      if (procesEventRecordStub) {
        procesEventRecordStub.restore();
      }
    });

    it("should resolve all for success scenario from processEvents",()=>{
      procesEventRecordStub = sinon.stub(index, "processEvents").resolves({
        "status":"succesfully processed Event Rcord"
      });
      index.processEvents(event,configData,"temp_auth").then((obj)=>{
        sinon.assert.calledOnce(procesEventRecordStub)
        for(let i=0;i<obj.length;i++){
          expect(obj[i].status).to.eq("succesfully processed Event Rcord")
        }
        procesEventRecordStub.restore();
      });
    });

    it("should reject all for Error case scenario from processEvents",()=>{
      procesEventRecordStub = sinon.stub(index, "processEvents").rejects({
        "status":"Process Event Record failed"
      });
      index.processEvents(event,configData,"temp_auth").catch((err)=>{
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
      var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
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
      var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
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
      var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
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


  // it('Verified getToken returned a valid 200 response ', function () {
  //   var requestPromoiseStub = sinon.stub(rp, 'Request').returns(Promise.resolve(testPayloads.tokenResponseObj200));
  //   var getTokenRequest = index.getTokenRequest(configData);

  //   var verified = rp(getTokenRequest)
  //     .then(res => {
  //       var status = res.statusCode;
  //       expect(status, "Invalid status Code from getToken").to.eql(200);
  //     });

  //   requestPromoiseStub.restore();
  //   return verified;
  // });

  // More Test cases to be added. 

});
