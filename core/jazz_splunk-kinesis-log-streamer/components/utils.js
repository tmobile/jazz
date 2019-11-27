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
	Helper functions for Splunk cloudwatch log streamer
	@module: utils.js
	@description: Helper functions for using Regex patterns, etc.
	@author:
	@version: 1.0
**/

const AWS = require('aws-sdk');
const Uuid = require("uuid/v4");
const request = require('request');
const logger = require("../components/logger.js");
const global_config = require("../config/global-config.json");
const truncate = require('unicode-byte-truncate');

// Helper functions

function assumeRole(configData, serviceData){
  var isPrimary, roleArn;
  if(serviceData){
  	isPrimary = checkIsPrimary(serviceData.deployment_accounts[0].accountId, configData);
  	roleArn = getRolePlatformService(serviceData.deployment_accounts[0].accountId, configData);
  } 
  var accessparams;
  return new Promise((resolve, reject) => {
    if(serviceData){
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
            accessparams = {
              accessKeyId: data.Credentials.AccessKeyId,
              secretAccessKey: data.Credentials.SecretAccessKey,
              sessionToken: data.Credentials.SessionToken,
            };
            resolve(accessparams)
          }
        })
      }
    } else {
      // if serviceData is undefined or null
      logger.error('Service Metadata is undefined or null');
      reject('Service Metadata is undefined or null');
    }
  })
}

function getLogsGroupsTags(logGroupName, tempCreds, serviceData) {
  if(serviceData){
  	tempCreds.region = serviceData.deployment_accounts[0].region;
  }
  var cloudwatchlogs = new AWS.CloudWatchLogs(tempCreds);
  var params = {
    logGroupName: logGroupName /* required */
  };
  return new Promise((resolve, reject) => {
    cloudwatchlogs.listTagsLogGroup(params, function(err, data) {
      if (err) {
        logger.error("something went wrong while fetching tags..: " + JSON.stringify(err));
        reject(err)
      } else {
        logger.debug(`tags for log group - ${logGroupName}: ` + JSON.stringify(data))
        resolve(data)
      } 
    });
  });
  // return cloudwatchlogs;
}

var getInfo = function (messages, patternStr) {
  let pattern = new RegExp(patternStr);
  let result = "";
  if (messages) {
    for (let i = 0, len = messages.length; i < len; i++) {
      let tmp = pattern.exec(messages[i].message);
      if (tmp && tmp[1]) {
        logger.debug("found match..:" + tmp[1]);
        result = tmp[1];
        break;
      }
    }
  }
  return result;
}

var getSubInfo = function (message, patternStr, index) {
  let pattern = new RegExp(patternStr);
  let result = "";
  if (message) {
    let tmp = pattern.exec(message);
    if (tmp && tmp[index]) {
      logger.debug("found match..:" + tmp[index]);
      result = tmp[index];
    }
  }
  return result;
}

var getCommonData = function (payload, config) {
  // first get token for calling respective APIs
  getToken(config)
  .then((creds) => {
    // get configDB data for getting roleArn specific to account
    getConfigJson(config, creds)
    .then((configData) => {
      // get accountId and region through service Data
      getServiceMetaData(config, payload.logGroup, creds)
      .then((serviceData) => {
        // execute sts:assumeRole
        assumeRole(configData, serviceData)
        .then((tempCreds) => {
          // configure cloudwatch and retrieve tags from logGroup
          getLogsGroupsTags(payload.logGroup, tempCreds, serviceData)
          .then((tagsResult) => {
            return new Promise((resolve, reject) => {
              let data = {};
              data.metadata = {};
              data.asset_type = "lambda"
              data.request_id = getInfo(payload.logEvents, global_config.PATTERNS.lambda_request_id);
              if (data.request_id) {
                data.provider = "aws";
                let domainAndservice, serviceInfo, dev_environment, serviceInfoArr, namespace;
                data.asset_identifier = payload.logGroup.split(global_config.PATTERNS.asset_identifier_key)[1];
                // if tags present, then it is for sls-app, otherwise for other services
                if(tagsResult != 'error' && tagsResult.tags.environment && tagsResult.tags.namespace && tagsResult.tags.service){
                  data.environment = tagsResult.tags.environment;
                  data.namespace = tagsResult.tags.namespace;
                  data.service = tagsResult.tags.service;
                } else {
                  data.environment = getSubInfo(payload.logGroup, global_config.PATTERNS.Lambda_environment, 2);
                  if (data.environment === "dev") {
                    dev_environment = getSubInfo(payload.logGroup, global_config.PATTERNS.Lambda_environment_dev, 2);
                    serviceInfo = getSubInfo(payload.logGroup, global_config.PATTERNS.Lambda_environment_dev, 1);
                    data.environment = dev_environment;
                  } else {
                    serviceInfo = getSubInfo(payload.logGroup, global_config.PATTERNS.Lambda_domain_service, 1);
                  }
                  domainAndservice = serviceInfo;
                  logger.debug("domainAndservice: " + domainAndservice)
          
                  namespace = domainAndservice.substring(0, domainAndservice.indexOf("_"));
                  if (namespace) {
                    data.namespace = namespace;
                    data.service = domainAndservice.substring(namespace.length + 1);
                  } else {
                    data.namespace = "";
                    data.service = domainAndservice;
                  }
                }
                data.metadata.platform_log_group = payload.logGroup;
                data.metadata.platform_log_stream = payload.logStream;
                resolve(data);
              } else {
                resolve(data);
              }
            });
          })
          .catch(error => {
            logger.error('Error in retreiving tags from logGroup:' + JSON.stringify(error));
            return callback(null);
          });
        })
        .catch(error => {
          logger.error('Error in executing sts:assumeRole:' + JSON.stringify(error));
          return callback(null);
        });
      })
      .catch(error => {
        logger.error('Error in retrieving service details:' + JSON.stringify(error));
        return callback(null);
      });
    })
    .catch(error => {
      logger.error('Error in retreiving admin config from DB:' + JSON.stringify(error));
      return callback(null);
    });
  })
  .catch(error => {
    logger.error('Error in retrieving token:' + JSON.stringify(error));
    return callback(null);
  });
}

