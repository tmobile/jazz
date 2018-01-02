#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
@Field def Util
echo "Service metadata module loaded successfully"

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

/**
 * Initialize the module
 */
def initialize(role_arn, region, role_id, jenkins_url, api_id_dev, api_id_stg, api_id_prod, current_environment,user_pool_id,
				env_name_prefix, client_id, repo_base, es_hostname, bitbucket_base, bitbucket_username, bitbucket_password) {
	
	setRoleARN(role_arn)
	setDomain(region)
	setService(role_id)
	setUrl(jenkins_url)
	setDevS3(api_id_dev)
	setStgS3(stg)
	setPrdS3(prd)
}

/**
 * Load the service metadata from Catalog
 *
 */
def loadServiceMetaData() {
	try {
		if (fileExists('swagger/swagger.json')){
			//Swagger SEDs
			echo "Updating the Swagger SEDs"
			sh "sed -i -- 's/{conf-role}/" + roleARN + "/g' ./swagger/swagger.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./swagger/swagger.json"
			sh "sed -i -- 's/{conf-accId}/" + roleId + "/g' ./swagger/swagger.json"
		 }

		echo "Updating the index.js for create and delete services"
		
		// @TODO : These conditional statements could be removed and needs to be refactored
		if ((service_template.trim() == "delete-serverless-service") ) {
			sh "sed -i -- 's/{conf-jenkins-host}/" + jenkinsURL + "/g' ./index.js"
		}
		
		if ( (service_template.trim() == "platform_events") ) {
			sh "sed -i -- 's/{conf_stack_prefix}/" + env.env_name_prefix + "/g' ./components/dev-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/" + env.env_name_prefix + "/g' ./components/stg-config.json"
			sh "sed -i -- 's/{conf_stack_prefix}/" + env.env_name_prefix + "/g' ./components/prod-config.json"
		}
		
		if ( (service_template.trim() == "platform-services-handler") ) {
			sh "sed -i -- 's/{conf-apikey}/" + env.API_ID_DEV + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-apikey}/" + env.API_ID_STG + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-apikey}/" + env.API_ID_PROD + "/g' ./config/prod-config.json"
			
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
			
			sh "sed -i -- 's/{conf-accId}/" + roleId + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-accId}/" + roleId + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-accId}/" + roleId + "/g' ./config/prod-config.json"
			
		}
		
		// @TODO : These conditional statements could be removed and needs to be refactored
		if ( (service_template.trim() == "platform_login") || (service_template.trim() == "platform_logout") || (service_template.trim() == "cognito-authorizer")) {
			echo "Updating configs for " + envmnt + " login and logout"
			sh "sed -i -- 's/{conf-user-pool-id}/" + env.USER_POOL_ID + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + env.CLIENT_ID + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
		  
			echo "Updating configs for stg"
			sh "sed -i -- 's/{conf-user-pool-id}/" + env.USER_POOL_ID + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + env.CLIENT_ID + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
		  
			echo "Updating configs for prod"
			sh "sed -i -- 's/{conf-user-pool-id}/" + env.USER_POOL_ID + "/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + env.CLIENT_ID + "/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}
		
		if ( (service_template.trim() == "is-service-available"))   
		{
			sh "sed -i -- 's/{inst_stack_prefix}/" + env.env_name_prefix + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_stack_prefix}/" + env.env_name_prefix + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_stack_prefix}/" + env.env_name_prefix + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}

		// @TODO : These conditional statements could be removed and needs to refactored
		if ( (service_template.trim() == "create-serverless-service") ) {
			echo "Updating configs for repo base"
			
			sh "sed -i -- 's/{conf-repo-base}/" + env.REPO_BASE + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-repo-base}/" + env.REPO_BASE + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-repo-base}/" + env.REPO_BASE + "/g' ./config/prod-config.json"
		}
		
		// @TODO : These conditional statements could be removed and needs to refactored
		if ( (service_template.trim() == "delete-serverless-service") || (service_template.trim() == "create-serverless-service") ) {
			echo "Updating configs for jenkins host"
			sh "sed -i -- 's/{conf-jenkins-host}/" + jenkinsURL + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-jenkins-host}/" + jenkinsURL + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-jenkins-host}/" + jenkinsURL + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{conf-user-pool-id}/" + env.USER_POOL_ID + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + env.CLIENT_ID + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
		  
			echo "Updating configs for stg"
			sh "sed -i -- 's/{conf-user-pool-id}/" + env.USER_POOL_ID + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + env.CLIENT_ID + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
		  
			echo "Updating configs for prod"
			sh "sed -i -- 's/{conf-user-pool-id}/" + env.USER_POOL_ID + "/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-client-id}/" + env.CLIENT_ID + "/g' ./config/prod-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}
		
		// @TODO : These conditional statements could be removed and needs to refactored
		if (service_template.trim() == "platform_services") {
			echo "Updating parameter specific to platform-services"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{conf-region}/" + region + "/g' ./config/prod-config.json"
		}

		if (service_template.trim() == "platform_logs") {
			echo "Updating parameter specific to platform_logs"
			sh "sed -i -- 's/{env-prefix}/" + env.env_name_prefix + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{env-prefix}/" + env.env_name_prefix + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{env-prefix}/" + env.env_name_prefix + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/prod-config.json"
		}

		if (service_template.trim() == "cloud-logs-streamer") {
			echo "Updating parameter specific to cloud-logs-streamer"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{inst_elastic_search_hostname}/" + es_hostname + "/g' ./config/prod-config.json"
		}

		if (service_template.trim() == "platform_usermanagement") {
			echo "Updating parameter specific to platform_usermanagement"

			sh "sed -i -- 's/{user_pool_id}/" + env.USER_POOL_ID + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{user_pool_id}/" + env.USER_POOL_ID + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{user_pool_id}/" + env.USER_POOL_ID + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{user_client_id}/" + env.CLIENT_ID + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{user_client_id}/" + env.CLIENT_ID + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{user_client_id}/" + env.CLIENT_ID + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{region}/" + region + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{region}/" + region + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{region}/" + region + "/g' ./config/prod-config.json"

			sh "sed -i -- 's,{bb_service_host}," + "http://" + var_bitbucket_base + ",g' ./config/dev-config.json"
			sh "sed -i -- 's,{bb_service_host}," + "http://" + var_bitbucket_base + ",g' ./config/stg-config.json"
			sh "sed -i -- 's,{bb_service_host}," + "http://" + var_bitbucket_base + ",g' ./config/prod-config.json"
		
			sh "sed -i -- 's/{bb_username}/" + env.BITBUCKET_USERNAME + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{bb_username}/" + env.BITBUCKET_USERNAME + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{bb_username}/" + env.BITBUCKET_USERNAME + "/g' ./config/prod-config.json"

			sh "sed -i -- 's/{bb_password}/" + env.BITBUCKET_PASSWORD + "/g' ./config/dev-config.json"
			sh "sed -i -- 's/{bb_password}/" + env.BITBUCKET_PASSWORD + "/g' ./config/stg-config.json"
			sh "sed -i -- 's/{bb_password}/" + env.BITBUCKET_PASSWORD + "/g' ./config/prod-config.json"
		}

		if (service_template.trim() == "platform_email") {
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

/**
 * Set Service Type
 * @return
 */
def setServiceType(serviceType) {
	g_service_type = serviceType
}

/**
 * Set Domain
 * @return
 */
def setDomain(domain) {
	g_service_domain = domain
}

/**
 * Set Service
 * @return
 */
def setService(service) {
	g_service_name = service
}

/**
 * Set URL
 * @return
 */
def setUrl(url) {
	util_url = url
}

/**
 * Set dev s3 location
 * @return
 */
def setDevS3(dev) {
	g_dev_s3_bucket = dev
}

/**
 * Set stg s3 location
 * @return
 */
def setStgS3(stg) {
	g_stg_s3_bucket = stg
}

/**
 * Set prod s3 location
 * @return
 */
def setPrdS3(prd) {
	g_prd_s3_bucket = prd
}

/**
 * Set Service
 * @return
 */
def setAuthToken(token) {
	g_login_token = token
}

/**
 * Set utility module
 * @return
 */
def setUtil(utilModule) {
	Util = utilModule
	Util.setUrl(util_url)
}

return this
