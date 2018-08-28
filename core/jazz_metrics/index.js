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

const moment = require('moment');
const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js")(); //Import the logging module.
const request = require('request');
const utils = require("./components/utils.js"); //Import the utils module.
const validateUtils = require("./components/validation.js");
const global_config = require("./config/global-config.json");

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
      .then(res => exportable.getMetricsDetails(res, eventBody, config))
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
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Error in fetching metrics")));
        }
      });
  } catch (e) {
    return cb(JSON.stringify(errorHandler.throwInternalServerError("Error in fetching metrics")));
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
          message = error.message;
        } else {
          message = response.body.message
        }
        logger.error(message);
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
        logger.error(error);
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
      logger.info("Validating assets");
      assetsArray.forEach((assetItem) => {
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
          var getAssetNameDetails = utils.getNameSpaceAndMetricDimensons(assetItem.type, assetItem.provider);

          if (!getAssetNameDetails.isError) {
            paramMetrics = getAssetNameDetails.paramMetrics;

            if (assetItem.provider === 'aws') {
              exportable.getActualParam(paramMetrics, getAssetNameDetails.nameSpace, assetItem, eventBody)
              .then(res => {
                newAssetArray.push({
                  "nameSpace": "aws",
                  "actualParam": res,
                  "userParam": assetItem
                });
                logger.debug("Validated Assets: " + JSON.stringify(newAssetArray));
                resolve(newAssetArray);
              })
              .catch(error => {
                logger.error(error);
                reject(error);
              });
            } else if (assetItem.provider === 'gcp') {
              exportable.getApigeeParam(paramMetrics, eventBody)
              .then(res => {
                newAssetArray.push({
                  "nameSpace": "gcp",
                  "actualParam": res,
                  "userParam": assetItem
                });
                logger.debug("Validated Assets: " + JSON.stringify(newAssetArray));
                resolve(newAssetArray);
              })
              .catch(error => {
                logger.error(error);
                reject(error);
              });
            }
          } else {
            logger.error(getAssetNameDetails.message);
            reject({
              result: "inputError",
              message: getAssetNameDetails.message
            });
          }
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

function getApigeeParam(paramMetrics, eventBody) {
  return new Promise((resolve, reject) => {
    let actualParam = [];
    paramMetrics.forEach(param => {
      const metricStatistics = param.Statistics.toLowerCase();
      const clonedObj = {};
      if (global_config.APIGEE.STATISTICS_MAP[eventBody.statistics] === metricStatistics) {
        clonedObj.MetricName = param.MetricName;
        clonedObj.Statistics = metricStatistics;
        actualParam.push(clonedObj);
      }
    });
    logger.verbose("Get Apigee params: " + actualParam);
    resolve(actualParam);
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

function getMetricsDetails(newAssetArray, eventBody, config) {

  return new Promise((resolve, reject) => {
    logger.debug("Inside getMetricsDetails" + JSON.stringify(newAssetArray));
    var metricsStatsArray = [];
    newAssetArray.forEach(assetParam => {
      if (assetParam.nameSpace === 'aws') {
        exportable.cloudWatchDetails(assetParam)
          .then(res => {
            metricsStatsArray.push(res);
            if (metricsStatsArray.length === newAssetArray.length) {
              resolve(metricsStatsArray);
            }
          })
          .catch(error => reject(error));
      }
      else if (assetParam.nameSpace === 'gcp') {
        exportable.apigeeMetricDetails(assetParam, eventBody, config)
        .then(res => {
          metricsStatsArray.push(res);
            if (metricsStatsArray.length === newAssetArray.length) {
              resolve(metricsStatsArray);
            }
        })
        .catch(error => reject(error));
      }
    });
  });
}

function apigeeMetricDetails(assetParam, eventBody, config) {
  const DATE_FORMAT = 'MM/DD/YYYY%20HH:MM';

  return new Promise((resolve, reject) => {
    let metrics = assetParam.actualParam.map(param =>`${param.Statistics}(${param.MetricName})`);
    let metricString = metrics.join(",");
    let endTime = moment(eventBody.end_time).format(DATE_FORMAT);
    let startTime = moment(eventBody.start_time).format(DATE_FORMAT);
    let timeUnit = global_config.APIGEE.INTERVAL_MAP[eventBody.interval];

    const servicePayload = {
      url: `${config.APIGEE.URL}${assetParam.userParam.asset_name.apiproxy}?select=${metricString}&timeRange=${startTime}~${endTime}&timeUnit=${timeUnit}`,
      headers: {
        "Authorization": "Basic " + new Buffer(`${config.APIGEE.USER}:${config.APIGEE.PASSWORD}`).toString("base64"),
      },
      method: "GET",
      rejectUnauthorized: false,
      json: true
    };

    logger.debug("Get Apigee metrics using URL : " + servicePayload.url);
    request(servicePayload, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (response && response.statusCode === 200 && body && body.environments) {
        const metricResult = body.environments[0].metrics;

        let metricsStats = metricResult.map(metric => {
          let dataPoints = metric.values.map(val => (
            {
              Timestamp: moment(val.timestamp),
              [eventBody.statistics]: val.value,
              Unit: eventBody.statistics
            }
          ));
          const metricObj = {
            Label: metric.name,
            Datapoints: dataPoints
          };

          return metricObj;
        });
        const assetObj = utils.assetData(metricsStats, assetParam.userParam);
        resolve(assetObj);
      } else {
        logger.error(body.message);
        reject(body.message);
      }
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

const exportable = {
  handler,
  genericValidation,
  getToken,
  getAssetsDetails,
  validateAssets,
  getActualParam,
  getApigeeParam,
  getMetricsDetails,
  cloudWatchDetails,
  apigeeMetricDetails
}

module.exports = exportable;
