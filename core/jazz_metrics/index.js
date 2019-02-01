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
Fetch metrics per service using CloudWatch APIs
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js")(); //Import the logging module.
const utils = require("./components/utils.js"); //Import the utils module.
const validateUtils = require("./components/validation.js");
const request = require('request');
const monitorManagementClient = require('azure-arm-monitor');
const msRestAzure = require('ms-rest-azure');
const moment = require("moment-timezone");
const momentDurationFormatSetup = require("moment-duration-format");



function handler(event, context, cb) {
  var errorHandler = errorHandlerModule();
  var config = configObj.getConfig(event, context);

  try {
		/*
		 * event input format :
		 *   {
		 *        "domain": "jazztest",
		 *        "service": "get-monitoring-data",
		 *        "environment": "prod",
		 *        "end_time": "2017-06-27T06:56:00.000Z",
		 *        "start_time": "2017-06-27T05:55:00.000Z",
		 *        "interval":"300",
		 *        "statistics":"average"
		 *    }
		 */
    var eventBody = event.body;
    exportable.genericValidation(event)
      .then(() => validateUtils.validateGeneralFields(eventBody))
      .then(() => exportable.getToken(config))
      .then((authToken) => exportable.getAssetsDetails(config, eventBody, authToken))
      .then(res => exportable.validateAssets(res, eventBody))
      .then(res => exportable.getMetricsDetails(res, config, eventBody))
      .then(res => {
        var finalObj = utils.massageData(res, eventBody);
        return cb(null, responseObj(finalObj, eventBody));
      })
      .catch(error => {
        if (error.result === "inputError") {
          return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
        } else if (error.result === "unauthorized") {
          return cb(JSON.stringify(errorHandler.throwUnauthorizedError(error.message)));
        } else {
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Error in fetching cloudwatch metrics")));
        }
      });
  } catch (e) {
    return cb(JSON.stringify(errorHandler.throwInternalServerError("Error in fetching cloudwatch metrics")));
  }

};

function genericValidation(event) {
  return new Promise((resolve, reject) => {
    if (!event && !event.body) {
      reject({
        result: "inputError",
        message: "Invalid Input Error"
      });
    }

    if (!event.method || event.method !== "POST") {
      reject({
        result: "inputError",
        message: "Invalid method"
      });
    }
    if (!event.principalId) {
      reject({
        result: "unauthorized",
        message: "Unauthorized"
      });
    }

    resolve();
  });
}

function getToken(config) {
  logger.debug("Inside getToken");
  return new Promise((resolve, reject) => {
    var svcPayload = {
      uri: config.SERVICE_API_URL + config.TOKEN_URL,
      method: 'post',
      json: {
        "username": config.SERVICE_USER,
        "password": config.TOKEN_CREDS
      },
      rejectUnauthorized: false
    };
    request(svcPayload, (error, response, body) => {
      if (response && response.statusCode === 200 && body && body.data) {
        var authToken = body.data.token;
        resolve(authToken);
      } else {
        var message = "";
        if (error) {
          message = error.message
        } else {
          message = response.body.message
        }
        reject({
          "error": "Could not get authentication token for updating service catalog.",
          "message": message
        });
      }
    });
  });
}

function getAssetsDetails(config, eventBody, authToken) {
  return new Promise((resolve, reject) => {
    var asset_api_options = {
      url: config.SERVICE_API_URL + config.ASSETS_URL + "?domain=" + eventBody.domain + "&service=" + eventBody.service + "&environment=" + eventBody.environment,
      headers: {
        "Content-Type": "application/json",
        "Authorization": authToken
      },
      method: "GET",
      rejectUnauthorized: false,
      requestCert: true,
      async: true
    };

    logger.info("asset_api_options :- " + JSON.stringify(asset_api_options));
    request(asset_api_options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        if (response.statusCode && response.statusCode === 200) {
          var responseBody = JSON.parse(body);
          var apiAssetsArray = [];

          if (responseBody && responseBody.data && responseBody.data.count > 0) {
            apiAssetsArray = responseBody.data.assets;
          }

          var userStatistics = eventBody.statistics.toLowerCase();
          // Massaging data from assets api , to get required list of assets which contains type, asset_name and statistics.
          var assetsArray = utils.getAssetsObj(apiAssetsArray, userStatistics);
          resolve(assetsArray);
        } else {
          logger.info("Assets not found for this service, domain, environment. ", JSON.stringify(asset_api_options));
          resolve([]);
        }
      }
    });
  });
}

