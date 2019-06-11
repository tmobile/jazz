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
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const zlib = require('zlib');
var PassThrough = require('stream').PassThrough;
var https = require('https');

const index = require('../index');
const configObj = require('../components/config.js');
const utils = require("../components/utils");

describe('jazz_es-kinesis-log-stream', function () {
  var err, context, callback, config, event;
  beforeEach(function () {
    context = awsContext();
    context.functionName = context.functionName + "-test";
    err = {
      "errorType": "svtfoe",
      "message": "starco"
    };
    event = {
      "Records": [{
        "kinesis": {
          "data": "H4sIAAAAAAAAAKVSy27bMBD8FUIo0IsU8SGJpG4OrAYF6qaw1Usto6CkVaBUr4p03DjIv3ftpuipgINcSHBmhzuz5JPXg7XmDvLHCbzUWy7yxfdVttksbjLP98bDADPCjHJJJY9YIhnC3Xh3M4/7CZnQHGzYmb6sTTjAwU7dfvgR3Jvj0YF1wXkxUxtM81j/UW7cDKZHKadMhVSHXIbbd58WebbJd0klQDOlKpBN1JRVGUfYGU+0gTqpJF5h96Wt5nZy7Th8aDsHs/XS7euM7M5OsgcY3En85LU1GhIR11oLHtOIakUTiSetuIi0SpiMqY6QZZorGkdCilgyRrGKoynX4hyd6XEkLBao5Tgqxbn/d74veQOqAy5zFqdcp1xeYcm3wrGGqkrESVDxxASMgQoUk1WATQwTdcNjxQr3P71PHmAuRwukcO994pPtWN5D5cjtedsVg/fsvy2iuDBi9nlJ1vBzj4Uf65RclOvt7qIL3a2zL7fr/NUG3XI/m9NvS4m60oL0tnDXbddBTf4xaAQJfIEV9OP8SDbtEVLC44SsrhE0v8gL8dXCqbE+46fwu+ffPBUArYUDAAA="
        }
      }]
    };
    callback = (err, responseObj) => {
      if (err) {
        return err;
      } else {
        return JSON.stringify(responseObj);
      }
    };

    config = configObj.getConfig(event, context);
  });

  describe('handler', () => {
    let postResult;

    beforeEach(function () {
      postResult = {
        "attemptedItems": 1,
        "successfulItems": 1,
        "failedItems": 0
      };
    });

    it('should indicate that record is skipped since message is not in supported format (gzip)', () => {
      let zipStub = sinon.stub(zlib, "gunzip").yields((err, res) => {
        return callback(err, null);
      });
      index.handler(event, context, (error, res) => {
        expect(res).to.have.all.keys('data', 'input');
        expect(res.data).to.eq("Success");
        sinon.assert.callCount(zipStub, event.Records.length);
        zipStub.restore();
      });
    });

    it('should indicate that record is skipped due to some unknown error', () => {
      let zipStub = sinon.stub(zlib, "gunzip").yields();
      index.handler(event, context, (error, res) => {
        expect(res).to.have.all.keys('data', 'input');
        expect(res.data).to.eq("Success");
        sinon.assert.callCount(zipStub, event.Records.length);
        zipStub.restore();
      });
    });

    it('should indicate success when transform returns error and skip the post function', () => {
      let transform = sinon.stub(utils, "transform").rejects(err);
      let post = sinon.stub(index, "post").yields(null, postResult, 200, []);
      index.handler(event, context, (error, res) => {
        expect(res).to.have.all.keys('data', 'input');
        expect(res.data).to.eq("Success");
        sinon.assert.calledOnce(transform);
        sinon.assert.notCalled(post);
        transform.restore();
        post.restore();
      });
    })

    it('should indicate success when transform returns empty data and skip the post function', () => {
      let transform = sinon.stub(utils, "transform").resolves();
      let post = sinon.stub(index, "post").yields(null, postResult, 200, []);
      index.handler(event, context, (error, res) => {
        expect(res).to.have.all.keys('data', 'input');
        expect(res.data).to.eq("Success");
        sinon.assert.calledOnce(transform);
        sinon.assert.notCalled(post);
        transform.restore();
        post.restore();
      });
    });

    it('should indicate that the provided input is empty', () => {
      index.handler({}, context, (error, res) => {
        expect(res).to.have.all.keys('data', 'input');
        expect(res.data).to.eq("Success");
      });
    });

    it('should indicate error while sending post request to es endpoint', () => {
      let transform = sinon.stub(utils, "transform").resolves("hello world");
      let post = sinon.stub(index, "post").yields(err, null, 400, [1, 2]);
      index.handler(event, context, (error, res) => {
        expect(error).to.include('{"errorType":"InternalServerError"');
        sinon.assert.calledOnce(transform);
        sinon.assert.calledOnce(post);
        transform.restore();
        post.restore();
      });
    })

    it('should send post request es endpoint', () => {

      let transform = sinon.stub(utils, "transform").resolves("hello world");
      let post = sinon.stub(index, "post").yields(null, postResult, 200, []);
      index.handler(event, context, (error, res) => {
        expect(res).to.have.all.keys('data', 'input');
        expect(res.data).to.eq("Success");
        sinon.assert.calledOnce(transform);
        sinon.assert.calledOnce(post);
        transform.restore();
        post.restore();
      });
    });

  });

  describe('post', () => {
    let payload, expected, response, request, data;
    beforeEach(function () {
      payload = {
        "host": config.ES_ENDPOINT,
        "method": "POST",
        "path": "/_bulk",
        "body": "Sample data",
        "headers": {
          "Content-Type": "application/json",
        }
      };
      expected = {
        "took": 91,
        "errors": false,
        "items": [{
            "index": {
              "_index": "applicationlogs",
              "_type": "prod",
              "_id": "34299932504098067999982349861750949931928054373571100672",
              "_version": 4,
              "result": "updated",
              "_shards": {
                "total": 2,
                "successful": 2,
                "failed": 0
              },
              "created": false,
              "status": 200
            }
          },
          {
            "index": {
              "_index": "applicationlogs",
              "_type": "prod",
              "_id": "34299932504098067999982349861750949931928054373571100673",
              "_version": 4,
              "result": "updated",
              "_shards": {
                "total": 2,
                "successful": 2,
                "failed": 0
              },
              "created": false,
              "status": 200
            }
          },
          {
            "index": {
              "_index": "applicationlogs",
              "_type": "prod",
              "_id": "34299932504098067999982349861750949931928054373571100674",
              "_version": 4,
              "result": "updated",
              "_shards": {
                "total": 2,
                "successful": 2,
                "failed": 0
              },
              "created": false,
              "status": 200
            }
          }
        ]
      };

      response = new PassThrough();
      request = new PassThrough();
    });

    it("should successfully execute the post function", () => {
      expected.errors = true;
      response.write(JSON.stringify(expected));
      response.end();

      this.request = sinon.stub(https, 'request');
      this.request.callsArgWith(1, response)
        .returns(request);

      let buildRequest = sinon.stub(utils, "buildRequest").returns(payload);
      index.post(config, "hello world", (error, success, response, failedItems) => {

        expect(error).to.have.all.keys('statusCode', 'responseBody');
        sinon.assert.calledOnce(buildRequest);
        sinon.assert.calledOnce(this.request);
        this.request.restore();
        buildRequest.restore();
      });
    })
  });

  describe('utils', () => {

    describe('transform', () => {
      it('should indicate unsupported event logs', () => {
        utils.transform("")
          .then(res => {
            expect(res).to.be.undefined;
          })
      });

      it('should indicate event log includes control message', () => {
        let payload = {
          messageType: 'CONTROL_MESSAGE'
        }
        utils.transform(payload)
          .then(res => {
            expect(res).to.be.undefined;
          });
      });

      it('should resolve with undefined response for invalid type of lambda logs', () => {
        let payload = {
          messageType: 'DATA_MESSAGE',
          logGroup: '/aws/lambda/jazztest-test-api-dev',
          logEvents: []
        }
        utils.transform(payload)
          .then(res => {
            expect(res).to.be.undefined;
          });
      });

      it('should resolve with undefined response for invalid type of API Gateway logs', () => {
        let payload = {
          messageType: 'DATA_MESSAGE',
          logGroup: 'API-Gateway-Execution-Logs_xxxxxxxxxx/dev',
          logEvents: []
        }
        utils.transform(payload)
          .then(res => {
            expect(res).to.be.undefined;
          });
      });

      it('should successfully transform the lambda logs', () => {
        let payload = {
          "messageType": "DATA_MESSAGE",
          "owner": "123456789012",
          "logGroup": "/aws/lambda/newsplunk-jazztest-test-api-dev",
          "logStream": "2018/09/27/[$LATEST]6c3e9188ce7f4fbcb54270ce70fed6c7",
          "subscriptionFilters": [
            "/aws/lambda/newsplunk-jazztest-test-api-dev"
          ],
          "logEvents": [{
              "id": "34299932504098067999982349861750949931928054373571100672",
              "timestamp": 1538062167822,
              "message": "2018-09-27T15:29:27.822Z\t1f08c356-c26a-11e8-817c-373a13df2581\t2018-09-27T15:29:27.822Z, verbose \t', , [object Object]\n"
            },
            {
              "id": "34299932504098067999982349861750949931928054373571100673",
              "timestamp": 1538062167822,
              "message": "END RequestId: 1f08c356-c26a-11e8-817c-373a13df2581\n"
            },
            {
              "id": "34299932504098067999982349861750949931928054373571100674",
              "timestamp": 1538062167822,
              "message": "REPORT RequestId: 1f08c356-c26a-11e8-817c-373a13df2581\tDuration: 8.93 ms\tBilled Duration: 100 ms \tMemory Size: 256 MB\tMax Memory Used: 19 MB\t\n"
            }
          ]
        };
        utils.transform(payload)
          .then(res => {
            expect(res).to.include('index')
            expect(res).to.include('environment')
            expect(res).to.include('servicename')
            expect(res).to.include('request_id')
            expect(res).to.include('platform_log_group')
            expect(res).to.include('platform_log_stream')
            expect(res).to.include('domain')
            expect(res).to.include('log_level')
          });
      });

      it('should successfully transform the API Gateway logs', () => {
        let payload = {
          "messageType": "DATA_MESSAGE",
          "owner": "123456789012",
          "logGroup": "API-Gateway-Execution-Logs_abc123def45/dev",
          "logStream": "2a38a4a9316c49e5a833517c45d31070",
          "subscriptionFilters": [
            "jazz_cloud-logs-streamer-dev"
          ],
          "logEvents": [{
              "id": "34254535366754881534587556924695368967726048245496414208",
              "timestamp": 1536026489779,
              "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Verifying Usage Plan for request: 706499f2-afe6-11e8-b7eb-8d53f824f304. API Key:  API Stage: abc123def45/dev"
            },
            {
              "id": "34254535366799483024984618170978440404271344968508375041",
              "timestamp": 1536026489781,
              "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) API Key  authorized because method 'POST /jazztest/abc' does not require API Key. Request will not contribute to throttle or quota limits"
            },
            {
              "id": "34254535366799483024984618170978440404271344968508375042",
              "timestamp": 1536026489781,
              "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Usage Plan check succeeded for API Key  and API Stage abc123def45/dev"
            },
            {
              "id": "34254535366799483024984618170978440404271344968508375043",
              "timestamp": 1536026489781,
              "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) Starting execution for request: 706499f2-afe6-11e8-b7eb-8d53f824f304"
            },
            {
              "id": "34254535366799483024984618170978440404271344968508375044",
              "timestamp": 1536026489781,
              "message": "(706499f2-afe6-11e8-b7eb-8d53f824f304) HTTP Method: POST, Resource Path: /api/jazztest/abc"
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
              "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) Verifying Usage Plan for request: 72621751-afe6-11e8-b7eb-8d53f824f304. API Key:  API Stage: abc123def45/dev"
            },
            {
              "id": "34254535441239370497679838217424667998371575675471003656",
              "timestamp": 1536026493119,
              "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) API Key  authorized because method 'POST /jazztest/abc' does not require API Key. Request will not contribute to throttle or quota limits"
            },
            {
              "id": "34254535441239370497679838217424667998371575675471003657",
              "timestamp": 1536026493119,
              "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) Usage Plan check succeeded for API Key  and API Stage abc123def45/dev"
            },
            {
              "id": "34254535441261671242878368840566203716644224036976984074",
              "timestamp": 1536026493120,
              "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) Starting execution for request: 72621751-afe6-11e8-b7eb-8d53f824f304"
            },
            {
              "id": "34254535441261671242878368840566203716644224036976984075",
              "timestamp": 1536026493120,
              "message": "(72621751-afe6-11e8-b7eb-8d53f824f304) HTTP Method: POST, Resource Path: /api/jazztest/abc"
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
        };
        utils.transform(payload)
          .then(res => {
            expect(res).to.include('index')
            expect(res).to.include('environment')
            expect(res).to.include('servicename')
            expect(res).to.include('request_id')
            expect(res).to.include('platform_log_group')
            expect(res).to.include('platform_log_stream')
            expect(res).to.include('domain')
            expect(res).to.include('log_level')
          });
      });
    });

    describe('buildRequest', () => {
      it('should successfully return build request payload', () => {
        let res = utils.buildRequest(config.ES_ENDPOINT, "sample text");
        expect(res).to.have.all.keys('host', 'method', 'path', 'body', 'headers');
      })
    })

  });
});
