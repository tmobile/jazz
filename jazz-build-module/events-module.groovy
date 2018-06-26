#!groovy?
import groovy.json.JsonOutput
import groovy.transform.Field
echo "Events module loaded successfully"

/**
 * The Events module for jenkins packs
 * @author: 
 * @date: 
*/

@Field def g_request_id = ""
@Field def g_branch = ""
@Field def g_environment = ""
@Field def g_event_handler = ""
@Field def g_event_type = ""
@Field def g_events_api
@Field def service_metadata
@Field def config_loader

/**
 * These are the list of available event_names. Any new event names added here should be added to the events table in dynamoDB as well. 
 */


@Field def Event_Names = [
	'VALIDATE_INPUT': 'VALIDATE_INPUT',
	'MODIFY_TEMPLATE':'MODIFY_TEMPLATE',
	'ADD_WRITE_PERMISSIONS_TO_SERVICE_REPO':'ADD_WRITE_PERMISSIONS_TO_SERVICE_REPO',
	'BUILD_MASTER_BRANCH':'BUILD_MASTER_BRANCH',
	'COMMIT_CODE':'COMMIT_CODE',
	'CREATE_SERVICE_REPO':'CREATE_SERVICE_REPO',
	'LOCK_MASTER_BRANCH':'LOCK_MASTER_BRANCH',
	'PUSH_TEMPLATE_TO_SERVICE_REPO':'PUSH_TEMPLATE_TO_SERVICE_REPO',
	'CLONE_TEMPLATE':'CLONE_TEMPLATE',
    'ADD_WEBHOOK':'ADD_WEBHOOK',
	'UNDEPLOY_LAMBDA':'UNDEPLOY_LAMBDA',
	'GET_SERVICE_CODE':'GET_SERVICE_CODE',
	'GET_SERVERLESS_CONF':'GET_SERVERLESS_CONF',
	'UPDATE_DEPLOYMENT_CONF':'UPDATE_DEPLOYMENT_CONF',
	'UPDATE_SWAGGER':'UPDATE_SWAGGER',
    'GET_DEPLOYMENT_CONF':'GET_DEPLOYMENT_CONF',
    'VALIDATE_PRE_BUILD_CONF':'VALIDATE_PRE_BUILD_CONF',
    'DELETE_PROJECT':'DELETE_PROJECT',
    'DELETE_API_RESOURCE':'DELETE_API_RESOURCE',
    'DELETE_CLOUDFRONT':'DELETE_CLOUDFRONT',
    'DISABLE_CLOUDFRONT':'DISABLE_CLOUDFRONT',
	'BUILD':'BUILD',
	'DEPLOY_TO_AWS':'DEPLOY_TO_AWS',
	'CREATE_ASSET':'CREATE_ASSET',
	'UPDATE_ASSET':'UPDATE_ASSET',
	'CALL_DELETE_WORKFLOW': 'CALL_DELETE_WORKFLOW',
	'CREATE_DEPLOYMENT': 'CREATE_DEPLOYMENT',
	'UPDATE_DEPLOYMENT': 'UPDATE_DEPLOYMENT',
	'UPDATE_ENVIRONMENT': 'UPDATE_ENVIRONMENT',
	'DELETE_ENVIRONMENT': 'DELETE_ENVIRONMENT',
	'CODE_QUALITY_CHECK': 'CODE_QUALITY_CHECK'
]

/**
 * These are the 3 event status. 
 * Any new event status added here should be added to the status table in dynamoDB as well.  
 */
@Field def Event_Status = [
	'STARTED':'STARTED',
	'COMPLETED':'COMPLETED',
	'FAILED':'FAILED'
]

def initialize(configLoader, serviceConfig, eventType, branch, env, url){
	setConfigLoader(configLoader)
	setServiceConfig(serviceConfig)
	setEventType(eventType)
	setBranch(branch)
	setEnvironment(env)
	setUrl(url)
}

/**
 * Send a started event.
 * @param event_name
 * @param message
 * @return      
 */
def sendStartedEvent(event_name, message = null, moreCxtMap = null) {
	def environment = g_environment
	sendStartedEvent(event_name, message, moreCxtMap, environment)
}

/**
 * Send a started event specific to an environment.
 * @param event_name
 * @param message
 * @param moreCxt - more contexual info if needed as a map (key, value pair)
 * @param message
 * @return      
 */
def sendStartedEvent(l_event_name, l_message, l_moreCxtMap, l_environment) {
	def moreCxtMap = l_moreCxtMap
	def message = l_message
	if (!l_moreCxtMap) {
		moreCxtMap = [:]
	}
	if (!l_message) {
		message = "No Message"
	}
	def event_name = getEventName(l_event_name)
	if (!config_loader.DISABLE_EVENTS || config_loader.DISABLE_EVENTS == false)
		sendEvent(event_name, Event_Status.STARTED, message, moreCxtMap)
}

/**
 * Send a completed event.
 * @return      
 */
