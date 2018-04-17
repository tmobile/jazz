#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
@Field def Util

echo "Environment and deployment metadata module loaded successfully"

/**
 * The environment-deployment loader module. This module will load all environment and deployment related  metadata from respective  tables or Apis 
 * get it ready for Jenkins builds. It loads data for all service types. 
*/


@Field def g_login_token
@Field def service_config
@Field def config_loader
@Field def scm_module
@Field def g_service_branch 
@Field def g_git_commit_hash
@Field def g_git_commit_url
@Field def g_git_token
@Field def g_build_url
@Field def g_build_id
@Field def g_environment_logical_id
@Field def g_environment_endpoint
@Field def g_request_id
@Field def g_base_url

@Field def GIT_REPO_BASE_URL= "https://bitbucket.corporate.t-mobile.com/scm/cas/"

/**
 * Initialize the module
 */
def initialize(service_config, config_loader, scm_module,branch, buildUrl, buildId,baseUrl) {
	setServiceConfig(service_config)
	setServiceConfig(scm_module)
	setConfigLoader(config_loader)
	setBranch(branch)
	setBuildId(buildId)
	setBuildUrl(buildUrl)
	setBaseUrl(baseUrl)
}


def getRepoCommitHash() {
	if(g_git_commit_hash == null) {
		g_git_commit_hash = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
	}
	echo "SCM_Commit_Hash:$g_git_commit_hash"
	return g_git_commit_hash
	
}

def getRepoURL() {
	if(g_git_commit_url == null) {
		def bitbucket_service_id
		if (service_config['domain'] && service_config['domain'].trim()!="") {
			bitbucket_service_id = service_config['domain'].trim() + "_" + service_config['service'].trim()
		} else{
			bitbucket_service_id = service_config['service'].trim()
		}

		if(service_config['domain'] && service_config['domain'] == "jazz"){
			repoUrl = scmModule.getCoreRepoUrl(bitbucket_service_id)
		}else{
			repoUrl = scmModule.getRepoUrl(bitbucket_service_id)
		}
		echo "GIT Repository URL: $repoUrl"
		g_git_commit_url = repoUrl
	} 
	echo "SCM_Commit_URL:$g_git_commit_url"
	return g_git_commit_url
}

def getEnvironmentLogicalId() {
	if(g_environment_logical_id == null) {
		def token = g_login_token
		echo "Access Token: $token"

		def API_ENVIRONMENT_QUERY_URL = "${g_base_url}?service=${service_config['service']}&domain=${service_config['domain']}"

		def getEnvironments = sh (script: "curl -H \"Content-type: application/json\" -H \"Authorization:\"$token -X GET \"${g_base_url}?service=${service_config['service']}&domain=${service_config['domain']}\" ", returnStdout: true).trim()

		def environmentOutput
		def environment_logical_id
		if(getEnvironments != null) {
			try {
				environmentOutput = parseJson(getEnvironments)
			} catch (ex) {
				error ex.getMessage()
			}

			if(environmentOutput != null && environmentOutput.data != null && environmentOutput.data.environment != null) {	
				for(environment in environmentOutput.data.environment) {
					if(environment.physical_id.equals(g_service_branch)){
						environment_logical_id = environment.logical_id
						break;
					}
				}
			}
		}
		g_environment_logical_id = environment_logical_id
	}
	echo "Environment_Logical_Id: $g_environment_logical_id"
	return g_environment_logical_id
}

/**
 * @param environment_logical_id
 */
def createPromotedEnvironment(environment_logical_id, created_by) {
	def isAvailable = checkIfEnvironmentAvailable(environment_logical_id)
	
	if(!isAvailable) { // create a new environment
		try {
			
			def params = [
				  "service": service_config['service'],
				  "domain": service_config['domain'],
				  "status": "deployment_started",
				  "created_by": created_by,
				  "physical_id": g_service_branch,
				  "logical_id": environment_logical_id
			]
			def payload = JsonOutput.toJson(params)
			//echo "payload...$payload"
			def res = sh (script: "curl -X POST \
						${g_base_url} \
						-H 'authorization: $g_login_token' \
						-H 'Content-type: application/json' \
						-d '$payload'", returnStdout: true)
			def resObj 
			//echo "resObj....$resObj"
			if(res) {
				resObj = parseJson(res)
			}
			if(resObj && resObj.data && resObj.data.result && resObj.data.result == "success") {
				g_environment_logical_id = environment_logical_id
				
			} else {
				error "Invalid response from environment API"
			}
				
		} catch (ex) {
			error "Could not create environment for logical_id $environment_logical_id due to "+ex.getMessage()
		}
		
	} else {
		g_environment_logical_id = environment_logical_id
		
	}
	
	
}

