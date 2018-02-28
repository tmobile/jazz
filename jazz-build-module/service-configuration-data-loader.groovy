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
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./components/dev-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./components/stg-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/${service_config.INSTANCE_PREFIX}/g' ./components/prod-config.json"
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

return this
