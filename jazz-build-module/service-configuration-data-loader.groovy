#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

echo "Service configuration module loaded successfully"

/**
 * The service metadata loader module. This module will load all service metadata from respective catalog tables and
 * get it ready for Jenkins builds. It loads data for all service types.
*/

@Field def role_arn
@Field def region
@Field def role_id
@Field def jenkins_url
@Field def api_id_dev
@Field def api_id_stg
@Field def api_id_prod
@Field def current_environment
@Field def user_pool_id
@Field def env_name_prefix
@Field def client_id
@Field def repo_base
@Field def es_hostname
@Field def bitbucket_base
@Field def bitbucket_username
@Field def bitbucket_password
@Field def service_name

/**
 * Initialize the module
 */
def initialize(role_arn, region, role_id, jenkins_url, api_id_dev, api_id_stg, api_id_prod, current_environment,user_pool_id,
				env_name_prefix, client_id, repo_base, es_hostname, bitbucket_base, bitbucket_username, bitbucket_password,service_name) {
	
	setRoleARN(role_arn)
	setRegion(region)
	setRoleId(role_id)
	setJenkinsUrl(jenkins_url)
	setApiIdDev(api_id_dev)
	setApiIdStg(api_id_stg)
	setApiIdProd(api_id_prod)
	setCurrentEnvironment(current_environment)
	setUserPoolId(user_pool_id)
	setEnvNamePrefix(env_name_prefix)
	setClientId(client_id)
	setRepoBase(repo_base)
	setEsHostName(es_hostname)
	setBitbucketBase(bitbucket_base)
	setBitbucketUserName(bitbucket_username)
	setBitbucketPassword(bitbucket_password)	
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
			sh "sed -i -- 's/{conf-role}/" + roleARN + "/g' ./swagger/swagger.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./swagger/swagger.json"
			sh "sed -i -- 's/{conf-accId}/" + role_id + "/g' ./swagger/swagger.json"
		 }

		echo "Updating the index.js for create and delete services"
		
		// @TODO : These conditional statements could be removed and needs to be refactored
		if ((service_name.trim() == "delete-serverless-service") ) {
			sh "sed -i -- 's/{conf-jenkins-host}/" + jenkins_url + "/g' ./index.js"
		}
		
		if ( (service_name.trim() == "platform_events") ) {
			sh "sed -i -- 's/{conf_stack_prefix}/" + env_name_prefix + "/g' ./components/dev-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/" + env_name_prefix + "/g' ./components/stg-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/" + env_name_prefix + "/g' ./components/prod-config.json"
		}
		
		if ( (service_name.trim() == "platform-services-handler") ) {
			sh "sed -i -- 's/{conf-apikey}/" + api_id_dev + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-apikey}/" + api_id_stg + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-apikey}/" + api_id_prod + "/g' ./config/prod-config.json"
			
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
			
			sh "sed -i -- 's/{conf-accId}/" + role_id + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-accId}/" + role_id + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-accId}/" + role_id + "/g' ./config/prod-config.json"
			
		}
		
		// @TODO : These conditional statements could be removed and needs to be refactored
		if ( (service_name.trim() == "platform_login") || (service_name.trim() == "platform_logout") || (service_name.trim() == "cognito-authorizer")) {
			echo "Updating configs for " + current_environment + " login and logout"
			sh "sed -i -- 's/{conf-user-pool-id}/" + user_pool_id + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + client_id + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
		  
			echo "Updating configs for stg"
			sh "sed -i -- 's/{conf-user-pool-id}/" + user_pool_id + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + client_id + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
		  
			echo "Updating configs for prod"
			sh "sed -i -- 's/{conf-user-pool-id}/" + user_pool_id + "/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + client_id + "/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}
		
		if ( (service_name.trim() == "is-service-available"))   
		{
			sh "sed -i -- 's/{inst_stack_prefix}/" + env_name_prefix + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_stack_prefix}/" + env_name_prefix + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_stack_prefix}/" + env_name_prefix + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}

		// @TODO : These conditional statements could be removed and needs to refactored
		if ( (service_name.trim() == "create-serverless-service") ) {
			echo "Updating configs for repo base"
			
			sh "sed -i -- 's/{conf-repo-base}/" + repo_base + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-repo-base}/" + repo_base + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-repo-base}/" + repo_base + "/g' ./config/prod-config.json"
		}
		
		// @TODO : These conditional statements could be removed and needs to refactored
		if ( (service_name.trim() == "delete-serverless-service") || (service_name.trim() == "create-serverless-service") ) {
			echo "Updating configs for jenkins host"
			sh "sed -i -- 's/{conf-jenkins-host}/" + jenkins_url + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-jenkins-host}/" + jenkins_url + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-jenkins-host}/" + jenkins_url + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{conf-user-pool-id}/" + user_pool_id + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + client_id + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
		  
			echo "Updating configs for stg"
			sh "sed -i -- 's/{conf-user-pool-id}/" + user_pool_id + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + client_id + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
		  
			echo "Updating configs for prod"
			sh "sed -i -- 's/{conf-user-pool-id}/" + user_pool_id + "/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + client_id + "/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}
		
		// @TODO : These conditional statements could be removed and needs to refactored
		if (service_name.trim() == "platform_services") {
			echo "Updating parameter specific to platform-services"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}

		if (service_name.trim() == "platform_logs") {
			echo "Updating parameter specific to platform_logs"
			sh "sed -i -- 's/{env-prefix}/" + env_name_prefix + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{env-prefix}/" + env_name_prefix + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{env-prefix}/" + env_name_prefix + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/prod-config.json"
		}

		if (service_name.trim() == "cloud-logs-streamer") {
			echo "Updating parameter specific to cloud-logs-streamer"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/prod-config.json"
		}

		if (service_name.trim() == "platform_usermanagement") {
			echo "Updating parameter specific to platform_usermanagement"

			sh "sed -i -- 's/{user_pool_id}/" + user_pool_id + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{user_pool_id}/" + user_pool_id + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{user_pool_id}/" + user_pool_id + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{user_client_id}/" + client_id + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{user_client_id}/" + client_id + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{user_client_id}/" + client_id + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{region}/" + region + "/g' ./config/prod-config.json"

			sh "sed -i -- 's,{bb_service_host}," + "http://" + bitbucket_base + ",g' ./config/dev-config.json"
			sh "sed -i -- 's,{bb_service_host}," + "http://" + bitbucket_base + ",g' ./config/stg-config.json"
			sh "sed -i -- 's,{bb_service_host}," + "http://" + bitbucket_base + ",g' ./config/prod-config.json"
		
			sh "sed -i -- 's/{bb_username}/" + bitbucket_username + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{bb_username}/" + bitbucket_username + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{bb_username}/" + bitbucket_username + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{bb_password}/" + bitbucket_password + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{bb_password}/" + bitbucket_password + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{bb_password}/" + bitbucket_password + "/g' ./config/prod-config.json"
		}

		if (service_name.trim() == "platform_email") {
			echo "Updating parameter specific to platform email"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}
	}
	catch(e){
		echo "error occured while fetching service metadata: " + e.getMessage()
		error "error occured while fetching service metadata: " + e.getMessage()
	}
}

