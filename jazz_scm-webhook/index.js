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
API to record SCM activity
@author: 
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const request = require("request");
const moment = require("moment");

var handler = function(event, context, cb) {

	//Initializations
	var errorHandler = errorHandlerModule();
	var config = configObj(event);
	logger.init(event, context);
	logger.info("Webhook-events: " + JSON.stringify(event));
	
	if(!event || !event.body ){
		logger.error("Unable to find SCM activity in event body!");
		return cb(JSON.stringify(errorHandler.throwInputValidationError("Unable to find SCM activity in event body!")));
	} 
	var scmMap = config.SCM_MAPPINGS;
	var scmSource, scmIdentifier = scmMap.identifier;

	getScmType(scmIdentifier, event)
	.then((result) => getScmDetails(result, event, config))
	.then((res) => updateEventsWithScmDetails(res, config))
	.then(function(result){
		logger.info("Successfully updated the event: "+JSON.stringify(result));
		return cb(result);
	})
	.catch(function(error){
		logger.info("Error while updating events: "+JSON.stringify(error));
		return cb(JSON.stringify(errorHandler.throwInternalServerError("Unable to find event name as event key is null.")));
	});
};

var getScmType = function(scmIdentifier, event){
	logger.info("scmIdentifier:"+JSON.stringify(scmIdentifier));
	return new Promise((resolve, reject) => {
		for (var key in scmIdentifier) {
			if(scmIdentifier.hasOwnProperty(key)) {
				if (event.headers && event.headers.hasOwnProperty(scmIdentifier[key])){
					scmSource = key;
					resolve(scmSource);
				}
			}
		}
	});
}

var getScmDetails = function(scmSource, event, config){
	logger.debug("Inside getScmDetails: "+ scmSource)
	return new Promise((resolve, reject) => {
		var userName, eventKey, service, repositoryLink, servContext,
		
		eventBody = event.body;

		if(scmSource === 'bitbucket'){
			userName = (eventBody.actor.username) ? eventBody.actor.username : '';
			eventKey = event.headers['X-Event-Key'];
			service = eventBody.repository.slug;
			repositoryLink = eventBody.repository.links.self[0].href;
			bitbucketScmContextDetails(eventKey, eventBody, config)
			.then(function(res){
				var resObj = {
					servContext: res, 
					service: service, 
					userName: userName, 
					repositoryLink: repositoryLink
				}
				resolve(resObj);
			})
			.catch(function(err){
				logger.error(err);
				reject(err);
			});
		} else if(scmSource === 'gitlab'){
			eventKey = eventBody.object_kind;
			service = eventBody.repository.name;
			repositoryLink = eventBody.repository.homepage;
			if(eventKey === 'push'|| eventKey === 'tag_push'){
				userName = (eventBody.user_username) ? eventBody.user_username : '';
			} else {
				userName = (eventBody.user.username) ? eventBody.user.username : '';
			}
			gitlabScmContextDetails(eventKey, eventBody, config)
			.then(function(res){
				var resObj = {
					servContext: res, 
					service: service, 
					userName: userName, 
					repositoryLink: repositoryLink
				}
				resolve(resObj);
			})
			.catch(function(err){
				logger.error(err);
				reject(err);
			});
		} else {
			logger.error("Unsupported scmSource: "+ scmSource);
			reject("Unsupported scm source");
		}
	});
}

var bitbucketScmContextDetails = function(value, body, config){
	logger.debug("Inside bitbucketScmContextDetails: " + value)
	return new Promise((resolve, reject) => {
		var result = {}, changes = null;
		result.event_type = config.EVENT_TYPE.deployment;
		if(body.pullrequest){
			changes = body.pullrequest;	
			result.branch = changes.fromRef.branch.name;
			result.prlink = body.pullrequest.link;
			result.target = changes.toRef.branch.name;
		} else if(body.push){
			changes = body.push.changes[0];	
		}
		
		switch (value) {
			case 'repo:push': 					
				if(changes && changes.created && !changes.closed && !changes.old && changes.new) {
					var type = changes.new.type;
					result.branch = changes.new.name;
					if(type === 'tag'){
						result.event_name = 'CREATE_TAG';
						resolve(result);
					} else if(type === 'branch' && changes.new.name === 'master'){
						result.event_name = 'COMMIT_TEMPLATE';
						resolve(result);
						result.event_type = config.EVENT_TYPE.onboarding;
					} else {
						result.event_name = 'CREATE_BRANCH';
						resolve(result);
					}					
				} else if(changes && !changes.created && changes.closed){
					var objtype = changes.old.type;
					result.branch = changes.old.name;
					if(objtype === 'tag'){
						result.event_name = 'DELETE_TAG';
						resolve(result);
					} else {
						result.event_type = config.EVENT_TYPE.deletion;
						result.event_name = 'DELETE_BRANCH';
						resolve(result);
					} 		
				} else if(changes && !changes.created && !changes.closed && changes.old ){
					result.branch = changes.new.name;
					result.hash = changes.new.target.hash;
					result.event_name = 'COMMIT_CODE';
					resolve(result);
				} else {
					reject("Invalid push event");
				}
				break;
			case 'pullrequest:created':
				result.event_name = 'RAISE_PR';
				resolve(result);
				break;
			case 'pullrequest:fulfilled':
				result.event_name = 'MERGE_PR';
				resolve(result);
				break;
			case 'pullrequest:rejected':
				result.event_name = 'DECLINE_PR';
				resolve(result);
				break;
			case 'pullrequest:updated':
				result.event_name = 'UPDATE_PR';
				resolve(result);
				break;
			case 'pullrequest:comment':
				result.event_name = 'COMMENT_PR';
				resolve(result);
				break;
			default:
				reject("Invalid event key");
		}		
	});
}