function validateAssets(assetsArray, eventBody) {
  return new Promise((resolve, reject) => {
    if (assetsArray.length > 0) {
      var newAssetArray = [];
      var invalidTypeCount = 0;

      assetsArray.filter(assetItem => assetItem.provider == 'aws').forEach((assetItem) => {
        if (assetItem.isError) {
          logger.error(assetItem.isError);
          invalidTypeCount++;
          if (invalidTypeCount === assetsArray.length) {
            reject({
              result: "inputError",
              message: "Unsupported metric type."
            });
          }
        } else {
          var paramMetrics = [];
          var getAssetNameDetails = utils.getNameSpaceAndMetricDimensons(assetItem.type);

          if (!getAssetNameDetails.isError) {
            paramMetrics = getAssetNameDetails.paramMetrics;
            exportable.getActualParam(paramMetrics, getAssetNameDetails.awsNameSpace, assetItem, eventBody)
              .then(res => {
                newAssetArray.push({
                  "actualParam": res,
                  "userParam": assetItem,
                  "provider": assetItem.provider
                });
                resolve(newAssetArray);
              })
              .catch(error => {
                reject(error);
              });
          } else {
            logger.error("Unsupported metric type. ");
            reject({
              result: "inputError",
              message: "Unsupported metric type."
            });
          }
        }
      });

      assetsArray.filter(assetItem => assetItem.provider == 'azure').forEach((assetItem) => {
        if (assetItem.isError) {
          logger.error(assetItem.isError);
          invalidTypeCount++;
          if (invalidTypeCount === assetsArray.length) {
            reject({
              result: "inputError",
              message: "Unsupported metric type."
            });
          }
        } else {

            newAssetArray.push(assetItem);
            resolve(newAssetArray);
        }
      });
    } else {
      reject({
        result: "inputError",
        message: "Metric not found for requested asset"
      });
    }
  });
}

function getActualParam(paramMetrics, awsNameSpace, assetItem, eventBody) {
  return new Promise((resolve, reject) => {
    // Forming object with parameters required by cloudwatch getMetricStatistics api.
    var commonParam = {

      Namespace: assetItem.type,
      MetricName: "",
      Period: eventBody.interval,
      EndTime: eventBody.end_time,
      StartTime: eventBody.start_time,
      Dimensions: [{
        Name: '',
        Value: assetItem.asset_name
      },],
      Statistics: [
        assetItem.statistics,
      ],
      Unit: ""
    };
    var actualParam = [];
    var assetNameObj = assetItem.asset_name;

    commonParam.Namespace = awsNameSpace;
    paramMetrics.forEach((arrayItem) => {
      var clonedObj = {};
      for (let key in commonParam) {
        clonedObj[key] = commonParam[key];
      }
      clonedObj.MetricName = arrayItem.MetricName;
      clonedObj.Unit = arrayItem.Unit;
      var dimensionsArray = arrayItem.Dimensions;
      clonedObj.Dimensions = [];
      var minCount = 0;
      dimensionsArray.forEach((dimensionArr, i) => {
        var obj = {};
        if (assetNameObj[dimensionArr]) {
          obj = {
            "Name": dimensionArr,
            "Value": assetNameObj[dimensionArr]
          };
          if (obj.Name === "StorageType") {
            if (clonedObj.MetricName === "BucketSizeBytes") {
              obj.Value = "StandardStorage";
            } else if (clonedObj.MetricName === "NumberOfObjects") {
              obj.Value = "AllStorageTypes";
            }
          }

          clonedObj.Dimensions.push(obj);
          minCount++;
        }

      });
      if (minCount === 0) {
        logger.error("Invalid asset_name inputs.");
        reject({
          result: "inputError",
          message: "Invalid asset_name inputs."
        });
      }
      actualParam.push(clonedObj);
      resolve(actualParam);
    });
  });
}

