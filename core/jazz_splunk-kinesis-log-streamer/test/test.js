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

const expect = require('chai').expect;
const assert = require('chai').assert;
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const SplunkLogger = require('splunk-logging').Logger;
const zlib = require('zlib');

const index = require('../index');
const configObj = require('../components/config.js');
const utils = require("../components/utils");

describe('jazz_splunk-cw-log-streamer', function () {
  var err, errMessage, context, callback, callbackObj, config, dataObj, event, splunkLog;

  beforeEach(function () {
    context = awsContext();
    context.functionName = context.functionName + "-test";
    config = configObj.getConfig(event, context);
    err = {
      "errorType": "svtfoe",
      "message": "starco"
    };
    event = {
      "Records": [{
        "kinesis": {
          "data": "H4sIAAAAAAAAAI1Qy27CMBD8FWT1SBTb62dukZqiSu2FRL1QhBzsoFTk0dgUFcS/1+nj3sseZmd2Z+aKOue9Objqc3QoQ/d5le+ei7LMVwVaouHcuynCgKnSWGMCDEf4OBxW03Aa4yY1Z58eTVdbk75dLsH5sJtHEjk+sSaYZJwG+yMqw+RMF1UUE5VinRKdbu6e8qooqy0RwtaNNrLRDaOaau6Y3mNtLBYgvv/6U+33UzuGdugf2mNwk0fZ5t8ett8mig/Xh1l3Ra2dszGqQGoGWBNBJMNCKU2xYEoKAVRyDFpR0MBBcE6IkoxJhVX0E9rYXjBdLIJwkACKY0EAln+txvNlla+rxdq9nyL10WYLkASoICKpa8sTQpxK5tiJ5Y7vGyk1YWbxEqPFkNnit53XHt22ty/LUFK8rgEAAA=="
        }
      }]
    }
    callback = (err, responseObj) => {
      if (err) {
        return err;
      } else {
        return JSON.stringify(responseObj);
      }
    };
    dataObj = {
      statusCode: 200,
      body: {}
    }
    loggerConfig = {
      url: config.SPLUNK_ENDPOINT,
      token: config.SPLUNK_TOKEN,
      maxBatchCount: 0, // Manually flush events
      maxRetries: 1 // Retry 1 times
    };
    splunkLog = new SplunkLogger(loggerConfig);
  });

  describe("sendDataToSplunk", () => {
    it("should trigger splunk send function and add event to queue", () => {
      let eventData = {
        "sourcetype": "applicationlogs",
        "event": {
          "metadata": {
            "platform_log_group": "/aws/lambda/jazztest_lambda-log-check-prod",
            "platform_log_stream": "2018/09/10/[$LATEST]2f2051615c5a43d59a1bc12744b20364"
          },
          "request_id": "a864c74f-b4e4-11e8-a776-cd835ba739c5",
          "provider": "aws_lambda",
          "environment": "prod",
          "namespace": "jazztest",
          "service": "lambda-log-check",
          "event_timestamp": "2018-09-10T10:31:20.641Z",
          "message": "REPORT RequestId: a864c74f-b4e4-11e8-a776-cd835ba739c5\tDuration: 18.83 ms\tBilled Duration: 100 ms \tMemory Size: 256 MB\tMax Memory Used: 19 MB",
          "log_level": "INFO"
        }
      };
      let sendStub = sinon.stub(splunkLog, "send");
      index.sendDataToSplunk(splunkLog, eventData, config);

      assert.isFunction(splunkLog.send);
      sinon.assert.calledOnce(sendStub);
      sendStub.restore();
    });
  });

  describe("sendSplunkEvent", () => {
    let awslogsData;

    it("should indicate that event message type is CONTROL_MESSAGE", () => {
      awslogsData = {
        messageType: "CONTROL_MESSAGE"
      }
      index.sendSplunkEvent(awslogsData, splunkLog, config)
        .then(res => {
          expect(res).to.be.empty;
        });
    });

    it("should indicate that log event is invalid", () => {
      awslogsData = {
        messageType: "invalid",
        logGroup: "invalid"
      };
      index.sendSplunkEvent(awslogsData, splunkLog, config)
        .catch(err => {
          expect(err).to.include({
            result: "inputError",
            message: "Received unsupported logEvents"
          });
        });
    });

    it("should process lambda logs and send events to splunk", () => {
      awslogsData = {
        "messageType": "DATA_MESSAGE",
        "logGroup": "/aws/lambda/jazztest_test-splunk-prod",
        "logEvents": [{
            "id": "34255429465492157807993298165767983214402684914394726400",
            "timestamp": 1536066582553,
            "message": "sample message 1"
          },
          {
            "id": "34255429465492157807993298165767983214402684914394726400",
            "timestamp": 1536066582553,
            "message": "sample message 2"
          }
        ]
      };
      let transformedLogs = {
        "sourcetype": "applicationlogs",
        "event": {
          "type": "mock"
        }
      };
      let getCommonData = sinon.stub(utils, "getCommonData").resolves({
        service: "test-logs"
      });
      let transformLambdaLogs = sinon.stub(utils, "transformLambdaLogs").resolves(transformedLogs);
      let sendDataToSplunk = sinon.stub(index, "sendDataToSplunk");
      index.sendSplunkEvent(awslogsData, splunkLog, config)
        .then(res => {
          expect(res).to.eq(awslogsData.logEvents.length);
          sinon.assert.callCount(transformLambdaLogs, awslogsData.logEvents.length);
          sinon.assert.callCount(sendDataToSplunk, awslogsData.logEvents.length);
          sinon.assert.calledOnce(getCommonData);

          transformLambdaLogs.restore();
          sendDataToSplunk.restore();
          getCommonData.restore();
        });
    });

    it("should indicate error while transforming lambda logs", () => {
      awslogsData = {
        "messageType": "DATA_MESSAGE",
        "logGroup": "/aws/lambda/jazztest_test-splunk-prod",
        "logEvents": [{
            "id": "34255429465492157807993298165767983214402684914394726400",
            "timestamp": 1536066582553,
            "message": "sample message 1"
          },
          {
            "id": "34255429465492157807993298165767983214402684914394726400",
            "timestamp": 1536066582553,
            "message": "sample message 2"
          }
        ]
      };
      errMessage = {
        result: "inputError",
        message: "Invalid lambda logs event."
      }
      let getCommonData = sinon.stub(utils, "getCommonData").resolves({
        service: "test-logs"
      })
      let transformLambdaLogs = sinon.stub(utils, "transformLambdaLogs").rejects(errMessage);
      index.sendSplunkEvent(awslogsData, splunkLog, config)
        .then(res => {
          expect(res).to.be.empty;
          sinon.assert.callCount(transformLambdaLogs, awslogsData.logEvents.length);
          sinon.assert.calledOnce(getCommonData);
          transformLambdaLogs.restore();
          getCommonData.restore();
        });
    });

    it("should Process API Gateway Logs and send events to splunk", () => {
      awslogsData = {
        "messageType": "DATA_MESSAGE",
        "logGroup": "API-Gateway-Execution-Logs_dww0le4qre/prod",
        "logEvents": [{
            "id": "34254535366754881534587556924695368967726048245496414208",
            "timestamp": 1536026489779,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Verifying Usage Plan for request: 706499f2-afe6-11e8-b7eb-8d53f824f304. API Key:  API Stage: dww0le4qre/prod"
          },
          {
            "id": "34254535366799483024984618170978440404271344968508375041",
            "timestamp": 1536026489781,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) API Key  authorized because method 'POST /jazz/apilinter' does not require API Key. Request will not contribute to throttle or quota limits"
          }
        ]
      };
      let transformedLogs = {
        "sourcetype": "apilogs",
        "event": {
          "type": "mock"
        }
      };
      let transformApiLogs = sinon.stub(utils, "transformApiLogs").resolves(transformedLogs);
      let sendDataToSplunk = sinon.stub(index, "sendDataToSplunk");
      index.sendSplunkEvent(awslogsData, splunkLog, config)
        .then(res => {
          expect(res).to.eq(1);
          sinon.assert.calledOnce(transformApiLogs);
          sinon.assert.calledOnce(sendDataToSplunk);

          transformApiLogs.restore();
          sendDataToSplunk.restore();
        });
    });

    it("should indicate error while transforming the API Gateway Log events", () => {
      awslogsData = {
        "messageType": "DATA_MESSAGE",
        "logGroup": "API-Gateway-Execution-Logs_dww0le4qre/prod",
        "logEvents": [{
            "id": "34254535366754881534587556924695368967726048245496414208",
            "timestamp": 1536026489779,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Verifying Usage Plan for request: 706499f2-afe6-11e8-b7eb-8d53f824f304. API Key:  API Stage: dww0le4qre/prod"
          },
          {
            "id": "34254535366799483024984618170978440404271344968508375041",
            "timestamp": 1536026489781,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) API Key  authorized because method 'POST /jazz/apilinter' does not require API Key. Request will not contribute to throttle or quota limits"
          }
        ]
      };
      errMessage = {
        result: "inputError",
        message: "Invalid api logs event."
      };
      let transformApiLogs = sinon.stub(utils, "transformApiLogs").rejects(errMessage);
      let sendDataToSplunk = sinon.stub(index, "sendDataToSplunk");
      index.sendSplunkEvent(awslogsData, splunkLog, config)
        .then(res => {
          expect(res).to.be.empty;
          sinon.assert.calledOnce(transformApiLogs);
          sinon.assert.notCalled(sendDataToSplunk);

          transformApiLogs.restore();
          sendDataToSplunk.restore();
        });
    });
  });

  describe("handler", () => {
    var sandbox, body;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      body = {
        error: 'error',
        code: 0
      };
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should indicate input validation error", () => {
      err = {
        result: "inputError",
        message: "Invalid LogEvents"
      }
      errMessage = '{"errorType":"BadRequest","message":"Invalid LogEvents"}'
      let sendSplunkEvent = sinon.stub(index, "sendSplunkEvent").rejects(err);
      index.handler(event, context, (error, res) => {
        expect(res).to.be.eq("Success");
        sinon.assert.calledOnce(sendSplunkEvent);
        sendSplunkEvent.restore();
      });
    });

    it("should indicate that no logs for splunk forwarder", () => {
      event = {
        "invalidKey": "invalidData"
      };
      index.handler(event, context, (error, res) => {
        expect(res).to.be.eq("Success");
      });
    });

    it("should indicate error while unzipping the event data", () => {
      let zipStub = sinon.stub(zlib, "gunzip").yields((err, res) => {
        return callback(err, null);
      })
      index.handler(event, context, (error, result) => {
        expect(result).to.be.eq("Success");
        sinon.assert.calledOnce(zipStub);
        zipStub.restore();
      });
    });

    it("should indicate internal server error if gunzip doesn't returns data", () => {
      let zipStub = sinon.stub(zlib, "gunzip").yields();
      index.handler(event, context, (error, result) => {
        expect(result).to.be.eq("Success");
        sinon.assert.calledOnce(zipStub);
        zipStub.restore();
      });
    });

    it("should indicate that process is suceess even the sendSplunkEvent doesn't return processed logs count", () => {
      let sendSplunkEvent = sinon.stub(index, "sendSplunkEvent").resolves();
      index.handler(event, context, (error, res) => {
        expect(res).to.include("Success");
        sinon.assert.calledOnce(sendSplunkEvent);
        sendSplunkEvent.restore();
      });
    });

    it("should indicate splunk error if flush method yields async response", () => {
      let sendSplunkEvent = sinon.stub(index, "sendSplunkEvent").resolves(1);
      let slogger = sinon.stub(SplunkLogger.prototype, "flush").yieldsAsync(err, null, null);
      index.handler(event, context, (error, res) => {
        expect(error).to.include(JSON.stringify(err));
        sinon.assert.calledOnce(sendSplunkEvent);
        sinon.assert.calledOnce(slogger);
        sendSplunkEvent.restore();
        slogger.restore();
      });
    });

    it("should indicate splunk error if flush method yields async response with invalid code", () => {
      body = {
        text: 'Success',
        code: 100
      };
      let sendSplunkEvent = sinon.stub(index, "sendSplunkEvent").resolves(1);
      let slogger = sinon.stub(SplunkLogger.prototype, "flush").yieldsAsync(undefined, {
        body: body
      }, body);
      index.handler(event, context, (error, res) => {
        expect(error).to.include(JSON.stringify(body));
        sinon.assert.calledOnce(sendSplunkEvent);
        sinon.assert.calledOnce(slogger);
        sendSplunkEvent.restore();
        slogger.restore();
      });
    });

    it("should successfully execute handler function", () => {
      body = {
        text: 'Success',
        code: 0
      };
      let sendSplunkEvent = sinon.stub(index, "sendSplunkEvent").resolves(1);
      let slogger = sinon.stub(SplunkLogger.prototype, "flush").returns(body);
      index.handler(event, context, (error, res) => {
        expect(res).to.include(body);
        sinon.assert.calledOnce(sendSplunkEvent);
        sinon.assert.calledOnce(slogger);
        sendSplunkEvent.restore();
        slogger.restore();
      });
    });
  });

  describe("utils", () => {
    var lambdaLogsPaylod, apiGatewayLogsPayload;
    beforeEach(function () {
      lambdaLogsPaylod = {
        "messageType": "DATA_MESSAGE",
        "owner": "302890901340",
        "logGroup": "/aws/lambda/jazztest_test-splunk-prod",
        "logStream": "2018/09/04/[$LATEST]89e64d592ffa4374a9a85dc57a622e14",
        "subscriptionFilters": [
          "/aws/lambda/jazztest_test-splunk-prod"
        ],
        "logEvents": [{
            "id": "34255429465492157807993298165767983214402684914394726400",
            "timestamp": 1536066582553,
            "message": "2018-09-04T13:09:42.532Z\tc95e7ca7-b043-11e8-8bbd-75b43bc0efcd\tINFO  \t  { body: {},\n  method: 'GET',\n  principalId: '',\n  stage: 'prod',\n  resourcePath: '/jazztest/test-splunk',\n  headers: \n   { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',\n     'accept-encoding': 'gzip, deflate, br',\n     'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',\n     'cache-control': 'max-age=0',\n     Host: 'jqp4n94n32.execute-api.us-west-2.amazonaws.com',\n     'upgrade-insecure-requests': '1',\n     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',\n     'X-Amzn-Trace-Id': 'Root=1-5b8e8416-dd2cf74718f0b7d13793efe7',\n     'X-Forwarded-For': '206.29.176.52',\n     'X-Forwarded-Port': '443',\n     'X-Forwarded-Proto': 'https' },\n  query: {},\n  path: {},\n  identity: \n   { cognitoIdentityPoolId: '',\n     accountId: '',\n     cognitoIdentityId: '',\n     caller: '',\n     sourceIp: '206.29.176.52',\n     accessKey: '',\n     cognitoAuthenticationType: '',\n     cognitoAuthenticationProvider: '',\n     userArn: '',\n     userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',\n     user: '' },\n  stageVariables: {} }\n"
          },
          {
            "id": "34255429465848969731169788136032554706765058698490413057",
            "timestamp": 1536066582569,
            "message": "2018-09-04T13:09:42.552Z\tc95e7ca7-b043-11e8-8bbd-75b43bc0efcd\tINFO  \t  { callbackWaitsForEmptyEventLoop: [Getter/Setter],\n  done: [Function: done],\n  succeed: [Function: succeed],\n  fail: [Function: fail],\n  logGroupName: '/aws/lambda/jazztest_test-splunk-prod',\n  logStreamName: '2018/09/04/[$LATEST]89e64d592ffa4374a9a85dc57a622e14',\n  functionName: 'jazztest_test-splunk-prod',\n  memoryLimitInMB: '256',\n  functionVersion: '$LATEST',\n  getRemainingTimeInMillis: [Function: getRemainingTimeInMillis],\n  invokeid: 'c95e7ca7-b043-11e8-8bbd-75b43bc0efcd',\n  awsRequestId: 'c95e7ca7-b043-11e8-8bbd-75b43bc0efcd',\n  invokedFunctionArn: 'arn:aws:lambda:us-west-2:302890901340:function:jazztest_test-splunk-prod' }\n"
          },
          {
            "id": "34255429465871270476368318759174090425037707059996393474",
            "timestamp": 1536066582570,
            "message": "END RequestId: c95e7ca7-b043-11e8-8bbd-75b43bc0efcd\n"
          },
          {
            "id": "34255429465871270476368318759174090425037707059996393475",
            "timestamp": 1536066582570,
            "message": "REPORT RequestId: c95e7ca7-b043-11e8-8bbd-75b43bc0efcd\tDuration: 45.65 ms\tBilled Duration: 100 ms \tMemory Size: 256 MB\tMax Memory Used: 20 MB\t\n"
          },
          {
            "id": "34255429527978845854276104208351065814363393854151852036",
            "timestamp": 1536066585355,
            "message": "START RequestId: cb344d6a-b043-11e8-933c-9d414b034894 Version: $LATEST\n"
          },
          {
            "id": "34255429528313357032254063555474101588453119276741558277",
            "timestamp": 1536066585370,
            "message": "2018-09-04T13:09:45.356Z\tcb344d6a-b043-11e8-933c-9d414b034894\tINFO  \t  { body: {},\n  method: 'GET',\n  principalId: '',\n  stage: 'prod',\n  resourcePath: '/jazztest/test-splunk',\n  headers: \n   { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',\n     'accept-encoding': 'gzip, deflate, br',\n     'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',\n     'cache-control': 'max-age=0',\n     Host: 'jqp4n94n32.execute-api.us-west-2.amazonaws.com',\n     'upgrade-insecure-requests': '1',\n     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',\n     'X-Amzn-Trace-Id': 'Root=1-5b8e8419-4ceb04d996b0f66761255f93',\n     'X-Forwarded-For': '206.29.176.52',\n     'X-Forwarded-Port': '443',\n     'X-Forwarded-Proto': 'https' },\n  query: {},\n  path: {},\n  identity: \n   { cognitoIdentityPoolId: '',\n     accountId: '',\n     cognitoIdentityId: '',\n     caller: '',\n     sourceIp: '206.29.176.52',\n     accessKey: '',\n     cognitoAuthenticationType: '',\n     cognitoAuthenticationProvider: '',\n     userArn: '',\n     userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',\n     user: '' },\n  stageVariables: {} }\n"
          },
          {
            "id": "34255429528335657777452594178615637306725767638247538694",
            "timestamp": 1536066585371,
            "message": "2018-09-04T13:09:45.370Z\tcb344d6a-b043-11e8-933c-9d414b034894\tINFO  \t  { callbackWaitsForEmptyEventLoop: [Getter/Setter],\n  done: [Function: done],\n  succeed: [Function: succeed],\n  fail: [Function: fail],\n  logGroupName: '/aws/lambda/jazztest_test-splunk-prod',\n  logStreamName: '2018/09/04/[$LATEST]89e64d592ffa4374a9a85dc57a622e14',\n  functionName: 'jazztest_test-splunk-prod',\n  memoryLimitInMB: '256',\n  functionVersion: '$LATEST',\n  getRemainingTimeInMillis: [Function: getRemainingTimeInMillis],\n  invokeid: 'cb344d6a-b043-11e8-933c-9d414b034894',\n  awsRequestId: 'cb344d6a-b043-11e8-933c-9d414b034894',\n  invokedFunctionArn: 'arn:aws:lambda:us-west-2:302890901340:function:jazztest_test-splunk-prod' }\n"
          },
          {
            "id": "34255429528335657777452594178615637306725767638247538695",
            "timestamp": 1536066585371,
            "message": "END RequestId: cb344d6a-b043-11e8-933c-9d414b034894\n"
          },
          {
            "id": "34255429528335657777452594178615637306725767638247538696",
            "timestamp": 1536066585371,
            "message": "REPORT RequestId: cb344d6a-b043-11e8-933c-9d414b034894\tDuration: 15.37 ms\tBilled Duration: 100 ms \tMemory Size: 256 MB\tMax Memory Used: 20 MB\t\n"
          }
        ]
      };

      apiGatewayLogsPayload = {
        "messageType": "DATA_MESSAGE",
        "owner": "302890901340",
        "logGroup": "API-Gateway-Execution-Logs_dww0le4qre/prod",
        "logStream": "2a38a4a9316c49e5a833517c45d31070",
        "subscriptionFilters": [
          "jazz_cloud-logs-streamer-prod"
        ],
        "logEvents": [{
            "id": "34254535366754881534587556924695368967726048245496414208",
            "timestamp": 1536026489779,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Verifying Usage Plan for request: 706499f2-afe6-11e8-b7eb-8d53f824f304. API Key:  API Stage: dww0le4qre/prod"
          },
          {
            "id": "34254535366799483024984618170978440404271344968508375041",
            "timestamp": 1536026489781,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) API Key  authorized because method 'POST /jazz/apilinter' does not require API Key. Request will not contribute to throttle or quota limits"
          },
          {
            "id": "34254535366799483024984618170978440404271344968508375042",
            "timestamp": 1536026489781,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Usage Plan check succeeded for API Key  and API Stage dww0le4qre/prod"
          },
          {
            "id": "34254535366799483024984618170978440404271344968508375043",
            "timestamp": 1536026489781,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Starting execution for request: 706499f2-afe6-11e8-b7eb-8d53f824f304"
          },
          {
            "id": "34254535366799483024984618170978440404271344968508375044",
            "timestamp": 1536026489781,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) HTTP Method: POST, Resource Path: /api/jazz/apilinter"
          },
          {
            "id": "34254535371415737281080457161276334086709555800246321157",
            "timestamp": 1536026489988,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Successfully completed execution"
          },
          {
            "id": "34254535371415737281080457161276334086709555800246321158",
            "timestamp": 1536026489988,
            "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Method completed with status: 200"
          },
          {
            "id": "34254535441217069752481307594283132280098927313965023239",
            "timestamp": 1536026493118,
            "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) Verifying Usage Plan for request: 72621751-afe6-11e8-b7eb-8d53f824f304. API Key:  API Stage: dww0le4qre/prod"
          },
          {
            "id": "34254535441239370497679838217424667998371575675471003656",
            "timestamp": 1536026493119,
            "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) API Key  authorized because method 'POST /jazz/apilinter' does not require API Key. Request will not contribute to throttle or quota limits"
          },
          {
            "id": "34254535441239370497679838217424667998371575675471003657",
            "timestamp": 1536026493119,
            "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) Usage Plan check succeeded for API Key  and API Stage dww0le4qre/prod"
          },
          {
            "id": "34254535441261671242878368840566203716644224036976984074",
            "timestamp": 1536026493120,
            "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) Starting execution for request: 72621751-afe6-11e8-b7eb-8d53f824f304"
          },
          {
            "id": "34254535441261671242878368840566203716644224036976984075",
            "timestamp": 1536026493120,
            "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) HTTP Method: POST, Resource Path: /api/jazz/apilinter"
          },
          {
            "id": "34254535444740587493849146050645775767177368431909928972",
            "timestamp": 1536026493276,
            "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) Successfully completed execution"
          },
          {
            "id": "34254535444740587493849146050645775767177368431909928973",
            "timestamp": 1536026493276,
            "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) Method completed with status: 200"
          }
        ]
      }

    });

    describe("getCommonData", () => {
      it("should successfully execute getCommonData", () => {
        utils.getCommonData(lambdaLogsPaylod)
          .then(res => {
            expect(res).to.have.all.keys('service', 'namespace', 'environment', 'metadata', 'provider', 'request_id');
            expect(res.metadata).to.have.all.keys('platform_log_group', 'platform_log_stream');
            expect(res.metadata.platform_log_stream).to.eq(lambdaLogsPaylod.logStream);
            expect(res.metadata.platform_log_group).to.eq(lambdaLogsPaylod.logGroup);
          });
      });

      it("should return empty data", () => {
        lambdaLogsPaylod.logEvents = [];
        utils.getCommonData(lambdaLogsPaylod)
          .then(res => {
            expect(Object.keys(res.metadata).length).to.be.zero;
            expect(res.request_id).to.be.empty;
          });
      });
    });

    describe("transformLambdaLogs", () => {
      it("should successfully transform lambda logs", () => {
        let commonData = {
          service: "test-logs"
        };
        lambdaLogsPaylod.logEvents.forEach(logEvent => {
          utils.transformLambdaLogs(logEvent, commonData)
            .then(res => {
              expect(res).to.have.all.keys('event', 'sourcetype');
              expect(res.sourcetype).to.eq('applicationlogs');
            });
        });
      });

      it("should indicate error while transforming lambda function", () => {
        let commonData = {};
        utils.transformLambdaLogs(lambdaLogsPaylod.logEvents[0], commonData)
          .catch(err => {
            expect(err).to.include({
              result: 'inputError',
              message: 'Invalid lambda logs event.'
            });
          });
      });
    });

    describe("transformApiLogs", () => {
      it("should successfully transform Api Gateway logs", () => {
        utils.transformApiLogs(apiGatewayLogsPayload)
          .then(res => {
            expect(res).to.have.all.keys('event', 'sourcetype');
            expect(res.sourcetype).to.eq('apilogs')
          });
      });

      it("should indicate error while transforming lambda function", () => {
        apiGatewayLogsPayload.logEvents = [];
        utils.transformApiLogs(apiGatewayLogsPayload)
          .catch(err => {
            expect(err).to.include({
              result: 'inputError',
              message: 'Invalid api logs event.'
            });
          });
      });
    });
  });
});
