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

/**
    Helper functions for Metrics
    @module: utils.js
    @description: Defines functions like format the output as per metrics catalog.
    @author:
    @version: 1.0
**/
const parser = require('aws-arn-parser');
const metricConfig = require("./metrics.json");
const global_config = require("../config/global-config.json");

function massageData(assetResults, eventBody) {

  var output_obj = {};
  output_obj = {
    "domain": eventBody.domain,
    "service": eventBody.service,
    "environment": eventBody.environment,
    "end_time": eventBody.end_time,
    "start_time": eventBody.start_time,
    "interval": eventBody.interval,
    "statistics": eventBody.statistics,
    "assets": assetResults
  }

  return output_obj;
};

function assetData(results, assetItem) {
  var asset_obj = {};

  asset_obj = {
    "type": assetItem.type,
    "asset_name": assetItem.asset_name,
    "statistics": assetItem.statistics,
    "metrics": []
  };

  var metricsArr = [];

  results.forEach(function (key) {
    var metricsObj = {
      "metric_name": key.Label,
      "datapoints": key.Datapoints
    }
    metricsArr.push(metricsObj);
  });
  asset_obj.metrics = metricsArr;
  return asset_obj;
};

function getNameSpaceAndMetricDimensons(nameSpaceFrmAsset) {
  var output_obj = {};
  output_obj["isError"] = false;
  var paramMetrics = [];
  var nameSpace = nameSpaceFrmAsset.toLowerCase();

  var namespacesList = metricConfig.namespaces;

  var supportedNamespace = namespacesList[nameSpace];

  paramMetrics = supportedNamespace["metrics"];

  var awsAddedNameSpace = nameSpace.indexOf('aws/') === -1 ? 'aws/' + nameSpace : nameSpace;
  awsAddedNameSpace = awsAddedNameSpace.replace(/ /g, "");
  var nameSpaceList = {
    'aws/apigateway': 'AWS/ApiGateway',
    'aws/lambda': 'AWS/Lambda',
    'aws/cloudfront': 'AWS/CloudFront',
    'aws/s3': 'AWS/S3'
  }

  if (Object.keys(nameSpaceList).indexOf(awsAddedNameSpace) > -1) {
    awsNameSpace = nameSpaceList[awsAddedNameSpace];
  } else {
    output_obj["isError"] = true;
    output_obj["awsNameSpace"] = "Invalid";
  }

  output_obj["paramMetrics"] = paramMetrics;
  output_obj["awsNameSpace"] = awsNameSpace;
  return output_obj;
};

function extractValueFromString(string, keyword) {

  var value = "";
  var startIndex = string.indexOf(keyword + ":") + (keyword + ":").length;
  var extractedString = string.substring(startIndex, string.length);
  var extractedSplitString = extractedString.split(":");
  var value = extractedSplitString[0];
  return value;
};

function getApiName(string) {
  var value;
  if (Object.keys(global_config.APINAME).indexOf(string) > -1) {
    value = global_config.APINAME[string];
  } else {
    value = "*"
  }
  return value;

};

function getAssetsObj(assetsArray, userStatistics) {
  var newAssetArr = [];
  var namespaces = metricConfig.namespaces;

  assetsArray.forEach(function (asset) {

    var arnString = asset.provider_id;
    var arnParsedObj = parser(arnString);
    var assetEnvironment = asset.environment;
    var assetType = asset.asset_type;
    var metricNamespace = namespaces[assetType];

    if (metricNamespace) {
      var dimensions = metricNamespace.dimensions;
      var dimensionObj = {};

      dimensions.forEach(function (dimensionName) {
        dimensionObj[dimensionName] = "";
      });
      // dimensionObj - contains dimension names and values got by parsing provider_id.

      // Making value of statistics as title case.
      if (userStatistics === "samplecount") {
        userStatistics = "SampleCount";
      } else {
        userStatistics = (userStatistics).replace(/\w\S*/g, function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      }

      var newAssetObj = {
        "type": assetType,
        "asset_name": dimensionObj,
        "statistics": userStatistics
      };

      switch (assetType) {
        case "lambda":
          var relativeId = arnParsedObj.relativeId;
          if (relativeId === 'function') {
            var funcValue = extractValueFromString(arnString, relativeId);
            newAssetObj.asset_name.FunctionName = funcValue;
          }
          break;
        case "apigateway":
          var relativeId = arnParsedObj.relativeId;
          var parts = relativeId.split("/");
          var apiId = parts[0];
          newAssetObj.asset_name.ApiName = getApiName(apiId);

          var stgValue = parts[1] === '*' ? assetEnvironment : parts[1];
          newAssetObj.asset_name.Stage = stgValue || "*";

          var methodValue = parts[2];
          newAssetObj.asset_name.Method = methodValue;

          var resourceValue = "/" + parts[3];
          if (parts[4]) {
            resourceValue += "/" + parts[4];
          }
          newAssetObj.asset_name.Resource = resourceValue;

          break;
        case "s3":
          var relativeId = arnParsedObj.relativeId;
          var parts = relativeId.split("/");
          var bucketValue = parts[0];
          newAssetObj.asset_name.BucketName = bucketValue;
          newAssetObj.asset_name.StorageType = "StandardStorage";
          break;

        case "cloudfront":
          var relativeId = arnParsedObj.relativeId;
          var parts = relativeId.split("/");
          var distIdVal = parts[1];
          newAssetObj.asset_name.DistributionId = distIdVal;
          newAssetObj.asset_name.Region = "Global";
          break;

        default:
          newAssetObj = {
            "isError": "Metric not supported for asset type " + assetType
          }
      }
      newAssetArr.push(newAssetObj);
    } else if (assetType) {
      // type not supported
      newAssetArr.push({
        "isError": "Metric not supported for asset type " + assetType
      });
    } else {
      // type not found
      newAssetArr.push({
        "isError": "Asset type not found "
      });
    }

  });
  return newAssetArr;

};
module.exports = {
  massageData,
  assetData,
  getNameSpaceAndMetricDimensons,
  getAssetsObj
};