var gitlabScmContextDetails = function(eventKey, body, config){
	logger.info("Inside gitlabScmContextDetails: "+eventKey)
	return new Promise((resolve, reject) => {
		var result = {}, changes = null;
		result.event_type = config.EVENT_TYPE.deployment;
		if(eventKey === 'merge_request'){
			changes = body.object_attributes;	
			result.branch = changes.source_branch;
			result.prlink = changes.url;
			result.target = changes.target_branch;

			if(changes.action === "open"){
				result.event_name = 'RAISE_PR';
				resolve(result);
			} else if(changes.action === "merge"){
				result.event_name = 'MERGE_PR';
				resolve(result);
			} else if(changes.action === "update"){
				result.event_name = 'UPDATE_PR';
				resolve(result);
			} else if(changes.action === "close"){
				result.event_name = 'DECLINE_PR';
				resolve(result);
			}

		} else if(eventKey === 'note'){
			changes = body.merge_request;
			result.branch = changes.source_branch;
			result.prlink = changes.url;
			result.target = changes.target_branch;
			result.event_name = 'COMMENT_PR';
			resolve(result);
		} else if (eventKey === 'push'|| eventKey === 'tag_push'){
			result.branch = body.ref;
			
			if( body.before && parseInt(body.before, 10) === 0) {
				if(eventKey === 'tag_push'){
					result.event_name = 'CREATE_TAG';
					resolve(result);
				} else if(body.commits && body.total_commits_count){
					result.event_name = 'COMMIT_TEMPLATE';
					result.event_type = config.EVENT_TYPE.onboarding;
					resolve(result);
				} else {
					result.event_name = 'CREATE_BRANCH';
					resolve(result);
				}					
			} else if(body.after && parseInt(body.after, 10) === 0){
				if(eventKey === 'tag_push'){
					result.event_name = 'DELETE_TAG';
					resolve(result);
				} else {
					result.event_type = config.EVENT_TYPE.deletion;
					result.event_name = 'DELETE_BRANCH';
					resolve(result);
				} 		
			} else if(body.before && body.after && body.total_commits_count){
				result.hash = body.after;
				result.event_name = 'COMMIT_CODE';
				resolve(result);
			} else {
				logger.error("Invalid event key");
				reject("Invalid event key");
			}
		} else {
			logger.error("Invalid event key");
			reject("Invalid event key");
		}
	})
}

var updateEventsWithScmDetails = function(servObj, config){
	logger.info("Inside updateEventsWithScmDetails: "+ JSON.stringify(servObj));
	return new Promise((resolve, reject) => {
		var service = servObj.service.split("_"),
		serviceName = service[1],
		namespace = service[0],
		timestamp = moment().utc().format("YYYY-MM-DDTHH:mm:ss:SSS"),
		servContext = servObj.servContext,
		bodyObj = {
			'event_handler': config.SCM_TYPE[scmSource],
			'event_name': servContext.event_name, 
			'service_name': serviceName,
			'event_status': config.EVENT_STATUS.completed,
			'event_type': servContext.event_type, 
			'username': servObj.userName,
			'event_timestamp': timestamp,
			'service_context': {      
				'repository': servObj.repositoryLink,
				'domain' : namespace,
				'branch' : servContext.branch,
				'pr_link' : servContext.prlink,
				'target' : servContext.target,
				'hash' : servContext.hash
			}
		};

		var possibleEventName = config.EVENT_NAME,
			isvalidEventName = false;
		for (var idx in possibleEventName ){
			if ((servContext.event_name).toLowerCase() === possibleEventName[idx].toLowerCase()){
				isvalidEventName = true;
				break;
			} 
		}

		if(isvalidEventName){
			//Invoking platform events api to record git activity.
			var options = {
				url: config.SERVICE_API_URL + config.EVENTS_URL,
				method: 'POST',
				headers: { 
					'cache-control': 'no-cache',
					'content-type': 'application/json'
				},
				body : bodyObj,
				json: true,
				rejectUnauthorized: false
			};
			request(options, function (error, response, body) {
				if (error) {
					logger.error('Error invoking service: ' + JSON.stringify(error));
					reject(error);
				} else {
					if(response.statusCode === 200){
						var output = {
							message: 'Successfully recorded git activity to jazz_events.',
							event_id : body.data.event_id
						};
						resolve(responseObj(output, body.input));
					} else {
						logger.error("StatusCode :"+ JSON.stringify(response));
						reject(response.body.message);
					}
				}
			});
		} else {
			logger.warn("Unable to send envents, only specified event name(s) are allowed: " + possibleEventName.join(", "));
			reject("Unable to send envents, only specified event name(s) are allowed: " + possibleEventName.join(", "));
		}
	})
}

module.exports = {
	getScmType: getScmType,
	getScmDetails: getScmDetails,
	bitbucketScmContextDetails: bitbucketScmContextDetails,
	gitlabScmContextDetails: gitlabScmContextDetails,
	updateEventsWithScmDetails: updateEventsWithScmDetails,
    handler: handler
}
