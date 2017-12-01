#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
@Field def Util
echo "Environment and deployment metadata module loaded successfully"



/**
 * The environment-deployment loader module. This module will load all environment and deployment related  metadata from respective  tables or Apis 
 * get it ready for Jenkins builds. It loads data for all service types. 
 * @author: Sidd(SDutta7)
 * @date: Monday, October 2, 2017
*/
@Field def g_login_token


@Field def g_service_domain
@Field def g_service_name
@Field def g_service_type


@Field def g_git_commit_hash
@Field def g_git_commit_url
@Field def g_git_username
@Field def g_git_password
@Field def g_git_token

@Field def g_build_url
@Field def g_build_id

@Field def g_environment_logical_id
@Field def g_environment_endpoint






/**
 * Initialize the module
 */
def initialize(serviceType, service, domain, branch, buildUrl, buildId) {
	setServiceType(serviceType)
	setDomain(domain)
	setService(service)
	setBranch(branch)
	setBuildId(buildId)
	setBuildUrl(buildUrl)
}

/**
 * Set the git credentials
 */
def setGitCredentials(username, password) {
	setGitUserName(username)
	setGitPassword(password)
}




def getRepoCommitHash() {

	if(g_git_commit_hash == null) {
		//def git_token = getGitToken()
		g_git_commit_hash = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
	}
	echo "SCM_Commit_Hash:$g_git_commit_hash"
	return g_git_commit_hash
	
}

def getRepoURL() {

	if(g_git_commit_url == null) {
		def GIT_REPO_BASE_URL= "https://bitbucket.corporate.t-mobile.com/scm/cas/"
		def bitbucket_service_id
		if (g_service_domain && g_service_domain.trim()!="") {
			bitbucket_service_id = g_service_domain.trim() + "_" + g_service_name.trim()
		} else{
			bitbucket_service_id = g_service_name.trim()
		}
		def repoUrl = GIT_REPO_BASE_URL + bitbucket_service_id + ".git"
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

		def API_ENVIRONMENT_URL= "https://cloud-api.corporate.t-mobile.com/api/jazz/environments"
		def API_ENVIRONMENT_QUERY_URL = "$API_ENVIRONMENT_URL" +  "?service=" + g_service_name + "&domain=" + g_service_domain

		def getEnvironments = sh (script: "curl -H \"Content-type: application/json\" -H \"Authorization:\"$token -X GET \"$API_ENVIRONMENT_URL?service=$g_service_name&domain=$g_service_domain\" ", returnStdout: true).trim()

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


 
def generateEnvironmentMap(status, environment_logical_id) {

	def env_logical_id
	if(environment_logical_id == null) {
		env_logical_id = getEnvironmentLogicalId()
	} else {
		env_logical_id = environment_logical_id
	}

	def serviceCtxMap = [
		status: status,
		domain: g_service_domain,
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
		domain: g_service_domain,
    	provider_build_url:  g_build_url,
    	provider_build_id: g_build_id,
    	scm_commit_hash:  getRepoCommitHash(),
    	scm_url:  getRepoURL(),
    	scm_branch: g_service_branch
	]
	return serviceCtxMap;
}

def generateDeleteDeploymentMap() {

	def serviceCtxMap = [
		domain: g_service_domain,
    	provider_build_url:  g_build_url,
    	provider_build_id: g_build_id
 	]
	return serviceCtxMap;
}



/**
 * For getting token to access authenticated catalog APIs.
 * Must be a service account which has access to all services
 */
 def setCredentials(user, pwd) {
	def authToken = null
	try {
		authToken = Util.getAuthToken(user, pwd)
		if(authToken) {
			setAuthToken(authToken)
		}else {
			error "Could not generate Auth token for API access"
		}
	}
	catch(e){
		error "error occured: " + e.getMessage()
	}	

 }

 /**
 * For setting token to access Bitbucket APIs.
 */
 def getGitToken() {
	try {

		if(g_git_token == null) {
			def gitToken = "Basic " + g_git_username.bytes.encodeBase64().toString() + ":" + g_git_password.bytes.encodeBase64().toString()
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

		def GIT_REPO_API_URL = "https://bitbucket.corporate.t-mobile.com/rest/api/1.0/projects/CAS/repos/"

		echo "[Metadata] g_service_domain : $g_service_domain"
		echo "[Metadata] g_service_name : $g_service_name"
		
		def repoUrl = GIT_REPO_API_URL + g_service_domain + "_" + g_service_name + "/commits/" + getRepoCommitHash()
		echo "[Metadata] Repository URL: $repoUrl"

		def bitbucketCommitResponse

		withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: env.GIT_CREDENTIALS_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
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

	echo "g_service_domain...$g_service_domain"
	echo "g_service_name...$g_service_name"
	echo "g_service_type...$g_service_type"
	echo "g_git_commit_hash...$g_git_commit_hash"
	echo "g_git_commit_url...$g_git_commit_url"
	echo "g_git_username...$g_git_username"
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
 * Set Branch
 * @return      
 */
def setBranch(branch) {
	g_service_branch = branch
	
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
def setService(service) {
	g_service_name = service
	
}

/**
 * Set Service
 * @return      
 */
def setAuthToken(token) {
	g_login_token = token
	
}

/**
 * Set Service
 * @return      
 */
def setGitUserName(username) {
	g_git_username = username
	
}


/**
 * Set Service
 * @return      
 */
def setGitPassword(password) {
	g_git_password = password
	
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



return this;