def sendCompletedEvent(event_name, message = null, moreCxtMap = null) {
	def environment = g_environment
	sendCompletedEvent(event_name, message, moreCxtMap, environment)
}

/**
 * Send a completed event specific to an environment .
 * @param event_name
 * @param message
 * @param moreCxt - more contexual info if needed as a map (key, value pair)
 * @param message
 * @return      
 */
def sendCompletedEvent(l_event_name, l_message, l_moreCxtMap, l_environment) {
	def moreCxtMap = l_moreCxtMap
	def message = l_message
	if (!l_moreCxtMap) {
		moreCxtMap = [:]
	}
	if (!l_message) {
		message = "No Message"
	}

	def event_name = getEventName(l_event_name)
	if (!config_loader.DISABLE_EVENTS || config_loader.DISABLE_EVENTS == false)
		sendEvent(event_name, Event_Status.COMPLETED, message, moreCxtMap)
}

/**
 * Send a failure event.
 * @return      
 */
def sendFailureEvent(event_name, message = null, moreCxtMap = null) {
	def environment = g_environment
	sendFailureEvent(event_name, message, moreCxtMap, environment)
}

/**
 * Send a failure event specific to an environment .
 * @param event_name
 * @param message
 * @param moreCxt - more contexual info if needed as a map (key, value pair)
 * @param message
 * @return      
 */
def sendFailureEvent(l_event_name, l_message, l_moreCxtMap, l_environment) {
	def moreCxtMap = l_moreCxtMap
	def message = l_message
	if (!l_moreCxtMap) {
		moreCxtMap = [:]
	}
	if (!l_message) {
		message = "No Message"
	}

	def event_name = getEventName(l_event_name)
	if (!config_loader.DISABLE_EVENTS || config_loader.DISABLE_EVENTS == false)
		sendEvent(event_name, Event_Status.FAILED, message, moreCxtMap)
}

/**
* Get the the valid event.
* @param eventTxt
* @return      
*/
def getEventName(eventTxt) {
	def _validEvent
	_validEvent = Event_Names[eventTxt]

	if (_validEvent) {
		echo "$_validEvent"
		return _validEvent
	} else {
		error "EVENT NAME not defined- $eventTxt. Please update the EventsName table"
	}

}

/**
 * SendEvent method to record events.
 * @param  runtime
 * @return      
 */


def sendEvent(event_name, event_status, message, moreCxtMap){

	def context_json = []
	def event_json = []
	def moreCxt = moreCxtMap

	context_json = [
		'service_type': service_metadata['type'],
		'branch': g_branch,
		'runtime': service_metadata['runtime'],
		'domain': service_metadata['domain'],
		'iam_role': config_loader.AWS.ROLEID,
		'environment': g_environment,
		'region': config_loader.AWS.REGION,
		'message': message
	]
	context_json.putAll(moreCxt)

	event_json = [
		'request_id': g_request_id,
		'event_handler': "JENKINS",
		'event_name': event_name,
		'service_name': service_metadata['service'],
		'service_id': service_metadata['service_id'],
		'event_status': event_status,
		'event_type': g_event_type,
		'username': service_metadata['created_by'],
		'event_timestamp':sh(script: "date -u +'%Y-%m-%dT%H:%M:%S:%3N'", returnStdout: true).trim(),
		'service_context': context_json
	]

	def payload = JsonOutput.toJson(event_json)
	echo "$event_json"
	
	try {
		if (service_metadata['domain'] != "jazz") {
			def shcmd = sh(script: "curl --silent -X POST -k -v \
				-H \"Content-Type: application/json\" \
					$g_events_api \
				-d \'${payload}\'", returnStdout:true).trim()

			echo "------  Event send.........."
		}
	}
	catch (e) {
		echo "error occured when recording event: " + e.getMessage()
	}
}

/**
  * Jazz shebang that runs quietly and disable all console logs
  *
  */
def jazz_quiet_sh(cmd) {
    sh('#!/bin/sh -e\n' + cmd)
}

/**
 * Set Request Id
 * @return      
 */
def setRequestId(request_id) {
	g_request_id = request_id

}

/**
 * Set Branch Name
 * @return      
 */
def setBranch(branch) {
	g_branch = branch

}

/**
 * Set config_loader
 * @return      
 */
def setConfigLoader(configLoader) {
	config_loader = configLoader
}

/**
 * Set service_metadata
 * @return      
 */
def setServiceConfig(serviceConfig) {
	service_metadata = serviceConfig
}

/**
 * Set Environment
 * @return      
 */
def setEnvironment(environment) {
	g_environment = environment

}

/**
 * Set Event handler
 * @return      
 */
def setEventHandler(eventHandler) {
	g_event_handler = eventHandler

}

/**
 * Set Event Type
 * @return      
 */
def setEventType(eventType) {
	g_event_type = eventType

}


/**
 * Set Url
 * @return      
 */
def setUrl(url) {
	g_events_api = url

}


return this;
