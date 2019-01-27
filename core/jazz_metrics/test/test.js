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
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const request = require('request');

const index = require('../index');
const configObj = require('../components/config.js');
const validateUtils = require("../components/validation.js");
const global_config = require("../config/global-config.json");
const metricConfig = require('../components/metrics.json');
const utils = require('../components/utils.js')

describe('jazz_metrics', function () {

  var err, event, context, callback, callbackObj;

  beforeEach(function () {
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
    config = configObj.getConfig(event, context);
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

    it("should indicate method is invalid if empty or invalid method is provided", () => {
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

  describe('validateUtils', () => {
    it("should successfully validate input", () => {
      validateUtils.validateGeneralFields(event.body)
        .then(res => {
          expect(res).to.eq(event.body);
        });
    });

    it("should indicate empty payload if event.body is empty", () => {
      validateUtils.validateGeneralFields({})
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Input payload cannot be empty'
          })
        });
    });

    it("should indicate that required fields are missing from input", () => {
      var required_fields = global_config.REQUIRED_FIELDS;
      required_fields.forEach(field => {
        var payload = Object.assign({}, event.body);
        delete payload[field];

        validateUtils.validateGeneralFields(payload)
          .catch(error => {
            expect(error).to.include({
              result: 'inputError',
              message: 'Following field(s) are required - ' + field
            });
          });
      });
    });

    it("should indicate that required field values are missing in input", () => {
      var required_fields = global_config.REQUIRED_FIELDS;
      required_fields.forEach(field => {
        var payload = Object.assign({}, event.body);
        payload[field] = '';

        validateUtils.validateGeneralFields(payload)
          .catch(error => {
            expect(error).to.include({
              result: 'inputError',
              message: 'Following field(s) value cannot be empty - ' + field
            });
          });
      });
    });

    it("should indicate that interval value is invalid", () => {
      event.body.interval = 200;
      validateUtils.validateGeneralFields(event.body)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Invalid interval value'
          });
        });
    });

    it("should indicate that end_time value is invalid", () => {
      var invalid_time = "Fri, 29 Jun 2018 12:11:30 GMT";
      var time_list = ["end_time", "start_time"];
      time_list.forEach(field => {
        var payload = Object.assign({}, event.body);
        payload[field] = invalid_time;
        validateUtils.validateGeneralFields(payload)
          .catch(error => {
            expect(error).to.include({
              result: 'inputError',
              message: 'Invalid ' + field
            });
          });
      });
    });

    it("should indicate input error if start time is greater than end time", () => {
      var payload = Object.assign({}, event.body);
      payload.end_time = "2018-06-12T07:48:56.712Z";
      payload.start_time = "2018-06-27T07:48:56.712Z";
      validateUtils.validateGeneralFields(payload)
        .catch(error => {
          expect(error).to.include({
            result: "inputError",
            message: "start_time should be less than end_time"
          });
        });
    });

    it("should indicate that statistics value is invalid", () => {
      var payload = Object.assign({}, event.body);
      payload.statistics = "invalid";
      validateUtils.validateGeneralFields(payload)
        .catch(error => {
          expect(error).to.include({
            result: "inputError",
            message: "Invalid statistics type"
          })
        })
    })

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
      var assetsList = {
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
      }

      var responseObj = {
        statusCode: 200,
        body: JSON.stringify({
          data: [assetsList]
        })
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var getAssetRes = {
        "type": "assetType",
        "asset_name": "dimensionObj",
        "statistics": "userStatistics",
        "provider": "aws"
      }
      const getAssetsObj = sinon.stub(utils, "getAssetsObj").returns(getAssetRes);
      index.getAssetsDetails(config, event.body, authToken)
        .then(res => {
          expect(res).to.have.all.keys('type', 'asset_name', 'statistics', 'provider');
          sinon.assert.calledOnce(getAssetsObj);
          getAssetsObj.restore();
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should indicate assets not found if Assets API response has empty array", () => {
      var authToken = "zaqwsxcderfv.qawsedrftg.qxderfvbhy";
      var responseObj = {
        statusCode: 200,
        body: JSON.stringify({
          data: []
        })
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
    var stubAP, stubNS;
    beforeEach(function () {
      stubAP = sinon.stub(index, "getActualParam");
      stubNS = sinon.stub(utils, "getNameSpaceAndMetricDimensons");
    });

    afterEach(function () {
      index.getActualParam.restore();
      utils.getNameSpaceAndMetricDimensons.restore();
    });

    it("should successfully validate assets", () => {
      var assetsArray = [{
        type: 'lambda',
        asset_name: {
          FunctionName: 'jazztest_test-service'
        },
        statistics: 'Average',
        provider: 'aws'
      }];
      const getActualParam = stubAP.resolves("resObj");
      const getNameSpaceAndMetricDimensons = stubNS.returns({
        awsNameSpace: "namSpace",
        paramMetrics: ["metric1", "metric2"]
      });
      index.validateAssets(assetsArray, event.body)
        .then(res => {
          expect(res[0]).to.have.all.deep.keys('actualParam', 'userParam', 'provider');
          expect(res[0].actualParam).to.not.be.empty;
          expect(res[0].userParam).to.not.be.empty;
          sinon.assert.calledOnce(getActualParam);
          sinon.assert.calledOnce(getNameSpaceAndMetricDimensons);
        });
    });

    it("should indicate error if getActualParam rejects with error", () => {
      var assetsArray = [{
        type: 'lambda',
        asset_name: {
          FunctionName: 'jazztest_test-service'
        },
        statistics: 'Average',
        provider: 'aws'
      }];
      const getActualParam = stubAP.rejects(err);
      const getNameSpaceAndMetricDimensons = stubNS.returns({
        awsNameSpace: "namSpace",
        paramMetrics: ["metric1", "metric2"]
      });
      index.validateAssets(assetsArray, event.body)
        .catch(error => {
          expect(error).to.include(err);
          sinon.assert.calledOnce(getActualParam);
          sinon.assert.calledOnce(getNameSpaceAndMetricDimensons);
        });
    })

    it("should indicate error if asset tye is invalid", () => {
      var assetsArray = [{
        'isError': true,
        'awsNameSpace': 'Invalid'
      }];
      index.validateAssets(assetsArray, event.body)
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
      const getNameSpaceAndMetricDimensons = stubNS.returns({
        awsNameSpace: "Invalid",
        isError: true
      })
      index.validateAssets(assetsArray, event.body)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Unsupported metric type.'
          });
          sinon.assert.calledOnce(getNameSpaceAndMetricDimensons);
        });
    });

    it("should indicate error if there are no assets available", () => {
      index.validateAssets([], event.body)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Metric not found for requested asset'
          })
        });
    });
  });

  describe("cloudWatchDetails", () => {
    var lambdaAssetArray, cfAssetArray;
    beforeEach(function () {
      lambdaAssetArray = {
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
        }],
        "userParam": {
          "type": "lambda",
          "asset_name": {
            "FunctionName": "jazztest_test-service"
          },
          "statistics": "Average"
        }
      };
      cfAssetArray = {
        "actualParam": [{
          "Namespace": "AWS/CloudFront",
          "MetricName": "Requests",
          "Period": "600",
          "EndTime": "2018-06-22T07:48:56.000Z",
          "StartTime": "2018-06-12T07:48:56.712Z",
          "Dimensions": [{
            "Name": "DistributionId",
            "Value": "E16NHYWWTGCWY5"
          }, {
            "Name": "Region",
            "Value": "Global"
          }],
          "Statistics": ["Average"],
          "Unit": "None"
        }],
        "userParam": {
          "type": "cloudfront",
          "asset_name": {
            "DistributionId": "E16NHYWWTGCWY5",
            "Region": "Global"
          },
          "statistics": "Average"
        }
      }
    });

    it("should successfully get metrics details from cloudwatch", () => {
      var dataArray = [lambdaAssetArray, cfAssetArray];
      var responseObj = {
        "ResponseMetadata": {
          "RequestId": "ba9e7fbd-7dcc-11e8-bc2d-395011659ba5"
        },
        "Label": "Duration",
        "Datapoints": [{
          "Timestamp": "2018-06-28T10:07:00.000Z",
          "Sum": 29.78,
          "Unit": "Milliseconds"
        }]
      }
      var assetDataRes = {
        "type": "assettype",
        "asset_name": "abc",
        "statistics": "sum",
        "metrics": []
      }
      const assetData = sinon.stub(utils, "assetData").returns(assetDataRes);
      AWS.mock('CloudWatch', "getMetricStatistics", (params, cb) => {
        return cb(null, responseObj);
      })
      dataArray.forEach(each => {
        index.cloudWatchDetails(each)
          .then(res => {
            expect(res).to.have.all.deep.keys('type', 'asset_name', 'statistics', 'metrics');
            sinon.assert.calledTwice(assetData);
            assetData.restore()

          });
      })
      AWS.restore('CloudWatch');
    });

    it("should indicate error if CloudWatch fails", () => {
      AWS.mock('CloudWatch', "getMetricStatistics", (params, cb) => {
        return cb(err, null);
      })
      index.cloudWatchDetails(lambdaAssetArray)
        .catch(error => {
          expect(error).to.include({
            result: 'serverError',
            message: 'Unknown internal error occurred'
          });
          AWS.restore('CloudWatch');
        });
    });

    it("should indicate InvalidParameterCombination", () => {
      var errorObj = {
        code: 'InvalidParameterCombination',
        message: 'InvalidParameterCombination from cloudwatch.'
      }
      AWS.mock('CloudWatch', "getMetricStatistics", (params, cb) => {
        return cb(errorObj, null);
      })
      index.cloudWatchDetails(lambdaAssetArray)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: errorObj.message
          });
          AWS.restore('CloudWatch');
        });
    })
  });

  describe('getMetricsDetails', () => {
    var assetsArray = [], stubCW;
    beforeEach(function () {
      assetsArray = [{
        "actualParam": [{
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
          "Unit": "Count"
        }],
        "userParam": {
          "type": "lambda",
          "asset_name": {
            "FunctionName": "jazztest_test-service"
          },
          "statistics": "Average"
        },
        "provider": "aws"
      }];
      stubCW = sinon.stub(index, 'cloudWatchDetails');
    });

    afterEach(function (){
      index.cloudWatchDetails.restore();
    })

    it("should successfully get datapoints for each metrics", () => {
      var responseObj = {
        "type": "lambda",
        "asset_name": {
          "FunctionName": "jazztest_test-service"
        },
        "statistics": "Average",
        "metrics": [{
          "metric_name": "Duration",
          "datapoints": [{
            "Timestamp": "2018-06-28T10:07:00.000Z",
            "Sum": 29.78,
            "Unit": "Milliseconds"
          }]
        }]
      }

      const cloudWatchDetails = stubCW.resolves(responseObj)
      index.getMetricsDetails(assetsArray)
        .then(res => {
          expect(res[0]).to.have.all.deep.keys('type', 'asset_name', 'statistics', 'metrics');
          sinon.assert.calledOnce(cloudWatchDetails);
        });

    });

    it("should indicate error if cloudWatchDetails rejects with error", () => {
      var errorObj = {
        code: 'InvalidParameterCombination',
        message: 'InvalidParameterCombination from cloudwatch.'
      }
      const cloudWatchDetails = stubCW.rejects(errorObj)
      index.getMetricsDetails(assetsArray)
        .catch(error => {
          expect(error).to.include(errorObj);
          sinon.assert.calledOnce(cloudWatchDetails);
        });
    })
  });

  describe("handler", () => {
    var metricsDetailsRes = [],
      assetDetailsRes = [],
      validateAssetsRes = [];
    beforeEach(function () {
      assetDetailsRes = [{
        type: 'lambda',
        asset_name: {
          FunctionName: 'jazztest_test-service'
        },
        statistics: 'Average'
      }];
      validateAssetsRes = [{
        "actualParam": [{
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
          "Unit": "Count"
        }],
        "userParam": {
          "type": "lambda",
          "asset_name": {
            "FunctionName": "jazztest_test-service"
          },
          "statistics": "Average"
        }
      }];
      metricsDetailsRes = [{
        "type": "lambda",
        "asset_name": {
          "FunctionName": "jazztest_test-service"
        },
        "statistics": "Average",
        "metrics": [{
          "metric_name": "Duration",
          "datapoints": [{
            "Timestamp": "2018-06-28T10:07:00.000Z",
            "Sum": 29.78,
            "Unit": "Milliseconds"
          }]
        }]
      }];
    });

    it("should successfully get metrics data for provided input", () => {
      const genericValidation = sinon.stub(index, "genericValidation").resolves();
      const validateGeneralFields = sinon.stub(validateUtils, "validateGeneralFields").resolves(event.body);
      const getToken = sinon.stub(index, 'getToken').resolves("zaqwsxcderfv.qawsedrftg.qxderfvbhy");
      const getAssetsDetails = sinon.stub(index, "getAssetsDetails").resolves(assetDetailsRes);
      const validateAssets = sinon.stub(index, "validateAssets").resolves(validateAssetsRes);
      const getMetricsDetails = sinon.stub(index, "getMetricsDetails").resolves(metricsDetailsRes);
      const massageData = sinon.stub(utils, "massageData").returns({
        assets: "test"
      })

      index.handler(event, context, (error, res) => {
        expect(res).to.have.all.deep.keys('data', 'input');
        expect(res).to.have.deep.property('data.assets');
        expect(res.data.assets).to.not.be.empty;

        sinon.assert.calledOnce(genericValidation);
        sinon.assert.calledOnce(validateGeneralFields);
        sinon.assert.calledOnce(getToken);
        sinon.assert.calledOnce(getAssetsDetails);
        sinon.assert.calledOnce(validateAssets);
        sinon.assert.calledOnce(getMetricsDetails);
        sinon.assert.calledOnce(massageData);

        genericValidation.restore();
        validateGeneralFields.restore();
        getToken.restore();
        getAssetsDetails.restore();
        validateAssets.restore();
        getMetricsDetails.restore();
        massageData.restore();
      });
    });

    it("should indicate Bad request if genericValidation rejects with Invalid Input Error", () => {
      event.body = {};
      const genericValidation = sinon.stub(index, "genericValidation").rejects({
        result: "inputError",
        message: "Invalid Input Error"
      });

      index.handler(event, context, (error, res) => {
        expect(error).to.include('{"errorType":"BadRequest","message":"Invalid Input Error"}');
        sinon.assert.calledOnce(genericValidation);
        genericValidation.restore();
      });
    });

    it("should indicate unauthorized if genericValidation rejects with unauthorized error", () => {
      event.principalId = '';
      const genericValidation = sinon.stub(index, "genericValidation").rejects({
        result: "unauthorized",
        message: "Unauthorized"
      });

      index.handler(event, context, (error, res) => {
        expect(error).to.include('{"errorType":"Unauthorized","message":"Unauthorized"}');
        sinon.assert.calledOnce(genericValidation);
        genericValidation.restore();
      });
    });

    it("should indicate internal server error if cloudwatch.getMetricStatistics() fails", () => {
      const genericValidation = sinon.stub(index, "genericValidation").resolves();
      const validateGeneralFields = sinon.stub(validateUtils, "validateGeneralFields").resolves(event.body);
      const getToken = sinon.stub(index, 'getToken').resolves("zaqwsxcderfv.qawsedrftg.qxderfvbhy");
      const getAssetsDetails = sinon.stub(index, "getAssetsDetails").resolves(assetDetailsRes);
      const validateAssets = sinon.stub(index, "validateAssets").resolves(validateAssetsRes);
      const getMetricsDetails = sinon.stub(index, "getMetricsDetails").rejects({
        "result": "serverError",
        "message": "Unknown internal error occurred"
      });

      index.handler(event, context, (error, res) => {
        expect(error).to.include('{"errorType":"InternalServerError","message":"Error in fetching cloudwatch metrics"}');

        sinon.assert.calledOnce(genericValidation);
        sinon.assert.calledOnce(validateGeneralFields);
        sinon.assert.calledOnce(getToken);
        sinon.assert.calledOnce(getAssetsDetails);
        sinon.assert.calledOnce(validateAssets);
        sinon.assert.calledOnce(getMetricsDetails);

        genericValidation.restore();
        validateGeneralFields.restore();
        getToken.restore();
        getAssetsDetails.restore();
        validateAssets.restore();
        getMetricsDetails.restore();
      });
    });

  });

  describe("utils", () => {
    it("should massage data for provided input params", () => {
      var resObj = utils.massageData("assetData", event.body)
      expect(resObj).to.have.all.keys('service', 'domain', 'environment', 'start_time', 'end_time', 'assets', 'interval', 'statistics');
      expect(resObj.assets).to.eq("assetData");
    });

    it("should re-arrange asset data for provided input/result data", () => {
      var results = [{
        "Label": "Duration",
        "Datapoints": [{
          "Timestamp": "2018-06-28T10:07:00.000Z",
          "Sum": 29.78,
          "Unit": "Milliseconds"
        }]
      }];
      var assetItem = {
        type: 's3',
        statistics: 'sum',
        asset_name: 'assetName'
      }
      var resObj = utils.assetData(results, assetItem);
      expect(resObj).to.have.all.keys('type', 'asset_name', 'statistics', 'metrics');
    });

    describe('getNameSpaceAndMetricDimensons', () => {
      it("should provide all metrics params for provided namespace", () => {
        var validNameSpace = ['apigateway', 'cloudfront', 'lambda', 's3'];
        validNameSpace.forEach(namespace => {
          var resObj = utils.getNameSpaceAndMetricDimensons(namespace);
          expect(resObj).to.have.all.keys('isError', 'paramMetrics', 'awsNameSpace');
          expect(resObj.isError).to.be.false;
          resObj.paramMetrics.forEach(each => {
            if (namespace === 's3') {
              expect(each).to.have.all.keys('MetricName', 'Unit', 'Dimensions', 'Statistics');
            } else {
              expect(each).to.have.all.keys('MetricName', 'Unit', 'Dimensions');
            }
          })
        });
      });

      it("should indicate error while accessing metric params for invalid namespace", () => {
        var invalidNameSpace = ['swagger_url', 'endpoint_url'];
        invalidNameSpace.forEach(namespace => {
          var resObj = utils.getNameSpaceAndMetricDimensons(namespace);
          expect(resObj).to.have.all.keys('isError', 'awsNameSpace');
          expect(resObj.isError).to.be.true;
          expect(resObj.awsNameSpace).to.eq("Invalid");
        })
      })
    });

    it("should successfully get asset object for provided asset details", () => {
      var assetsArray = [{
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

      var userStatistics = 'average';
      assetsArray.forEach(asset => {
        var resObj = utils.getAssetsObj([asset], userStatistics);
        if (asset.asset_type === 's3') {
          expect(resObj[0]).to.have.all.deep.keys('type', 'asset_name', 'statistics', 'provider')
          expect(resObj[0]).to.have.deep.property('asset_name.BucketName')
        } else if (asset.asset_type === 'cloudfront') {
          expect(resObj[0]).to.have.all.deep.keys('type', 'asset_name', 'statistics', 'provider')
          expect(resObj[0]).to.have.deep.property('asset_name.DistributionId')
        } else if (asset.asset_type === 'lambda' || asset.asset_type === 'apigateway') {
          expect(resObj[0]).to.have.all.deep.keys('type', 'asset_name', 'statistics', 'provider')
          expect(resObj[0]).to.include({
            type: asset.asset_type
          })
        }
      });
    });

    it("should indicate error if provided asset does not support", () => {
      var assetsArray = [{
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
        }
      ];

      var userStatistics = 'average';
      assetsArray.forEach(asset => {
        var resObj = utils.getAssetsObj([asset], userStatistics);
        expect(resObj[0]).to.have.all.deep.keys('isError', 'provider')
        expect(resObj[0]).to.include({
          isError: 'Metric not supported for asset type ' + asset.asset_type
        })
      });
    });

  });

});
