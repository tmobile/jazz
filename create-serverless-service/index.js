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
const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const CronParser = require("./components/cron-parser.js");
const https = require('https');
const request = require('request');
const secretHandlerModule = require("./components/secret-handler.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");

/**
	Serverless create service 
    @author: UST-Global/Somanchi
    @version: 1.0
**/


module.exports.handler = (event, context, cb) => {
    
    var errorHandler = errorHandlerModule();
	var config = configObj(event);
	var secretHandler = secretHandlerModule();
	logger.init(event, context);
	
    var messageToBeSent;
    var isValidName = function(name) {
        return /^[A-Za-z0-9\-]+$/.test(name);
    };

    try {
        if (event.body === undefined) {
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Service inputs not defined")));
        } else if (event.body.service_type === undefined || event.body.service_type === "") {
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Service Type not defined")));
        } else if (event.body.service_name === undefined || event.body.service_name === "" || !isValidName(event.body.service_name)) {
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Service Name not defined or approriate")));
        } else if (event.headers.Authorization === undefined || event.headers.Authorization === "") {
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Authorization not defined or approriate")));
        } else if (event.body.service_type !== "website" && (event.body.runtime === undefined || event.body.runtime === "")) {
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Service Runtime not defined")));
        } else if (event.body.approvers === undefined || event.body.approvers === "") {
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Service Approvers not defined")));
        } else if (event.body.domain && !isValidName(event.body.domain)) {
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Domain Name is not approriate")));
        } else if (event.body.username === undefined || event.body.username === "") {
            // Check if Service Creator (username) exists
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Service Creator not defined")));
        }
	
	    logger.info("Request event: "+JSON.stringify(event));
	
		//var base_auth_token = "Basic " + new Buffer("jobexec:jenkinsadmin").toString("base64");
		var base_auth_token = "Basic " + new Buffer(config.SVC_USER + ":" + config.SVC_PASWD).toString("base64");

        var approvers = event.body.approvers;
        var domain = (event.body.domain || "").toLowerCase();
        var bitbucketName = event.body.service_name.toLowerCase();
        if (domain.length) {
            bitbucketName = domain + "-" + bitbucketName;
        }

        var propertiesObject = {
            token: config.BUILD_TOKEN,
            service_type: event.body.service_type,
            runtime: event.body.runtime,
            service_name: event.body.service_name,
            username: event.body.username,
            domain: event.body.domain,
            auth_token: event.headers.Authorization
        };
        
        // create-serverless-service API to take slack-channel as one more parameter(optional)
        if(event.body.slack_channel) {
            propertiesObject.slack_channel = event.body.slack_channel;
        }

        // create-serverless-service API to take require_internal_access as one more parameter
        if((event.body.service_type === "api" || event.body.service_type === "lambda") && (event.body.require_internal_access !== null)) {
            propertiesObject.require_internal_access = event.body.require_internal_access;
        }
        
        // allowing service creators to opt in/out of creating Cloudfront url.
        if (event.body.service_type === "website") {
            // by default Cloudfront url will not be created from now on.
            var create_cloudfront_url = event.body.create_cloudfront_url || false;
            propertiesObject.create_cloudfront_url = create_cloudfront_url;
        }
	
        // Add rate expression to the propertiesObject;
        if (event.body.service_type === "lambda") {
            if (event.body.rateExpression !== undefined) {
                var cronExpValidator = CronParser.validateCronExpression(event.body.rateExpression);

                // Validate cron expression. If valid add it to propertiesObject, else throw error
                if (cronExpValidator.result === 'valid') {
                    propertiesObject['rateExpression'] = event.body.rateExpression;

                    // enableEventSchedule is added here as an additional feature. It will be passed on to deployment-env.yml
                    // If it is set as false it will be picked by serverless and event schedule will be disabled.
                    // If the user chooses to stop the cron event, he can just disable and then re-enable it instead of deleting.
                    if (event.body.enableEventSchedule === false) {
                        propertiesObject['enableEventSchedule'] = event.body.enableEventSchedule;
                    } else {
                        // enable by default
                        propertiesObject['enableEventSchedule'] = true;
                    }
                } else {
                    logger.error('cronExpValidator : ', cronExpValidator);
                    return cb(JSON.stringify(errorHandler.throwInternalServerError(cronExpValidator.message)));
                }
            }
        }
	
        logger.info("Raise a request to ServiceOnboarding job..: "+JSON.stringify(propertiesObject));

        request({
          	uri: "{conf-jenkins-host}/job/create-service/buildWithParameters",          
            method: 'POST',
            headers: {
	            "Authorization": base_auth_token
	    },
            qs: propertiesObject
        }, function(err, response, body) {
            if (err) {
                logger.error('Error while starting Jenkins job: ' + err);
                return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
            }else {
				messageToBeSent = "Your Service Code will be available at "+config.BIT_BUCKET_URL+bitbucketName + "/browse";
				return cb(null, responseObj(messageToBeSent, event.body));
			}
        });
    } catch (e) {
        logger.error('Error : ', e.message);
        cb(JSON.stringify(errorHandler.throwInternalServerError(e.message)));
    }
};
