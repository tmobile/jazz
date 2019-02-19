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

def setAzureVar(envId) {

  if (configLoader.AZURE && configLoader.AZURE.RESOURCE_GROUPS) {
    if (envId == 'prod') {
      configLoader.AZURE.RESOURCE_GROUP = configLoader.AZURE.RESOURCE_GROUPS.PRODUCTION
    } else {
      configLoader.AZURE.RESOURCE_GROUP = configLoader.AZURE.RESOURCE_GROUPS.DEVELOPMENT
    }

  }

}


def createFunction(serviceInfo){
  def assetList = []
  setAzureVar(serviceInfo.envId)
  loadAzureConfig(serviceInfo)

  def masterKeyResult = invokeAzureCreation(serviceInfo, assetList)
  def masterKey = masterKeyResult.data.key
  sendAssetCompletedEvent(serviceInfo, assetList)

  def functionName = serviceInfo.serviceCatalog['service']
  def endpoint = "https://${serviceInfo.stackName}.azurewebsites.net/admin/functions/$functionName?code=$masterKey"
  return endpoint

}


def sendAssetCompletedEvent(serviceInfo, assetList) {

  for (item in assetList) {
    def id = item.azureResourceId
    def assetType = item.type
    events.sendCompletedEvent('CREATE_ASSET', null, utilModule.generateAssetMap(serviceInfo.serviceCatalog['platform'], id, assetType, serviceInfo.serviceCatalog), serviceInfo.envId)

  }
}

def invokeAzureCreation(serviceInfo, assetList){

  sh "rm -rf _azureconfig"

  sh "zip -qr content.zip ."
  echo "trying to encode zip as 64bit string"
  sh 'base64 content.zip -w 0 > b64zip'
  def zip = readFile "b64zip"


  withCredentials([
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_PASSWORD', passwordVariable: 'AZURE_CLIENT_SECRET', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_CLIENTID', passwordVariable: 'AZURE_CLIENT_ID', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_TENANTID', passwordVariable: 'AZURE_TENANT_ID', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_SUBSCRIPTIONID', passwordVariable: 'AZURE_SUBSCRIPTION_ID', usernameVariable: 'UNAME']
  ]) {

    def type = azureUtil.getExtensionName(serviceInfo)
    def runtimeType = azureUtil.getRuntimeType(serviceInfo)
    def tags = azureUtil.getTags(serviceInfo)
    def data = azureUtil.getAzureRequestPayload(serviceInfo)
    data.tags = tags
    data.runtime = runtimeType
    data.resourceName = serviceInfo.resourceName


    executeLambda(data, "createStorage")
    def item = getAssetDetails(serviceInfo, data.appName, "storage_account","Microsoft.Storage/storageAccounts")
    assetList.add(item)

    if (type) {
      data.eventSourceType = type
      executeLambda(data, "createEventResource")
      if (type == 'CosmosDB') {
        echo "sleep 3 min to wait for db account creation"
        sleep 180
        item = getAssetDetails(serviceInfo, data.appName, "cosmosdb","Microsoft.DocumentDB/databaseAccounts")
        executeLambda(data, "createDatabase")

      } else if (type == 'ServiceBus') {
        item = getAssetDetails(serviceInfo, data.appName, "servicebus_namespace","Microsoft.ServiceBus/namespaces")

      } else if (type == 'EventHubs') {
        item = getAssetDetails(serviceInfo, data.appName, "eventhubs_namespace","Microsoft.EventHub/namespaces")
      }

      assetList.add(item)
    }

    executeLambda(data, "createfunction")
    item = getAssetDetails(serviceInfo, data.stackName, "functionapp","Microsoft.Web/sites")
    assetList.add(item)

    data.zip = zip
    executeLambda(data, "deployFunction")
    data.zip = ""
    if (type) {
      executeLambda(data, "installFunctionExtensions")

    }

    return azureUtil.invokeAzureService(data, "getMasterKey")
  }
}

def executeLambda(data, commandName) {
  def azureCreatefunction = azureUtil.getAzureServiceName()

  def payload = [
    "className": "FunctionApp",
    "command"  : commandName,
    "data"     : data
  ]

  def payloadString = JsonOutput.toJson(payload)
  invokeLambda([awsAccessKeyId: "$AWS_ACCESS_KEY_ID", awsRegion: 'us-east-1', awsSecretKey: "$AWS_SECRET_ACCESS_KEY", functionName: azureCreatefunction, payload: payloadString, synchronous: true])
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
    serviceInfo.resourceType = "cron"
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

def getAssetDetails(serviceInfo, name, assetType, resourceType) {

  def data = azureUtil.getAzureRequestPayload(serviceInfo)

  data.appName = name
  data.resourceType = resourceType

  def assetItem = [
    type: assetType,
    azureResourceType: resourceType,
    azureResourceName: name
  ]

  def result = azureUtil.invokeAzureService(data, "getId")
  echo "getId result $result"
  if (result && result.data.statusCode == 200) {

    assetItem.azureResourceId = result.data.id

    return assetItem
  } else {
    error "Azure resource id search error ${result}"
  }

}



return this