function getMetricsDetails(newAssetArray, config, eventBody) {
  return new Promise((resolve, reject) => {
    logger.debug("Inside getMetricsDetails" + JSON.stringify(newAssetArray));
    var metricsStatsArray = [];
    newAssetArray.filter(assetParam => assetParam.provider == 'aws').forEach(assetParam => {
      exportable.cloudWatchDetails(assetParam)
        .then(res => {
          metricsStatsArray.push(res);
          if (metricsStatsArray.length === newAssetArray.length) {
            resolve(metricsStatsArray);
          }
        })
        .catch(error => {
          reject(error);
        });
    });

    // call azure api if 'azure' is found as a provider
    newAssetArray.filter(assetParam => assetParam.provider == 'azure').forEach(assetParam => {
      exportable.azureMetricDefinitions(config, assetParam)
        .then( definitions => exportable.azureMetricDetails(definitions, config, assetParam, eventBody))
        .then(res => {
          metricsStatsArray.push(res);
          resolve(metricsStatsArray);
        })
        .catch(error => {
          reject(error);
        });
    });

  });
}

function cloudWatchDetails(assetParam) {
  logger.debug("Inside cloudWatchDetails");
  return new Promise((resolve, reject) => {
    var metricsStats = [];
    (assetParam.actualParam).forEach((param) => {
      let cloudwatch = param.Namespace === "AWS/CloudFront" ? utils.getCloudfrontCloudWatch() : utils.getCloudWatch();
      cloudwatch.getMetricStatistics(param, (err, data) => {
        if (err) {
          logger.error("Error while getting metrics from cloudwatch: " + JSON.stringify(err));
          if (err.code === "InvalidParameterCombination") {
            reject({
              "result": "inputError",
              "message": err.message
            });
          } else {
            reject({
              "result": "serverError",
              "message": "Unknown internal error occurred"
            });
          }
        } else {
          metricsStats.push(data);
          if (metricsStats.length === assetParam.actualParam.length) {
            resolve(utils.assetData(metricsStats, assetParam.userParam));
          }
        }
      });
    });
  });
}

/*
* Prepare to obtain azure metrics definiations
*/
function azureMetricDefinitions(config, assetParam) {
  var data = {};
  var resourceid = assetParam.provider_id;
  return new Promise((resolve, reject) => {
    subscriptionId = config.AZURE.SUBSCRIPTIONID;

    // to obtain the azure credentials
    msRestAzure.loginWithServicePrincipalSecret(
      config.AZURE.CLIENTID,
      config.AZURE.PASSWORD,
      config.AZURE.TENANTID,
      (err, credentials) => {

        if (err) {
          logger.error("Error while obtaining azure credentials " + JSON.stringify(err));
            reject({
              "result": "inputError",
              "message": err.message
            });
        } else {

          // to create an azure client
          const client = new monitorManagementClient(credentials, subscriptionId);
          const uri = `/subscriptions/${subscriptionId}${resourceid}`

          // to get the metrics definitions
          return client.metricDefinitions.list(uri).then((items) => {
            if (items == null || items == undefined)
              reject({
                "result": "inputError",
                "message": "Failed in obtaining metric definitions"
              });
            items.forEach(item => {
              var attrs = {};
              attrs["unit"] = item.unit;
              attrs["aggregationtype"] = item.primaryAggregationType;
              attrs["namespace"] = item.namespace;
              data[item.name.value] = attrs;
            });
            resolve(data);
          });
        }
    });
  });
};

