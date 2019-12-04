#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

echo "Service configuration module loaded successfully"

/**
 * The service metadata loader module. This module will load all service metadata from respective catalog tables and
 * get it ready for Jenkins builds. It loads data for all service types.
*/

@Field def config_loader
@Field def role_arn
@Field def region
@Field def accountId
@Field def jenkins_url
@Field def current_environment
@Field def service_name
@Field def utilModule
@Field def awsAPIGatewayModule

/**
 * Initialize the module
 */
def initialize(configLoader, role_arn, region, accountId, jenkins_url, current_environment, service_name, utilModule, awsAPIGatewayModule) {
    config_loader = configLoader
    setRoleARN(role_arn)
    setRegion(region)
    setAccountId(accountId)
    setJenkinsUrl(jenkins_url)
    setCurrentEnvironment(current_environment)
    setServiceName(service_name)
    setUtilModule(utilModule)
    setAWSAPIGatewayModule(awsAPIGatewayModule)
}

/**
 * Load the service metadata from Catalog
 *
 */
def loadServiceConfigurationData() {
  try {

    if (fileExists('swagger/swagger.json')) {
      //Swagger SEDs
      echo "Updating the Swagger SEDs"
      sh "sed -i -- 's/{conf-region}/${region}/g' ./swagger/swagger.json"
      sh "sed -i -- 's/{conf-accId}/${accountId}/g' ./swagger/swagger.json"
    }

    if ((config_loader.SLACK.ENABLE_SLACK == "true") && (service_name.trim() == "jazz_is-slack-channel-available")) {
      updateConfigValue("{slack_channel_token}", config_loader.SLACK.SLACK_TOKEN);
    }

    if (service_name.trim() == "jazz_acl") {
      withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.ACL.DATABASE.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
        updateConfigValue("{casbin_user}", UNAME)
        updateConfigValue("{casbin_password}", PWD)
      }

      updateConfigValue("{casbin_host}", config_loader.ACL.DATABASE.ENDPOINT)
      updateConfigValue("{casbin_port}", config_loader.ACL.DATABASE.PORT)
      updateConfigValue("{casbin_database}", config_loader.ACL.DATABASE.NAME)
      updateConfigValue("{casbin_type}", config_loader.ACL.DATABASE.TYPE_DB)
      updateConfigValue("{casbin_timeout}", config_loader.ACL.DATABASE.TIMEOUT)
      updateConfigValue("{inst_stack_prefix}", config_loader.INSTANCE_PREFIX)
      updateConfigValue("{conf-region}", region)

      sh "sed -i -- 's/{scm_type}/${config_loader.SCM.TYPE}/g' ./config/global-config.json"
      sh "sed -i -- 's,{scm_base_url},http://${config_loader.REPOSITORY.BASE_URL},g' ./config/global-config.json"

      if (config_loader.SCM.TYPE == "bitbucket") {
        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
          sh "sed -i -- 's/{bb_username}/${UNAME}/g' ./config/global-config.json"
          sh "sed -i -- 's/{bb_password}/${PWD}/g' ./config/global-config.json"
        }
      }

      if (config_loader.SCM.TYPE == "gitlab") {
        sh "sed -i -- 's/{private_token}/${config_loader.SCM.PRIVATE_TOKEN}/g' ./config/global-config.json"
      }
    }

    if (service_name.trim() == "jazz_metrics") {
      updateConfigValue("{conf-region}", region)
      updateCoreAPI()
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)

      sh "sed -i -- 's/{cf-region}/us-east-1/g' ./config/global-config.json"  // CloudFront Metrics are in us-east-1
      sh "sed -i -- 's/{conf-apikey-dev}/${getApigatewayInfoCore('jazz','DEV')}/g' ./config/global-config.json"
      sh "sed -i -- 's/{conf-apikey-stg}/${getApigatewayInfoCore('jazz','STG')}/g' ./config/global-config.json"
      sh "sed -i -- 's/{conf-apikey-prod}/${getApigatewayInfoCore('jazz','PROD')}/g' ./config/global-config.json"
      sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/global-config.json"

      if (configLoader.APIGEE && configLoader.APIGEE.ENABLE_APIGEE instanceof Boolean && configLoader.APIGEE.ENABLE_APIGEE) {
        sh "sed -i -- 's|{apigee_mgmt_host}|${config_loader.APIGEE.API_ENDPOINTS.DEV.MGMT_HOST}|g' ./config/dev-config.json"
        sh "sed -i -- 's|{apigee_mgmt_host}|${config_loader.APIGEE.API_ENDPOINTS.PROD.MGMT_HOST}|g' ./config/prod-config.json"

        sh "sed -i -- 's/{apigee_mgmt_org}/${config_loader.APIGEE.API_ENDPOINTS.DEV.MGMT_ORG}/g' ./config/dev-config.json"
        sh "sed -i -- 's/{apigee_mgmt_org}/${config_loader.APIGEE.API_ENDPOINTS.PROD.MGMT_ORG}/g' ./config/prod-config.json"

        sh "sed -i -- 's/{apigee_mgmt_env}/${config_loader.APIGEE.API_ENDPOINTS.DEV.MGMT_ENV}/g' ./config/dev-config.json"
        sh "sed -i -- 's/{apigee_mgmt_env}/${config_loader.APIGEE.API_ENDPOINTS.PROD.MGMT_ENV}/g' ./config/prod-config.json"

        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.APIGEE.APIGEE_CRED_ID, passwordVariable: 'PASS', usernameVariable: 'USER']]){
          updateConfigValue("{apigee_user}", USER)
          updateConfigValue("{apigee_password}", PASS)
        }
      }

      if (config_loader.AZURE && config_loader.AZURE.IS_ENABLED instanceof Boolean && config_loader.AZURE.IS_ENABLED) {
        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_SUBSCRIPTIONID', passwordVariable: 'PASS', usernameVariable: 'USER']]){
          sh """
             sed -i -- 's/{azure_subscriptionid}/${PASS}/g' ./config/dev-config.json
             sed -i -- 's/{azure_subscriptionid}/${PASS}/g' ./config/stg-config.json
             sed -i -- 's/{azure_subscriptionid}/${PASS}/g' ./config/prod-config.json
          """
        }

        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_CLIENTID', passwordVariable: 'PASS', usernameVariable: 'USER']]){
          sh """
             sed -i -- 's/{azure_clientid}/${PASS}/g' ./config/dev-config.json
             sed -i -- 's/{azure_clientid}/${PASS}/g' ./config/stg-config.json
             sed -i -- 's/{azure_clientid}/${PASS}/g' ./config/prod-config.json
          """
        }

        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_PASSWORD', passwordVariable: 'PASS', usernameVariable: 'USER']]){
          sh """
             sed -i -- 's/{azure_password}/${PASS}/g' ./config/dev-config.json
             sed -i -- 's/{azure_password}/${PASS}/g' ./config/stg-config.json
             sed -i -- 's/{azure_password}/${PASS}/g' ./config/prod-config.json
          """
        }

        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_TENANTID', passwordVariable: 'PASS', usernameVariable: 'USER']]){
          sh """
             sed -i -- 's/{azure_tenantid}/${PASS}/g' ./config/dev-config.json
             sed -i -- 's/{azure_tenantid}/${PASS}/g' ./config/stg-config.json
             sed -i -- 's/{azure_tenantid}/${PASS}/g' ./config/prod-config.json
          """
        }
      }
    }

    if (service_name.trim() == "jazz_codeq") {
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{sonar_hostname}", config_loader.CODE_QUALITY.SONAR.HOST_NAME)
      updateConfigValue("{key_prefix}", config_loader.CODE_QUALITY.SONAR.KEY_PREFIX)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)

      withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.CODE_QUALITY.SONAR.ADMIN_SONAR_CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]){
        updateConfigValue("{sonar_user}", UNAME)
        updateConfigValue("{sonar_creds}", PWD)
      }
    }

    if (service_name.trim() == "jazz_assets") {
      updateConfigValue("{conf_stack_prefix}", config_loader.INSTANCE_PREFIX)
      updateConfigValue("{conf-region}", region)
    }

    if (service_name.trim() == "jazz_deployments") {
      updateConfigValue("{conf_stack_prefix}", config_loader.INSTANCE_PREFIX)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)
    }

    if (service_name.trim() == "jazz_scm-webhook") {
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)
    }

    if (service_name.trim() == "jazz_environments") {
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{inst_stack_prefix}", config_loader.INSTANCE_PREFIX)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
    }

    if (service_name.trim() == "jazz_environment-event-handler") {
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)
    }

    if (service_name.trim() == "jazz_asset-event-handler") {
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)

      sh "sed -i -- 's/{conf-region}/${region}/g' ./event.json"
    }

    if (service_name.trim() == "jazz_deployments-event-handler") {
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)
    }

    if ((config_loader.SLACK.ENABLE_SLACK == "true") && (service_name.trim() == "jazz_slack-event-handler")) {
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)
      updateConfigValue("{slack_notifier_name}", config_loader.SLACK.SLACK_USER)
      updateConfigValue("{slack_token}", config_loader.SLACK.SLACK_TOKEN)
    }

    if ((service_name.trim() == "jazz_events") || (service_name.trim() == "jazz_events-handler")) {
      updateConfigValue("{conf_stack_prefix}", config_loader.INSTANCE_PREFIX)

      if (service_name.trim() == "jazz_events") {
        updateConfigValue("{conf-region}", region)
      }
    }

    if ((service_name.trim() == "jazz_services-handler") || (service_name.trim() == "jazz_create-serverless-service")
      || (service_name.trim() == "jazz_acl")) {
      updateCoreAPI()
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)
      updateConfigValue("{conf-region}", region)
    }

    if ((service_name.trim() == "jazz_login") || (service_name.trim() == "jazz_logout") || (service_name.trim() == "jazz_cognito-authorizer") || (service_name.trim() == "jazz_cognito-admin-authorizer") || (service_name.trim() == "jazz_token-authorizer")) {
      updateConfigValue("{conf-user-pool-id}", config_loader.JAZZ.PLATFORM.AWS.COGNITO.USER_POOL_ID)
      updateConfigValue("{conf-client-id}", config_loader.JAZZ.PLATFORM.AWS.COGNITO.CLIENT_ID)
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
    }

    if (service_name.trim() == "jazz_cognito-authorizer") {
      updateCoreAPI()
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)
    }

    if (service_name.trim() == "jazz_is-service-available") {
      updateConfigValue("{inst_stack_prefix}", config_loader.INSTANCE_PREFIX)
      updateConfigValue("{conf-region}", region)
    }

    if ((service_name.trim() == "jazz_delete-serverless-service") || (service_name.trim() == "jazz_create-serverless-service")
      || (service_name.trim() == "jazz_deployments") || (service_name.trim() == "jazz_environment-event-handler")) {

      updateConfigValue("{conf-jenkins-host}", jenkins_url)
      updateConfigValue("{job_token}", config_loader.JENKINS.JOB_AUTH_TOKEN)
      updateConfigValue("{api_token}", utilModule.getApiToken())
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)

      sh "sed -i -- 's/{conf-region}/${region}/g' ./event.json"

      withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.JENKINS.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]){
        updateConfigValue("{ci_user}", UNAME)
      }
    }

    if (service_name.trim() == "jazz_services") {
      updateConfigValue("{inst_stack_prefix}", config_loader.INSTANCE_PREFIX)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
    }

    if ((service_name.trim() == "jazz_logs") || (service_name.trim() == "jazz_cloud-logs-streamer") || (service_name.trim() == "jazz_es-kinesis-log-streamer")) {
      updateConfigValue("{inst_elastic_search_hostname}", config_loader.JAZZ.ES_HOSTNAME)
      updateConfigValue("{inst_kibana_search_hostname}", config_loader.JAZZ.KIBANA_HOSTNAME)

      if (service_name.trim() == "jazz_logs") {
        updateConfigValue("{env-prefix}", config_loader.INSTANCE_PREFIX)
      }
    }

    if ((service_name.trim() == "jazz_es-kinesis-log-streamer")) {
      sh "sed -i -- 's|{stack_prefix}|${config_loader.INSTANCE_PREFIX}|g' ./config/global_config.json"
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)
      updateConfigValue("{conf-region}", region)

      sh "sed -i -- 's/{conf-apikey}/${getApigatewayInfoCore('jazz','DEV')}/g' ./config/dev-config.json"
      sh "sed -i -- 's/{conf-apikey}/${getApigatewayInfoCore('jazz','STG')}/g' ./config/stg-config.json"
      sh "sed -i -- 's/{conf-apikey}/${getApigatewayInfoCore('jazz','PROD')}/g' ./config/prod-config.json"
    }

    if (service_name.trim() == "jazz_splunk-kinesis-log-streamer") {
      sh "sed -i -- 's|{splunk_endpoint}|${config_loader.SPLUNK.ENDPOINT}|g' ./config/dev-config.json"
      sh "sed -i -- 's|{splunk_endpoint}|${config_loader.SPLUNK.ENDPOINT}|g' ./config/stg-config.json"
      sh "sed -i -- 's|{splunk_endpoint}|${config_loader.SPLUNK.ENDPOINT}|g' ./config/prod-config.json"

      updateConfigValue("{spunk_hec_token}", config_loader.SPLUNK.HEC_TOKEN)
      updateConfigValue("{splunk_index}", config_loader.SPLUNK.INDEX)

      sh "sed -i -- 's/{enable_splunk_logging_global}/${config_loader.SPLUNK.IS_ENABLED}/g' ./config/global-config.json"
      sh "sed -i -- 's|{stack_prefix}|${config_loader.INSTANCE_PREFIX}|g' ./config/global-config.json"
    }

    if (service_name.trim() == "jazz_usermanagement") {
      updateConfigValue("{user_pool_id}", config_loader.JAZZ.PLATFORM.AWS.COGNITO.USER_POOL_ID)
      updateConfigValue("{user_client_id}", config_loader.JAZZ.PLATFORM.AWS.COGNITO.CLIENT_ID)
      updateConfigValue("{region}", region)
    }

    if ((service_name.trim() == "jazz_usermanagement") ) {
      updateConfigValue("{scm_type}", config_loader.SCM.TYPE)

      sh "sed -i -- 's,{scm_base_url},http://${config_loader.REPOSITORY.BASE_URL},g' ./config/dev-config.json"
      sh "sed -i -- 's,{scm_base_url},http://${config_loader.REPOSITORY.BASE_URL},g' ./config/stg-config.json"
      sh "sed -i -- 's,{scm_base_url},http://${config_loader.REPOSITORY.BASE_URL},g' ./config/prod-config.json"

      if (config_loader.SCM.TYPE == "bitbucket") {
        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
          updateConfigValue("{bb_username}", UNAME)
          updateConfigValue("{bb_password}", PWD)
        }
      }

      if (config_loader.SCM.TYPE == "gitlab") {
        updateConfigValue("{private_token}", config_loader.SCM.PRIVATE_TOKEN)
      }
    }

    if (service_name.trim() == "jazz_admin") {
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{config_table}", config_loader.INSTANCE_PREFIX + '_JazzConfig')
    }

    if (service_name.trim() == "jazz_email") {
      updateConfigValue("{conf-region}", region)
    }

    if ((config_loader.SLACK.ENABLE_SLACK == "true") && (service_name.trim() == "jazz_slack-channel")) {
      updateCoreAPI()
      updateConfigValue("{conf-region}", region)
      updateConfigValue("{jazz_admin}", config_loader.JAZZ.STACK_ADMIN)
      updateConfigValue("{jazz_admin_creds}", config_loader.JAZZ.STACK_PASSWORD)
      updateConfigValue("{slack_notifier_name}", config_loader.SLACK.SLACK_USER)
      updateConfigValue("{slack-token}", config_loader.SLACK.SLACK_TOKEN)
      updateConfigValue("{slack-workspace}", config_loader.SLACK.SLACK_WORKSPACE)
      updateConfigValue("{svc_acc_id}", config_loader.SLACK.SLACK_SVC_ID)
    }

    if (service_name.trim() == "jazz_create-serverless-service") {
      def apiOptions = ""
      def functionOptions = ""
      def websiteOptions = ""
      def slsAppOptions = ""

      for (String item: config_loader.JAZZ.DEPLOYMENT_TARGETS.API) {
        apiOptions += '"' + item + '",'
      }
      apiOptions = apiOptions.substring(0, apiOptions.length() - 1)

      for (String item: config_loader.JAZZ.DEPLOYMENT_TARGETS.FUNCTION) {
        functionOptions += '"' + item + '",'
      }
      functionOptions = functionOptions.substring(0, functionOptions.length() - 1)

      for (String item: config_loader.JAZZ.DEPLOYMENT_TARGETS.WEBSITE) {
        websiteOptions += '"' + item + '",'
      }
      websiteOptions = websiteOptions.substring(0, websiteOptions.length() - 1)

      for (String item: config_loader.JAZZ.DEPLOYMENT_TARGETS['SLS-APP']) {
        slsAppOptions += '"' + item + '",'
      }
      slsAppOptions = slsAppOptions.substring(0, slsAppOptions.length() - 1)

      sh "sed -i -- 's/\"{conf_deployment_targets_api}\"/$apiOptions/g' ./config/dev-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_api}\"/$apiOptions/g' ./config/stg-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_api}\"/$apiOptions/g' ./config/prod-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_api}\"/$apiOptions/g' ./config/test-config.json"

      sh "sed -i -- 's/\"{conf_deployment_targets_function}\"/$functionOptions/g' ./config/dev-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_function}\"/$functionOptions/g' ./config/stg-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_function}\"/$functionOptions/g' ./config/prod-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_function}\"/$functionOptions/g' ./config/test-config.json"

      sh "sed -i -- 's/\"{conf_deployment_targets_website}\"/$websiteOptions/g' ./config/dev-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_website}\"/$websiteOptions/g' ./config/stg-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_website}\"/$websiteOptions/g' ./config/prod-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_website}\"/$websiteOptions/g' ./config/test-config.json"

      updateConfigValue("{aws-primary-region}", region)
      updateConfigValue("{aws-providerId}", config_loader.AWS.DEFAULTS.PROVIDER)
      updateConfigValue("{aws-primary-accountId}", config_loader.AWS.DEFAULTS.ACCOUNTID)

      if(config_loader.AZURE && config_loader.AZURE.IS_ENABLED instanceof Boolean && config_loader.AZURE.IS_ENABLED){
        updateConfigValue("{azure-primary-region}", config_loader.AZURE.DEFAULTS.REGION)
        updateConfigValue("{azure-providerId}", config_loader.AZURE.DEFAULTS.PROVIDER)
        updateConfigValue("{azure-primary-accountId}", config_loader.AZURE.DEFAULTS.ACCOUNTID)
      }
      sh "sed -i -- 's/\"{conf_deployment_targets_sls-app}\"/$slsAppOptions/g' ./config/dev-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_sls-app}\"/$slsAppOptions/g' ./config/stg-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_sls-app}\"/$slsAppOptions/g' ./config/prod-config.json"
      sh "sed -i -- 's/\"{conf_deployment_targets_sls-app}\"/$slsAppOptions/g' ./config/test-config.json"
    }

  } catch (e) {
    echo "error occured while loading service configuration: " + e.getMessage()
    error "error occured while loading service configuration: " + e.getMessage()
  }
}

