#!groovy?
import groovy.json.JsonOutput
import groovy.transform.Field

@Field def configLoader
@Field def resourceUtil
@Field def utilModule


echo "azure util loaded successfully"

def initialize(configData, resourceUtility, utilModule){

  configLoader = configData
  resourceUtil = resourceUtility
  utilModule = utilModule
}


def setAzureVar(serviceInfo) {
  def azureAccount = utilModule.getAzureAccountInfo(serviceInfo.serviceCatalog)
  def azureRegionInfo
  for (item in azureAccount.REGIONS) {
		if(item.REGION == serviceInfo.serviceCatalog.region){
			azureRegionInfo = item
		}
	}
  if (serviceInfo.serviceCatalog['event_source_resource_group'] && serviceInfo.envId == 'prod') {
    azureRegionInfo.RESOURCE_GROUP = resourceUtil.getResourceName(serviceInfo.serviceCatalog['event_source_resource_group'], serviceInfo.envId)
  } else {
    if (azureRegionInfo && azureRegionInfo.RESOURCE_GROUPS) {
      if (serviceInfo.envId == 'prod') {
        azureRegionInfo.RESOURCE_GROUP = azureRegionInfo.RESOURCE_GROUPS.PROD
      } else {
        azureRegionInfo.RESOURCE_GROUP = azureRegionInfo.RESOURCE_GROUPS.DEV
      }

    }
  }

}


//TODO this is not needed after we fix the UI
def getQueueName(serviceMetadata, env) {

  def queueNameInput = serviceMetadata['event_source_servicebusqueue']
  def queueNameArray = queueNameInput.split(':')
  return resourceUtil.getResourceName(queueNameArray[queueNameArray.size() - 1], env)
}

//TODO this is not needed after we fix the UI
def getStreamName(serviceMetadata, env) {

  def nameInput = serviceMetadata['event_source_eventhub']
  def nameArray = nameInput.split('/')
  return resourceUtil.getResourceName(nameArray[nameArray.size() - 1], env)
}

def getStorageName(serviceMetadata, env) {
  def nameInput = serviceMetadata['event_source_storageaccount']
  return resourceUtil.getResourceName(nameInput, env)
}

def getDbName(serviceMetadata, env) {
  def nameInput = serviceMetadata['event_source_cosmosdb']
  def nameArray = nameInput.split('/')
  return resourceUtil.getResourceName(nameArray[1], env)
}

def getExtensionName(serviceInfo) {

  def name
  if (serviceInfo.isQueueEnabled) {
    name = "ServiceBus"
  } else if (serviceInfo.isStreamEnabled) {
    name = "EventHubs"
  } else if (serviceInfo.isStorageEnabled) {
    name = "Storage"
  } else if (serviceInfo.isDbEnabled) {
    name = "CosmosDB"
  }

  return name
}


def getServicebusNamespace(serviceMetadata, env, defaultIfNull) {

    return getMetadatabyKey(serviceMetadata, env, 'event_source_servicebus_namespace', defaultIfNull)
}

def getEventhubsNamespace(serviceMetadata, env, defaultIfNull) {

    return getMetadatabyKey(serviceMetadata, env, 'event_source_eventhubs_namespace', defaultIfNull)
}


def getStorageAccount(serviceMetadata, env, defaultIfNull) {

    return getMetadatabyKey(serviceMetadata, env, 'event_source_storage_account', defaultIfNull)
}

def getCosmosAccount(serviceMetadata, env, defaultIfNull) {

     return getMetadatabyKey(serviceMetadata, env, 'event_source_cosmosdb_account', defaultIfNull)
}

def getCosmosDatabase(serviceMetadata, env, defaultIfNull) {

    return getMetadatabyKey(serviceMetadata, env, 'event_source_cosmosdb_database', defaultIfNull)
}

def getCosmosTable(serviceMetadata, env, defaultIfNull) {

    return getMetadatabyKey(serviceMetadata, env, 'event_source_cosmosdb_table', defaultIfNull)
}

def getMetadatabyKey(serviceMetadata, env, key, defaultIfNull) {

  def userInput = serviceMetadata[key]

  return userInput? resourceUtil.getResourceName(userInput, env) : defaultIfNull
}

def getRuntimeType(serviceInfo) {

  if (serviceInfo.serviceCatalog['runtime'].indexOf("c#") > -1) {
    return "dotnet"
  } else {
    return "node"
  }
}

def invokeAzureService(data, command) {
  def payload = [
    "className": "FunctionApp",
    "command"  : command,
    "data"     : data
  ]

  def payloadString = JsonOutput.toJson(payload)

  writeFile(file:'payload.json', text: payloadString)
  def output =  sh(script: './bin/jazz-azure-cli ./payload.json', returnStdout: true).trim()

  echo "azure service $command $output"

  def outputJson =  parseJson(output)
  if (outputJson && outputJson.data && outputJson.data.error) {
    throw new Exception("Failed calling azure service $command $output")
  } else {
    return outputJson
  }

}

def getAzureServiceName() {

  return "${configLoader.INSTANCE_PREFIX}-jazz-azure-create-service-prod"
}
def getTags(serviceInfo) {

  def tags = [
    'application' : configLoader.INSTANCE_PREFIX,
    'owner': serviceInfo.serviceCatalog['created_by'],
    'domain': serviceInfo.serviceCatalog['domain'],
    'STAGE': serviceInfo.envId,
    'environment': serviceInfo.envId,
    'service': serviceInfo.stackName
  ]

  return tags
}
def getAzureRequestPayload(serviceInfo) {

  def azureAccount = utilModule.getAzureAccountInfo(serviceInfo.serviceCatalog)
  def resourceGroupName
  def location
  for (item in azureAccount.REGIONS) {
		if(item.REGION == serviceInfo.serviceCatalog.region){
			location = item.LOCATION
      resourceGroupName = item
		}
	}
  def data = [
    "resourceGroupName": resourceGroupName.RESOURCE_GROUP,
    "appName"          : serviceInfo.storageAccountName,
    "stackName"        : serviceInfo.stackName,
    "tenantId"         : AZURE_TENANT_ID,
    "subscriptionId"   : AZURE_SUBSCRIPTION_ID,
    "clientId"         : AZURE_CLIENT_ID,
    "clientSecret"     : AZURE_CLIENT_SECRET,
    "location"         : location
  ]

  return data
}
/**
 * JSON parser
 */
@NonCPS
def parseJson(def json) {
  new groovy.json.JsonSlurperClassic().parseText(json)
}

return this
