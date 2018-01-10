#!groovy?
import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import groovy.transform.Field
echo "Events module loaded successfully"

/**
 * The Events module for jenkins packs
 * @author: 
 * @date: 
*/

@Field def g_request_id = ""
@Field def g_service = ""
@Field def g_branch = ""
@Field def g_runtime = ""
@Field def g_environment = ""
@Field def g_region = ""
@Field def g_domain = ""
@Field def g_role = ""
@Field def g_service_type = ""
@Field def g_event_handler = ""
@Field def g_event_type = ""

/**
 * These are the list of available event_names. Any new event names added here should be added to the events table in dynamoDB as well. 
 */
/**@Field def Event_Name =[
	'GENERATE_API_DOC':'GENERATE_API_DOC', 
	'DELETE_API_DOC':'DELETE_API_DOC', 
	'UPLOAD_API_SPEC':'UPLOAD_API_SPEC', 
	'DISABLE_API_CACHE':'DISABLE_API_CACHE', 
	'UPDATE_SWAGGER':'UPDATE_SWAGGER', 
	'DEPLOY_SWAGGER_TO_APIGATEWAY':'DEPLOY_SWAGGER_TO_APIGATEWAY', 
	'UPDATE_DEPLOYMENT_CONF':'UPDATE_DEPLOYMENT_CONF', 
	'UPDATE_LOGGING_CONF':'UPDATE_LOGGING_CONF', 
	'GET_DEPLOYMENT_CONF':'GET_DEPLOYMENT_CONF', 
	'GET_SERVERLESS_CONF':'GET_SERVERLESS_CONF', 
	'GET_SERVICE_CODE':'GET_SERVICE_CODE', 
	'MODIFY_TEMPLATE':'MODIFY_TEMPLATE',
	'CALL_ONBOARDING_WORKFLOW':'CALL_ONBOARDING_WORKFLOW',
	'RAISE_PR':'RAISE_PR',
	'VALIDATE_PRE_BUILD_CONF':'VALIDATE_PRE_BUILD_CONF',
	'CALL_ONBOARDING_SERVICE':'CALL_ONBOARDING_SERVICE',
	'ADD_WRITE_PERMISSIONS_TO_SERVICE_REPO':'ADD_WRITE_PERMISSIONS_TO_SERVICE_REPO',
	'CREATE_SERVICE':'CREATE_SERVICE',
	'BUILD':'BUILD',
	'CODE_QUALITY_CHECK':'CODE_QUALITY_CHECK',
	'UNIT_TEST':'UNIT_TEST',
	'COMMIT_CODE':'COMMIT_CODE',
	'APPROVE_PR':'APPROVE_PR',
	'CREATE_SERVICE_REPO':'CREATE_SERVICE_REPO',
	'LOCK_MASTER_BRANCH':'LOCK_MASTER_BRANCH',
	'DEPLOY_TO_AWS':'DEPLOY_TO_AWS',
	'UNDEPLOY_LAMBDA':'UNDEPLOY_LAMBDA',
	'UNDEPLOY_WEBSITE':'UNDEPLOY_WEBSITE',
	'PUSH_TEMPLATE_TO_SERVICE_REPO':'PUSH_TEMPLATE_TO_SERVICE_REPO',
	'CLONE_TEMPLATE':'CLONE_TEMPLATE',
	'CREATE_ASSET':'CREATE_ASSET',
	'UPDATE_ASSET':'UPDATE_ASSET',
	'DELETE_API_RESOURCE':'DELETE_API_RESOURCE',
	'DELETE_CLOUDFRONT':'DELETE_CLOUDFRONT',
	'DISABLE_CLOUDFRONT':'DISABLE_CLOUDFRONT',
	'DELETE_S3BUCKET_POLICY':'DELETE_S3BUCKET_POLICY',
	'BACKUP_PROJECT':'BACKUP_PROJECT',
	'DELETE_PROJECT':'DELETE_PROJECT',
	'ENABLE_AD_AUTHORIZATION':'ENABLE_AD_AUTHORIZATION',
	'CREATE_DEPLOYMENT': 'CREATE_DEPLOYMENT',
	'UPDATE_DEPLOYMENT': 'UPDATE_DEPLOYMENT',
	'UPDATE_ENVIRONMENT': 'UPDATE_ENVIRONMENT',
	'DELETE_DEPLOYMENT':'DELETE_DEPLOYMENT'

]*/

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
    'ADD_WEBHOOK':'ADD_WEBHOOK'
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
	if(!l_moreCxtMap) {
		moreCxtMap = [:]
	}
	if(!l_message) {
		message = "No Message"
	}
	def service_name = g_service
	def request_id = g_request_id
	def branch = g_branch
	def runtime = g_runtime
	def environment = l_environment
	def region = g_region
	def domain = g_domain
	def iam_role = g_role
	def service_type = g_service_type
	def event_handler = g_event_handler
	def event_type = g_event_type
	def event_name = getEventName(l_event_name)
	sendEvent(request_id, event_type, event_handler, service_type, service_name, branch, runtime, environment, region, domain, iam_role, event_name, Event_Status.STARTED, message, moreCxtMap)
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
	if(!l_moreCxtMap) {
		moreCxtMap = [:]
	}
	if(!l_message) {
		message = "No Message"
	}	
	def service_name = g_service
	def request_id = g_request_id
	def branch = g_branch
	def runtime = g_runtime
	def environment = l_environment
	def region = g_region
	def domain = g_domain
	def iam_role = g_role
	def service_type = g_service_type
	def event_handler = g_event_handler
	def event_type = g_event_type
	def event_name = getEventName(l_event_name)
	sendEvent(request_id, event_type, event_handler, service_type, service_name, branch, runtime, environment, region, domain, iam_role, event_name, Event_Status.COMPLETED, message, moreCxtMap)
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
	if(!l_moreCxtMap) {
		moreCxtMap = [:]
	}
	if(!l_message) {
		message = "No Message"
	}	
	def service_name = g_service
	def request_id = g_request_id
	def branch = g_branch
	def runtime = g_runtime
	def environment = l_environment
	def region = g_region
	def domain = g_domain
	def iam_role = g_role
	def service_type = g_service_type
	def event_handler = g_event_handler
	def event_type = g_event_type
	def event_name = getEventName(l_event_name)	
	sendEvent(request_id, event_type, event_handler, service_type, service_name, branch, runtime, environment, region, domain, iam_role, event_name, Event_Status.FAILED, message, moreCxtMap)
}

