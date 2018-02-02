#!groovy?
import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* Module that handles managing projects (create, delete) in the user's preferred scm
*/

@Field def scm
@Field def repo_base
@Field def gitlab_private_token

@Field def scm_core_services_endpoint
@Field def scm_user_services_api_endpoint
@Field def scm_user_services_clone_url
@Field def scm_webhook_api
@Field def scm_branch_permission_api_endpoint

@Field def serviceonboarding_repo
@Field def config
@Field def scm_protocol	= "http://"

def initialize(config){
    config = config
    setRepoEndpoints()
}

def setRepoEndpoints(){
	
    if (config.JAZZ_SCM == 'bitbucket'){
		scm_user_services_api_endpoint = = "${scm_protocol}${config.REPOSITORY.REPO_BASE}/rest/api/1.0/projects/${config.REPOSITORY.REPO_LOC}/repos"
        scm_core_services_endpoint = "${scm_protocol}${config.REPOSITORY.REPO_BASE}/scm/${config.REPOSITORY.REPO_CORE}/" 
        scm_user_services_clone_url = "${configLoader.REPOSITORY.REPO_BASE}/scm/${configLoader.REPOSITORY.REPO_LOC}/"
        scm_webhook_api = "${scm_protocol}${configLoader.REPOSITORY.REPO_BASE}/rest/webhook/1.0/projects/${configLoader.REPOSITORY.REPO_LOC}/repos/"
        scm_branch_permission_api_endpoint =  "${scm_protocol}${configLoader.REPOSITORY.REPO_BASE}/rest/branch-permissions/2.0/projects/${configLoader.REPOSITORY.REPO_LOC}/repos/"
        serviceonboarding_repo 	= "${scm_protocol}${configLoader.REPOSITORY.REPO_BASE}/scm/${config.REPOSITORY.REPO_CORE}/service-onboarding-build-pack.git"
	}
}

def createProject(repo_owner, repo_name){
    try { 
        if(config.JAZZ_SCM == "gitlab") {
            def git_username
            def cas_proj_id
            def cas_repo_id
            
            //assuming usernames for now are a concatenation of the user's email, check platform_usermanagement index.js
            if(repo_owner.contains("@")){
                git_username = repo_owner.substring(0, owner.indexOf("@"))
            }

            def user_id = getGitlabUserId(git_username, ${config.GITLAB.gitlab_private_token})
            
            def gitlab_repo_output = sh (
                script: "curl --header \"Private-Token: ${config.GITLAB.gitlab_private_token}\" -X POST \"http://${configLoader.REPOSITORY.REPO_BASE}/api/v3/projects/user/$user_id?name=$repo_name&path=$repo_name&visibility=private&request_access_enabled=true\"",
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
        else if(config.JAZZ_SCM == "bitbucket"){
            sh "curl -X POST -k -v -u \"${config.BITBUCKET.BITBUCKET_USERNAME}:${config.BITBUCKET.BITBUCKET_PASSWORD}\" -H \"Content-Type: application/json\" " + scm_user_services_api_endpoint + " -d \'{\"name\":\""+ repo_name +"\", \"scmId\": \"git\", \"forkable\": \"true\"}\'"
        }else {
            error "Invalid scm type ${config.JAZZ_SCM}" 
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
            script: "curl --header \"Private-Token: ${config.GITLAB.gitlab_private_token}\" -X GET \"http://${configLoader.REPOSITORY.REPO_BASE}/api/v3/users?username=$gitlab_username\"",
            returnStdout: true
        ).trim()
  
        def jsonSlurper = new JsonSlurper()
        def userObject = jsonSlurper.parseText(output)
  
        if(userObject == null || userObject.equals("") || userObject[0] == null || userObject[0].equals("") 
            || userObject[0].id == null || userObject[0].id.equals("")){
                error "get user data in gitlab failed"
        }
        
        return userObject[0].id
    }
    catch (ex) {
            if(!((ex.getMessage()).indexOf("groovy.json.internal.LazyMap") > -1)) {
                echo "getGitlabUserId Failed"
                error "getGitlabUserId Failed. "+ex.getMessage()
            }
        }
}

def getCasRepoId(repo_loc){
    try{
        def output = sh (
            script: "curl --header \"Private-Token: ${config.GITLAB.gitlab_private_token}\" -X GET \"http://${configLoader.REPOSITORY.REPO_BASE}/api/v3/groups?search=$repo_loc\"",
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
        if(!((ex.getMessage()).indexOf("groovy.json.internal.LazyMap") > -1)) {
            echo "getCasRepoId Failed"
            error "getCasRepoId Failed. "+ex.getMessage()
        }
    }
}

def transferProject(cas_id, project_id){
  	def output = sh (
  		script: "curl --header \"Private-Token: ${config.GITLAB.gitlab_private_token}\" -X POST \"http://${configLoader.REPOSITORY.REPO_BASE}/api/v3/groups/$cas_id/projects/$project_id\"",
  		returnStdout: true
  	).trim()
}

def setBranchPermissions(repo_name) {
    checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: ${config.REPOSITORY.REPO_CREDENTIAL_ID}, url: serviceonboarding_repo]]])
	sh "curl -X POST -k -v -u \"$UNAME:$PWD\" -H \"Content-Type: application/vnd.atl.bitbucket.bulk+json\" ${scm_branch_permission_api_endpoint}${repo_name}/restrictions   -d \"@branch_permissions_payload.json\"  "
}
/**
 * Delete the project repository from scm
 * @param  scm_repo_name
 * @return
 */
def deleteProject(repo_loc, scm_repo_name, cas_rest_repo) {
    if(config.JAZZ_SCM == "gitlab"){
        def encodedProjectPath = repo_loc + "%2F" + scm_repo_name
        def gitlab_repo_output = sh (
            script: "curl --header \"Private-Token: ${config.GITLAB.gitlab_private_token}\" -X POST \"http://${configLoader.REPOSITORY.REPO_BASE}/api/v3/projects/$encodedProjectPath\"",
            returnStdout: true
        ).trim()
    }
    else if(config.JAZZ_SCM == "bitbucket"){
        def repourl = cas_rest_repo + scm_repo_name;
        def outputStr = sh (
            script: "curl -X DELETE -k -u \"$bitbucket_admin:$bitbucket_admin_password\" '" + cas_rest_repo + scm_repo_name +"'" ,
            returnStdout: true
        ).trim()
    }else {
        error "Invalid scm type ${config.JAZZ_SCM}" 
    }
}

def getRepoUrl(repo_name) {
    if (scm == 'bitbucket'){
        return "${scm_protocol}${config.REPOSITORY.REPO_BASE}/projects/${config.REPOSITORY.REPO_LOC}/repos/${repo_name}/browse";
    }
}

return this