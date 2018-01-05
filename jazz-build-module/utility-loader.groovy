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


return this
