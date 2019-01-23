// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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
'use strict';

var https = require('https');
var zlib = require('zlib');
var truncate = require('unicode-byte-truncate');

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const utils = require("./components/utils.js")(); //Import the utils module.
const responseObj = require("./components/response.js");
const globalConfig = require("./config/global_config.json"); //Import the Global Configuration module.

/**
	Custom Cloud logs Streamer (to ES)
	@author:
	@version: 1.0
**/

module.exports.handler = (input, context, cb) => {

    logger.init(input, context);
    var config = configModule.getConfig(input, context);

    // decode input from base64
    var zippedInput = new Buffer(input.awslogs.data, 'base64');

    // decompress the input
    zlib.gunzip(zippedInput, function (error, buffer) {
        if (error) { context.fail(error); return; }

        // parse the input from JSON
        var awslogsData = JSON.parse(buffer.toString('utf8'));

        // transform the input to Elasticsearch documents
        var elasticsearchBulkData = transform(awslogsData);

        // skip control messages
        if (!elasticsearchBulkData) {
            logger.debug('Received a control message');
            context.succeed('Control message handled successfully');
            return;
        }

        // post documents to the Amazon Elasticsearch Service
        post(config, elasticsearchBulkData, function (error, success, statusCode, failedItems) {
            logger.debug('Response: statusCode: ' + statusCode);

            if (error) {
                logger.error('Error: ' + JSON.stringify(error, null, 2));

                if (failedItems && failedItems.length > 0) {
                    logger.error("Failed Items: " + JSON.stringify(failedItems, null, 2));
                }

                context.fail(JSON.stringify(error));
            } else {
                logger.info('Success: ' + JSON.stringify(success));
                context.succeed('Success');
            }
        });
    });

    cb(null, responseObj(JSON.stringify(input), input));

};

