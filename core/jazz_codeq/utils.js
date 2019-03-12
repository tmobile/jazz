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
/*jshint loopfunc:true */
const logger = require("./components/logger.js"); //Import the logging module.
const request = require('request');

function getAPIPath(url) {
  return new Promise((resolve, reject) => {

    if (!url) {
      return reject({ "errorMessage": "Invalid resource path." });
    }

    try {
      let resourcePath = url.split("/");
      let pathString = resourcePath.pop();

      let pathStringLower = pathString.toLowerCase();
      if (pathStringLower === "codeq" || pathStringLower === "help") {
        return resolve({ "pathString": pathStringLower });
      } else {
        return reject({ "errorMessage": "Invalid resource path." });
      }
    } catch (ex) {
      logger.error(ex.message);
      return reject({ "errorMessage": "Invalid resource path." });
    }
  });
}

function getReport(metrics, sonarMeasures, config, branch, serviceContext) {
  return new Promise((resolve, reject) => {
    if (!metrics) {
      reject({
        "report_error": "No metrics defined.",
        "code": 500
      });
    } else {
      let output = { metrics: [] };

      if (sonarMeasures) {
        for (let r = sonarMeasures.length - 1; r >= 0; r--) {
          let record = sonarMeasures[r];
          let metricName = Object.keys(config.METRIC_MAP).find(key => config.METRIC_MAP[key] === record.metric);
          output.metrics.push({
            "name": metricName,
            "link": config.SONAR_PROTOCOL + config.SONAR_HOSTNAME + '/component_measures?id=' + config.SONAR_PROJECT_KEY + '_' + serviceContext.query.domain + '_' + serviceContext.query.service + '_' + branch + '&metric=' + config.METRIC_MAP[metricName],
            "values": getHistoryValues(record.history)
          });
        }
      } else {
        for (let n = metrics.length - 1; n >= 0; n--) {
          let record = metrics[n];
          output.metrics.push({
            "name": record,
            "link": config.SONAR_PROTOCOL + config.SONAR_HOSTNAME + '/component_measures?id=' + config.SONAR_PROJECT_KEY + '_' + serviceContext.query.domain + '_' + serviceContext.query.service + '_' + branch + '&metric=' + config.METRIC_MAP[record],
            "values": []
          });
        }
      }

      resolve(output);
    }
  });
}

function getQuery(serviceContext) {
  let query = {};

  if (serviceContext.query && serviceContext.query !== {}) {
    query = Object.keys(serviceContext.query).reduce((acc, key) => (acc[key.toLowerCase()] = serviceContext.query[key], acc), {});
  }

  return query;
}

function getMetrics(query, config, messages) {
  //if metrics is in query validate the metrics requested against allowed metrics
  let result = {};
  let metrics;

  if (query && query.metrics) {

    try {
      metrics = query.metrics.split(",");
      let allowed_metrics = config.ALLOWED_METRICS.map(v => v.toLowerCase());
      let invalid_metrics = [];

      for (let j = metrics.length - 1; j >= 0; j--) {
        if (allowed_metrics.indexOf(metrics[j]) === -1) {
          invalid_metrics.push(metrics[j]);
        }
      }

      if (invalid_metrics.length > 0) {
        let message = messages.MISSING_METRICS + invalid_metrics.join(", ");
        result = { "error": message, "metrics": [] };
        return result;
      } else {
        result = { "metrics": metrics };
      }
    } catch (ex) {
      logger.error(ex.message);
      result = { "error": messages.INVALID_METRICS + query.metrics, "metrics": [] };
      return result;
    }
  } else {
    result = { "metrics": config.ALLOWED_METRICS };
  }

  return result;
}

function replaceKeys(obj, find, replace) {
  return Object.keys(obj).reduce(
    (acc, key) => Object.assign(acc, {
      [key.replace(find, replace)]: obj[key]
    }), {}
  );
}