/**
* Get the the valid event.
* @param eventTxt
* @return      
*/
def getEventName(eventTxt) {
	def _validEvent
	_validEvent = Event_Names[eventTxt]
	
	if(_validEvent) {
		echo "$_validEvent"
		return _validEvent
	} else {
		error "EVENT NAME not defined. Please update the EventsName table"
	}
	
} 

/**
 * SendEvent method to record events.
 * @param  runtime
 * @return      
 */
def sendEvent(request_id, event_type, event_handler, service_type, service_name, branch, runtime, environment, region, domain, iam_role, event_name, event_status, message, moreCxtMap){

	def context_json = []
	def event_json = []
	def moreCxt = moreCxtMap
	
	context_json =[
			'service_type': service_type,
			'branch': branch,
			'runtime': runtime,
			'domain': domain,
			'iam_role': iam_role,
			'environment': environment,
			'region': region,
			'message': message
		]
	context_json.putAll(moreCxt)
		
	event_json = [
	  'request_id': request_id,
	  'event_handler': event_handler,
	  'event_name': event_name,
	  'service_name': service_name,
	  'event_status': event_status,
	  'event_type': event_type,
	  'username': iam_role,
	  'event_timestamp':sh( script: "date -u +'%Y-%m-%dT%H:%M:%S:%3N'",  returnStdout: true ).trim(),
	  'service_context': context_json
	]

	event_json.service_context = context_json
	//echo JsonOutput.toJson(event_json)
	def payload = JsonOutput.toJson(event_json)
	
	
	try{
		/**def shcmd = "curl -X POST  -k -s\
			-H \"Content-Type: application/json\" \
			https://cloud-api.corporate.t-mobile.com/api/platform/events \
			-d \'${payload}\' >/dev/null"
		jazz_quiet_sh(shcmd)*/
      
      echo "Pai------  Event send.........."
      echo "$event_json"
	}
	catch(e){
		echo "error occured when recording event: " + e.getMessage() //@TODO: Do nothing now
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
 * Set Service Name
 * @return      
 */
def setServiceName(serviceName) {
	g_service = serviceName
	
}

/**
 * Set Branch Name
 * @return      
 */
def setBranch(branch) {
	g_branch = branch
	
}

/**
 * Set Runtime
 * @return      
 */
def setRuntime(runtime) {
	g_runtime = runtime
	
}

/**
 * Set Environment
 * @return      
 */
def setEnvironment(environment) {
	g_environment = environment
	
}

/**
 * Set Region
 * @return      
 */
def setRegion(region) {
	g_region = region
	
}

/**
 * Set Domain
 * @return      
 */
def setDomain(domain) {
	g_domain = domain
	
}

/**
 * Set Role
 * @return      
 */
def setRole(role) {
	g_role = role
	
}

/**
 * Set Service Type
 * @return      
 */
def setServiceType(serviceType) {
	g_service_type = serviceType
	
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

return this;