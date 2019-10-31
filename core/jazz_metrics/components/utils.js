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
const logger = require("../components/logger.js")();
const AWS = require("aws-sdk");
const Uuid = require("uuid/v4");

function massageData(assetResults, eventBody, account) {
  var output_obj = {};
  output_obj = {
    "accountId": account.accountId,
    "region": account.region,
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

  var metricsArr = results.map(key => {
    return {
      "metric_name": key.Label,
      "datapoints": key.Datapoints
    }
  });
  asset_obj.metrics = metricsArr;
  return asset_obj;
};

function getNameSpaceAndMetricDimensons(nameSpaceFrmAsset, provider) {
  var output_obj = {};
  output_obj["isError"] = false;
  var paramMetrics = [];
  var nameSpace = nameSpaceFrmAsset.toLowerCase();
  var namespacesList = metricConfig.namespaces;

  if (!namespacesList[provider]) {
    output_obj["isError"] = true;
    output_obj["message"] = `Provider not defined for namespace: ${nameSpace}`
    output_obj["nameSpace"] = `Invalid`;
    return output_obj;
  }

  // mapping source: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/aws-services-cloudwatch-metrics.html
  var supportedNamespace = namespacesList[provider][nameSpace];
  let awsNameSpace;
  if (nameSpaceFrmAsset && supportedNamespace && provider === 'aws') {
    paramMetrics = supportedNamespace["metrics"];
    var awsAddedNameSpace = nameSpace.indexOf('aws/') === -1 ? 'aws/' + nameSpace : nameSpace;
    awsAddedNameSpace = awsAddedNameSpace.replace(/ /g, "");
    var nameSpaceList = {
      'aws/apigateway': 'AWS/ApiGateway',
      'aws/lambda': 'AWS/Lambda',
      'aws/cloudfront': 'AWS/CloudFront',
      'aws/s3': 'AWS/S3',
      'aws/dynamodb': 'AWS/DynamoDB',
      'aws/dynamodb_stream': 'AWS/DynamoDB',
      'aws/sqs': 'AWS/SQS',
      'aws/kinesis_stream': 'AWS/Kinesis'
    };

    if (Object.keys(nameSpaceList).indexOf(awsAddedNameSpace) > -1) {
      awsNameSpace = nameSpaceList[awsAddedNameSpace];
    } else {
      output_obj["isError"] = true;
      output_obj["message"] = "AWS namespace not defined";
      output_obj["nameSpace"] = "Invalid Namespace: " + awsAddedNameSpace;
    }

    output_obj["paramMetrics"] = paramMetrics;
    output_obj["nameSpace"] = awsNameSpace;
    return output_obj;
  } else if (nameSpaceFrmAsset && supportedNamespace && provider === 'gcp') {
    paramMetrics = supportedNamespace["metrics"];
    output_obj["paramMetrics"] = paramMetrics;
    output_obj["nameSpace"] = `${provider}/${nameSpace}`;
    return output_obj;
  } else {
    output_obj["isError"] = true;
    output_obj["message"] = `Invalid provider ${provider}`;
    output_obj["nameSpace"] = "Invalid";
    return output_obj;
  }
};

function extractValueFromString(string, keyword) {
  var startIndex = string.indexOf(keyword + ":") + (keyword + ":").length;
  var extractedString = string.substring(startIndex, string.length);
  var extractedSplitString = extractedString.split(":");
  var value = extractedSplitString[0];
  return value;
};

function getApiName(string) {
  var value;
  if( string == "stg"){
    value = global_config.STACK_PREFIX + "-stg"
  } else if( string == "prod"){
    value = global_config.STACK_PREFIX + "-prod"
  } else {
    value = global_config.STACK_PREFIX + "-dev"
  }
  return value;
};

function getAssetsObj(assetsArray, userStatistics) {
  var newAssetArr = [];
  var namespaces = metricConfig.namespaces;
  if (!namespaces) {
    newAssetArr.push({
      "message": `Namespaces not defined`,
      "isError": true
    });
  }
  assetsArray.forEach((asset) => {


    var assetType = asset.asset_type;
    if (!namespaces[asset.provider]) {
      newAssetArr.push({
        "message": `Provider not defined for the asset: ${asset.asset_type}`,
        "isError": true
      });
    }
    var metricNamespace = namespaces[asset.provider][assetType];
    if (metricNamespace) {
      var dimensions = metricNamespace.dimensions;
      var dimensionObj = {};
      var assetObj = {};
      // dimensionObj - contains dimension names and values got by parsing provider_id.
      dimensions.forEach((dimensionName) => {
        dimensionObj[dimensionName] = "";
      });

      // Making value of statistics as title case.
      if (userStatistics === "samplecount") {
        userStatistics = "SampleCount";
      } else {
        userStatistics = (userStatistics).replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      }

      var newAssetObj = {
        "provider": asset.provider,
        "type": assetType,
        "asset_name": dimensionObj,
        "statistics": userStatistics,
        "provider": asset.provider,
        "metrics": metricNamespace.metrics
      };
      assetObj = updateNewAssetObj(newAssetObj, asset);
      newAssetArr.push(assetObj);
    } else {
      // type not supported
      newAssetArr.push({
        "message": `Metric not supported for asset type: ${assetType}`,
        "provider": asset.provider,
        "isError": true
      });
    }
  });
  return newAssetArr;
};

function updateNewAssetObj(newAssetObj, asset) {
  let assetType = asset.asset_type;

  switch (asset.provider) {
    case "aws":
      newAssetObj = updateAWSAsset(newAssetObj, asset);
      break;
    case "azure":
      newAssetObj = updateAZAsset(newAssetObj, asset);
      break;
    case "gcp":
      newAssetObj = updateApigeeAsset(newAssetObj, asset);
      break;
    default:
      newAssetObj = {
        "isError": true,
        "message": "Metric not supported for asset type: " + assetType
      }
  }
  return newAssetObj;
}

function updateAWSAsset(newAssetObj, asset) {
  var arnString = asset.provider_id, assetType = asset.asset_type, assetEnvironment = asset.environment;
  var arnParsedObj = parser(arnString);
  var relativeId = arnParsedObj.relativeId;

  switch (assetType) {
    case "lambda":
      newAssetObj = updateLambdaAsset(newAssetObj, relativeId, arnString);
      break;
    case "apigateway":
      newAssetObj = updateApigatewayAsset(newAssetObj, relativeId, assetEnvironment);
      break;
    case "s3":
      newAssetObj = updateS3Asset(newAssetObj, relativeId);
      break;

    case "cloudfront":
      newAssetObj = updateCloudfrontAsset(newAssetObj, relativeId);
      break;

    case "dynamodb":
      newAssetObj = updateDynamodbAsset(newAssetObj, relativeId);
      break;

    case "dynamodb_stream":
      newAssetObj = updateDynamodbStreamAsset(newAssetObj, relativeId, arnString);
      break;

    case "sqs":
      newAssetObj = updateSqsAsset(newAssetObj, relativeId);
      break;

    case "kinesis_stream":
      newAssetObj = updateKinesisAsset(newAssetObj, relativeId);
      break;

    default:
      newAssetObj = {
        "message": "Metric not supported for asset type: " + assetType,
        "isError": true
      }
  }
  return newAssetObj;
}

function updateAZAsset(newAssetObj, asset) {
  var arnString = asset.provider_id, assetType = asset.asset_type, assetEnvironment = asset.environment;
  var arnParsedObj = parser(arnString);
  var relativeId = arnParsedObj.relativeId;

  switch (assetType) {
    case "storage_account":
      asset.metrics = newAssetObj.metrics;
      newAssetObj = asset;
      break;
    case "apigateway":
      asset.metrics = newAssetObj.metrics;
      newAssetObj = asset;
      break;
    default:
      newAssetObj = {
        "isError": "Metric not supported for asset type: " + assetType
      }
  }
  return newAssetObj;
}

function updateApigeeAsset(newAssetObj, asset) {
  let providerArr = asset.provider_id.split("/");
  newAssetObj.asset_name.Stage = providerArr[1];
  newAssetObj.asset_name.Method = providerArr[2];
  let resourceValue = "/" + providerArr[3];
  if (providerArr[4]) {
    resourceValue += "/" + providerArr[4];
  }
  newAssetObj.asset_name.Resource = resourceValue;
  newAssetObj.asset_name.apiproxy = `${asset.domain}-${asset.service}-${asset.environment}`;
  return newAssetObj;
}

function updateLambdaAsset(newAssetObj, relativeId, arnString) {
  if (relativeId === 'function') {
    var funcValue = extractValueFromString(arnString, relativeId);
    newAssetObj.asset_name.FunctionName = funcValue;
  }
  return newAssetObj;
}

function updateDynamodbAsset(newAssetObj, relativeId) {
  let parts = relativeId.split("/");
  newAssetObj.asset_name.TableName = parts[1];
  newAssetObj.asset_name.Operation = "PutItem";
  return newAssetObj;
}

function updateDynamodbStreamAsset(newAssetObj, relativeId, arnString) {
  if (relativeId.indexOf("stream") !== 1) {
    relativeId = arnString.substring(arnString.indexOf(relativeId), arnString.length);
    let parts = relativeId.split("/");
    newAssetObj.asset_name.TableName = parts[1];
    newAssetObj.asset_name.Operation = "GetRecords";
    newAssetObj.asset_name.StreamLabel = parts[3];
  }
  return newAssetObj;
}

function updateSqsAsset(newAssetObj, relativeId) {
  let parts = relativeId.split("/");
  newAssetObj.asset_name.QueueName = parts[0];
  return newAssetObj;
}

function updateKinesisAsset(newAssetObj, relativeId) {
  let parts = relativeId.split("/");
  newAssetObj.asset_name.StreamName = parts[1];
  return newAssetObj;
}

function updateApigatewayAsset(newAssetObj, relativeId, assetEnvironment) {

  var parts = relativeId.split("/");

  //var apiId = parts[0];

  var stgValue = parts[1] === '*' ? assetEnvironment : parts[1];
  newAssetObj.asset_name.Stage = stgValue || "*";

  newAssetObj.asset_name.ApiName = getApiName(stgValue);

  var methodValue = parts[2];
  newAssetObj.asset_name.Method = methodValue;

  // rest of the parts belong to the actual resource
  resourceValue = "/" + parts.slice(3, parts.length).join("/")

  newAssetObj.asset_name.Resource = resourceValue;
  return newAssetObj;
}

function updateS3Asset(newAssetObj, relativeId) {
  var parts = relativeId.split("/");
  var bucketValue = parts[0];
  newAssetObj.asset_name.BucketName = bucketValue;
  newAssetObj.asset_name.StorageType = "StandardStorage";
  newAssetObj.asset_name.FilterId = "EntireBucket";
  return newAssetObj;
}

function updateCloudfrontAsset(newAssetObj, relativeId) {
  var parts = relativeId.split("/");
  var distIdVal = parts[1];
  newAssetObj.asset_name.DistributionId = distIdVal;
  newAssetObj.asset_name.Region = "Global";
  return newAssetObj;
}

function getCloudWatch(tempcreds, region) {
  tempcreds.apiVersion = '2010-08-01';
  tempcreds.region = region;
  var cloudwatch = new AWS.CloudWatch(tempcreds);
  return cloudwatch;
}

function getCloudfrontCloudWatch(tempcreds) {
  tempcreds.apiVersion = '2010-08-01';
  tempcreds.region = global_config.CF_REGION;
  var cloudwatch = new AWS.CloudWatch(tempcreds);
  return cloudwatch;
}
function checkIsPrimary(accountId, jsonConfig) {
  var data = jsonConfig.config.AWS.ACCOUNTS;
  var index = data.findIndex(x => x.ACCOUNTID == accountId);
  if (data[index].PRIMARY) {
    return data[index].PRIMARY;
  } else {
    return false;
  }
}

function getRolePlatformService(accountId, jsonConfig) {
  var data = jsonConfig.config.AWS.ACCOUNTS;
  var index = data.findIndex(x => x.ACCOUNTID == accountId);
  return data[index].IAM.PLATFORMSERVICES_ROLEID;
}

function AssumeRole(accountID, configJson) {
  var isPrimary = checkIsPrimary(accountID, configJson);
  var roleArn = getRolePlatformService(accountID, configJson);
  var accessparams;
  return new Promise((resolve, reject) => {
    if (isPrimary) {
      accessparams = {};
      resolve(accessparams)
    } else {
      const sts = new AWS.STS({ region: process.env.REGION });
      const roleSessionName = Uuid();
      const params = {
        RoleArn: roleArn,
        RoleSessionName: roleSessionName,
        DurationSeconds: 3600,
      };
      sts.assumeRole(params, (err, data) => {
        if (err) {
          reject({
            "result": "serverError",
            "message": "Unknown internal error occurred"
          })
        } else {
          logger.debug("Temporary Credentials are : ", JSON.stringify(data));
          accessparams = {
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken,
          };
          resolve(accessparams)
        }
      })
    }
  });
}

module.exports = {
  massageData,
  assetData,
  getNameSpaceAndMetricDimensons,
  getAssetsObj,
  getCloudWatch,
  getCloudfrontCloudWatch,
  AssumeRole
};