function getHistoryValues(valuesArray) {
  return valuesArray.map(obj => replaceKeys(obj, 'date', 'ts'));
}

//get auth token
function getJazzToken(config) {
  return new Promise((resolve, reject) => {
    const svcPayload = {
      uri: config.SERVICE_API_URL + config.TOKEN_URL,
      method: 'POST',
      json: {
        "username": config.SERVICE_USER,
        "password": config.TOKEN_CREDS
      },
      rejectUnauthorized: false
    };

    logger.debug("Getting token for calling Environment API...");
    request(svcPayload, (error, response, body) => {
      if (response.statusCode === 200 && body && body.data) {
        resolve({ "auth_token": body.data.token });
      } else {
        logger.error(response.body.message);
        reject({
          "token_error": "Could not get authentication token for environment lookup.",
          "message": response.body.message
        });
      }
    });
  });
}

//get branch
function getProjectBranch(authToken, query, config, serviceId) {
  return new Promise((resolve, reject) => {
    const envID = query.environment;
    const svcPayload = {
      uri: config.SERVICE_API_URL + config.ENV_SERVICE + envID + "?domain=" + query.domain + "&service=" + query.service,
      method: 'GET',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json',
        'Jazz-Service-ID': serviceId
      },
      rejectUnauthorized: false
    };

    logger.debug(`Calling Environment API to get project branch with uri - ${svcPayload.uri}`);

    request(svcPayload, (error, response, body) => {
      if (response.statusCode === 200 && body) {
        let parsedBody = (typeof body === 'string') ? JSON.parse(body) : body;

        logger.info("ENV :" + parsedBody.data.environment[0]);
        const physicalID = parsedBody.data.environment[0].physical_id;
        const branch = physicalID.replace("/", "-");
        //resolve with results
        resolve({ "branch": branch });
      } else {
        if (error) {
          logger.error(error);
        }
        logger.error(response.body);
        reject({
          "report_error": "Unknown error occured when fetching environment details.",
          "code": response.statusCode
        });
      }
    });
  });
}

//get report
function getCodeqReport(metrics, branch, toDate, fromDate, query, config, serviceContext) {
  return new Promise((resolve, reject) => {

    let metricString = "";
    for (let m = metrics.length - 1; m >= 0; m--) {
      metricString = metricString + config.METRIC_MAP[metrics[m]] + ",";
    }

    const component = config.SONAR_PROJECT_KEY + "_" + query.domain + "_" + query.service + "_" + branch;
    const svcPayload = {

      uri: config.SONAR_PROTOCOL + config.SONAR_HOSTNAME + config.SONAR_ENV_SERVICE + "?metrics=" + metricString + "&from=" + fromDate + "&to=" + toDate + "&component=" + component,
      method: 'GET',
      headers: {
        'Authorization': "Basic " + new Buffer(config.SONAR_USER + ":" + config.SONAR_PASSWORD).toString("base64"),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      rejectUnauthorized: false
    };

    logger.info(`Calling Sonar API to get report with url - ${svcPayload.uri}`);

    request(svcPayload, (error, response, body) => {
      if (response.statusCode === 200 && body) {

        let parsedBody = (typeof body === 'string') ? JSON.parse(body) : body;
        getReport(metrics, parsedBody.measures, config, branch, serviceContext)
          .then(results => resolve(results))
          .catch(err => {
            logger.error(err);
            reject(err);
          });
      } else {
        if (error) {
          logger.error(error);
        }
        if (response.body) {
          const parsedBody = (typeof response.body === 'string') ? JSON.parse(response.body) : response.body;
          reject({
            "report_error": parsedBody.errors[0].msg,
            "code": response.statusCode
          });
        } else {
          reject({
            "report_error": "No response data from SonarQube.",
            "code": response.statusCode
          });
        }
      }
    });
  });
}

module.exports = {
  getAPIPath,
  getReport,
  getQuery,
  getMetrics,
  getJazzToken,
  getProjectBranch,
  getCodeqReport
};
