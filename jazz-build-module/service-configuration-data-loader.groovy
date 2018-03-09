#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

echo "Service configuration module loaded successfully"

/**
 * The service metadata loader module. This module will load all service metadata from respective catalog tables and
 * get it ready for Jenkins builds. It loads data for all service types.
*/

@Field def service_config
@Field def role_arn
@Field def region
@Field def role_id
@Field def jenkins_url
@Field def current_environment
@Field def es_hostname
@Field def service_name

/**
 * Initialize the module
 */
def initialize(config, role_arn, region, role_id, jenkins_url, current_environment, service_name) {
	
	service_config = config
	setRoleARN(role_arn)
	setRegion(region)
	setRoleId(role_id)
	setJenkinsUrl(jenkins_url)
	setCurrentEnvironment(current_environment)
	setServiceName(service_name)
}

/**
 * Load the service metadata from Catalog
 *
 */
def loadServiceConfigurationData() {
	try {
		
		if (fileExists('swagger/swagger.json')){
			//Swagger SEDs
			echo "Updating the Swagger SEDs"
			sh "sed -i -- 's/{conf-role}/${role_arn}/g' ./swagger/swagger.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./swagger/swagger.json"
			sh "sed -i -- 's/{conf-accId}/${role_id}/g' ./swagger/swagger.json"
		 }

		if ((service_name.trim() == "delete-serverless-service") ) {
			sh "sed -i -- 's/{conf-jenkins-host}/${jenkins_url}/g' ./index.js"
		}
		
		if ( (service_name.trim() == "platform_events") ) {
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/prod-config.json"
		}
		
		if ( (service_name.trim() == "platform_events-handler") ) {
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/prod-config.json"
		}
		
		if ( (service_name.trim() == "platform-services-handler") ) {
			sh "sed -i -- 's/{conf-apikey}/${service_config.AWS.API.DEV_ID}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-apikey}/${service_config.AWS.API.STG_ID}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-apikey}/${service_config.AWS.API.PROD_ID}/g' ./config/prod-config.json"
			
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
			
			sh "sed -i -- 's/{conf-accId}/${role_id}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-accId}/${role_id}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-accId}/${role_id}/g' ./config/prod-config.json"
			
			sh "sed -i -- 's/{jazz_admin}/${service_config.JAZZ.ADMIN}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{jazz_admin}/${service_config.JAZZ.ADMIN}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{jazz_admin}/${service_config.JAZZ.ADMIN}/g' ./config/prod-config.json"
			
			sh "sed -i -- 's/{jazz_admin_creds}/${service_config.JAZZ.PASSWD}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{jazz_admin_creds}/${service_config.JAZZ.PASSWD}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{jazz_admin_creds}/${service_config.JAZZ.PASSWD}/g' ./config/prod-config.json"
			
		}
		
		if ( (service_name.trim() == "platform_login") || (service_name.trim() == "platform_logout") || (service_name.trim() == "cognito-authorizer")) {
			sh "sed -i -- 's/{conf-user-pool-id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-client-id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
		  
			sh "sed -i -- 's/{conf-user-pool-id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-client-id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
		  
			sh "sed -i -- 's/{conf-user-pool-id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-client-id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
		}
		
		if ( (service_name.trim() == "is-service-available")){
			sh "sed -i -- 's/{inst_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/prod-config.json"

			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
		}

		if ( (service_name.trim() == "create-serverless-service") ) {
			sh "sed -i -- 's/{conf-repo-base}/${service_config.REPOSITORY.BASE_URL}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-repo-base}/${service_config.REPOSITORY.BASE_URL}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-repo-base}/${service_config.REPOSITORY.BASE_URL}/g' ./config/prod-config.json"
		}
		
		if ( (service_name.trim() == "delete-serverless-service") || (service_name.trim() == "create-serverless-service") ) {
			sh "sed -i -- 's/{conf-jenkins-host}/${jenkins_url}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-jenkins-host}/${jenkins_url}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-jenkins-host}/${jenkins_url}/g' ./config/prod-config.json"

			sh "sed -i -- 's/{conf-user-pool-id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-client-id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
		  
			sh "sed -i -- 's/{conf-user-pool-id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-client-id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
		  
			sh "sed -i -- 's/{conf-user-pool-id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-client-id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
		}
		
		if (service_name.trim() == "platform_services") {
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
		}

		if (service_name.trim() == "platform_logs") {
			sh "sed -i -- 's/{env-prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{env-prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{env-prefix}/${service_config.INSTANCE_PREFIX}/g' ./config/prod-config.json"

			sh "sed -i -- 's/{inst_elastic_search_hostname}/${service_config.AWS.ES_HOSTNAME}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/${service_config.AWS.ES_HOSTNAME}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/${service_config.AWS.ES_HOSTNAME}/g' ./config/prod-config.json"
		}

		if (service_name.trim() == "cloud-logs-streamer") {
			sh "sed -i -- 's/{inst_elastic_search_hostname}/${service_config.AWS.ES_HOSTNAME}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/${service_config.AWS.ES_HOSTNAME}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/${service_config.AWS.ES_HOSTNAME}/g' ./config/prod-config.json"
		}

		if (service_name.trim() == "platform_usermanagement") {
			sh "sed -i -- 's/{user_pool_id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{user_pool_id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{user_pool_id}/${service_config.AWS.COGNITO.USER_POOL_ID}/g' ./config/prod-config.json"

			sh "sed -i -- 's/{user_client_id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{user_client_id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{user_client_id}/${service_config.AWS.COGNITO.CLIENT_ID}/g' ./config/prod-config.json"

			sh "sed -i -- 's/{region}/${region}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{region}/${region}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{region}/${region}/g' ./config/prod-config.json"

			sh "sed -i -- 's/{scm_type}/${service_config.SCM.TYPE}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{scm_type}/${service_config.SCM.TYPE}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{scm_type}/${service_config.SCM.TYPE}/g' ./config/prod-config.json"

			if (service_config.SCM.TYPE == "bitbucket") {
				sh "sed -i -- 's,{bb_service_host},http://${service_config.REPOSITORY.BASE_URL},g' ./config/dev-config.json"
				sh "sed -i -- 's,{bb_service_host},http://${service_config.REPOSITORY.BASE_URL},g' ./config/stg-config.json"
				sh "sed -i -- 's,{bb_service_host},http://${service_config.REPOSITORY.BASE_URL},g' ./config/prod-config.json"
			
				sh "sed -i -- 's/{bb_username}/${service_config.SCM.USERNAME}/g' ./config/dev-config.json"
				sh "sed -i -- 's/{bb_username}/${service_config.SCM.USERNAME}/g' ./config/stg-config.json"
				sh "sed -i -- 's/{bb_username}/${service_config.SCM.USERNAME}/g' ./config/prod-config.json"

				sh "sed -i -- 's/{bb_password}/${service_config.SCM.PASSWORD}/g' ./config/dev-config.json"
				sh "sed -i -- 's/{bb_password}/${service_config.SCM.PASSWORD}/g' ./config/stg-config.json"
				sh "sed -i -- 's/{bb_password}/${service_config.SCM.PASSWORD}/g' ./config/prod-config.json"
			}

			if (service_config.SCM.TYPE == "gitlab") {
				sh "sed -i -- 's,{gitlab_service_host},http://${service_config.REPOSITORY.BASE_URL},g' ./config/dev-config.json"
				sh "sed -i -- 's,{gitlab_service_host},http://${service_config.REPOSITORY.BASE_URL},g' ./config/stg-config.json"
				sh "sed -i -- 's,{gitlab_service_host},http://${service_config.REPOSITORY.BASE_URL},g' ./config/prod-config.json"
			
				sh "sed -i -- 's/{gitlab_private_token}/${service_config.SCM.PRIVATE_TOKEN}/g' ./config/dev-config.json"
				sh "sed -i -- 's/{gitlab_private_token}/${service_config.SCM.PRIVATE_TOKEN}/g' ./config/stg-config.json"
				sh "sed -i -- 's/{gitlab_private_token}/${service_config.SCM.PRIVATE_TOKEN}/g' ./config/prod-config.json"
			}	
		}

		if (service_name.trim() == "platform_email") {
			echo "Updating parameter specific to platform email"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
		}
	}
	catch(e){
		echo "error occured while loading service configuration: " + e.getMessage()
		error "error occured while loading service configuration: " + e.getMessage()
	}
}

