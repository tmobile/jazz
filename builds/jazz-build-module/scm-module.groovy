#!groovy?
import groovy.json.JsonOutput
import groovy.transform.Field
import groovy.json.JsonSlurperClassic

/*
* Module that handles managing repos (create, delete) in the user's preferred scm
*/

def scm_core_services_endpoint
def scm_user_services_api_endpoint
def scm_user_services_clone_url
def scm_branch_permission_api_endpoint
def serviceonboarding_repo
@Field def config_loader
@Field def service_config
@Field def scm_protocol	= "http://"

def initialize(configData){
    config_loader = configData
    setRepoEndpoints()
}

def setRepoEndpoints(){
    if (config_loader.SCM.TYPE == "gitlab") {
        scm_user_services_api_endpoint = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/rest/api/1.0/projects/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        scm_core_services_endpoint = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/${config_loader.REPOSITORY.REPO_BASE_PLATFORM}/"
        scm_user_services_clone_url = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/"
        scm_branch_permission_api_endpoint = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/rest/branch-permissions/2.0/projects/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        serviceonboarding_repo = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/${config_loader.REPOSITORY.REPO_BASE_PLATFORM}/service-onboarding-build-pack.git"
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        scm_user_services_api_endpoint = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/rest/api/1.0/projects/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        scm_core_services_endpoint = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/scm/${config_loader.REPOSITORY.REPO_BASE_PLATFORM}/"
        scm_user_services_clone_url = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/scm/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/"
        scm_branch_permission_api_endpoint = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/rest/branch-permissions/2.0/projects/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        serviceonboarding_repo = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/scm/${config_loader.REPOSITORY.REPO_BASE_PLATFORM}/service-onboarding-build-pack.git"
    }
}

def createProject(repo_owner, repo_name){
    try {
        if (config_loader.SCM.TYPE == "gitlab") {

            //gitlabs username is restricted to alphanumeric and . _ - characters,
            // so using email all email characters (except -, _) replaced with -
            def gitlab_username = repo_owner.replaceAll("[^a-zA-Z0-9_-]", "-")

            def user_id = getGitlabUserId(gitlab_username)
            def user_services_group_id = getUserServicesGroupId()

            def gitlab_repo_output = sh(
                script: "curl --header \"Private-Token: ${config_loader.SCM.PRIVATE_TOKEN}\" -X POST \"http://${config_loader.REPOSITORY.BASE_URL}/api/v4/projects/user/$user_id?name=$repo_name&path=$repo_name&visibility=private&request_access_enabled=true\"",
                returnStdout: true
            ).trim()

            def repo_details = parseJson(gitlab_repo_output)

            if (repo_details == null || repo_details.equals("") || repo_details.id == null || repo_details.id.equals("")) {
                error "project creation in gitlabs failed"
            }
            repo_id = repo_details.id

            transferProject(user_services_group_id, repo_id)
        } else if (config_loader.SCM.TYPE == "bitbucket") {
           withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
            sh "curl -X POST -k -v -u \"${UNAME}:${PWD}\" -H \"Content-Type: application/json\" " + scm_user_services_api_endpoint + " -d \'{\"name\":\"" + repo_name + "\", \"scmId\": \"git\", \"forkable\": \"true\"}\'"
           }
        }
    } catch (ex) {
        echo "createProject failed: " + ex.toString()
        error "createProject failed: "+ ex.getMessage()
    }
}

def getGitlabUserId(gitlab_username){
    try {
        def output = sh(
            script: "curl --header \"Private-Token: ${config_loader.SCM.PRIVATE_TOKEN}\" -X GET \"http://${config_loader.REPOSITORY.BASE_URL}/api/v4/users?username=$gitlab_username\"",
            returnStdout: true
        ).trim()

        def jsonSlurper = new groovy.json.JsonSlurperClassic()
        def userObject = jsonSlurper.parseText(output)

        if (userObject == null || userObject.equals("") || userObject[0] == null || userObject[0].equals("")
            || userObject[0].id == null || userObject[0].id.equals("")) {
            error "get user data in gitlab failed"
        }

        return userObject[0].id
    }
    catch (ex) {
        error "getGitlabUserId failed: " + ex.getMessage()
    }
}

def getUserServicesGroupId(){
    try {
        def output = sh(
            script: "curl --header \"Private-Token: ${config_loader.SCM.PRIVATE_TOKEN}\" -X GET \"http://${config_loader.REPOSITORY.BASE_URL}/api/v4/groups?search=${config_loader.REPOSITORY.REPO_BASE_SERVICES}\"",
            returnStdout: true
        ).trim()

        def jsonSlurper = new groovy.json.JsonSlurperClassic()
        def groupObject = jsonSlurper.parseText(output)

        if (groupObject == null || groupObject.equals("") || groupObject[0] == null || groupObject[0].equals("")
            || groupObject[0].id == null || groupObject[0].id.equals("")) {
            error "Unable to find the user services group id "
        }

        return groupObject[0].id
    } catch (ex) {
        error "getUserServicesGroupId failed: "+ ex.getMessage()
    }
}

