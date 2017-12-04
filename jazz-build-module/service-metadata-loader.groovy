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

@Field def g_dev_s3_bucket
@Field def g_stg_s3_bucket
@Field def g_prd_s3_bucket
@Field def g_login_token
@Field def util_url
@Field def g_service_id
@Field def g_service_created_by
//@Field def g_service_description
@Field def g_service_domain
//@Field def g_service_email
@Field def g_service_name
//@Field def g_service_region
@Field def g_service_repository
@Field def g_service_runtime
//@Field def g_service_status
//@Field def g_service_tags
@Field def g_service_type
//@Field def g_timestamp

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
def initialize(serviceType, service, domain, url, dev, stg, prd) {
	setServiceType(serviceType)
	setDomain(domain)
	setService(service)
	setUrl(url)
	setDevS3(dev)
	setStgS3(stg)
	setPrdS3(prd)
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
			\"$util_url\"", returnStdout: true)

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
 * Get bucket name for environment
 * @param stage environment
 * @return  folder name
 */
def getBucket(stage) {
	if(stage == 'dev') {
		return g_dev_s3_bucket //"dev-serverless-static-website"
	}else if (stage == 'stg') {
		return g_stg_s3_bucket //"stg-serverless-static-website"
	} else if (stage == 'prod') {
		return g_prd_s3_bucket //"prod-serverless-static-website"
	}
}

/**
 * For getting token to access authenticated catalog APIs.
 * Must be a service account which has access to all services
 */
 /*Dstart
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

 } Dend*/

 /**
  * Core dump
  */
def showState() {
	echo "g_service_id...$g_service_id"
	echo "g_service_created_by...$g_service_created_by"
	//echo "g_service_description...$g_service_description"
	echo "g_service_domain...$g_service_domain"
	//echo "g_service_email...$g_service_email"
	echo "g_service_name...$g_service_name"
	//echo "g_service_region...$g_service_region"
	echo "g_service_repository...$g_service_repository"
	echo "g_service_runtime...$g_service_runtime"
	//echo "g_service_status...$g_service_status"
	echo "g_service_tags...$g_service_tags"
	echo "g_service_type...$g_service_type"
	//echo "g_timestamp...$g_timestamp"
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
 * Set URL
 * @return
 */
def setUrl(url) {
	util_url = url
}

/**
 * Set dev s3 location
 * @return
 */
def setDevS3(dev) {
	g_dev_s3_bucket = dev
}

/**
 * Set stg s3 location
 * @return
 */
def setStgS3(stg) {
	g_stg_s3_bucket = stg
}

/**
 * Set prod s3 location
 * @return
 */
def setPrdS3(prd) {
	g_prd_s3_bucket = prd
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
	Util.setUrl(util_url)
}

return this;