def setRoleARN(roleArn){
	role_arn = roleArn
}
def setRegion(rgn){
	region = rgn
}
def setRoleId(roleId){
	role_id = roleId
}
def setJenkinsUrl(jenkinsUrl){
	jenkins_url = jenkinsUrl
}
def setCurrentEnvironment(currentEnvironment){
	current_environment = currentEnvironment
}
def setServiceName(serviceName){
	service_name = serviceName
}

def setKinesisStream(config){
	if ( (config['service'].trim() == "services-handler") || (config['service'].trim() == "events-handler") ) {
		def function_name =  "${service_config.INSTANCE_PREFIX}-${config['domain']}-${config['service']}-${current_environment}"
		def event_source_list = sh (
			script: "aws lambda list-event-source-mappings --query \"EventSourceMappings[?contains(FunctionArn, '$function_name')]\" --region \"$region\"" ,
			returnStdout: true
		).trim()
		echo "$event_source_list"
		if (event_source_list == "[]"){
			sh "aws lambda  create-event-source-mapping --event-source-arn arn:aws:kinesis:$region:$role_id:stream/${service_config.INSTANCE_PREFIX}-events-hub-" + current_environment + " --function-name arn:aws:lambda:$region:$role_id:function:$function_name --starting-position LATEST --region " + region
		}
	}
}
def setLogStreamPermission(config){
	if (config['service'] == "cloud-logs-streamer") {
		def function_name =  "${service_config.INSTANCE_PREFIX}-${config['domain']}-${config['service']}-${current_environment}"
		echo "set permission for cloud-logs-streamer"
		try {
			def rd = sh(script: "openssl rand -hex 4", returnStdout:true).trim()
			sh "aws lambda add-permission --function-name arn:aws:lambda:${region}:${role_id}:function:${function_name} --statement-id lambdaFxnPermission${rd} --action lambda:* --principal logs.${region}.amazonaws.com --region ${region}"
			echo "set permission for cloud-logs-streamer - success"
		}catch(ss) {
			//ignore if already registered permissions
			echo(ss)
			echo "set permission for cloud-logs-streamer - ok np"
		}
	}	
}
@NonCPS
def parseJson(jsonString) {
    def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
    def m = [:]
    m.putAll(lazyMap)
    return m
}
def loadServiceMetadata(service_id,configLoader){
	
	withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID',
		credentialsId: configLoader.AWS_CREDENTIAL_ID, secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
			
		def table_name = "${configLoader.INSTANCE_PREFIX}_services_prod"
		def service_Object = sh (
				script: "aws --region ${configLoader.AWS.REGION} dynamodb get-item --table-name $table_name --key '{\"SERVICE_ID\": {\"S\":\"$service_id\"}}' --output json" ,
				returnStdout: true
			).trim()
		
		
		if(service_Object){
			def service_data = parseJson(service_Object)
			def data = service_data.Item.SERVICE_METADATA.M
			def metadata = [:]
			
			for(item in data){
				metadata[item.key] = item.value.S				
			}
			metadata['service_id'] = service_data.Item.SERVICE_ID.S
			metadata['service'] = service_data.Item.SERVICE_NAME.S
			metadata['domain'] = service_data.Item.SERVICE_DOMAIN.S
			metadata['owner'] = service_data.Item.SERVICE_CREATED_BY.S
			metadata['created_by'] = service_data.Item.SERVICE_CREATED_BY.S
			metadata['type'] = service_data.Item.SERVICE_TYPE.S
			metadata['region'] = configLoader.AWS.REGION
			if(service_data.Item.SERVICE_ENDPOINTS)			
				metadata['endpoints'] = service_data.Item.SERVICE_ENDPOINTS.M
			
			
			return metadata
		}
	}
}
return this