def getGitLabsProjectId(repo_name) {
    try {
        def output = sh(
            script: "curl --header \"Private-Token: ${config_loader.SCM.PRIVATE_TOKEN}\" -X GET \"http://${config_loader.REPOSITORY.BASE_URL}/api/v4/projects?search=${repo_name}\"",
            returnStdout: true
        ).trim()

        def jsonSlurper = new groovy.json.JsonSlurperClassic()
        def projectObject = jsonSlurper.parseText(output)

        if (projectObject == null || projectObject.equals("") || projectObject[0] == null || projectObject[0].equals("")
            || projectObject[0].id == null || projectObject[0].id.equals("")) {
            error "getGitLabsProjectId failed to find project with name $repo_name"
        }

        return projectObject[0].id
    } catch (ex) {
        error "getGitLabsProjectId failed: "+ ex.getMessage()
    }
}

def transferProject(cas_id, project_id){
    try {
        sh "curl --header \"Private-Token: ${config_loader.SCM.PRIVATE_TOKEN}\" -X POST \"http://${config_loader.REPOSITORY.BASE_URL}/api/v4/groups/$cas_id/projects/$project_id\""
    } catch (ex) {
        echo "transferProject failed: "+ ex.getMessage()
    }
}

def setBranchPermissions(repo_name) {
    if (config_loader.SCM.TYPE == "gitlab") {
        def proj_id = getGitLabsProjectId(repo_name)
        sh "curl --request DELETE --header \"PRIVATE-TOKEN: ${config_loader.SCM.PRIVATE_TOKEN}\" \"${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/api/v4/projects/$proj_id/protected_branches/master\""
        sh "curl --request POST --header \"PRIVATE-TOKEN: ${config_loader.SCM.PRIVATE_TOKEN}\" \"${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/api/v4/projects/$proj_id/protected_branches?name=master&push_access_level=0\""
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, url: serviceonboarding_repo]]])
        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
        sh "curl -X POST -k -v -u \"${UNAME}:${PWD}\"  -H \"Content-Type: application/vnd.atl.bitbucket.bulk+json\" ${scm_branch_permission_api_endpoint}${repo_name}/restrictions -d \"@branch_permissions_payload.json\"  "
        }
    }
}

def setRepoPermissions(repo_owner, repo_name, admin_group) {
    if (config_loader.SCM.TYPE == "gitlab") {

    } else if (config_loader.SCM.TYPE == "bitbucket") {
        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
          def addGpOutputStr = sh(
              script: "curl -X PUT -G -k -v -u \"${UNAME}:${PWD}\" -d \"name=$admin_group\" \"${scm_user_services_api_endpoint}${repo_name}/permissions/groups?permission=REPO_ADMIN&\"",
              returnStdout: true
          ).trim()

          def encoded_creator = URLEncoder.encode(repo_owner, "utf-8")
          def repoPermissionOutputStr = sh(
              script: "curl -X PUT -G -k -v -u \"${UNAME}:${PWD}\" -d \"name=$encoded_creator\" \"${scm_user_services_api_endpoint}${repo_name}/permissions/users?permission=REPO_ADMIN\"",
              returnStdout: true
          ).trim()

        }
    }
}

def addWebhook(repo_name, webhookName, scm_webhook_target_url) {
    if (config_loader.SCM.TYPE == "gitlab") {
        def proj_id = getGitLabsProjectId(repo_name)
        def scm_webhook_api = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/api/v4/projects/${proj_id}/hooks?enable_ssl_verification=false&push_events=true&tag_push_events=true&note_events=true&merge_requests_events=true&url="
        sh "curl --header \"Private-Token: ${config_loader.SCM.PRIVATE_TOKEN}\" -X POST \"${scm_webhook_api}$scm_webhook_target_url\""
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        def scm_webhook_api = "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/rest/webhook/1.0/projects/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/repos/"
        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
         sh "curl -X PUT -k -v -u \"${UNAME}:${PWD}\" -H \"Content-Type: application/json\" ${scm_webhook_api}${repo_name}/configurations  -d \'{\"title\": \"${webhookName}\", \"url\": \"${scm_webhook_target_url}\" , \"enabled\": true}\'"
        }
    }
}

def deleteProject(repo_name) {
    if (config_loader.SCM.TYPE == "gitlab") {
        def proj_id = getGitLabsProjectId(repo_name)
        def gitlab_repo_delete_output = sh(
            script: "curl --header \"Private-Token: ${config_loader.SCM.PRIVATE_TOKEN}\" -X DELETE \"http://${config_loader.REPOSITORY.BASE_URL}/api/v4/projects/${proj_id}\"",
            returnStdout: true
        ).trim()
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
          def outputStr = sh(
              script: "curl -X DELETE -k -u \"${UNAME}:${PWD}\" '" + scm_user_services_api_endpoint + repo_name + "'",
              returnStdout: true
          ).trim()
        }
    }
}

