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
		return config_loader.JAZZ.PLATFORM.AWS.S3.WEBSITE_DEV_BUCKET
	} else if (stage == 'stg') {
		return config_loader.JAZZ.PLATFORM.AWS.S3.WEBSITE_STG_BUCKET
	} else if (stage == 'prod') {
		return config_loader.JAZZ.PLATFORM.AWS.S3.WEBSITE_PROD_BUCKET
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
def parseJson(jsonString) {
	def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
	def m = [:]
	m.putAll(lazyMap)
	return m
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
				-H \"Jazz-Service-ID: ${service_config['service_id']}\" \
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

def isReplayedBuild() {
	def replayClassName = "org.jenkinsci.plugins.workflow.cps.replay.ReplayCause"
	currentBuild.rawBuild.getCauses().any{ cause -> cause.toString().contains(replayClassName) }
}

/*
* Get the required account
*/
def getAccountInfo(service_config){
	def dataObj = {};
	for (item in configLoader.AWS.ACCOUNTS) {
		if(item.ACCOUNTID == service_config.accountId){
			dataObj = item
		}
	}
	return dataObj;
}

/*
* Get the primary account
*/
def getAccountInfoPrimary(){
	def dataObjPrimary = {};
	for (item in configLoader.AWS.ACCOUNTS) {
		if(item.PRIMARY){
			dataObjPrimary = item
		}
	}
	return dataObjPrimary;
}

/**
*  Get Account Specific S3
*/

def getAccountBucketName(service_config) {
	def s3Object = {}
	def accountObject = getAccountInfo(service_config);
	if( accountObject.size() > 0){
		def regions = accountObject['REGIONS'];
		for (region in regions ){
			if( region['REGION'] == service_config.region) { 
				s3Object = region['S3'];
			}
		}
	}
	return s3Object;
}

/*
* Get the required azure account
*/
def getAzureAccountInfo(service_config){
	def dataObj = {};
	for (item in configLoader.AZURE.ACCOUNTS) {
		if(item.ACCOUNTID == service_config.accountId){
			dataObj = item
		}
	}
	return dataObj;
}

def constructArn (arn, resourceName, resourceType, config) {
	try{		
		//Get queueName from url
		if( resourceType == "AWS::SQS::Queue"){
			resourceName  = resourceName.substring(resourceName.lastIndexOf("/") + 1)
		}
		if( arn != null ) {
			arn = arn.replaceAll("\\{region\\}", "${config['region']}")
			arn = arn.replaceAll("\\{account-id\\}", "${config['accountId']}")
			arn = arn.replaceAll("\\{resourceName\\}", "${resourceName}")
		} else {
			error "Arn Templates not found for Resource Type : ${resourceType}"
		}
	} catch (ex){
		echo "Exception occured on getting Arn templates for Resource Type : ${resourceType}"
		error "Exception occured on getting Arn templates for Resource Type : ${resourceType}"
	}
	return arn
}


def getStackResources (stackName, region, credsId) {
	def stackResources	
	try {
		def stackResources = sh(script: "aws cloudformation describe-stack-resources --stack-name ${stackName} --region ${region} --profile ${credsId}  --output json 2<&1", returnStdout: true)
		echo "Describe Stacks are ${stackResources}"
		def parsedResources = parseJson(stackResources)
		return parsedResources
	} catch (ex) {
		echo "stack not exists..."
		try {
			def resp = sh(script: "aws cloudformation describe-stack-resources --stack-name ${stackName} --region ${region} --profile ${credsId}  --output json 2<&1 | grep -c 'ValidationError'", returnStdout: true)
			if(resp != 1) error "describe stack failed."
			else return {}
		} catch (e) {}
	}
}

def createAllStackResources (whiteListModule, events, config, stackResources, env) {
	def arnsMap = [:]
	def resources = stackResources['StackResources']
	if( resources != null ) {
		def assetCatalogTypes = whiteListModule.getassetCatalogTypes()
		for( resource in resources ) {
			def resourceType = resource['ResourceType']
			if( whiteListModule.checkAssetType(resourceType)){
				def arnTemplate = whiteListModule.getarnTemplates(resourceType)
				def arn = constructArn(arnTemplate, resource['PhysicalResourceId'], resourceType, config)
				if(arn.startsWith('arn')) {
					def arnAsArray = arn.split(':') // Here we splitting the arn itself in hope to obtain type of the resource. Should be the third element: arn:aws:dynamodb:us-east-1:123456:table/jazzUsersTable53
					if(arnAsArray.size() > 2) { // Making sure that the third element exists
					def artifactType = arnAsArray[2]
					if (arnsMap[assetCatalogTypes[artifactType]] && arnsMap[assetCatalogTypes[artifactType]].size() > 0) 
						arnsMap[assetCatalogTypes[artifactType]].add(arn)
					else {
						arnsMap[assetCatalogTypes[artifactType]] = new ArrayList()
						arnsMap[assetCatalogTypes[artifactType]].add(arn)
					}
					
					events.sendCompletedEvent('CREATE_ASSET',
												null,
												generateAssetMap("aws", arn, assetCatalogTypes[artifactType], config),
												env)
					}
				}
			}
		}
	}
	echo "arnsMap: $arnsMap"
	return arnsMap
}

def archiveCustomRole(assets_api, auth_token, config, env, events) {  
	def assets = getAssets(assets_api, auth_token, config, env)
	def assetList = parseJson(assets)

	for (asset in assetList.data.assets) {
		if (asset.asset_type == 'iam_role') { 
			events.sendCompletedEvent('UPDATE_ASSET', "Archiving the custom role since user specific role is being used.", generateAssetMap(asset.provider, asset.provider_id, "iam_role", config), env)
		}
	}
}


return this
