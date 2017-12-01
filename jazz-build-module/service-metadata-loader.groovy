#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
@Field def Util
echo "Service metadata module loaded successfully"



/**
 * The service metadata loader module. This module will load all service metadata from respective catalog tables and 
 * get it ready for Jenkins builds. It loads data for all service types. 
 * @author: Deepu Sundaresan(DSundar3)
 * @date: Monday, October 2, 2017
*/

@Field def g_login_token

@Field def g_service_id
@Field def g_service_created_by
@Field def g_service_description
@Field def g_service_domain
@Field def g_service_email
@Field def g_service_name
@Field def g_service_region
@Field def g_service_repository
@Field def g_service_runtime
@Field def g_service_status
@Field def g_service_tags
@Field def g_service_type
@Field def g_timestamp

/* Assets schema */
// @Field def g_asset_created_by
// //@Field def g_asset_domain
// @Field def g_asset_environment
// @Field def g_asset_id
// @Field def g_asset_provider
// @Field def g_asset_provider_id
// //@Field def g_asset_service
// @Field def g_asset_status
// @Field def g_asset_tags
// @Field def g_asset_timestamp
// @Field def g_asset_type

/* Environment schema */
// @Field def g_environment_created
// @Field def g_environment_created_by
// @Field def g_environment_id
// @Field def g_environment_last_updated
// @Field def g_environment_logical_id
// @Field def g_environment_status
// //@Field def g_service_domain
// //@Field def g_service_name

/**
 * Initialize the module
 */
def initialize(serviceType, service, domain) {
	setServiceType(serviceType)
	setDomain(domain)
	setService(service)
}

/**
 * Load the service metadata from Catalog
 *
 */

def loadServiceMetaData() {
	try {
		def serviceData = sh (script: "curl GET  -k -v \
			-H \"Content-Type: application/json\" \
			-H \"Authorization: $g_login_token\" \
			\"https://cloud-api.corporate.t-mobile.com/api/platform/services?domain=$g_service_domain&service=$g_service_name\"", returnStdout: true)
		
		if(serviceData) {
			def serviceDataObj = parseJson(serviceData)
			if(serviceDataObj && serviceDataObj.data && serviceDataObj.data.services) {
				def dataArr = serviceDataObj.data.services[0]
				g_service_id = dataArr.id
				g_service_created_by = dataArr.created_by
				g_service_repository = dataArr.repository
				g_service_runtime = dataArr.runtime
			}
		}
		
		if(!g_service_id) {
			error "Could not fetch service metadata"
		}
	
	}
	catch(e){
		echo "error occured while fetching service metadata: " + e.getMessage()
		error "error occured while fetching service metadata: " + e.getMessage()
	}
}

 
/**
 * Loads the s3 asset details if the service is 'website'
 *
 */
def getS3BucketNameForService() {
	def data = loadAssetInfo("s3", null)
	if(data && data[0] && data[0].provider_id){
		def dataObj = data[0]
		def providerId = dataObj.provider_id
		def environment = dataObj.environment
		def bucketName
		if(providerId) {
			bucketName = providerId.replaceAll("s3://","")
			bucketName = bucketName.replaceAll("/.*\$","")
		}
		return bucketName

	} else {
		return null
	}
	
}

 
/**
 * Load the assets metadata from assets catalog given a asset type
 * @param type - Asset types (s3, lambda, apigatway etc.)
 */

def loadAssetInfo(type, environment) {
	def asset_json = [:]
	def assetInfoResult = []
	asset_json = [
			'type': type,
			'service': g_service_name
		]
	if(g_service_domain) {
		asset_json.put("domain", g_service_domain)
	}
	if(environment) {
		asset_json.put("environment", environment)
	}
	def payload = JsonOutput.toJson(asset_json)
	try {
		def assetInfo = sh (script: "curl  -X POST  -k -v \
			-H \"Content-Type: application/json\" \
			\"https://cloud-api.corporate.t-mobile.com/api/platform/assets/search\" \
			-d \'${payload}\'", returnStdout:true)
			
		if(assetInfo) {
			def assetInfoObj = parseJson(assetInfo)	
			if(assetInfoObj && assetInfoObj.data) {
				assetInfoResult = assetInfoObj.data
			}
		}	
		return assetInfoResult
	} catch(e){
		echo "error occured while fetching asset metadata: " + e.getMessage()
		return []
	}
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
  * Core dump
  */
def showState() {
	echo "g_service_id...$g_service_id"
	echo "g_service_created_by...$g_service_created_by"
	echo "g_service_description...$g_service_description"
	echo "g_service_domain...$g_service_domain"
	echo "g_service_email...$g_service_email"
	echo "g_service_name...$g_service_name"
	echo "g_service_region...$g_service_region"
	echo "g_service_repository...$g_service_repository"
	echo "g_service_runtime...$g_service_runtime"
	echo "g_service_status...$g_service_status"
	echo "g_service_tags...$g_service_tags"
	echo "g_service_type...$g_service_type"
	echo "g_timestamp...$g_timestamp"	
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
 * Set utility module
 * @return      
 */
def setUtil(utilModule) {
	Util = utilModule
	
}

return this;