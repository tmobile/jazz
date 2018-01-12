#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
@Field def Util
echo "Service metadata module loaded successfully"

/**
 * The service metadata loader module. This module will load all service metadata from respective catalog tables and
 * get it ready for Jenkins builds. It loads data for all service types.
*/

@Field def g_dev_s3_bucket
@Field def g_stg_s3_bucket
@Field def g_prd_s3_bucket
@Field def g_login_token
@Field def util_url
@Field def g_service_id
@Field def g_service_created_by
@Field def g_service_domain
@Field def g_service_name
@Field def g_service_repository
@Field def g_service_runtime
@Field def g_service_type

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
 * Load the service metadata from Catalog
 *
 */
 
def loadServiceMetaDataByServiceId() {
	try {
		def serviceData = sh (script: "curl GET  -k \
			-H \"Content-Type: application/json\" \
			-H \"Authorization: $g_login_token\" \
			\"$util_url\"", returnStdout: true)		

		return parseJson(serviceData)
			
	}
	catch(e){
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
		return g_dev_s3_bucket
	}else if (stage == 'stg') {
		return g_stg_s3_bucket
	} else if (stage == 'prod') {
		return g_prd_s3_bucket
	}
}

 /**
  * Core dump
  */
def showState() {
	echo "g_service_id...$g_service_id"
	echo "g_service_created_by...$g_service_created_by"
	echo "g_service_domain...$g_service_domain"
	echo "g_service_name...$g_service_name"
	echo "g_service_repository...$g_service_repository"
	echo "g_service_runtime...$g_service_runtime"
	echo "g_service_tags...$g_service_tags"
	echo "g_service_type...$g_service_type"
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

return this
