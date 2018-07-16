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
var eventPayload;

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

  describe('check if assets exists',() => {
    
    
    it('assets found',() => {  
      let responseObject = {
        statusCode: 200,
        body: {
          data: ["test1","test2"]            
          }
      };    
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      
      let result = index.checkIfAssetExists(eventPayload, configData, authToken).then(obj =>{
        expect(obj).to.eq(responseObject.body.data[0]);
      })
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
        expect(obj.details).to.eq('No Assets found');
      })
    });

    it('assets fails',() => {
      let responseObject = null;
      let errorObject = {
        message:"",
        type:"200"
      }      
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(errorObject, null, null);
      });      
      let result = index.checkIfAssetExists(eventPayload, configData, authToken).catch(obj =>{
      })
    });
  })

  describe("processUpdateAsset", function () {
    it('process update asset success',() => {
      let responseObject = {
        statusCode:200,
        body:{
          data:{
            key:"value"
          }
        }
      };
      let record = {
        id:121212
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      index.processUpdateAsset(record, eventPayload, configData, authToken).then(result => {
        expect(result).to.eq(responseObject.body);
      });
    });

    it('process update asset error',() => {
      let responseObject = {
        statusCode:0,
        body:{
          data:{
            
          },
        }
      };
      let record = {
        id:121212
      };
      // eventPayload.EVENT_STATUS.S = 'state';
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      let news = index.processUpdateAsset(record, eventPayload, configData, authToken).catch(err => {
        // expect(err.).to.eq(responseObject.body.details);
        console.log('caiught it ',err)
      });
    });
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

  // describe("checkforInterestedEvents", () => {
  //   it("should return object with paramenter interested_event set to true", () => {
  //     var record = event.Records[0];
  //     var sequenceNumber = record.kinesis.sequenceNumber;
  //     var encodedPayload = record.kinesis.data;
  //     index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
  //       assert.isTrue(res.interested_event);
  //     });
  //   });
  //   it("should reject with paramenter interested_event set to false", () => {
  //     var payload = {
  //       Item: {
  //         EVENT_ID: {
  //           S: '084f8c38-a01b-4ac9-943e-365f5de8ebe4'
  //         },
  //         TIMESTAMP: {
  //           S: '2018-05-16T12:12:42:821'
  //         },
  //         REQUEST_ID: {
  //           NULL: true
  //         },
  //         EVENT_HANDLER: {
  //           S: 'JENKINS'
  //         },
  //         EVENT_NAME: {
  //           S: 'CREATE_DEPLOYMENT'
  //         },
  //         SERVICE_NAME: {
  //           S: 'test-02'
  //         },
  //         SERVICE_ID: {
  //           S: '00001-test-serivice-id-00001'
  //         },
  //         EVENT_STATUS: {
  //           S: 'STARTED'
  //         },
  //         EVENT_TYPE: {
  //           S: 'NOT_SERVICE_DEPLOYMENT'
  //         },
  //         USERNAME: {
  //           S: 'temp@testing.com'
  //         },
  //         EVENT_TIMESTAMP: {
  //           S: '2018-05-16T12:12:41:083'
  //         },
  //         SERVICE_CONTEXT: {
  //           S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'
  //         }
  //       }
  //     };
  //     var encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  //     var sequenceNumber = "test_sequence01";
  //     var encodedPayload = encoded;
  //     index.checkForInterestedEvents(encodedPayload, sequenceNumber, configData).then((res) => {
  //       assert.isFalse(res.interested_event);
  //     });
  //   });
  // });

  // describe("processEvents", () => {
  //   var  procesEventRecordStub;
  //   beforeEach(() => {
  
  //   });
  //   afterEach(() => {
  //     if (procesEventRecordStub) {
  //       procesEventRecordStub.restore();
  //     }
  //   });
 
  //   it("should resolve all for success scenario from processEvents",()=>{
  //     procesEventRecordStub = sinon.stub(index, "processEachEvent").resolves({
  //       "status":"succesfully processed Event Rcord"
  //     });
  //     index.processEvents(event,configData,"temp_auth").then((obj)=>{
  //       sinon.assert.calledOnce(procesEventRecordStub)
  //       for(let i=0;i<obj.length;i++){
  //         expect(obj[i].status).to.eq("succesfully processed Event Rcord")
  //       }
  //       procesEventRecordStub.restore();
  //     });
  //   });

  //   it("should reject all for Error case scenario from processEvents",()=>{
  //     procesEventRecordStub = sinon.stub(index, "processEvents").rejects({
  //       "status":"Process Event Record failed"
  //     });
  //     index.processEvents(event,configData,"temp_auth").catch((err)=>{
  //       sinon.assert.calledOnce(procesEventRecordStub)
  //       expect(err.status).to.eq("Process Event Record failed");
  //       procesEventRecordStub.restore()
  //     });
  //   });
  // });



  
  // describe("processEventRecord", () => {
  //   var payload;
  //   beforeEach(() => {
  //     payload = {
  //       Item: {
  //         EVENT_ID: {
  //           S: '084f8c38-a01b-4ac9-943e-365f5de8ebe4'
  //         },
  //         TIMESTAMP: {
  //           S: '2018-05-16T12:12:42:821'
  //         },
  //         REQUEST_ID: {
  //           NULL: true
  //         },
  //         EVENT_HANDLER: {
  //           S: 'JENKINS'
  //         },
  //         EVENT_NAME: {
  //           S: 'CREATE_DEPLOYMENT'
  //         },
  //         SERVICE_NAME: {
  //           S: 'test-02'
  //         },
  //         SERVICE_ID: {
  //           S: '00001-test-serivice-id-00001'
  //         },
  //         EVENT_STATUS: {
  //           S: 'STARTED'
  //         },
  //         EVENT_TYPE: {
  //           S: 'NOT_SERVICE_DEPLOYMENT'
  //         },
  //         USERNAME: {
  //           S: 'temp@testing.com'
  //         },
  //         EVENT_TIMESTAMP: {
  //           S: '2018-05-16T12:12:41:083'
  //         },
  //         SERVICE_CONTEXT: {
  //           S: '{"service_type":"api","branch":"","runtime":"nodejs","domain":"jazztest","iam_role":"arn:aws:iam::12345678:role/gitlabtest10001_test01","environment":"","region":"us-east-1","message":"input validation starts","created_by":"temp@testing.com"}'
  //         }
  //       }
  //     };
  //   });
  //   afterEach(() => {
  //     if (reqStub) {
  //       reqStub.restore();
  //     }
  //   });
  //   it("should call processEvent for intrested events", () => {
  //     let message = "Succesfully Updated Creation Event"
  //     let responseObject = {
  //       statusCode: 200,
  //       body: {
  //         data: {
  //           message: message
  //         }
  //       }
  //     };
  //     reqStub = sinon.stub(request, "Request").callsFake((obj) => {
  //       return obj.callback(null, responseObject, responseObject.body);
  //     });
  //     var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
  //       "interested_event": true,
  //       "payload": payload.Item
  //     });
  //     var processEventStub = sinon.stub(index, "processEvent")
  //     var tempAuth = "Auth_token"
  //     index.processEventRecord(event.Records[0], configData, tempAuth).then((obj) => {
  //       sinon.assert.calledOnce(processEventStub)
  //       checkForInterestedEventsStub.restore()
  //       processEventStub.restore()
  //     })
  //   })
  //   it("should Return success message when called with valid paramenters", () => {
  //     let message = "Succesfully Updated Creation Event"
  //     let responseObject = {
  //       statusCode: 200,
  //       body: {
  //         data: {
  //           message: message
  //         }
  //       }
  //     };
  //     reqStub = sinon.stub(request, "Request").callsFake((obj) => {
  //       return obj.callback(null, responseObject, responseObject.body);
  //     })
  //     var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
  //       "interested_event": true,
  //       "payload": payload.Item
  //     })
  //     var tempAuth = "Auth_token"
  //     index.processEventRecord(event.Records[0], configData, tempAuth).then((obj) => {
  
  //       expect(obj).to.not.eq(null);
  //       expect(obj.data.message).to.eq(message)
  //       reqStub.restore()
  //       checkForInterestedEventsStub.restore()
  //     })
  //   })
  //   it("should return error message for not intrested events", () => {
  //     var message = "Not an interesting event";
  //     var checkForInterestedEventsStub = sinon.stub(index, "checkForInterestedEvents").resolves({
  //       "interested_event": false,
  //       "payload": payload.Item
  //     })
  //     var tempAuth = "Auth_token";
  //     index.processEventRecord(event.Records[0], configData, tempAuth).then((obj) => {
  //       expect(obj.message).to.eq(message)
  //       sinon.assert.calledOnce(checkForInterestedEventsStub)
  //     })
  //   })
  // })


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