function transform(payload) {
    if (payload.messageType === 'CONTROL_MESSAGE') {
        return null;
    }
    logger.info("Raw payload..:" + JSON.stringify(payload));
    var bulkRequestBody = '';
    var data = {};
    if (payload.logGroup.indexOf("API-Gateway-Execution-Logs") === 0) { // API logs goes here
        var indexName = "apilogs";

        data.timestamp = new Date();
        //data.account = payload.owner; // as per review comments
        data.platform_log_group = payload.logGroup;
        data.platform_log_stream = payload.logStream;
        data.environment = utils.getSubInfo(payload.logGroup, globalConfig.PATTERNS.environment, 2);
        data.request_id = utils.getInfo(payload.logEvents, globalConfig.PATTERNS.request_id);
        data.method = utils.getInfo(payload.logEvents, globalConfig.PATTERNS.method);
        if (!data.method) { data.method = "GET"; } // Cloudwatch do not have method info for get! 

        var apiDomainAndService = utils.getInfo(payload.logEvents, globalConfig.PATTERNS.domain_service);
        var _apiDomain = apiDomainAndService.substring(0, apiDomainAndService.indexOf("/"));
        if (_apiDomain) {
            data.domain = _apiDomain;
            data.servicename = apiDomainAndService.substring(_apiDomain.length + 1);
        } else {
            data.domain = "";
            data.servicename = apiDomainAndService;
        }

        data.path = utils.getInfo(payload.logEvents, globalConfig.PATTERNS.path);
        data.application_logs_id = utils.getInfo(payload.logEvents, globalConfig.PATTERNS.lambda_ref_id);
        var method_req_headers = utils.getInfo(payload.logEvents, globalConfig.PATTERNS.method_req_headers);
        logger.debug("method_req_headers..:" + method_req_headers);
        data.origin = utils.getSubInfo(method_req_headers, globalConfig.PATTERNS.origin, 1);
        data.host = utils.getSubInfo(method_req_headers, globalConfig.PATTERNS.host, 1);
        data.user_agent = utils.getSubInfo(method_req_headers, globalConfig.PATTERNS.user_agent, 1);
        data.x_forwarded_port = utils.getSubInfo(method_req_headers, globalConfig.PATTERNS.x_forwarded_port, 1);
        data.x_forwarded_for = utils.getSubInfo(method_req_headers, globalConfig.PATTERNS.x_forwarded_for, 1);
        data.x_amzn_trace_id = utils.getSubInfo(method_req_headers, globalConfig.PATTERNS.x_amzn_trace_id, 1);
        data.content_type = utils.getSubInfo(method_req_headers, globalConfig.PATTERNS.content_type, 1);
        data.cache_control = utils.getSubInfo(method_req_headers, globalConfig.PATTERNS.cache_control, 1);
        data.log_level = "INFO"; // Default to INFO for apilogs
        data.status = utils.getInfo(payload.logEvents, globalConfig.PATTERNS.status);

        var action = { "index": {} };
        action.index._index = indexName;
        action.index._type = data.environment;
        action.index._id = data.request_id;

        bulkRequestBody += [
            JSON.stringify(action),
            JSON.stringify(data),
        ].join('\n') + '\n';

        logger.debug("bulkRequestBody-API-Gateway_exe..:" + bulkRequestBody);
        return bulkRequestBody;

    } else if (payload.logGroup.indexOf("/aws/lambda/") === 0) { // Lambda logs goes here

        data = {};
        data.request_id = utils.getInfo(payload.logEvents, globalConfig.PATTERNS.Lambda_request_id);
        if (data.request_id) {
            data.environment = utils.getSubInfo(payload.logGroup, globalConfig.PATTERNS.Lambda_environment, 2);
            var domainAndservice;
            if (data.environment === "dev") {
                var dev_environment = utils.getSubInfo(payload.logGroup, globalConfig.PATTERNS.Lambda_environment_dev, 2);
                domainAndservice = utils.getSubInfo(payload.logGroup, globalConfig.PATTERNS.Lambda_environment_dev, 1);
                data.environment = dev_environment;
            } else {
                domainAndservice = utils.getSubInfo(payload.logGroup, globalConfig.PATTERNS.Lambda_domain_service, 1);
            }

            data.servicename = domainAndservice;
            if (data.servicename) {
                payload.logEvents.forEach(function (logEvent) {
                    data.request_id = utils.getSubInfo(logEvent.message, globalConfig.PATTERNS.guid_regex, 0);
                    data.platform_log_group = payload.logGroup;
                    data.platform_log_stream = payload.logStream;
                    data.timestamp = new Date(1 * logEvent.timestamp).toISOString();
                    var message = logEvent.message;
                    var messageLength = Buffer.byteLength(message, 'utf8');
                    if (messageLength > 32766) { //since 32766(32KB) is the default message size
                        var truncatedMessage = truncate(message, 32740); // message size + ...[TRUNCATED]
                        data.message = truncatedMessage + "  ...[TRUNCATED]";
                    } else {
                        data.message = message;
                    }
                    data.log_level = utils.getSubInfo(logEvent.message, globalConfig.PATTERNS.log_level, 0);
                    if (!data.log_level) {
                        data.log_level = globalConfig.DEFAULT_LOG_LEVEL;
                    }
                    if (!(data.message.startsWith("REPORT") || data.message.startsWith("START") || data.message.startsWith("END"))) {
                        var timestmp = utils.getSubInfo(data.message, globalConfig.PATTERNS.timestamp_pattern, 0);
                        data.message = data.message.replace(timestmp, "");
                        var guid = utils.getSubInfo(data.message, globalConfig.PATTERNS.guid_regex, 0);
                        data.message = data.message.replace(guid, "");
                        data.message = data.message.replace(data.log_level, "");
                    }
                    data.message = data.message.trim();

                    var indexName = "applicationlogs";
                    var action = { "index": {} };
                    action.index._index = indexName;
                    action.index._type = data.environment;
                    action.index._id = logEvent.id;

                    bulkRequestBody += [
                        JSON.stringify(action),
                        JSON.stringify(data),
                    ].join('\n') + '\n';
                });
            } else {
                logger.error("invalid lambda logs event..: " + JSON.stringify(payload));
            }
            logger.debug("bulkRequestBody-/aws/lambda/..:" + bulkRequestBody);
            return bulkRequestBody;
        } else
            return null;
    }
    return null;
}

