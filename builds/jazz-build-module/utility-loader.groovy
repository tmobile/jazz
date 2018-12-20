#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
import static java.util.UUID.randomUUID
import jenkins.security.*

echo "Utility module loaded successfully"


@Field def config_loader



def initialize(configLoader){
	setConfigLoader(configLoader)
}


/**
 * Generate a unique name for S3 bucket for deploying website
 *
 */

def generateBucketNameForService(domain, service) {
	def bucketName
	def _hash
	if (service) {
		bucketName = service
		if (domain) {
			bucketName = domain + "-" + bucketName
		}
		try {
			def rd = sh(script: "openssl rand -hex 4", returnStdout:true).trim()
			if (rd && rd.length() == 8) {
				_hash = rd
			} else {
				error "OpenSSL failed to generate a valid hash"
			}
		} catch (ex) {
			_hash = sh(script: "echo \${RANDOM}", returnStdout:true).trim()
		}
	}
	if (_hash) {
		bucketName = bucketName + "-" + _hash
	}
	if (bucketName) {
		return bucketName.toLowerCase()
	} else {
		error "Could not generate bucket name for service"
	}
}

/**
 * Get bucket name for environment
 * @param stage environment
 * @return  folder name
 */
def getBucket(stage) {
	if (stage == 'dev') {
		return config_loader.JAZZ.S3.WEBSITE_DEV_BUCKET
	} else if (stage == 'stg') {
		return config_loader.JAZZ.S3.WEBSITE_STG_BUCKET
	} else if (stage == 'prod') {
		return config_loader.JAZZ.S3.WEBSITE_PROD_BUCKET
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
* Get Request Id
* @return
*/
def generateRequestId() {
	UUID uuid = UUID.randomUUID()
	return uuid.toString()
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
	return getAPIId(apiIdMapping, config['domain'], config['service'])
}

def getAPIId(apiIdMapping, namespace, service) {
	if (!apiIdMapping) {
		error "No mapping document provided to lookup API Id!!"
	}

	if (apiIdMapping["${namespace}_${service}"]) {
		return apiIdMapping["${namespace}_${service}"];
	} else if (apiIdMapping["${namespace}_*"]) {
		return apiIdMapping["${namespace}_*"];
	} else {
		apiIdMapping["*"];
	}
}

@NonCPS
def generateAssetMap(provider, providerId, type, service_config) {

	def serviceCtxMap = [
		service_type: service_config['type'],
		provider: provider,
		provider_id: providerId,
		type: type,
		created_by: service_config['created_by']
	]
	return serviceCtxMap;
}

def getAssets(assets_api, auth_token, service_config, env) {
  def assets
  try{
      assets = sh (
      script: "curl GET  \
			-H \"Content-Type: application/json\" \
			-H \"Authorization: $auth_token\" \
			\"${assets_api}?domain=${service_config['domain']}&service=${service_config['service']}&environment=${env}\"",
      returnStdout: true
    ).trim()
    echo "Asset details for the service: ${service_config['service']} and domain: ${service_config['domain']} : \n $assets"
  } catch(ex) {
      echo "Exception occured while getting the assets. $ex"
  }
  return assets
}
/**
getAPIIdForCore is a helper method to get apiId for jazz core services
*/
def getAPIIdForCore(apiIdMapping) {
	return getAPIId(apiIdMapping, "jazz", "*")
}

/**
 * Set config_loader
 * @return
 */
def setConfigLoader(configLoader) {
	config_loader = configLoader
}

def getApiToken(){
	withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.JENKINS.CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]){
		User u = User.get(UNAME)
		ApiTokenProperty t = u.getProperty(ApiTokenProperty.class)
		def token = t.getApiToken()
		return token
	}
}

return this