/*
* Prepare to obtain metrcis based on the metric definitions
*/
function azureMetricDetails(definitions, config, assetParam, eventBody) {

  //prepare the metric names & primary aggregation types
  var resourceid = assetParam.provider_id;
  var names = "";
  var aggregations = "";

  for (var name in definitions) {
    names += name + ",";
    aggregations += definitions[name]["aggregationtype"] + ",";
  }
  names = names.substring(0, names.length-1);
  aggregations = aggregations.substring(0, aggregations.length-1);

  return new Promise((resolve, reject) => {
    subscriptionId = config.AZURE.SUBSCRIPTIONID;

    // to obtain the azure credentials
    msRestAzure.loginWithServicePrincipalSecret(
      config.AZURE.CLIENTID,
      config.AZURE.PASSWORD,
      config.AZURE.TENANTID,
      (err, credentials) => {

        // create an azure client
        const client = new monitorManagementClient(credentials, subscriptionId);
        var options = {'metricnames': names}
        options['interval'] = moment.duration(60, "minutes");
        options['timespan'] = eventBody.start_time + "/" + eventBody.end_time;
        options['aggregation'] = aggregations;
        const uri = `/subscriptions/${subscriptionId}${resourceid}`

        // query azure to get the multiple metric results
        return client.metrics.list(uri, options).then((result) => {
          var metrics = [];

          if (!(result && result.value)) {
            logger.error("Failed in obtaining metric results. Here is the response:  " + JSON.stringify(result));
            return reject({"result": "inputError", "message": "Failed in obtaining metric results"});
          }

          result.value.forEach(item => {
            if (item.name && item.name.value) {
              var defname = item.name.value; // "UsedCapacity", "Availabilty", etc
              var datapoints = [];
            } else {
              logger.error("Returned metric does not have 'name' property. Here is the metric: " + JSON.stringify(item));
              return reject({"result": "inputError", "message": "Returned metric does not have a name"});
            }

            if (!item.timeseries){
              logger.error("Returned metric does not have 'timeseries' property: Here is the metric: " + JSON.stringify(item));
              return reject({"result": "inputError", "message": "Returned metric does not have timeseries"});
            }
            item.timeseries.forEach(dot => {
              if (!dot.data){
                logger.error("Timeseries does not have 'data' property. Here is the Timeseries: " + JSON.stringify(dot));
                return reject({"result": "inputError", "message": "Timeseries does not have data"});
              }
              dot.data.forEach(p => {
                if ((p[definitions[defname]["aggregationtype"].toLowerCase()]) && (p[definitions[defname]["aggregationtype"].toLowerCase()] >0 )) {
                  point = {"Timestamp": p.timeStamp, "Unit": definitions[defname]["unit"], "Sum": p[definitions[defname]["aggregationtype"].toLowerCase()]};
                  datapoints.push(point);
                } else {
                  logger.error("Timeseries data is malformatted. Here is the data: " + JSON.stringify(dot));
                  return reject({"result": "inputError", "message": "Timeseries data is malformatted"});
                }
              });
            });
            points = {
              "metric_name": defname,
              "datapoints": datapoints
            };
            metrics.push(points);
            data = {
              "type": assetParam.asset_type,
              "asset_name": {"provider_id": assetParam.provider_id, "asset_type": assetParam.asset_type},
              "statistics": "Sum", /// TODO:
              "metrics": metrics
            };
            resolve(data);
          });
      });
    });
  });
};


const exportable = {
  handler,
  genericValidation,
  getToken,
  getAssetsDetails,
  validateAssets,
  getActualParam,
  getMetricsDetails,
  cloudWatchDetails,
  azureMetricDefinitions,
  azureMetricDetails
}

module.exports = exportable;