/**
 * Method to check an env is created with same logical id
 * @param environment = logical_id
 */
def checkIfEnvironmentAvailable(environment_logical_id) {
	
	def isAvailable = false
	try {
		if(environment_logical_id) {
			def token = g_login_token
			def API_ENVIRONMENT_QUERY_URL = "${g_base_url}?service=${service_config['service']}&domain=${service_config['domain']}"
			def getEnvironments = sh (script: "curl -H \"Content-type: application/json\" -H \"Authorization:\"$token -X GET \"${g_base_url}?service=$s{ervice_config['service']}&domain=${service_config['domain']}\" ", returnStdout: true).trim()

			//echo "getEnvironments... $getEnvironments"
			def environmentOutput
			if(getEnvironments) {
				environmentOutput = parseJson(getEnvironments)
				if(environmentOutput && environmentOutput.data && environmentOutput.data.environment) {	
					for(environment in environmentOutput.data.environment) {
						if(environment.logical_id.equals(environment_logical_id)){
							isAvailable = true
							break;
						}
					}
				}
			}
		}
		return isAvailable
	
	} catch(ex) {
		error "checkIfEnvironmentAvailable Failed for "+ex.getMessage()
	}
	
}


def getEnvironmentLogicalIds() {
	def env_logical_ids = []
	try {
		def environment_data = sh (script: "curl GET  \
			-H \"Content-Type: application/json\" \
			-H \"Authorization: $g_login_token\" \
			\"${g_base_url}?domain=${service_config['domain']}&service=${service_config['service']}\"", returnStdout: true)
		if(environment_data) {
			def environment_dataObj = parseJson(environment_data)
			if(environment_dataObj && environment_dataObj.data && environment_dataObj.data.environment) {
				def env_collection = environment_dataObj.data.environment
				if(env_collection.size() > 0){
					for(_env in env_collection){
						if( _env.status != 'archived' ){
							env_logical_ids.push(_env.logical_id)
						}
					}
				}
			}
		}
        return env_logical_ids
	}
	catch(e){
		echo "error occured while fetching environment id list: " + e.getMessage()
		return env_logical_ids
	}
}

def getEnvironmentBranchName(logical_id) {
	def branchName
	try {
		def environment_data = sh (script: "curl GET  \
			-H \"Content-Type: application/json\" \
			-H \"Authorization: $g_login_token\" \
			\"${g_base_url}?domain=${service_config['domain']}&service=${service_config['service']}\"", returnStdout: true)
		if(environment_data) {
			def environment_dataObj = parseJson(environment_data)
			if(environment_dataObj && environment_dataObj.data && environment_dataObj.data.environment) {
				def env_collection = environment_dataObj.data.environment
				if(env_collection.size() > 0){
					for(_env in env_collection){
						if( _env.logical_id == logical_id ){
							branchName = _env.physical_id
						}
					}
				}
			}
		}
        return branchName
	}
	catch(e){
		echo "error occured while finding branch name of $logical_id: " + e.getMessage()
		return branchName
	}
}
 
def generateEnvironmentMap(status, environment_logical_id) {

	def env_logical_id
	if(environment_logical_id == null) {
		env_logical_id = getEnvironmentLogicalId()
	} else {
		env_logical_id = environment_logical_id
	}

	def serviceCtxMap = [
		status: status,
		domain: service_config['domain'],
		branch: g_service_branch,
		logical_id: env_logical_id		
	]
	if(g_environment_endpoint != null) {
		serviceCtxMap.endpoint = g_environment_endpoint
	}

	return serviceCtxMap;
}

def generateDeploymentMap(status, environment_logical_id) {

	def env_logical_id
	if(environment_logical_id == null) {
		env_logical_id = getEnvironmentLogicalId()
	} else {
		env_logical_id = environment_logical_id
	}

	def serviceCtxMap = [
		environment_logical_id: env_logical_id,
		status: status,
		domain: service_config['domain'],
    	provider_build_url:  g_build_url,
    	provider_build_id: g_build_id,
    	scm_commit_hash:  getRepoCommitHash(),
    	scm_url:  "${getRepoURL()}.git",
    	scm_branch: g_service_branch,
		request_id: g_request_id
	]
	return serviceCtxMap;
}