def getRepoUrl(repo_name) {
    if (config_loader.SCM.TYPE == "gitlab") {
        return "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/${repo_name}";
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        return "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/projects/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/repos/${repo_name}";
    }
}

def getRepoCloneUrl(repo_name) {
    if (config_loader.SCM.TYPE == "gitlab") {
        return "${scm_user_services_clone_url}${repo_name}.git"
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        return "${scm_user_services_clone_url}${repo_name}.git"
    }
}

def getRepoCloneBaseUrl(repo_name) {
    if (config_loader.SCM.TYPE == "gitlab") {
        return "${config_loader.REPOSITORY.BASE_URL}/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/${repo_name}.git"
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        return "${config_loader.REPOSITORY.BASE_URL}/scm/${config_loader.REPOSITORY.REPO_BASE_SERVICES}/${repo_name}.git"
    }
}

def getRepoProtocol() {
    return "${scm_protocol}"
}

def getTemplateUrl(template_name) {
    if (config_loader.SCM.TYPE == "gitlab") {
        return "${scm_core_services_endpoint}${template_name}.git";
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        return "${scm_core_services_endpoint}${template_name}.git";
    }
}

def getCoreRepoUrl(repo_name) {
    if (config_loader.SCM.TYPE == "gitlab") {
        return "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/${config_loader.REPOSITORY.REPO_BASE_PLATFORM}/${repo_name}";
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        return "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/projects/${config_loader.REPOSITORY.REPO_BASE_PLATFORM}/repos/${repo_name}";
    }
}

def getCoreRepoCloneUrl(repo_name) {
    if (config_loader.SCM.TYPE == "gitlab") {
        return "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/${config_loader.REPOSITORY.REPO_BASE_PLATFORM}/${repo_name}.git"
    } else if (config_loader.SCM.TYPE == "bitbucket") {
        return "${scm_protocol}${config_loader.REPOSITORY.BASE_URL}/scm/${config_loader.REPOSITORY.REPO_BASE_PLATFORM}/${repo_name}.git"
    }
}

def setServiceConfig(serviceConfig){
    service_config = serviceConfig
}

@NonCPS
def parseJson(jsonString) {
    def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
    def m = [:]
    m.putAll(lazyMap)
    return m
}

def getRepoCommitHash() {
    dir(getRepoName()) {
        return sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
    }
}

def getRepoName(){
    def repo_name
    if (service_config['domain'] && service_config['domain'].trim() != "") {
        repo_name = service_config['domain'].trim() + "_" + service_config['service'].trim()
    } else {
        repo_name = service_config['service'].trim()
    }
    return repo_name
}

def getRepoURL() {
    def repo_name = getRepoName()
    if (service_config['domain'] && service_config['domain'] == "jazz") {
        repoUrl = getCoreRepoUrl(repo_name)
    } else {
        repoUrl = getRepoUrl(repo_name)
    }
    echo "SCM_Commit_URL:$repoUrl"
    return repoUrl
}

def getRepoCommitterInfo(commitHash) {
    def committerId = null
    if (commitHash) {
        if (config_loader.SCM.TYPE == "gitlab") {
            def repo_name = getRepoName()
            def proj_id = getGitLabsProjectId(repo_name)
            def scm_commit_api = "http://${config_loader.REPOSITORY.BASE_URL}/api/v4/projects/${proj_id}/repository/commits/${commitHash}"
            scmCommitResponse = sh(script: "curl --header \"Private-Token: ${config_loader.SCM.PRIVATE_TOKEN}\"  \"${scm_commit_api}\"", returnStdout: true).trim()
            if (scmCommitResponse != null) {
                def commitDetails = parseJson(scmCommitResponse)
                if (commitDetails != null) {
                    committerId = commitDetails.author_name
                }
            }
        } else if (config_loader.SCM.TYPE == "bitbucket") {
            def repoBase
            if (service_config['domain'] == 'jazz') {
                repoBase = config_loader.REPOSITORY.REPO_BASE_PLATFORM
            } else {
                repoBase = config_loader.REPOSITORY.REPO_BASE_SERVICES
            }
            def scm_commit_api = "http://${config_loader.REPOSITORY.BASE_URL}/rest/api/1.0/projects/${repoBase}/repos/${getRepoName()}"
            def repoUrl = "${scm_commit_api}/commits/${commitHash}"
            echo "[Metadata] Repository URL: $repoUrl"
            def scmCommitResponse
            withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
                scmCommitResponse = sh(script: "curl -k -v -u \"$UNAME:$PWD\" -H \"Content-Type: application/json\"  $repoUrl", returnStdout: true).trim()
            }
            if (scmCommitResponse != null) {
                def commitDetails = parseJson(scmCommitResponse)
                if (commitDetails != null && commitDetails.author != null && commitDetails.author.name != null) {
                    committerId = commitDetails.author.name
                }
            }
        }

        return committerId
    }
}

return this
