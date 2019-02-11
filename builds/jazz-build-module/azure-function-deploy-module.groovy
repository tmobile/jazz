#!groovy?
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* azure deployment module
*/

@Field def configLoader
@Field def azureUtil
@Field def utilModule
@Field def scmModule
@Field def events

echo "azure deployment module loaded successfully"

def initialize(configLoader, utilModule, scmModule, events, azureUtil){
  this.configLoader = configLoader
  this.utilModule = utilModule
  this.scmModule = scmModule
  this.events = events
  this.azureUtil = azureUtil

}

def setAzureVar() {

  if (configLoader.AZURE && configLoader.AZURE.RESOURCE_GROUPS) {
    configLoader.AZURE.RESOURCE_GROUP = configLoader.AZURE.RESOURCE_GROUPS.DEVELOPMENT
  } else {
    configLoader.AZURE.RESOURCE_GROUP = "heinajazzdevrg"
    configLoader.AZURE.LOCATION = "westus2"

  }

}

def createFunction(serviceInfo, azureCreatefunction) {
  setAzureVar()
  loadAzureConfig(serviceInfo)
  invokeAzureCreation(serviceInfo, azureCreatefunction)
//  sendAssetComplete(serviceInfo)

//    def hostname = azureUtil.getResourceHostname("functionapp", serviceInfo.stackName)
//    def functionName = serviceInfo.serviceCatalog['service']
//    def masterKey = azureUtil.getMasterKey(serviceInfo.stackName)
//    def endpoint = "https://$hostname/admin/functions/$functionName?code=$masterKey"
//    return endpoint

}

def invokeAzureCreation(serviceInfo, azureCreatefunction){

  sh "rm -rf _azureconfig"

  sh "zip -qr content.zip ."
  echo "trying to encode zip as 64bit string"
  sh 'base64 content.zip -w 0 > b64zip'
  def zip = readFile "b64zip"

  withCredentials([
    string(credentialsId: 'AZ_PASSWORD', variable: 'AZURE_CLIENT_SECRET'),
    string(credentialsId: 'AZ_CLIENTID', variable: 'AZURE_CLIENT_ID'),
    string(credentialsId: 'AZ_TENANTID', variable: 'AZURE_TENANT_ID'),
    string(credentialsId: 'AZ_SUBSCRIPTIONID', variable: 'AZURE_SUBSCRIPTION_ID')]) {

    def type = azureUtil.getExtensionName(serviceInfo)
    def myData = [
      "zip" : zip,
      "resourceGroupName" : configLoader.AZURE.RESOURCE_GROUP,
      "appName" : serviceInfo.storageAccountName,
      "stackName" : serviceInfo.stackName,
      "tenantId" : AZURE_TENANT_ID,
      "subscriptionId" : AZURE_SUBSCRIPTION_ID,
      "clientId" : AZURE_CLIENT_ID,
      "clientSecret" : AZURE_CLIENT_SECRET,
      "location": configLoader.AZURE.LOCATION,
      "eventSourceType": type,
      "resourceName": serviceInfo.resourceName
    ]

    def payload = [
      "className" : "FunctionApp",
      "command" : "create",
      "data" : myData
    ]

    def payloadString = JsonOutput.toJson(payload)
    invokeLambda([awsAccessKeyId: "$AWS_ACCESS_KEY_ID", awsRegion: 'us-east-1', awsSecretKey: "$AWS_SECRET_ACCESS_KEY" , functionName: azureCreatefunction, payload: payloadString, synchronous: true])
    invokeLambda([awsAccessKeyId: "$AWS_ACCESS_KEY_ID", awsRegion: 'us-east-1', awsSecretKey: "$AWS_SECRET_ACCESS_KEY" , functionName: azureCreatefunction, payload: payloadString, synchronous: true])
    invokeLambda([awsAccessKeyId: "$AWS_ACCESS_KEY_ID", awsRegion: 'us-east-1', awsSecretKey: "$AWS_SECRET_ACCESS_KEY" , functionName: azureCreatefunction, payload: payloadString, synchronous: true])

  }
}

def loadAzureConfig(serviceInfo) {
  checkoutConfigRepo(serviceInfo.repoCredentialId)
  selectConfig(serviceInfo)
}