// Function to get service metadata using service API
function getServiceMetaData(config, logGroup, authToken) {
  var serviceParts = logGroup.split('_');
  return new Promise((resolve, reject) => {
    var service_api_options = {
      url: `${config.SERVICE_API_URL}${config.SERVICE_URL}?domain=${serviceParts[1]}&service=${serviceParts[2]}&environment=${serviceParts[serviceParts.length - 1]}`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": authToken
      },
      method: "GET",
      rejectUnauthorized: false
    };

    request(service_api_options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        if (response.statusCode && response.statusCode === 200) {
          var responseBody = JSON.parse(body);
          logger.debug("Response Body of Service Metadata is: " + JSON.stringify(responseBody));
          resolve(responseBody.data.services[0])
        } else {
          logger.error("Service not found for this service, domain, environment: ", JSON.stringify(service_api_options));
          reject('Service not found for this service, domain, environment');
        }
      }
    })
  });
}

// Function to check if account is primary or not
function checkIsPrimary(accountId, jsonConfig) {
  var data = jsonConfig.config.AWS.ACCOUNTS;
  var index = data.findIndex(x => x.ACCOUNTID == accountId);
  if (data[index].PRIMARY) {
    return data[index].PRIMARY;
  } else {
    return false;
  }
}

// Function to get roleArn for specific accountId
function getRolePlatformService(accountId, jsonConfig) {
  var data = jsonConfig.config.AWS.ACCOUNTS;
  var index = data.findIndex(x => x.ACCOUNTID == accountId);
  return data[index].IAM.PLATFORMSERVICES_ROLEID;
}

// Function to get configDB data
function getConfigJson(config, token) {
  return new Promise((resolve, reject) => {
    var config_json_api_options = {
      url: `${config.SERVICE_API_URL}${config.CONFIG_URL}`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      method: "GET",
      rejectUnauthorized: false
    };

    request(config_json_api_options, (error, response, body) => {
      if (error) {
        reject(error)
      } else {
        if (response.statusCode && response.statusCode === 200) {
          var responseBody = JSON.parse(body);
          logger.debug("Response body of Config Json is: " +  JSON.stringify(responseBody));
          resolve(responseBody.data)
        } else {
          logger.error("Error in retreiving admin config from DB");
          reject('Error in retreiving admin config from DB');
        }
      }
    })
  })
}

// Function to get accessToken
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
          "error": "Failed while getting authentication token",
          "message": message
        });
      }
    });
  });
}

