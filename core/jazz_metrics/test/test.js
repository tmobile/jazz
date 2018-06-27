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
var AWS = require('aws-sdk-mock');
var AWS_SDK = require('aws-sdk')

AWS.setSDKInstance(AWS_SDK);
const sinon = require('sinon');
const request = require('request');

const index = require('../index');
const configObj = require('../components/config.js');
const validateutils = require("../components/validation.js");
const global_config = require("../config/global-config.json");
const metricConfig = require('../components/metrics.json')

describe('jazz_metrics', function () {

  var tableName, global, spy, stub, err, errMessage, errType, dataObj, event, context, callback, callbackObj, logMessage, logStub, indexName, responseObj;

  beforeEach(function () {
    spy = sinon.spy();
    event = {
      "stage": "test",
      "method": "POST",
      "body": {
        "service": "test-service",
        "domain": "jazztest",
        "environment": "test",
        "end_time": "2018-06-22T07:48:56.000Z",
        "start_time": "2018-06-12T07:48:56.712Z",
        "interval": "600",
        "statistics": "average"
      },
      "principalId": "xswdxwscvff@test.com"
    };
    context = awsContext();
    callback = (err, responseObj) => {
      if (err) {
        return err;
      } else {
        return JSON.stringify(responseObj);
      }
    };
    err = {
      "errorType": "svtfoe",
      "message": "starco"
    };
    callbackObj = {
      "callback": callback
    };
    config = configObj(event);
  });

  describe('generic validation', () => {
    it("should indicate input error payload is missing", () => {
      event.body = {};
      index.genericValidation(event)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Invalid Input Error'
          })
        });
    });

    it("should indicate method is invalid if empty or invalid metod is provided", () => {
      var invalidArray = ["", "GET", "PUT"];
      for (var i in invalidArray) {
        event.method = invalidArray[i];
        index.genericValidation(event)
          .catch(error => {
            expect(error).to.include({
              result: 'inputError',
              message: 'Invalid method'
            });
          });
      }
    });

    it("should indicate unauthorized if principalId is null", () => {
      event.principalId = "";
      index.genericValidation(event)
        .catch(error => {
          expect(error).to.include({
            result: 'unauthorized',
            message: 'Unauthorized'
          });
        });
    });

  });

  describe("getToken", () => {

    it("should successfully get authToken", () => {
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      index.getToken(config)
        .then(res => {
          expect(res).to.eq(responseObj.body.data.token);
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should indicate error while acessing authToken", () => {
      var responseObj = {
        statusCode: 400,
        body: {
          data: {},
          message: "Could not get authentication token"
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      index.getToken(config)
        .catch(error => {
          expect(error).to.include({
            message: 'Could not get authentication token'
          });
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should indicate error while making request to login api", () => {
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(err, null, null)
      });
      index.getToken(config)
        .catch(error => {
          expect(error).to.include({
            error: 'Could not get authentication token for updating service catalog.'
          });
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

  });

  describe("getAssetsDetails", () => {
    it("Should successfully get assets details", () => {
      var authToken = "zaqwsxcderfv.qawsedrftg.qxderfvbhy";
      var assetsList = [{
          "environment": "test",
          "service": "test-service",
          "created_by": "xswdxwscvff@test.com",
          "timestamp": "2018-04-11T16:27:34:800",
          "status": "active",
          "provider": "aws",
          "provider_id": "arn:aws:lambda:test-region:302890901340:function:jazztest_test-service",
          "id": "886d901d-fffe-9ac9-becb-a7cfe96fd5dc",
          "domain": "jazztest",
          "asset_type": "lambda"
        },
        {
          "environment": "test",
          "service": "test-service",
          "created_by": "xswdxwscvff@test.com",
          "timestamp": "2018-04-11T16:30:46:715",
          "status": "active",
          "provider": "aws",
          "provider_id": "arn:aws:execute-api:test-region:302890901340:qwertyuiop/test/GET/jazztest/test-service",
          "id": "f6aabe91-cc2a-6a79-0e29-68e9ce037426",
          "domain": "jazztest",
          "asset_type": "apigateway"
        },
        {
          "environment": "test",
          "service": "test-service",
          "created_by": "xswdxwscvff@test.com",
          "timestamp": "2018-04-11T16:30:57:801",
          "status": "active",
          "provider": "aws",
          "provider_id": "http://test-env.com/jazztest_test-service/test/swagger.json",
          "id": "e0d626c2-f137-ba4b-d096-d7b420ba2744",
          "domain": "jazztest",
          "asset_type": "swagger_url"
        },
        {
          "environment": "test",
          "service": "test-service",
          "created_by": "xswdxwscvff@test.com",
          "timestamp": "2018-04-11T16:31:02:187",
          "status": "active",
          "provider": "aws",
          "provider_id": "https://test-env.com/api/jazztest/test-service",
          "id": "8039b94b-4380-33fa-c3fe-b970840bf1be",
          "domain": "jazztest",
          "asset_type": "endpoint_url"
        },
        {
          "environment": "test",
          "service": "test-service",
          "created_by": "xswdxwscvff@test.com",
          "timestamp": "2018-04-11T16:30:46:715",
          "status": "active",
          "provider": "aws",
          "provider_id": "arn:aws:s3:::apis-deployment-test-20180618210508085200000002/*",
          "id": "f6aabe91-cc2a-6a79-0e29-68e9ce037426",
          "domain": "jazztest",
          "asset_type": "s3"
        },
        {
          "environment": "test",
          "service": "test-service",
          "created_by": "xswdxwscvff@test.com",
          "timestamp": "2018-04-11T16:30:46:715",
          "status": "active",
          "provider": "aws",
          "provider_id": "arn:aws:cloudfront::192006145812:distribution/E16NHYWWTGCWY5",
          "id": "f6aabe91-cc2a-6a79-0e29-68e9ce037426",
          "domain": "jazztest",
          "asset_type": "cloudfront"
        }
      ];
      assetsList.map((eachAsset) => {
        var responseObj = {
          statusCode: 200,
          body: {
            data: [eachAsset]
          }
        };
        reqStub = sinon.stub(request, "Request").callsFake((obj) => {
          return obj.callback(null, responseObj, responseObj.body)
        });
        index.getAssetsDetails(config, event.body, authToken)
          .then(res => {
            if (eachAsset.asset_type === 's3') {
              expect(res[0]).to.have.deep.property('asset_name.BucketName')
            } else if (eachAsset.asset_type === 'cloudfront') {
              expect(res[0]).to.have.deep.property('asset_name.DistributionId')
            } else if (eachAsset.asset_type === 'lambda' || eachAsset.asset_type === 'apigateway') {
              expect(res[0]).to.include({
                type: eachAsset.asset_type
              })
            } else {
              expect(res[0]).to.include({
                isError: 'Metric not supported for asset type ' + eachAsset.asset_type
              })
            }
          });
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate assets not found if Assets API response has empty array", () => {
      var authToken = "zaqwsxcderfv.qawsedrftg.qxderfvbhy";
      var responseObj = {
        statusCode: 200,
        body: {
          data: []
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      index.getAssetsDetails(config, event.body, authToken)
        .then(res => {
          expect(res).to.be.empty;
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should indicate error if Assets API request fails", () => {
      var authToken = "zaqwsxcderfv.qawsedrftg.qxderfvbhy";
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(err, null, null)
      });
      index.getAssetsDetails(config, event.body, authToken)
        .catch(error => {
          expect(error).to.include(err);
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

  });

  describe("getActualParam", () => {
    it("should successfully get actual params", () => {
      var nameSpaceList = {
        'lambda': {
          awsNameSpace: 'AWS/Lambda',
          assetItem: {
            type: 'lambda',
            asset_name: {
              FunctionName: 'jazztest_test-service'
            },
            statistics: 'Average'
          }
        },
        'apigateway': {
          awsNameSpace: 'AWS/ApiGateway',
          assetItem: {
            type: 'apigateway',
            asset_name: {
              ApiName: '*',
              Method: 'GET',
              Resource: '/jazztest/test-service',
              Stage: 'test'
            },
            statistics: 'Average'
          }
        },
        's3': {
          awsNameSpace: 'AWS/S3',
          assetItem: {
            type: 's3',
            asset_name: {
              BucketName: 'apis-deployment-test-20180618210508085200000002',
              StorageType: 'StandardStorage'
            },
            statistics: 'Average'
          }
        },
        'cloudfront': {
          awsNameSpace: 'AWS/CloudFront',
          assetItem: {
            type: 'cloudfront',
            asset_name: {
              DistributionId: 'E16NHYWWTGCWY5',
              Region: 'Global'
            },
            statistics: 'Average'
          }
        }
      };
      Object.keys(nameSpaceList).forEach(param => {
        var paramMetrics = metricConfig.namespaces[param].metrics;
        index.getActualParam(paramMetrics, nameSpaceList[param].awsNameSpace, nameSpaceList[param].assetItem, event.body)
          .then(res => {
            for (var i in res) {
              expect(res[i]).to.have.all.deep.keys('Namespace', 'MetricName', 'Period', 'EndTime', 'StartTime', 'Dimensions', 'Statistics', 'Unit')
              expect(res[i].MetricName).to.eq(paramMetrics[i].MetricName);
              expect(res[i].Namespace).to.eq(nameSpaceList[param].awsNameSpace)
              expect(res[i].Period).to.not.be.empty;
              expect(res[i].EndTime).to.not.be.empty;
              expect(res[i].StartTime).to.not.be.empty;
              expect(res[i].Dimensions).to.not.be.empty;
              expect((res[i].Statistics[0]).toLowerCase()).to.include(event.body.statistics);
              expect(res[i].Unit).to.eq(paramMetrics[i].Unit);
            }
          });
      });
    });

    it("should indicate error if assets item is empty", () => {
      var nameSpaceList = {
        'lambda': {
          awsNameSpace: 'AWS/Lambda',
          assetItem: {
            type: 'lambda',
            asset_name: {
              FunctionName: ''
            },
            statistics: 'Average'
          }
        }
      }
      var paramMetrics = metricConfig.namespaces['lambda'].metrics;
      index.getActualParam(paramMetrics, nameSpaceList['lambda'].awsNameSpace, nameSpaceList['lambda'].assetItem, event.body)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Invalid asset_name inputs.'
          });
        })

    })

  });

  describe("validateAssets", () => {
    it("should successfully validate assets", () => {
      var assetsArray = [{
          type: 'lambda',
          asset_name: {
            FunctionName: 'jazztest_test-service'
          },
          statistics: 'Average'
        },
        {
          type: 'apigateway',
          asset_name: {
            ApiName: '*',
            Method: 'GET',
            Resource: '/jazztest/test-service',
            Stage: 'test'
          },
          statistics: 'Average'
        },
        {
          type: 's3',
          asset_name: {
            BucketName: 'apis-deployment-test-20180618210508085200000002',
            StorageType: 'StandardStorage'
          },
          statistics: 'Average'
        },
        {
          type: 'cloudfront',
          asset_name: {
            DistributionId: 'E16NHYWWTGCWY5',
            Region: 'Global'
          },
          statistics: 'Average'
        }
      ];
      for (var i in assetsArray) {
        index.validateAssets([assetsArray[i]], event.body)
          .then(res => {
            expect(res[0]).to.have.all.deep.keys('actualParam', 'userParam');
            expect(res[0].actualParam).to.not.be.empty;
            expect(res[0].userParam).to.not.be.empty;
          });
      }
    });

    it("should indicate error if asset tye is invalid", () => {
      var assetsArray = [{
        'isError': true,
        'awsNameSpace': 'Invalid'
      }];
      index.validateAssets([assetsArray[0]], event.body)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Unsupported metric type.'
          })
        });
    });

    it("should indicate error if asset tye is not supported", () => {
      var assetsArray = [{
        type: 'swagger_url',
        asset_name: {},
        statistics: 'Average'
      }];
      index.validateAssets([assetsArray[0]], event.body)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Unsupported metric type.'
          })
        });
    });

    it("should indicate error if there is no assets available", () => {
      index.validateAssets([], event.body)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Metric not found for requested asset'
          })
        });
    });
  });

  describe("getMetricsDetails", () => {
    it.only("should successfully get metrics details from cloudwatch", () => {
      var newAssetArray = {
        "actualParam": [{
          "Namespace": "AWS/Lambda",
          "MetricName": "Invocations",
          "Period": "600",
          "EndTime": "2018-06-22T07:48:56.000Z",
          "StartTime": "2018-06-12T07:48:56.712Z",
          "Dimensions": [{
            "Name": "FunctionName",
            "Value": "jazztest_test-service"
          }],
          "Statistics": ["Average"],
          "Unit": "Count"
        }, {
          "Namespace": "AWS/Lambda",
          "MetricName": "Errors",
          "Period": "600",
          "EndTime": "2018-06-22T07:48:56.000Z",
          "StartTime": "2018-06-12T07:48:56.712Z",
          "Dimensions": [{
            "Name": "FunctionName",
            "Value": "jazztest_test-service"
          }],
          "Statistics": ["Average"],
          "Unit": "Count"
        }, {
          "Namespace": "AWS/Lambda",
          "MetricName": "Dead Letter Error",
          "Period": "600",
          "EndTime": "2018-06-22T07:48:56.000Z",
          "StartTime": "2018-06-12T07:48:56.712Z",
          "Dimensions": [{
            "Name": "FunctionName",
            "Value": "jazztest_test-service"
          }],
          "Statistics": ["Average"],
          "Unit": "Count"
        }, {
          "Namespace": "AWS/Lambda",
          "MetricName": "Duration",
          "Period": "600",
          "EndTime": "2018-06-22T07:48:56.000Z",
          "StartTime": "2018-06-12T07:48:56.712Z",
          "Dimensions": [{
            "Name": "FunctionName",
            "Value": "jazztest_test-service"
          }],
          "Statistics": ["Average"],
          "Unit": "Milliseconds"
        }, {
          "Namespace": "AWS/Lambda",
          "MetricName": "Throttles",
          "Period": "600",
          "EndTime": "2018-06-22T07:48:56.000Z",
          "StartTime": "2018-06-12T07:48:56.712Z",
          "Dimensions": [{
            "Name": "FunctionName",
            "Value": "jazztest_test-service"
          }],
          "Statistics": ["Average"],
          "Unit": "Count"
        }, {
          "Namespace": "AWS/Lambda",
          "MetricName": "IteratorAge",
          "Period": "600",
          "EndTime": "2018-06-22T07:48:56.000Z",
          "StartTime": "2018-06-12T07:48:56.712Z",
          "Dimensions": [{
            "Name": "FunctionName",
            "Value": "jazztest_test-service"
          }],
          "Statistics": ["Average"],
          "Unit": "Milliseconds"
        }],
        "userParam": {
          "type": "lambda",
          "asset_name": {
            "FunctionName": "jazztest_test-service"
          },
          "statistics": "Average"
        }
      };
      // AWS_SDK.config.update({
      //   accessKeyId : 'foo', secretAccessKey : 'bar', region : 'baz'
      // });
      var cloudwatch = new AWS_SDK.CloudWatch({
        apiVersion: '2010-08-01'
      });

      // AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
      //   return cb(null, dataObj);
      // });
      AWS.mock('CloudWatch', "getMetricStatistics", (obj) => {
        console.log("params:", obj);
        return cb(null, "hello");
      })
      // const stubMetrics = sinon.stub(cloudwatch, 'getMetricStatistics').returns("hello");
      index.getMetricsDetails(newAssetArray, cloudwatch)
      .then(res => {
        console.log(res);
      })
      .catch(error => {
        console.log(error);
      })
    })
  })

});