def checkoutConfigRepo(repoCredentialId) {

  def configPackURL = scmModule.getCoreRepoCloneUrl("azure-config-pack")

  dir('_azureconfig') {
    checkout([$class: 'GitSCM', branches: [
            [name: '*/master']
    ], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [
            [credentialsId: repoCredentialId, url: configPackURL]
    ]])
  }

}

def selectConfig(serviceInfo) {
  echo "load azure config...."
  def functionName = serviceInfo.serviceCatalog['service']
  def serviceCatalog = serviceInfo.serviceCatalog

  if (serviceCatalog['runtime'].indexOf("nodejs") > -1) {
    sh "cp _azureconfig/host.json ."
    sh "cp -rf _azureconfig/nodejs ./$functionName"

  } else {
    sh "mkdir $functionName"   //TODO we will handle other runtime condition later
  }

  def config = serviceInfo.serviceCatalog
  def envId = serviceInfo.envId


  if (serviceInfo.isScheduleEnabled) {
    sh "cp -rf _azureconfig/cron/function.json ./$functionName/function.json"
    def eventScheduleRate = config['eventScheduleRate']
    def timeRate = eventScheduleRate.replace("cron(0", "0 *").replace(")", "").replace(" ?", "")

    sh "sed -i -- 's|\${file(deployment-env.yml):eventScheduleRate}|$timeRate|g' $functionName/function.json"
    if (serviceInfo.serviceCatalog['runtime'].indexOf("c#") > -1) {
      sh "cp _azureconfig/host.json ."
      sh "cp -rf _azureconfig/cron/run.csx ./$functionName"
    }
  } else if (serviceInfo.isQueueEnabled) {

    def resourceName = azureUtil.getQueueName(config, envId)
    writeConfig(functionName, "servicebus", resourceName, serviceInfo, "3.0.0")

  } else if (serviceInfo.isStreamEnabled) {

    def resourceName = azureUtil.getStreamName(config, envId)
    writeConfig(functionName, "eventhubs", resourceName, serviceInfo, "3.0.0")

  } else if (serviceInfo.isStorageEnabled) {

    def resourceName = azureUtil.getStorageName(config, envId)
    writeConfig(functionName, "storage", resourceName, serviceInfo, "3.0.0")
  } else if (serviceInfo.isDbEnabled) {
    def resourceName = azureUtil.getDbName(config, envId)
    writeConfig(functionName, "cosmosdb", resourceName, serviceInfo, "3.0.1")
  }

}

private void writeConfig(functionName, type, resourceName, serviceInfo, version) {
  def extName = azureUtil.getExtensionName(serviceInfo)


  if (serviceInfo.serviceCatalog['runtime'].indexOf("c#") > -1) {
    sh "cp _azureconfig/host.json ."
    sh "cp -rf _azureconfig/$type/run.csx ./$functionName"
  }

  sh "cp -rf _azureconfig/$type/function.json ./$functionName/function.json"
  registerBindingExtension(type)
  sh "sed -i -- 's|{resource_name}|$resourceName|g' $functionName/function.json"
  sh "sed -i -- 's|{extension_name}|$extName|g' extensions.csproj"
  sh "sed -i -- 's|{extension_version}|$version|g' extensions.csproj"
  serviceInfo.resourceType = type
  serviceInfo.resourceName = resourceName
}

def registerBindingExtension(type) {

  sh "cp _azureconfig/extensions.csproj ."

}

////https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer#cron-expressions
////TODO this terrible method will be removed when we fix the cron expression from UI

//def sendAssetCompletedEvent(resourceName, resourceType, serviceInfo) {
//  def id
//
//  if (resourceType == "functionapp" || resourceType == "eventhubs_namespace" || resourceType == "servicebus_namespace" || resourceType == "storage_account" || resourceType == "cosmosdb") {
//    id = azureUtil.getResourceId(resourceType.replace("_", " "), resourceName)
//  } else  {
//    id = resourceName
//  }
//
//  events.sendCompletedEvent('CREATE_ASSET', null, utilModule.generateAssetMap(serviceInfo.serviceCatalog['platform'], id, resourceType, serviceInfo.serviceCatalog), serviceInfo.envId)
//}

return this
