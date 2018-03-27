#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
echo "Utility module loaded successfully"

@Field def g_url

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
getAPIId takes api Id mapping document and a config object to return an API Id
*/

def getAPIId(apiIdMapping, config) {
	return getAPIId(apiIdMapping, config["domain"], config["service"])
}

def getAPIId(apiIdMapping, namespace, service) {
	if (!apiIdMapping) {
		error "No mapping document provided to lookup API Id!!"
	}

	if (apiIdMapping["${namespace}_${service}"]) {
		return apiIdMapping["${namespace}_${service}"];
	}else if (apiIdMapping["${namespace}_*"]) {
		return apiIdMapping["${namespace}_*"];
	}else {
		apiIdMapping["*"];
	}   
}

/**
getAPIIdForCore is a helper method to get apiId for jazz core services
*/
def getAPIIdForCore(apiIdMapping) {
	return getAPIId(apiIdMapping, "jazz", "*")
}

return this
