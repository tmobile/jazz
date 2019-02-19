#!groovy?
import groovy.json.JsonOutput
import groovy.transform.Field

@Field def configLoader
@Field def resourceUtil


echo "azure util loaded successfully"

def initialize(configData, resourceUtility){

  configLoader = configData
  resourceUtil = resourceUtility
}



//TODO this is not needed after we fix the UI
def getQueueName(serviceMetadata, env) {

  def queueNameInput = serviceMetadata['event_source_sqs']
  def queueNameArray = queueNameInput.split(':')
  return resourceUtil.getResourceName(queueNameArray[queueNameArray.size() - 1], env)
}

//TODO this is not needed after we fix the UI
def getStreamName(serviceMetadata, env) {

  def nameInput = serviceMetadata['event_source_kinesis']
  def nameArray = nameInput.split('/')
  return resourceUtil.getResourceName(nameArray[nameArray.size() - 1], env)
}

def getStorageName(serviceMetadata, env) {
  def nameInput = serviceMetadata['event_source_s3']
  return resourceUtil.getResourceName(nameInput, env)
}

def getDbName(serviceMetadata, env) {
  def nameInput = serviceMetadata['event_source_dynamodb']
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

def getDatabaseAccountName(serviceInfo) {
  return serviceInfo.storageAccountName

}


def getNamespace(serviceInfo) {
  return serviceInfo.storageAccountName


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
    "command": command,
    "data"     : data
  ]
  def payloadString = JsonOutput.toJson(payload)
  def apiUrl = "https://fnm7abd9ci.execute-api.us-east-1.amazonaws.com/prod/heinanode/heinatestazure"
  try {
    def shcmd = sh(script: "curl --silent -X POST -k \
				-H \"Content-Type: application/json\" \
					$apiUrl \
				-d \'${payloadString}\'", returnStdout:true).trim()

    return parseJson(shcmd)
  }
  catch (e) {
    echo "error occured when create azure resource: " + e.getMessage()
    error "failed azure creation ${e.getMessage()}"
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


  def data = [
    "resourceGroupName": configLoader.AZURE.RESOURCE_GROUP,
    "appName"          : serviceInfo.storageAccountName,
    "stackName"        : serviceInfo.stackName,
    "tenantId"         : AZURE_TENANT_ID,
    "subscriptionId"   : AZURE_SUBSCRIPTION_ID,
    "clientId"         : AZURE_CLIENT_ID,
    "clientSecret"     : AZURE_CLIENT_SECRET,
    "location"         : configLoader.AZURE.LOCATION
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
