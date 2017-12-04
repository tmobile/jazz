#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
echo "Utility module loaded successfully"

@Field def g_url

/**
 * For all utility or common functions which can be used across all build packs
 * @author: Deepu Sundaresan(DSundar3)
 * @date: Monday, October 28, 2017
 *
 */


/**
 * Initialize the module. Implement this method if there are any initializations to be done.
 */
//def initialize(serviceType, service, domain) {
//}

/**
 * Set URL
 * @return
 */
def setUrl(url) {
	g_url = url
}


/**
 * Generate a unique name for S3 bucket for deploying website
 *
 */
def generateBucketNameForService(domain, service) {
	def bucketName
	def _hash
	if(service) {
		bucketName = service
		if(domain) {
			bucketName = domain+"-"+bucketName
		}
		try {
			def rd = sh(script: "openssl rand -hex 4", returnStdout:true).trim()
			if(rd && rd.length() == 8){
				_hash = rd
			} else {
				error "OpenSSL failed to generate a valid hash"
			}
		} catch(ex) {
			_hash = sh(script: "echo \${RANDOM}", returnStdout:true).trim()
		}
	}
	if(_hash) {
		bucketName = bucketName+"-"+_hash
	}
	if(bucketName) {
		return bucketName.toLowerCase()
	} else {
		error "Could not generate bucket name for service"
	}
}



/**
 * For getting token to access catalog APIs.
 * Usually a service account which has access to all services
 */
 //Dstart
 /*def getAuthToken(user, pwd) {
	def login_json = []
	def authToken = null

	login_json = [
			'username': user,
			'password': pwd
		]

	def payload = JsonOutput.toJson(login_json)


	try {
		def tokenOutput = sh (script: "curl  -X POST  -k -v \
			-H \"Content-Type: application/json\" \
			 $g_url \
			-d \'${payload}\'", returnStdout:true)

		if(tokenOutput) {
			def tokenObj = parseJson(tokenOutput)
			if(tokenObj && tokenObj.data && tokenObj.data.token) {
				authToken = tokenObj.data.token
			}
		}
		return authToken
	}
	catch(e){
		error "error occured while getting auth token: " + e.getMessage()
	}

 } Dend*/


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


return this;