def setRoleARN(roleArn){
	role_arn = roleArn
}
def setRegion(rgn){
	region = rgn
}
def setRoleId(role_id){
	role_id = role_id
}
def setJenkinsUrl(jenkinsUrl){
	jenkins_url = jenkinsUrl
}
def setApiIdDev(apiIdDev){
	api_id_dev = apiIdDev
}
def setApiIdStg(apiIdStg){
	api_id_stg = apiIdStg
}
def setApiIdProd(apiIdProd){
	api_id_prod = apiIdProd
}
def setCurrentEnvironment(currentEnvironment){
	current_environment = currentEnvironment
}
def setUserPoolId(userPoolId){
	user_pool_id = userPoolId
}
def setEnvNamePrefix(envNamePrefix){
	role_arn = envNamePrefix
}
def setClientId(clientId){
	env_name_prefix = clientId
}
def setRepoBase(repoBase){
	repo_base = repoBase
}
def setEsHostName(esHostname){
	es_hostname = esHostname
}
def setBitbucketBase(bitbucketBase){
	bitbucket_base = bitbucketBase
}
def setBitbucketUserName(bitbucketUsername){
	bitbucket_username = bitbucketUsername
}
def setBitbucketPassword(bitbucketPassword){
	bitbucket_password = bitbucketPassword
}
def setServiceName(serviceName){
	service_name = serviceName
}


return this