function buildSource(message, extractedFields) {
    if (extractedFields) {
        var source = {};

        for (var key in extractedFields) {
            logger.debug("key from buildSource..:" + JSON.stringify(key));
            if (extractedFields.hasOwnProperty(key) && extractedFields[key]) {
                var value = extractedFields[key];
                if (utils.isNumeric(value)) {
                    source[key] = 1 * value;
                    continue;
                }
                var jsonSubString = utils.extractJson(value);
                if (jsonSubString !== null) {
                    source['$' + key] = JSON.parse(jsonSubString);
                }
                source[key] = value;
            }
        }
        return source;
    }

    var jsonMessage = utils.extractJson(message);
    if (jsonMessage !== null) {
        return JSON.parse(jsonMessage);
    }
    return {};
}

function post(config, body, callback) {
    var requestParams = buildRequest(config.ES_ENDPOINT, body);
    var request = https.request(requestParams, function (response) {
        var responseBody = '';
        response.on('data', function (chunk) {
            responseBody += chunk;
        });
        logger.debug("response from post..:" + JSON.stringify(responseBody));
        response.on('end', function () {
            var info = JSON.parse(responseBody);
            var failedItems;
            var success;

            if (response.statusCode >= 200 && response.statusCode < 299) {
                failedItems = info.items.filter(function (x) {
                    return x.index.status >= 300;
                });
                success = {
                    "attemptedItems": info.items.length,
                    "successfulItems": info.items.length - failedItems.length,
                    "failedItems": failedItems.length
                };
            }

            var error = response.statusCode !== 200 || info.errors === true ? {
                "statusCode": response.statusCode,
                "responseBody": responseBody
            } : null;
            callback(error, success, response.statusCode, failedItems);
        });
    }).on('error', function (e) {
        callback(e);
    });
    request.end(requestParams.body);
}

function buildRequest(endpoint, body) {
    var endpointParts = endpoint.match(/^([^\.]+)\.?([^\.]*)\.?([^\.]*)\.amazonaws\.com$/);
    var region = endpointParts[2];
    var service = endpointParts[3];
    var datetime = (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, '');
    var date = datetime.substr(0, 8);
    var kDate = utils.hmac('AWS4' + process.env.AWS_SECRET_ACCESS_KEY, date);
    var kRegion = utils.hmac(kDate, region);
    var kService = utils.hmac(kRegion, service);
    var kSigning = utils.hmac(kService, 'aws4_request');

    var request = {
        host: endpoint,
        method: 'POST',
        path: '/_bulk',
        body: body,
        headers: {
            'Content-Type': 'application/json',
            'Host': endpoint,
            'Content-Length': Buffer.byteLength(body),
            'X-Amz-Security-Token': process.env.AWS_SESSION_TOKEN,
            'X-Amz-Date': datetime
        }
    };

    var canonicalHeaders = Object.keys(request.headers)
        .sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; })
        .map(function (k) { return k.toLowerCase() + ':' + request.headers[k]; })
        .join('\n');

    var signedHeaders = Object.keys(request.headers)
        .map(function (k) { return k.toLowerCase(); })
        .sort()
        .join(';');

    var canonicalString = [
        request.method,
        request.path, '',
        canonicalHeaders, '',
        signedHeaders,
        utils.hash(request.body, 'hex'),
    ].join('\n');

    var credentialString = [date, region, service, 'aws4_request'].join('/');

    var stringToSign = [
        'AWS4-HMAC-SHA256',
        datetime,
        credentialString,
        utils.hash(canonicalString, 'hex')
    ].join('\n');

    request.headers.Authorization = [
        'AWS4-HMAC-SHA256 Credential=' + process.env.AWS_ACCESS_KEY_ID + '/' + credentialString,
        'SignedHeaders=' + signedHeaders,
        'Signature=' + utils.hmac(kSigning, stringToSign, 'hex')
    ].join(', ');
    logger.debug("request from build request " + JSON.stringify(request));
    return request;
}


