#!groovy?
import groovy.json.JsonOutput
import groovy.transform.Field
import groovy.json.JsonSlurper

/*
* Module that handles managing projects (create, delete) in the user's preferred scm
*/

def scm_core_services_endpoint
def scm_user_services_api_endpoint
def scm_user_services_clone_url
def scm_webhook_api
def scm_branch_permission_api_endpoint

def serviceonboarding_repo
def scm_config
@Field def scm_protocol	= "http://"

def initialize(configData){
    scm_config = configData
    setRepoEndpoints()
}

def setRepoEndpoints(){
    scm_user_services_api_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/rest/api/1.0/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/"
    scm_core_services_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/" 
    scm_user_services_clone_url = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/"
    scm_webhook_api = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/rest/webhook/1.0/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/"
    scm_branch_permission_api_endpoint = "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/rest/branch-permissions/2.0/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/"
    serviceonboarding_repo	= "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/service-onboarding-build-pack.git"
}

def createProject(repo_owner, repo_name){
    try { 
        echo "ready to create project"
        if(scm_config.SCM.TYPE == "gitlab") {
            def git_username
            def cas_proj_id
            def cas_repo_id
            
            //assuming usernames for now are a concatenation of the user's email, check platform_usermanagement index.js
            if(repo_owner.contains("@")){
                git_username = repo_owner.substring(0, owner.indexOf("@"))
            }

            def user_id = getGitlabUserId(git_username, ${scm_config.SCM.PRIVATE_TOKEN})
            
            def gitlab_repo_output = sh (
                script: "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X POST \"http://${scm_config.REPOSITORY.BASE_URL}/api/v3/projects/user/$user_id?name=$repo_name&path=$repo_name&visibility=private&request_access_enabled=true\"",
                returnStdout: true
            ).trim()

            def jsonSlurper = new JsonSlurper()
            def object = jsonSlurper.parseText(gitlab_repo_output)
            
            if(object == null || object.equals("") || object.id == null || object.id.equals("")){
                error "project creation in gitlabs failed"
            }
             
            cas_proj_id = object.id

            cas_repo_id = getCasRepoId(gitlab_private_token, repo_loc)

            transferProject(cas_repo_id, cas_proj_id)
        }
        else{
            sh "curl -X POST -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" -H \"Content-Type: application/json\" " + scm_user_services_api_endpoint + " -d \'{\"name\":\""+ repo_name +"\", \"scmId\": \"git\", \"forkable\": \"true\"}\'"
        }
    }catch (ex) {
        if(!((ex.getMessage()).indexOf("groovy.json.internal.LazyMap") > -1)) {
            echo "createUserInSCM Failed"
            error "createProjectInSCM Failed. "+ex.getMessage()
        }
    }
}

def getGitlabUserId(gitlab_username){
    try{
        def output = sh (
            script: "curl --header \"Private-Token: ${scm_config..SCM.PRIVATE_TOKEN}\" -X GET \"http://${scm_config.REPOSITORY.BASE_URL}/api/v3/users?username=$gitlab_username\"",
            returnStdout: true
        ).trim()
  
        def jsonSlurper = new groovy.json.JsonSlurper()
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

def getCasRepoId(repo_loc){
    try{
        def output = sh (
            script: "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X GET \"http://${scm_config.REPOSITORY.BASE_URL}/api/v3/groups?search=$repo_loc\"",
            returnStdout: true
        ).trim()

        def jsonSlurper = new JsonSlurper()
        def groupObject = jsonSlurper.parseText(output)
        
        if(groupObject == null || groupObject.equals("") || groupObject[0] == null || groupObject[0].equals("") 
            || groupObject[0].id == null || groupObject[0].id.equals("")){
            error "get cas group data failed"
        }
        
        return groupObject[0].id
    }catch (ex) {
        error "getCasRepoId failed: "+ex.getMessage()
    }
}

def transferProject(cas_id, project_id){
  	def output = sh (
  		script: "curl --header \"Private-Token: ${scm_config.SCM.PRIVATE_TOKEN}\" -X POST \"http://${scm_config.REPOSITORY.BASE_URL}/api/v3/groups/$cas_id/projects/$project_id\"",
  		returnStdout: true
  	).trim()
}

def setBranchPermissions(repo_name) {
    checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: scm_config.REPOSITORY.CREDENTIAL_ID, url: serviceonboarding_repo]]])
	sh "curl -X POST -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\"  -H \"Content-Type: application/vnd.atl.bitbucket.bulk+json\" ${scm_branch_permission_api_endpoint}${repo_name}/restrictions   -d \"@branch_permissions_payload.json\"  "
}

def setRepoPermissions(repo_owner, repo_name, admin_group) {
    sh "curl -X PUT -G -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" -d \"name=$admin_group\" \"${scm_user_services_api_endpoint}/${repo_name}/permissions/groups?permission=REPO_ADMIN&\""

    def encoded_creator = URLEncoder.encode(repo_owner, "utf-8")

    sh "curl -X PUT -G -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" -d \"name=$encoded_creator\" \"${scm_user_services_api_endpoint}/${repo_name}/permissions/users?permission=REPO_ADMIN\""
}

def addWebhook(repo_name, webhookName, targetUrl) {
    sh "curl -X PUT -k -v -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" -H \"Content-Type: application/json\" ${scm_webhook_api}${repo_name}/configurations  -d \'{\"title\": \"${webhookName}\", \"url\": \"${targetUrl}\" , \"enabled\": true}\'"
}

def deleteProject(repo_name) {
    if(scm_config.JAZZ_SCM == "gitlab"){
        def encodedProjectPath = URLEncoder.encode("${repo_loc}+${repo_name}", "utf-8")
        def gitlab_repo_delete_output = sh (
            script: "curl --header \"Private-Token: ${scm_config.GITLAB.gitlab_private_token}\" -X POST \"http://${scm_config.REPOSITORY.BASE_URL}/api/v3/projects/$encodedProjectPath\"",
            returnStdout: true
        ).trim()
    }
    else{
        def outputStr = sh (
            script: "curl -X DELETE -k -u \"${scm_config.SCM.USERNAME}:${scm_config.SCM.PASSWORD}\" '" + scm_user_services_api_endpoint + repo_name +"'" ,
            returnStdout: true
        ).trim()
    }
}

def getRepoUrl(repo_name) {
    return "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/projects/${scm_config.REPOSITORY.REPO_BASE_SERVICES}/repos/${repo_name}/browse";
}

def getRepoCloneUrl(repo_name) {
     return "${scm_user_services_clone_url}${repo_name}.git"
}

def getTemplateUrl(template_name) {
    return "${scm_core_services_endpoint}${template_name}.git";
}

def getCoreRepoCloneUrl(repo_name) {
    return "${scm_protocol}${scm_config.REPOSITORY.BASE_URL}/scm/${scm_config.REPOSITORY.REPO_BASE_PLATFORM}/${repo_name}.git"
}

return this