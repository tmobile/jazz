/**
API to record SCM activity
@author: Aanand12
@version: 1.0
 **/


//123
const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const request = require("request");
const moment = require("moment");

module.exports.handler = (event, context, cb) => {

	//Initializations
	var errorHandler = errorHandlerModule();
	var config = configObj(event);
	logger.init(event, context);
	logger.info("Webhook-events:" + JSON.stringify(event));
	
	if(event === undefined || event.body === undefined ){
		logger.error("Events is empty! so unable to find the scm activity!");
		return cb(JSON.stringify(errorHandler.throwInputValidationError("Unable to find the bitbucket activity!")));
	} 
	var scmMap = config.scm_mappings;
	var scmSource, scmIdentifier = scmMap.identifier;

	for (var key in scmIdentifier) {
		if(scmIdentifier.hasOwnProperty(key)) {
			if (event.headers && event.headers.hasOwnProperty(scmIdentifier[key])){
				scmSource = key;
				break;
			}
		} 
	}
	
	logger.info("SCM Source:" + scmSource);
	var eventBody = event.body;
	userName = (eventBody.actor.username) ? eventBody.actor.username : '',
	eventKey = event.headers['X-Event-Key'],
	service = eventBody.repository.slug,
	serviceName = (service !== undefined && service !== '') ? service.split("_")[1] : "",
	domain = (service !== undefined && service !== '') ? service.split("_")[0] : "",
	repositoryLink = eventBody.repository.links.self[0].href,
	timestamp = moment().utc().format("YYYY-MM-DDTHH:mm:ss:SSS");
	
	if(eventKey){
		var servContext = getServiceContext(eventKey, eventBody),		
			bodyObj = {
				'event_handler': config.event_handler.bitbucket,
				'event_name': servContext.event_name, 
				'service_name': serviceName,
				'event_status': config.event_status.completed,
				'event_type': servContext.event_type, 
				'username': userName,
				'event_timestamp': timestamp,
				'service_context': {      
					'repository': repositoryLink,
					'domain' : domain,
					'branch' : servContext.branch,
					'pr_link' : servContext.prlink,
					'target' : servContext.target,
					'hash' : servContext.hash
				}
			};
		var possibleEventName = config.event_name,
			isvalidEventName = false;
		for (var idx in possibleEventName ){
			if ((servContext.event_name).toLowerCase() == possibleEventName[idx].toLowerCase()){
				isvalidEventName = true;
			} 
		}
		
		logger.info("bodyObj::" +JSON.stringify(bodyObj));
		logger.info("config.events_url::" + config.events_url);

		if(isvalidEventName){
			//Invoking platform events api to record bit bucket activity.	
			var options = {
				url: config.events_url,
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
					logger.error('Error invoking service: ' + error);
					return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured,"+ error)));
				} else {
					if(response.statusCode === 200){
						var output = {
							message: 'successfully recorded bitbucket activity to jazz_events.',
							event_id : body.data.event_id
						};
						logger.info("OutPut: " +JSON.stringify(output));
						logger.info("Input: " +JSON.stringify(body.input));
						cb(null, responseObj(output, body.input));
					} else {
						logger.error("StatusCode :"+ response.statusCode);
						return cb(JSON.stringify(errorHandler.throwInternalServerError("Unable to send events, StatusCode:"+ response.statusCode)));
					}
				}
			});
		} else {
			logger.warn("Unable to send envents! Only specified event name can be allowed :" + possibleEventName.join(", "));
		}
		
	} else {
		return cb(JSON.stringify(errorHandler.throwInternalServerError("Eventkey is null or undefined! so unable to find event name.")));
	}	
	
	function getServiceContext(value, body){
		var result = {},
			changes = null;
		result.event_type = config.event_type.deployment;
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
				if(changes.created && !changes.closed && changes.old === null && changes.new !== null) {
					var type = changes.new.type;
					result.branch = changes.new.name;
					if(type === 'tag'){
						result.event_name = 'CREATE_TAG';
					} else if(type === 'branch' && changes.new.name === 'master'){
						result.event_name = 'COMMIT_TEMPLATE';
						result.event_type = config.event_type.onboarding;
					} else {
						result.event_name = 'CREATE_BRANCH';
					}					
				} else if(!changes.created && changes.closed){
					var objtype = changes.old.type;
					result.branch = changes.old.name;
					if(objtype === 'tag'){
						result.event_name = 'DELETE_TAG';
					} else {
						result.event_type = config.event_type.deletion;
						result.event_name = 'DELETE_BRANCH';
					} 		
				} else if(!changes.created && !changes.closed && changes.old !== null){
					result.branch = changes.new.name;
					result.hash = changes.new.target.hash;
					result.event_name = 'COMMIT_CODE';
				}
				break;
			case 'pullrequest:created':
				result.event_name = 'RAISE_PR';
				break;
			case 'pullrequest:fulfilled':
				result.event_name = 'MERGE_PR';
				break;
			case 'pullrequest:rejected':
				result.event_name = 'DECLINE_PR';
				break;
			case 'pullrequest:updated':
				result.event_name = 'UPDATE_PR';
				break;
			case 'pullrequest:comment':
				result.event_name = 'COMMENT_PR';
				break;
		}
		logger.info("Events:"+ JSON.stringify(result));
		return result;
	}
};
