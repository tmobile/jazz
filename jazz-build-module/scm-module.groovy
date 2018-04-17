#!groovy?
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* Module that handles managing repos (create, delete) in the user's preferred scm
*/

def scm_core_services_endpoint
def scm_user_services_api_endpoint
def scm_user_services_clone_url
def scm_branch_permission_api_endpoint
def serviceonboarding_repo
def scm_config
@Field def scm_protocol	= "http://"

def initialize(configData){
    scm_config = configData
    setRepoEndpoints()
}

def setRepoEndpoints(){
    if(scm_config.SCM.TYPE == "gitlab"){
        scm_user_services_api_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/rest/api/1.0/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        scm_core_services_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/" 
        scm_user_services_clone_url = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/"
        scm_branch_permission_api_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/rest/branch-permissions/2.0/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        serviceonboarding_repo	= "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/service-onboarding-build-pack.git"
	}else if(scm_config.SCM.TYPE == "bitbucket"){
        scm_user_services_api_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/rest/api/1.0/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        scm_core_services_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/" 
        scm_user_services_clone_url = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/"
        scm_branch_permission_api_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/rest/branch-permissions/2.0/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        serviceonboarding_repo	= "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/service-onboarding-build-pack.git"
	}
}

def createProject(repo_owner, repo_name){
    try { 
        if(scm_config.SCM.TYPE == "gitlab"){
            //gitlabs username is restricted to alphanumeric and . _ - characters, 
            // so using email all email characters (except -, _) replaced with -
            def gitlab_username = repo_owner.replaceAll("[^a-zA-Z0-9_-]","-")

            def user_id = getGitlabUserId(gitlab_username)
            def user_services_group_id = getUserServicesGroupId()

            def gitlab_repo_output = sh (
                script: "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X POST \"http://${scm_config.REPOSITORY.BASE_URL}/api/v4/projects/user/$user_id?name=$repo_name&path=$repo_name&visibility=private&request_access_enabled=true\"",
                returnStdout: true
            ).trim()

            def jsonSlurper = new groovy.json.JsonSlurperClassic()
            def repo_details = jsonSlurper.parseText(gitlab_repo_output)
            
            if(repo_details == null || repo_details.equals("") || repo_details.id == null || repo_details.id.equals("")){
                error "project creation in gitlabs failed"
            }
            repo_id = repo_details.id
            
            transferProject(user_services_group_id, repo_id)
        }else if(scm_config.SCM.TYPE == "bitbucket"){
            sh "curl -X POST -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" -H \"Content-Type: application/json\" " + scm_user_services_api_endpoint + " -d \'{\"name\":\""+ repo_name +"\", \"scmId\": \"git\", \"forkable\": \"true\"}\'"
        }
    }catch (ex) {
        echo "createProject failed: " +ex.toString()
        error "createProject failed: "+ex.getMessage()
    }
}

def getGitlabUserId(gitlab_username){
    try{
        def output = sh (
            script: "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X GET \"http://${scm_config.REPOSITORY.BASE_URL}/api/v4/users?username=$gitlab_username\"",
            returnStdout: true
        ).trim()
  
        def jsonSlurper = new groovy.json.JsonSlurperClassic()
        def userObject = jsonSlurper.parseText(output)
  
        if(userObject == null || userObject.equals("") || userObject[0] == null || userObject[0].equals("") 
            || userObject[0].id == null || userObject[0].id.equals("")){
                error "get user data in gitlab failed"
        }
        
        return userObject[0].id
    }
    catch (ex) {
        error "getGitlabUserId failed: " +ex.getMessage() 
    }
}

def getUserServicesGroupId(){
    try{
        def output = sh (
            script: "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X GET \"http://${scm_config.REPOSITORY.BASE_URL}/api/v4/groups?search=${scm_config.REPOSITORY.REPO_BASE_SERVICES}\"",
            returnStdout: true
        ).trim()

        def jsonSlurper = new groovy.json.JsonSlurperClassic()
        def groupObject = jsonSlurper.parseText(output)
        
        if(groupObject == null || groupObject.equals("") || groupObject[0] == null || groupObject[0].equals("") 
            || groupObject[0].id == null || groupObject[0].id.equals("")){
            error "Unable to find the user services group id "
        }
        
        return groupObject[0].id
    }catch (ex) {
        error "getUserServicesGroupId failed: "+ex.getMessage()
    }
}

def getGitLabsProjectId(repo_name) {
    try{
        def output = sh (
            script: "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X GET \"http://${scm_config.REPOSITORY.BASE_URL}/api/v4/projects?search=${repo_name}\"",
            returnStdout: true
        ).trim()

        def jsonSlurper = new groovy.json.JsonSlurperClassic()
        def projectObject = jsonSlurper.parseText(output)
        
        if(projectObject == null || projectObject.equals("") || projectObject[0] == null || projectObject[0].equals("") 
            || projectObject[0].id == null || projectObject[0].id.equals("")){
            error "getGitLabsProjectId failed to find project with name $repo_name" 
        }
        
        return projectObject[0].id
    }catch (ex) {
        error "getGitLabsProjectId failed: "+ex.getMessage()
    }
}