def generateDeleteDeploymentMap() {

	def serviceCtxMap = [
		domain: service_config['domain'],
    	provider_build_url:  g_build_url,
    	provider_build_id: g_build_id
 	]
	return serviceCtxMap;
}

def setCredentials(catalog_sv_account) {
	
	withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: catalog_sv_account, passwordVariable: 'Password', usernameVariable: 'Username']]) {
		setCredentials(Username, Password)
	}
}

def setGitCredentials(repo_credential_id) {
	
	withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: repo_credential_id, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
		setGitCredentials(UNAME, PWD)
	}
}

 /**
 * For setting token to access Bitbucket APIs.
 */
 def getGitToken() {
	try {

		if(g_git_token == null) {
			def gitToken = "Basic " + config_loader.SCM.USERNAME.bytes.encodeBase64().toString() + ":" + config_loader.SCM.PASSWORD.bytes.encodeBase64().toString()
			echo "Git Token: $gitToken"
			g_git_token =  gitToken
		} 
		echo "GIT Token: $g_git_token"
		return g_git_token
	}
	catch(e){
		error "error occured while generating Git token: " + e.getMessage()
	}	

 }

 def getRepoCommitterInfo() {

    def committerId = null
	if(getRepoCommitHash() != null) {		
		def repoUrl = "${getRepoURL()}/commits/${getRepoCommitHash()}"
		echo "[Metadata] Repository URL: $repoUrl"
		def bitbucketCommitResponse
		withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.REPOSITORY.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
			bitbucketCommitResponse = sh (script: "curl -k -v -u \"$UNAME:$PWD\" -H \"Content-Type: application/json\"  $repoUrl", returnStdout: true).trim()
	   }

		if(bitbucketCommitResponse != null) {
			def commitDetails = parseJson(bitbucketCommitResponse)
			if(commitDetails != null && commitDetails.author != null && commitDetails.author.name != null)  {
				committerId = commitDetails.author.name
			}
		}
	}
	echo "committerId:$committerId"
	return committerId	
}

 
 /**
  * Core dump
  */
def showState() {

	echo "service_domain...${service_config['domain']}"
	echo "service_name...${service_config['service']}"
	echo "service_type...${service_config['type']}"
	echo "g_git_commit_hash...$g_git_commit_hash"
	echo "g_git_commit_url...$g_git_commit_url"
	echo "git username...$config_loader.SCM.USERNAME"
	echo "g_build_url...$g_build_url"
	echo "g_build_id...$g_build_id"
	echo "g_environment_logical_id...$g_environment_logical_id"
	echo "g_environment_endpoint...$g_environment_endpoint"
}


 /**
  * Jazz shebang that runs quietly and disable all console logs
  *
  */
def jazz_quiet_sh(cmd) {
    sh('#!/bin/sh -e\n' + cmd)
}

/**
 * JSON parser
 */
@NonCPS
def parseJson(def json) {
    new groovy.json.JsonSlurperClassic().parseText(json)
}

/**
 * Set Service config
 * @return      
 */
def setServiceConfig(config) {
	service_config = config	
}

/**
 * Set Service config
 * @return      
 */
def setConfigLoader(configLoader) {
	config_loader = configLoader
}

/**
 * Set Scm module
 * @return      
 */
def setScmModule(scmModule){
	scm_module = scmModule
}

/**
 * Set Branch
 * @return      
 */
def setBranch(branch) {
	g_service_branch = branch
	
}

/**
 * Set Branch
 * @return      
 */
def setEnvironmentLogicalId(logical_id) {
	g_environment_logical_id = logical_id
	
}

/**
 * Set Build Url
 * @return      
 */
def setBuildUrl(build_url) {
	g_build_url = build_url
	
}

/**
 * Set Build Id
 * @return      
 */
def setBuildId(build_id) {
	g_build_id = build_id
	
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
	
}

/**
 * Set Environment Endpoint
 * @return      
 */
def setEnvironmentEndpoint(endpoint) {
	g_environment_endpoint = endpoint
}

/**
 * Set Request Id 
 * @return      
 */
def setRequestId(requestId) {
	g_request_id = requestId
}

/**
 * Set Base Url 
 * @return      
 */
def setBaseUrl(base_url) {
	g_base_url = base_url
}



return this;