def updateConfigValue(key, val) {
  sh "sed -i -- 's#${key}#${val}#g' ./config/dev-config.json"
  sh "sed -i -- 's#${key}#${val}#g' ./config/stg-config.json"
  sh "sed -i -- 's#${key}#${val}#g' ./config/prod-config.json"
}

def updateCoreAPI() {
  sh "sed -i -- 's/{conf-apikey}/${getApigatewayInfoCore('jazz','DEV')}/g' ./config/dev-config.json"
  sh "sed -i -- 's/{conf-apikey}/${getApigatewayInfoCore('jazz','STG')}/g' ./config/stg-config.json"
  sh "sed -i -- 's/{conf-apikey}/${getApigatewayInfoCore('jazz','PROD')}/g' ./config/prod-config.json"
}

def setRoleARN(roleArn){
  role_arn = roleArn
}
def setRegion(rgn){
  region = rgn
}
def setAccountId(account_id){
    accountId = account_id
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
def setUtilModule(util){
  utilModule = util
}
def setAWSAPIGatewayModule(awsAPIGateway){
  awsAPIGatewayModule = awsAPIGateway;
}

def setKinesisStream(config){
    if ((config['service'].trim() == "services-handler") || (config['service'].trim() == "events-handler") ||
        (config['service'] == "environment-event-handler") || (config['service'] == "deployments-event-handler") ||
        (config['service'] == "asset-event-handler") || ((config['service'] == "slack-event-handler") && (config_loader.SLACK.ENABLE_SLACK == "true"))) {
        def kinesisArn = "arn:aws:kinesis:$region:$accountId:stream/${config_loader.INSTANCE_PREFIX}-events-hub-${current_environment}"
        setEventSourceMapping(kinesisArn, config)
    } else if ((config['service'].trim() == "es-kinesis-log-streamer") || (config['service'].trim() == "splunk-kinesis-log-streamer")) {
      def kinesisArn = config_loader.JAZZ.PLATFORM.AWS.KINESIS_LOGS_STREAM.PROD
      setEventSourceMapping(kinesisArn, config)
    }
}

def setEventSourceMapping(eventSourceArn, config) {
  def function_name = "${config_loader.INSTANCE_PREFIX}_${config['domain']}_${config['service']}_${current_environment}"
  def event_source_list = sh(
    script: "aws lambda list-event-source-mappings --query \"EventSourceMappings[?contains(FunctionArn, '$function_name')]\" --region \"$region\"",
    returnStdout: true
  ).trim()
  echo "$event_source_list"
  if (event_source_list == "[]") {
      sh "aws lambda create-event-source-mapping --event-source-arn ${eventSourceArn} --function-name arn:aws:lambda:$region:$accountId:function:$function_name --enabled --starting-position LATEST --region $region"
  }
}

def setLogStreamPermission(config){
  if (config['service'] == "cloud-logs-streamer") {
    def function_name = "${config_loader.INSTANCE_PREFIX}_${config['domain']}_${config['service']}_${current_environment}"
    echo "set permission for cloud-logs-streamer"
    try {
      def rd = sh(script: "openssl rand -hex 4", returnStdout: true).trim()
      sh "aws lambda add-permission --function-name arn:aws:lambda:${region}:${accountId}:function:${function_name} --statement-id lambdaFxnPermission${rd} --action lambda:* --principal logs.${region}.amazonaws.com --region ${region}"
      echo "set permission for cloud-logs-streamer - success"
    } catch (ss) {
      //ignore if already registered permissions
      echo(ss)
      echo "set permission for cloud-logs-streamer - ok np"
    }
  }
}

def getApigatewayInfoCore(domain, stage){
  def accountDetailsPrimary = utilModule.getAccountInfoPrimary();
   return awsAPIGatewayModule.getApigatewayInfoCore(stage, domain, accountDetailsPrimary);
}

return this