def transferProject(cas_id, project_id){
    try{
        sh "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X POST \"http://${scm_config.REPOSITORY.BASE_URL}/api/v4/groups/$cas_id/projects/$project_id\""
    }catch (ex) {
        echo "transferProject failed: "+ex.getMessage()
    }
}

def setBranchPermissions(repo_name) {
    if(scm_config.SCM.TYPE == "gitlab"){
        def proj_id = getGitLabsProjectId(repo_name)
        sh "curl --request DELETE --header \"PRIVATE-TOKEN: ${scm_config.SCM.PRIVATE_TOKEN}\" \"${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/api/v4/projects/$proj_id/protected_branches/master\""
        sh "curl --request POST --header \"PRIVATE-TOKEN: ${scm_config.SCM.PRIVATE_TOKEN}\" \"${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/api/v4/projects/$proj_id/protected_branches?name=master&push_access_level=0\""
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: scm_config.REPOSITORY.CREDENTIAL_ID, url: serviceonboarding_repo]]])
	    sh "curl -X POST -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\"  -H \"Content-Type: application/vnd.atl.bitbucket.bulk+json\" ${scm_branch_permission_api_endpoint}${repo_name}/restrictions -d \"@branch_permissions_payload.json\"  "
    }
}

def setRepoPermissions(repo_owner, repo_name, admin_group) {
    if(scm_config.SCM.TYPE == "gitlab"){
        
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        sh "curl -X PUT -G -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" -d \"name=$admin_group\" \"${scm_user_services_api_endpoint}/${repo_name}/permissions/groups?permission=REPO_ADMIN&\""

        def encoded_creator = URLEncoder.encode(repo_owner, "utf-8")

        sh "curl -X PUT -G -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" -d \"name=$encoded_creator\" \"${scm_user_services_api_endpoint}/${repo_name}/permissions/users?permission=REPO_ADMIN\""
    }
}

def addWebhook(repo_name, webhookName,scm_webhook_target_url) {
    if(scm_config.SCM.TYPE == "gitlab"){
        def proj_id = getGitLabsProjectId(repo_name)
		def scm_webhook_api = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/api/v4/projects/${proj_id}/hooks?enable_ssl_verification=false&push_events=true&url="
		sh "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X POST \"${scm_webhook_api}$scm_webhook_target_url\""
    }else if(scm_config.SCM.TYPE == "bitbucket"){
		def scm_webhook_api = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/rest/webhook/1.0/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/"
		sh "curl -X PUT -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" -H \"Content-Type: application/json\" ${scm_webhook_api}${repo_name}/configurations  -d \'{\"title\": \"${webhookName}\", \"url\": \"${scm_webhook_target_url}\" , \"enabled\": true}\'"
    }
}

def deleteProject(repo_name) {
    if(scm_config.SCM.TYPE == "gitlab"){
        def proj_id = getGitLabsProjectId(repo_name)
        def gitlab_repo_delete_output = sh (
            script: "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X DELETE \"http://${scm_config.REPOSITORY.BASE_URL}/api/v4/projects/${proj_id}\"",
            returnStdout: true
        ).trim()
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        def outputStr = sh (
            script: "curl -X DELETE -k -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" '" + scm_user_services_api_endpoint + repo_name +"'" ,
            returnStdout: true
        ).trim()
    }
}

def getRepoUrl(repo_name) {
    if(scm_config.SCM.TYPE == "gitlab"){
        return "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/${repo_name}";
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        return "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/${repo_name}/browse";
    } 
}

def getRepoCloneUrl(repo_name) {
    if(scm_config.SCM.TYPE == "gitlab"){
        return "${scm_user_services_clone_url}${repo_name}.git"
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        return "${scm_user_services_clone_url}${repo_name}.git"
    }
}

def getRepoCloneBaseUrl(repo_name) {
    if(scm_config.SCM.TYPE == "gitlab"){
        return "${scm_config.REPOSITORY.BASE_URL}/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/${repo_name}.git"
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        return "${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/${repo_name}.git"
    }
}

def getRepoProtocol() {
     return "${scm_protocol}"
}

def getTemplateUrl(template_name) {
    if(scm_config.SCM.TYPE == "gitlab"){
        return "${scm_core_services_endpoint}${template_name}.git";
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        return "${scm_core_services_endpoint}${template_name}.git";
    }
}

def getCoreRepoUrl(repo_name) {
    if(scm_config.SCM.TYPE == "gitlab"){
        return "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/${repo_name}";
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        return "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/projects/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/repos/${repo_name}/browse";
    } 
}

def getCoreRepoCloneUrl(repo_name) {
    if(scm_config.SCM.TYPE == "gitlab"){
        return "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/${repo_name}.git"
    }else if(scm_config.SCM.TYPE == "bitbucket"){
        return "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/${repo_name}.git"
    }
}

return this