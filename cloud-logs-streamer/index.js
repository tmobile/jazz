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

const errorHandlerModule = require("./components/error-handler.js"); 
const responseObj = require("./components/response.js");
var https = require('https');
var zlib = require('zlib');
var crypto = require('crypto');

var endpoint = '{inst_elastic_search_hostname}';

/**
	Custom Cloud logs Streamer (to ES)
	@author: T-Mobile/DSundar3, UST-Global/Somanchi
	@version: 1.0
**/

module.exports.handler = (input, context, cb) => {
	
    // decode input from base64
    var zippedInput = new Buffer(input.awslogs.data, 'base64');

    // decompress the input
    zlib.gunzip(zippedInput, function(error, buffer) {
        if (error) { context.fail(error); return; }

        // parse the input from JSON
        var awslogsData = JSON.parse(buffer.toString('utf8'));

        // transform the input to Elasticsearch documents
        var elasticsearchBulkData = transform(awslogsData);

        // skip control messages
        if (!elasticsearchBulkData) {
            console.log('Received a control message');
            context.succeed('Control message handled successfully');
            return;
        }

        // post documents to the Amazon Elasticsearch Service
        post(elasticsearchBulkData, function(error, success, statusCode, failedItems) {
            console.log('Response: ' + JSON.stringify({ 
                "statusCode": statusCode 
            }));

            if (error) { 
                console.log('Error: ' + JSON.stringify(error, null, 2));

                if (failedItems && failedItems.length > 0) {
                    console.log("Failed Items: " +
                        JSON.stringify(failedItems, null, 2));
                }

                context.fail(JSON.stringify(error));
            } else {
                console.log('Success: ' + JSON.stringify(success));
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
	console.log("Raw payload..:"+JSON.stringify(payload));
	var bulkRequestBody = '';	
	var data = {};
	if(payload.logGroup.indexOf("API-Gateway-Execution-Logs") === 0) { // API logs goes here
		var indexName = "apilogs";

		data.timestamp = new Date();
		//data.account = payload.owner; // as per review comments
		data.platform_log_group = payload.logGroup;
		data.platform_log_stream = payload.logStream;	
		data.environment = getSubInfo(payload.logGroup,getPatterns().environment,2);
		data.request_id = getInfo(payload.logEvents,getPatterns().request_id);
		data.method = getInfo(payload.logEvents,getPatterns().method);
		if(!data.method) {data.method = "GET";} // Cloudwatch do not have method info for get! 
		data.domain = getInfo(payload.logEvents,getPatterns().domain); 
		data.servicename = getInfo(payload.logEvents,getPatterns().servicename); 
		data.path = getInfo(payload.logEvents,getPatterns().path); 
		data.application_logs_id = getInfo(payload.logEvents,getPatterns().lambda_ref_id);
		var method_req_headers = getInfo(payload.logEvents,getPatterns().method_req_headers);
		console.log("method_req_headers..:"+method_req_headers);
		data.origin = getSubInfo(method_req_headers, getPatterns().origin, 1);
		data.host = getSubInfo(method_req_headers, getPatterns().host, 1);
		data.user_agent = getSubInfo(method_req_headers, getPatterns().user_agent, 1);
		data.x_forwarded_port = getSubInfo(method_req_headers, getPatterns().x_forwarded_port, 1);
		data.x_forwarded_for = getSubInfo(method_req_headers, getPatterns().x_forwarded_for, 1);
		data.x_amzn_trace_id = getSubInfo(method_req_headers, getPatterns().x_amzn_trace_id, 1);
		data.content_type = getSubInfo(method_req_headers, getPatterns().content_type, 1);
		data.cache_control = getSubInfo(method_req_headers, getPatterns().cache_control, 1);
		data.status = getInfo(payload.logEvents,getPatterns().status);
		
		var action = { "index": {} };
		action.index._index = indexName;
		action.index._type = data.environment;
		action.index._id = data.request_id;

		bulkRequestBody += [ 
			JSON.stringify(action), 
			JSON.stringify(data),
		].join('\n') + '\n';
			
		console.log("bulkRequestBody-API-Gateway_exe..:"+bulkRequestBody);
		return bulkRequestBody;
		
	} else if(payload.logGroup.indexOf("/aws/lambda/") === 0) { // Lambda logs goes here
		console.log("Lambda Payload..:"+JSON.stringify(payload));
		data = {};
		data.request_id = getInfo(payload.logEvents,getPatterns().Lambda_request_id);
		
		if(data.request_id) {
			data.environment = getSubInfo(payload.logGroup,getPatterns().Lambda_environment,2);
			data.servicename = getSubInfo(payload.logGroup,getPatterns().Lambda_function,1);
			payload.logEvents.forEach(function(logEvent) {
				
				data.platform_log_group = payload.logGroup;
				data.platform_log_stream = payload.logStream;
				data.timestamp = new Date(1 * logEvent.timestamp).toISOString();			
				data.message = logEvent.message;
				
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
			
			console.log("bulkRequestBody-/aws/lambda/..:"+bulkRequestBody);
			return bulkRequestBody;	
			
		}else 
			return null;
	}
	
	return null;
}

function buildSource(message, extractedFields) {
    if (extractedFields) {
        var source = {};

        for (var key in extractedFields) {
			console.log("key from buildSource..:"+JSON.stringify(key));
            if (extractedFields.hasOwnProperty(key) && extractedFields[key]) {
                var value = extractedFields[key];

                if (isNumeric(value)) {
                    source[key] = 1 * value;
                    continue;
                }

                jsonSubString = extractJson(value);
                if (jsonSubString !== null) {
                    source['$' + key] = JSON.parse(jsonSubString);
                }

                source[key] = value;
            }
        }
        return source;
    }

    jsonSubString = extractJson(message);
    if (jsonSubString !== null) { 
        return JSON.parse(jsonSubString); 
    }

    return {};
}

function extractJson(message) {
    var jsonStart = message.indexOf('{');
    if (jsonStart < 0) return null;
    var jsonSubString = message.substring(jsonStart);
    return isValidJson(jsonSubString) ? jsonSubString : null;
}

function isValidJson(message) {
    try {
        JSON.parse(message);
    } catch (e) { return false; }
    return true;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function post(body, callback) {
    var requestParams = buildRequest(endpoint, body);

    var request = https.request(requestParams, function(response) {
        var responseBody = '';
        response.on('data', function(chunk) {
            responseBody += chunk;
        });
		console.log("response from post..:"+JSON.stringify(responseBody));		
        response.on('end', function() {
            var info = JSON.parse(responseBody);
            var failedItems;
            var success;
            
            if (response.statusCode >= 200 && response.statusCode < 299) {
                failedItems = info.items.filter(function(x) {
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
    }).on('error', function(e) {
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
    var kDate = hmac('AWS4' + process.env.AWS_SECRET_ACCESS_KEY, date);
    var kRegion = hmac(kDate, region);
    var kService = hmac(kRegion, service);
    var kSigning = hmac(kService, 'aws4_request');
    
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
        .sort(function(a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; })
        .map(function(k) { return k.toLowerCase() + ':' + request.headers[k]; })
        .join('\n');

    var signedHeaders = Object.keys(request.headers)
        .map(function(k) { return k.toLowerCase(); })
        .sort()
        .join(';');

    var canonicalString = [
        request.method,
        request.path, '',
        canonicalHeaders, '',
        signedHeaders,
        hash(request.body, 'hex'),
    ].join('\n');

    var credentialString = [ date, region, service, 'aws4_request' ].join('/');

    var stringToSign = [
        'AWS4-HMAC-SHA256',
        datetime,
        credentialString,
        hash(canonicalString, 'hex')
    ] .join('\n');

    request.headers.Authorization = [
        'AWS4-HMAC-SHA256 Credential=' + process.env.AWS_ACCESS_KEY_ID + '/' + credentialString,
        'SignedHeaders=' + signedHeaders,
        'Signature=' + hmac(kSigning, stringToSign, 'hex')
    ].join(', ');

	console.log("request from build request"+JSON.stringify(request));
    return request;
}

function hmac(key, str, encoding) {
    return crypto.createHmac('sha256', key).update(str, 'utf8').digest(encoding);
}

function hash(str, encoding) {
    return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
}

function getInfo(messages, patternStr) {
	var pattern = new RegExp(patternStr);
	var result = "";
	if(messages){
		for (var i = 0, len = messages.length; i < len; i++) {
			var _tmp = pattern.exec(messages[i].message);
			if(_tmp && _tmp[1]) {
				console.log("found match..:"+_tmp[1]);
				result = _tmp[1];
				break;
			}
		}
	}
	return result;
}

function getSubInfo(message, patternStr, index) {
	var pattern = new RegExp(patternStr);
	var result = "";
	if(message){
		var _tmp = pattern.exec(message);
		if(_tmp && _tmp[index]) {
			console.log("found match..:"+_tmp[index]);
			result = _tmp[index];
		}
	}
	return result;
}


function getPatterns() {
	  return {
		"request_id":"^Starting execution for request: (.+)$",
		"environment":"^API-Gateway-Execution-Logs_(.+)/(.+)$",
		"method":"^HTTP Method: (.+),(.+)$",
		"servicename":"Resource Path: /api/(.+)$",
		"domain":"Resource Path: /api/(.+)/.+$",
		"path":"Method request path:(.+)$",
		"request":"Method request body before transformations: (.+)$",
		"request_get":"^Method request query string: (.+)$",
		"response":"Endpoint response body before transformations: (.+)$",
		"status":"^Method completed with status: (.+)$",
		"Lambda_request_id":"^END RequestId: (.+\n)$",
		"Lambda_environment":"^/aws/lambda/(.+)-(.+)$",
		"Lambda_function":"^/aws/lambda/(.+)$",
		"lambda_ref_id":", x-amzn-RequestId=(.+), Connection",
		"method_req_headers":"Method request headers: (.+)",
		"origin":", origin=([^,]+)",
		"host":", Host=([^,]+)",
		"user_agent":", User-Agent=([^,]+)",
		"x_forwarded_port":", X-Forwarded-Port=([^,]+)",
		"x_forwarded_for":", X-Forwarded-For=([^,]+)",
		"x_amzn_trace_id":", X-Amzn-Trace-Id=([^,]+)",
		"content_type":", content-type=([^,]+)",
		"cache_control":", cache-control=([^,]+)"
  };
}