var transformApiLogs = function (payload) {
  return new Promise((resolve, reject) => {
    let data = {},
      bulkRequestBody = '';
    data.metadata = {};
    data.event_timestamp = new Date();
    data.provider = "aws_apigateway";
    data.asset_type = "apigateway"
    data.metadata.platform_log_group = payload.logGroup;
    data.metadata.platform_log_stream = payload.logStream;
    data.environment = getSubInfo(payload.logGroup, global_config.PATTERNS.environment, 2);
    data.request_id = getInfo(payload.logEvents, global_config.PATTERNS.request_id);
    data.metadata.method = getInfo(payload.logEvents, global_config.PATTERNS.method);
    if (!data.metadata.method) {
      // Cloudwatch do not have method info for get!
      data.metadata.method = "GET";
    }

    let apiDomainAndService = getInfo(payload.logEvents, global_config.PATTERNS.domain_service);
    let apiDomain = apiDomainAndService.substring(0, apiDomainAndService.indexOf("/"));

    if (apiDomain) {
      data.namespace = apiDomain;
      data.service = apiDomainAndService.substring(apiDomain.length + 1);
    } else {
      data.namespace = "";
      data.service = apiDomainAndService;
    }

    data.metadata.path = getInfo(payload.logEvents, global_config.PATTERNS.path);
    data.metadata.application_logs_id = getInfo(payload.logEvents, global_config.PATTERNS.lambda_ref_id);
    if (!data.metadata.application_logs_id) {
      data.metadata.application_logs_id = "_incomplete_req";
    }
    let method_req_headers = getInfo(payload.logEvents, global_config.PATTERNS.method_req_headers);
    data.metadata.origin = getSubInfo(method_req_headers, global_config.PATTERNS.origin, 1);
    data.metadata.host = getSubInfo(method_req_headers, global_config.PATTERNS.host, 1);
    if (!data.metadata.host) {
      data.metadata.host = "_incomplete_req";
    }
    data.metadata.user_agent = getSubInfo(method_req_headers, global_config.PATTERNS.user_agent, 1);
    data.metadata.x_forwarded_port = getSubInfo(method_req_headers, global_config.PATTERNS.x_forwarded_port, 1);
    data.metadata.x_forwarded_for = getSubInfo(method_req_headers, global_config.PATTERNS.x_forwarded_for, 1);
    data.metadata.x_amzn_trace_id = getSubInfo(method_req_headers, global_config.PATTERNS.x_amzn_trace_id, 1);
    data.metadata.content_type = getSubInfo(method_req_headers, global_config.PATTERNS.content_type, 1);
    data.metadata.cache_control = getSubInfo(method_req_headers, global_config.PATTERNS.cache_control, 1);
    data.log_level = "INFO"; // Default to INFO for apilogs
    data.metadata.status = getInfo(payload.logEvents, global_config.PATTERNS.status);

    if (data.request_id && data.service) {
      bulkRequestBody = {
        sourcetype: "apilogs",
        event: data
      };
      logger.debug("Splunk payload for API Gateway LogEvent:" + JSON.stringify(bulkRequestBody));
      resolve(bulkRequestBody);
    } else {
      logger.error("Invalid api logs event..: " + JSON.stringify(payload));
      reject({
        result: "inputError",
        message: "Invalid api logs event."
      });
    }
  });
}

var transformLambdaLogs = function (logEvent, commonData) {
  return new Promise((resolve, reject) => {
    if (Object.keys(commonData).length && commonData.service) {
      try {
        let data = {};
        data.metadata = {};
        Object.keys(commonData).forEach(key => {
          data[key] = commonData[key];
        });
        data.request_id = getSubInfo(logEvent.message, global_config.PATTERNS.guid_regex, 0);
        data.event_timestamp = new Date(1 * logEvent.timestamp).toISOString();
        let message = logEvent.message;
        let messageLength = Buffer.byteLength(message, 'utf8');
        if (messageLength > 32766) { //since 32766(32KB) is the default message size
          let truncatedMessage = truncate(message, 32740); // message size + ...[TRUNCATED]
          data.message = truncatedMessage + "  ...[TRUNCATED]";
        } else {
          data.message = message;
        }

        data.log_level = getSubInfo(logEvent.message, global_config.PATTERNS.log_level, 0);
        if (!data.log_level) {
          data.log_level = global_config.DEFAULT_LOG_LEVEL;
        }

        if (!(data.message.startsWith("REPORT") || data.message.startsWith("START") || data.message.startsWith("END"))) {
          let timestmp = getSubInfo(data.message, global_config.PATTERNS.timestamp_pattern, 0);
          data.message = data.message.replace(timestmp, "");
          let guid = getSubInfo(data.message, global_config.PATTERNS.guid_regex, 0);
          data.message = data.message.replace(guid, "");
          data.message = data.message.replace(data.log_level, "");
        }

        data.message = data.message.trim();
        let bulkRequestBody = {
          sourcetype: "applicationlogs",
          event: data
        };
        logger.debug("Splunk payload for Lambda LogEvent:" + JSON.stringify(bulkRequestBody));
        resolve(bulkRequestBody);
      } catch (e) {
        logger.error(error);
      }

    } else {
      logger.error("Invalid lambda logs event.");
      reject({
        result: "inputError",
        message: "Invalid lambda logs event."
      });
    }
  });
}

module.exports = {
  getCommonData,
  transformApiLogs,
  transformLambdaLogs
};
