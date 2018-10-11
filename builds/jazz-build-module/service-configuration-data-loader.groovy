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
@Field def role_id
@Field def jenkins_url
@Field def current_environment
@Field def es_hostname
@Field def service_name
@Field def utilModule

/**
 * Initialize the module
 */
def initialize(config, role_arn, region, role_id, jenkins_url, current_environment, service_name, utilModule) {
    config_loader = config
    setRoleARN(role_arn)
    setRegion(region)
    setRoleId(role_id)
    setJenkinsUrl(jenkins_url)
    setCurrentEnvironment(current_environment)
    setServiceName(service_name)
    setUtilModule(utilModule)
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
            sh "sed -i -- 's/{conf-role}/${role_arn}/g' ./swagger/swagger.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./swagger/swagger.json"
            sh "sed -i -- 's/{conf-accId}/${role_id}/g' ./swagger/swagger.json"
        }

        if ((config_loader.SLACK.ENABLE_SLACK == "true") && (service_name.trim() == "jazz_is-slack-channel-available")) {
            sh "sed -i -- 's/{slack_channel_token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{slack_channel_token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{slack_channel_token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_metrics") {
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-apikey-dev}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/global-config.json"
            sh "sed -i -- 's/{conf-apikey-stg}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/global-config.json"
            sh "sed -i -- 's/{conf-apikey-prod}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/global-config.json"

            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/global-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_codeq") {
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{sonar_hostname}/${config_loader.CODE_QUALITY.SONAR.HOST_NAME}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{sonar_hostname}/${config_loader.CODE_QUALITY.SONAR.HOST_NAME}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{sonar_hostname}/${config_loader.CODE_QUALITY.SONAR.HOST_NAME}/g' ./config/prod-config.json"

            withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.CODE_QUALITY.SONAR.ADMIN_SONAR_CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]){
                sh "sed -i -- 's/{sonar_user}/${UNAME}/g' ./config/dev-config.json"
                sh "sed -i -- 's/{sonar_user}/${UNAME}/g' ./config/stg-config.json"
                sh "sed -i -- 's/{sonar_user}/${UNAME}/g' ./config/prod-config.json"

                sh "sed -i -- 's/{sonar_creds}/${PWD}/g' ./config/dev-config.json"
                sh "sed -i -- 's/{sonar_creds}/${PWD}/g' ./config/stg-config.json"
                sh "sed -i -- 's/{sonar_creds}/${PWD}/g' ./config/prod-config.json"
            }

            sh "sed -i -- 's/{key_prefix}/${config_loader.CODE_QUALITY.SONAR.KEY_PREFIX}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{key_prefix}/${config_loader.CODE_QUALITY.SONAR.KEY_PREFIX}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{key_prefix}/${config_loader.CODE_QUALITY.SONAR.KEY_PREFIX}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_assets") {
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_deployments") {
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_scm-webhook") {

            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

        }

        if (service_name.trim() == "jazz_environments") {
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_environment-event-handler") {
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_asset-event-handler") {
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_deployments-event-handler") {
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"
        }

        if ((config_loader.SLACK.ENABLE_SLACK == "true") && (service_name.trim() == "jazz_slack-event-handler")) {
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{slack_notifier_name}/${config_loader.SLACK.SLACK_USER}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{slack_notifier_name}/${config_loader.SLACK.SLACK_USER}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{slack_notifier_name}/${config_loader.SLACK.SLACK_USER}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{slack_token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{slack_token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{slack_token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/prod-config.json"

        }

        if ((service_name.trim() == "jazz_events") || (service_name.trim() == "jazz_events-handler")) {
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/prod-config.json"

            if (service_name.trim() == "jazz_events") {
                sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
                sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
                sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
            }
        }

        if ((service_name.trim() == "jazz_services-handler") || (service_name.trim() == "jazz_create-serverless-service")) {
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"

            if(service_name.trim() == "jazz_services-handler") {
                sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
                sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
                sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
            }

        }

        if ((service_name.trim() == "jazz_login") || (service_name.trim() == "jazz_logout") || (service_name.trim() == "jazz_cognito-authorizer")) {
            sh "sed -i -- 's/{conf-user-pool-id}/${config_loader.AWS.COGNITO.USER_POOL_ID}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-client-id}/${config_loader.AWS.COGNITO.CLIENT_ID}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"

            sh "sed -i -- 's/{conf-user-pool-id}/${config_loader.AWS.COGNITO.USER_POOL_ID}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-client-id}/${config_loader.AWS.COGNITO.CLIENT_ID}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"

            sh "sed -i -- 's/{conf-user-pool-id}/${config_loader.AWS.COGNITO.USER_POOL_ID}/g' ./config/prod-config.json"
            sh "sed -i -- 's/{conf-client-id}/${config_loader.AWS.COGNITO.CLIENT_ID}/g' ./config/prod-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_is-service-available") {
            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
        }

        if ((service_name.trim() == "jazz_delete-serverless-service") || (service_name.trim() == "jazz_create-serverless-service")
            || (service_name.trim() == "jazz_deployments") || (service_name.trim() == "jazz_environment-event-handler")) {
            sh "sed -i -- 's/{conf-jenkins-host}/${jenkins_url}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-jenkins-host}/${jenkins_url}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-jenkins-host}/${jenkins_url}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{job_token}/${config_loader.JENKINS.JOB_AUTH_TOKEN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{job_token}/${config_loader.JENKINS.JOB_AUTH_TOKEN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{job_token}/${config_loader.JENKINS.JOB_AUTH_TOKEN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{api_token}/${utilModule.getApiToken()}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{api_token}/${utilModule.getApiToken()}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{api_token}/${utilModule.getApiToken()}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.JENKINS.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]){
                sh "sed -i -- 's/{ci_user}/${UNAME}/g' ./config/dev-config.json"
                sh "sed -i -- 's/{ci_user}/${UNAME}/g' ./config/stg-config.json"
                sh "sed -i -- 's/{ci_user}/${UNAME}/g' ./config/prod-config.json"
            }
        }

        if (service_name.trim() == "jazz_services") {

            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{inst_stack_prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

        }

        if ((service_name.trim() == "jazz_logs") || (service_name.trim() == "jazz_cloud-logs-streamer") || (service_name.trim() == "jazz_es-kinesis-log-streamer")) {

            sh "sed -i -- 's/{inst_elastic_search_hostname}/${config_loader.AWS.ES_HOSTNAME}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{inst_elastic_search_hostname}/${config_loader.AWS.ES_HOSTNAME}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{inst_elastic_search_hostname}/${config_loader.AWS.ES_HOSTNAME}/g' ./config/prod-config.json"

            if (service_name.trim() == "jazz_logs") {
                sh "sed -i -- 's/{env-prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/dev-config.json"
                sh "sed -i -- 's/{env-prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/stg-config.json"
                sh "sed -i -- 's/{env-prefix}/${config_loader.INSTANCE_PREFIX}/g' ./config/prod-config.json"
            }
        }

        if((service_name.trim() == "jazz_es-kinesis-log-streamer")) {
            sh "sed -i -- 's|{stack_prefix}|${config_loader.INSTANCE_PREFIX}|g' ./config/global_config.json"
        }

        if (service_name.trim() == "jazz_splunk-kinesis-log-streamer") {
            sh "sed -i -- 's|{splunk_endpoint}|${config_loader.SPLUNK.ENDPOINT}|g' ./config/dev-config.json"
            sh "sed -i -- 's|{splunk_endpoint}|${config_loader.SPLUNK.ENDPOINT}|g' ./config/stg-config.json"
            sh "sed -i -- 's|{splunk_endpoint}|${config_loader.SPLUNK.ENDPOINT}|g' ./config/prod-config.json"

            sh "sed -i -- 's/{spunk_hec_token}/${config_loader.SPLUNK.HEC_TOKEN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{spunk_hec_token}/${config_loader.SPLUNK.HEC_TOKEN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{spunk_hec_token}/${config_loader.SPLUNK.HEC_TOKEN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{splunk_index}/${config_loader.SPLUNK.INDEX}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{splunk_index}/${config_loader.SPLUNK.INDEX}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{splunk_index}/${config_loader.SPLUNK.INDEX}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{enable_splunk_logging_global}/${config_loader.SPLUNK.IS_ENABLED}/g' ./config/global-config.json"
            sh "sed -i -- 's|{stack_prefix}|${config_loader.INSTANCE_PREFIX}|g' ./config/global-config.json"

        }

        if (service_name.trim() == "jazz_usermanagement") {
            sh "sed -i -- 's/{user_pool_id}/${config_loader.AWS.COGNITO.USER_POOL_ID}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{user_pool_id}/${config_loader.AWS.COGNITO.USER_POOL_ID}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{user_pool_id}/${config_loader.AWS.COGNITO.USER_POOL_ID}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{user_client_id}/${config_loader.AWS.COGNITO.CLIENT_ID}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{user_client_id}/${config_loader.AWS.COGNITO.CLIENT_ID}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{user_client_id}/${config_loader.AWS.COGNITO.CLIENT_ID}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{region}/${region}/g' ./config/prod-config.json"
        }

        if (( service_name.trim() == "jazz_usermanagement") || (service_name.trim() == "jazz_admin")) {

            sh "sed -i -- 's/{scm_type}/${config_loader.SCM.TYPE}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{scm_type}/${config_loader.SCM.TYPE}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{scm_type}/${config_loader.SCM.TYPE}/g' ./config/prod-config.json"

            sh "sed -i -- 's,{scm_base_url},http://${config_loader.REPOSITORY.BASE_URL},g' ./config/dev-config.json"
            sh "sed -i -- 's,{scm_base_url},http://${config_loader.REPOSITORY.BASE_URL},g' ./config/stg-config.json"
            sh "sed -i -- 's,{scm_base_url},http://${config_loader.REPOSITORY.BASE_URL},g' ./config/prod-config.json"

            if (config_loader.SCM.TYPE == "bitbucket") {
              withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
                  sh "sed -i -- 's/{bb_username}/${UNAME}/g' ./config/dev-config.json"
                  sh "sed -i -- 's/{bb_username}/${UNAME}/g' ./config/stg-config.json"
                  sh "sed -i -- 's/{bb_username}/${UNAME}/g' ./config/prod-config.json"

                  sh "sed -i -- 's/{bb_password}/${PWD}/g' ./config/dev-config.json"
                  sh "sed -i -- 's/{bb_password}/${PWD}/g' ./config/stg-config.json"
                  sh "sed -i -- 's/{bb_password}/${PWD}/g' ./config/prod-config.json"
              }
            }

            if (config_loader.SCM.TYPE == "gitlab") {
                sh "sed -i -- 's/{private_token}/${config_loader.SCM.PRIVATE_TOKEN}/g' ./config/dev-config.json"
                sh "sed -i -- 's/{private_token}/${config_loader.SCM.PRIVATE_TOKEN}/g' ./config/stg-config.json"
                sh "sed -i -- 's/{private_token}/${config_loader.SCM.PRIVATE_TOKEN}/g' ./config/prod-config.json"
            }
        }

        if (service_name.trim() == "jazz_admin") {
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"
        }

        if (service_name.trim() == "jazz_email") {
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"
        }

        if ((config_loader.SLACK.ENABLE_SLACK == "true") && (service_name.trim() == "jazz_slack-channel")) {
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["DEV"])}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["STG"])}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-apikey}/${utilModule.getAPIIdForCore(config_loader.AWS.API["PROD"])}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{conf-region}/${region}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin}/${config_loader.JAZZ.ADMIN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{jazz_admin_creds}/${config_loader.JAZZ.PASSWD}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{slack_notifier_name}/${config_loader.SLACK.SLACK_USER}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{slack_notifier_name}/${config_loader.SLACK.SLACK_USER}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{slack_notifier_name}/${config_loader.SLACK.SLACK_USER}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{slack-token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{slack-token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{slack-token}/${config_loader.SLACK.SLACK_TOKEN}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{slack-workspace}/${config_loader.SLACK.SLACK_WORKSPACE}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{slack-workspace}/${config_loader.SLACK.SLACK_WORKSPACE}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{slack-workspace}/${config_loader.SLACK.SLACK_WORKSPACE}/g' ./config/prod-config.json"

            sh "sed -i -- 's/{svc_acc_id}/${config_loader.SLACK.SLACK_SVC_ID}/g' ./config/dev-config.json"
            sh "sed -i -- 's/{svc_acc_id}/${config_loader.SLACK.SLACK_SVC_ID}/g' ./config/stg-config.json"
            sh "sed -i -- 's/{svc_acc_id}/${config_loader.SLACK.SLACK_SVC_ID}/g' ./config/prod-config.json"

        }
    } catch (e) {
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
def setUtilModule(util){
    utilModule = util
}
def setKinesisStream(config){
    if ((config['service'].trim() == "services-handler") || (config['service'].trim() == "events-handler") ||
        (config['service'] == "environment-event-handler") || (config['service'] == "deployments-event-handler") ||
        (config['service'] == "asset-event-handler") || ((config['service'] == "slack-event-handler") && (config_loader.SLACK.ENABLE_SLACK == "true"))) {
        def kinesisArn = "arn:aws:kinesis:$region:$role_id:stream/${config_loader.INSTANCE_PREFIX}-events-hub-${current_environment}"
        setEventSourceMapping(kinesisArn, config)
    } else if ((config['service'].trim() == "es-kinesis-log-streamer") || (config['service'].trim() == "splunk-kinesis-log-streamer")) {
      def kinesisArn = config_loader.AWS.KINESIS_LOGS_STREAM.PROD
      setEventSourceMapping(kinesisArn, config)
    }
}

def setEventSourceMapping(eventSourceArn, config) {
  def function_name = "${config_loader.INSTANCE_PREFIX}-${config['domain']}-${config['service']}-${current_environment}"
  def event_source_list = sh(
      script: "aws lambda list-event-source-mappings --query \"EventSourceMappings[?contains(FunctionArn, '$function_name')]\" --region \"$region\"",
      returnStdout: true
  ).trim()
  echo "$event_source_list"
  if (event_source_list == "[]") {
      sh "aws lambda create-event-source-mapping --event-source-arn ${eventSourceArn} --function-name arn:aws:lambda:$region:$role_id:function:$function_name --starting-position LATEST --region $region"
  }
}

def setLogStreamPermission(config){
    if (config['service'] == "cloud-logs-streamer") {
        def function_name = "${config_loader.INSTANCE_PREFIX}-${config['domain']}-${config['service']}-${current_environment}"
        echo "set permission for cloud-logs-streamer"
        try {
            def rd = sh(script: "openssl rand -hex 4", returnStdout: true).trim()
            sh "aws lambda add-permission --function-name arn:aws:lambda:${region}:${role_id}:function:${function_name} --statement-id lambdaFxnPermission${rd} --action lambda:* --principal logs.${region}.amazonaws.com --region ${region}"
            echo "set permission for cloud-logs-streamer - success"
        } catch (ss) {
            //ignore if already registered permissions
            echo(ss)
            echo "set permission for cloud-logs-streamer - ok np"
        }
    }
}
return this
