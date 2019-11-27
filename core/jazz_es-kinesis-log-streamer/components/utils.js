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
    Helper functions for Cloud Logs Streamer
  @module: utils.js
  @description: Helper functions for using Regex patterns, etc.
  @version: 1.0
**/

const AWS = require('aws-sdk');
const Uuid = require("uuid/v4");
const request = require('request');
const crypto = require('crypto');
const logger = require("../components/logger.js");
const config = require("../config/global_config.json");
var truncate = require('unicode-byte-truncate');

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

function getInfo(messages, patternStr) {
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

function getSubInfo(message, patternStr, index) {
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

function hmac(key, str, encoding) {
  return crypto.createHmac('sha256', key).update(str, 'utf8').digest(encoding);
}

function hash(str, encoding) {
  return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
}

function getApiLogsData(payload) {
  let bulkRequestBody = '',
    data = {},
    indexName = "apilogs";
  data.asset_type = "apigateway";
  data.provider = "aws";
  data.timestamp = new Date();
  data.platform_log_group = payload.logGroup;
  data.platform_log_stream = payload.logStream;
  data.environment = getSubInfo(payload.logGroup, config.PATTERNS.environment, 2);
  data.request_id = getInfo(payload.logEvents, config.PATTERNS.request_id);
  data.method = getInfo(payload.logEvents, config.PATTERNS.method);
  if (!data.method) {
    data.method = "GET";
  } // Cloudwatch do not have method info for get!

  let apiDomainAndService = getInfo(payload.logEvents, config.PATTERNS.domain_service);
  if (data.environment === "dev") {
    apiDomainAndService = apiDomainAndService.substring(apiDomainAndService.indexOf("/") + 1, apiDomainAndService.length);
  }

  let apiDomain = apiDomainAndService.substring(0, apiDomainAndService.indexOf("/"));
  if (apiDomain) {
    data.domain = apiDomain;
    data.servicename = apiDomainAndService.substring(apiDomain.length + 1);
  } else {
    data.domain = "";
    data.servicename = apiDomainAndService;
  }
  data.asset_identifier = data.method + "/" + apiDomainAndService;

  data.path = getInfo(payload.logEvents, config.PATTERNS.path);
  data.application_logs_id = getInfo(payload.logEvents, config.PATTERNS.lambda_ref_id);
  if (!data.application_logs_id) {
    data.application_logs_id = "_incomplete_req";
  }

  let method_req_headers = getInfo(payload.logEvents, config.PATTERNS.method_req_headers);
  data.origin = getSubInfo(method_req_headers, config.PATTERNS.origin, 1);
  data.host = getSubInfo(method_req_headers, config.PATTERNS.host, 1);
  if (!data.host) {
    data.host = "_incomplete_req";
  }

  data.user_agent = getSubInfo(method_req_headers, config.PATTERNS.user_agent, 1);
  data.x_forwarded_port = getSubInfo(method_req_headers, config.PATTERNS.x_forwarded_port, 1);
  data.x_forwarded_for = getSubInfo(method_req_headers, config.PATTERNS.x_forwarded_for, 1);
  data.x_amzn_trace_id = getSubInfo(method_req_headers, config.PATTERNS.x_amzn_trace_id, 1);
  data.content_type = getSubInfo(method_req_headers, config.PATTERNS.content_type, 1);
  data.cache_control = getSubInfo(method_req_headers, config.PATTERNS.cache_control, 1);
  data.log_level = "INFO"; // Default to INFO for apilogs
  data.status = getInfo(payload.logEvents, config.PATTERNS.status);

  let action = {
    "index": {}
  };
  action.index._index = indexName;
  action.index._type = "apilogs";
  action.index._id = data.request_id;

  if (data.request_id && data.servicename) {
    bulkRequestBody += [
      JSON.stringify(action),
      JSON.stringify(data),
    ].join('\n') + '\n';
  } else {
    logger.error("invalid api logs event..: " + JSON.stringify(payload));
  }

  return bulkRequestBody;
}

function getLambdaLogsData(configValue, payload, callback) {
  // first get token for calling respective APIs
  getToken(configValue)
  .then((creds) => {
    // get configDB data for getting roleArn specific to account
    getConfigJson(configValue, creds)
    .then((configData) => {
      // get accountId and region through service Data
      getServiceMetaData(configValue, payload.logGroup, creds)
      .then((serviceData) => {
        // execute sts:assumeRole
        assumeRole(configData, serviceData)
        .then((tempCreds) => {
          // configure cloudwatch and retrieve tags from logGroup
          getLogsGroupsTags(payload.logGroup, tempCreds, serviceData)
          .then((tagsResult) => {
            let bulkRequestBody = '',
            data = {}
            data.asset_type = "lambda";
            data.provider = "aws";
            let domainAndservice, serviceInfo, environment, dev_environment, serviceInfoArr, domain;
            data.request_id = getInfo(payload.logEvents, config.PATTERNS.lambda_request_id);
            if (data.request_id) {
              data.asset_identifier = payload.logGroup.split(config.PATTERNS.asset_identifier_key)[1];
              // if tags present, then it is for sls-app, otherwise for other services
              if(tagsResult != 'error' && tagsResult.tags.environment && tagsResult.tags.namespace && tagsResult.tags.service){
                data.environment = tagsResult.tags.environment;
                data.domain = tagsResult.tags.namespace;
                data.servicename = tagsResult.tags.service;
              } else {
                environment = getSubInfo(payload.logGroup, config.PATTERNS.lambda_environment, 2);
                if (environment === "dev") {
                  dev_environment = getSubInfo(payload.logGroup, config.PATTERNS.lambda_environment_dev, 2);
                  serviceInfo = getSubInfo(payload.logGroup, config.PATTERNS.lambda_environment_dev, 1);
                  data.environment = dev_environment;
                } else {
                  data.environment = environment;
                  serviceInfo = getSubInfo(payload.logGroup, config.PATTERNS.lambda_domain_service, 1);
                }

                domainAndservice = serviceInfo;
            
                logger.debug("domainAndservice: " + domainAndservice)
                domain = domainAndservice.substring(0, domainAndservice.indexOf("_"));
                if (domain) {
                  data.domain = domain;
                  data.servicename = domainAndservice.substring(domain.length + 1);
                } else {
                  data.domain = "";
                  data.servicename = domainAndservice;
                }
              }

              if (data.servicename) {
                payload.logEvents.forEach(function (logEvent) {

                  data.request_id = getSubInfo(logEvent.message, config.PATTERNS.guid_regex, 0);

                  data.platform_log_group = payload.logGroup;
                  data.platform_log_stream = payload.logStream;
                  data.timestamp = new Date(1 * logEvent.timestamp).toISOString();
                  let message = logEvent.message;
                  let messageLength = Buffer.byteLength(message, 'utf8');
                  if (messageLength > 32766) { //since 32766(32KB) is the default message size
                    let truncatedMessage = truncate(message, 32740); // message size + ...[TRUNCATED]
                    data.message = truncatedMessage + "  ...[TRUNCATED]";
                  } else {
                    data.message = message;
                  }

                  data.log_level = getSubInfo(logEvent.message, config.PATTERNS.log_level, 0);
                  if (!data.log_level) {
                    data.log_level = config.DEFAULT_LOG_LEVEL;
                  }

                  if (!(data.message.startsWith("REPORT") || data.message.startsWith("START") || data.message.startsWith("END"))) {
                    let timestmp = getSubInfo(data.message, config.PATTERNS.timestamp_pattern, 0);
                    data.message = data.message.replace(timestmp, "");

                    let guid = getSubInfo(data.message, config.PATTERNS.guid_regex, 0);
                    data.message = data.message.replace(guid, "");

                    data.message = data.message.replace(data.log_level, "");
                  }
                  data.message = data.message.trim();
                  let indexName = "applicationlogs";
                  let action = {
                    "index": {}
                  };
                  action.index._index = indexName;
                  action.index._type = "applicationlogs";
                  action.index._id = logEvent.id;

                  bulkRequestBody += [
                    JSON.stringify(action),
                    JSON.stringify(data),
                  ].join('\n') + '\n';
                });
              } else {
                logger.error("invalid lambda logs event..: " + JSON.stringify(payload));
              }
              callback(bulkRequestBody);
            } else {
              callback(null);
            }
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

function transform(payload, config) {
  return new Promise((resolve, reject) => {
    if (payload && payload.messageType === 'CONTROL_MESSAGE') {
      logger.debug("This is a control message.")
      resolve();
    } else if (payload && payload.logGroup.indexOf("API-Gateway-Execution-Logs") === 0) {
      if (getApiLogsData(payload)) {
        resolve(getApiLogsData(payload));
      } else {
        resolve();
      }
    } else if (payload && payload.logGroup.indexOf("/aws/lambda/") === 0) {
      getLambdaLogsData(config, payload, function(data){
        if (data) {
          resolve(data);
        } else {
          resolve();
        }
      })
    } else {
      logger.debug("Unsupported event logs.")
      resolve();
    }
  });
}

function buildRequest(config, body) {
  let endpoint = config.ES_ENDPOINT;
  let endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com/);
  let region = endpointParts[2];
  let service = endpointParts[3];
  let datetime = (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, '');
  let date = datetime.substr(0, 8);
  let kDate = hmac('AWS4' + process.env.AWS_SECRET_ACCESS_KEY, date);
  let kRegion = hmac(kDate, region);
  let kService = hmac(kRegion, service);
  let kSigning = hmac(kService, 'aws4_request');

  let reqPayload = {
    url: `${endpoint}/_bulk`,
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'X-Amz-Security-Token': process.env.AWS_SESSION_TOKEN,
      'X-Amz-Date': datetime
    }
  };

  let canonicalHeaders = Object.keys(reqPayload.headers)
    .sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    })
    .map(function (k) {
      return k.toLowerCase() + ':' + reqPayload.headers[k];
    })
    .join('\n');

  let signedHeaders = Object.keys(reqPayload.headers)
    .map(function (k) {
      return k.toLowerCase();
    })
    .sort()
    .join(';');

  let canonicalString = [
    reqPayload.method,
    reqPayload.path, '',
    canonicalHeaders, '',
    signedHeaders,
    hash(reqPayload.body, 'hex'),
  ].join('\n');

  let credentialString = [date, region, service, 'aws4_request'].join('/');

  let stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialString,
    hash(canonicalString, 'hex')
  ].join('\n');

  reqPayload.headers.Authorization = [
    'AWS4-HMAC-SHA256 Credential=' + process.env.AWS_ACCESS_KEY_ID + '/' + credentialString,
    'SignedHeaders=' + signedHeaders,
    'Signature=' + hmac(kSigning, stringToSign, 'hex')
  ].join(', ');

  return reqPayload;
}



module.exports = {
  transform,
  buildRequest
};
