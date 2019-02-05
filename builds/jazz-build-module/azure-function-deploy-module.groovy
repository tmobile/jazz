#!groovy?
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


//  configLoader.AZURE.APP_INSIGHTS_KEY = sh (
//      script: "az resource show  -n ${configLoader.AZURE.APP_INSIGHTS} -g ${configLoader.AZURE.RESOURCE_GROUP} --resource-type 'Microsoft.Insights/components' --query properties.InstrumentationKey --output tsv",
//      returnStdout: true
//  ).trim()

}

def setAzureVar() {

  if (configLoader.AZURE && configLoader.AZURE.RESOURCE_GROUPS) {
    configLoader.AZURE.RESOURCE_GROUP = configLoader.AZURE.RESOURCE_GROUPS.DEVELOPMENT
  } else {
    configLoader.AZURE.RESOURCE_GROUP = "heinajazzdevrg"
    configLoader.AZURE.LOCATION = "westus2"

  }


  configLoader.AZURE.APP_INSIGHTS = "heinajazzdevinsights"
  configLoader.AZURE.APP_INSIGHTS_KEY = sh (
    script: "az resource show  -n ${configLoader.AZURE.APP_INSIGHTS} -g ${configLoader.AZURE.RESOURCE_GROUP} --resource-type 'Microsoft.Insights/components' --query properties.InstrumentationKey --output tsv",
    returnStdout: true
  ).trim()

}

def createFunction(serviceInfo) {

    setAzureVar()
    loadAzureConfig(serviceInfo)
    createAsset(serviceInfo)
    createFunctionApp(serviceInfo)

    def hostname = azureUtil.getResourceHostname("functionapp", serviceInfo.stackName)
    def functionName = serviceInfo.serviceCatalog['service']
    def masterKey = azureUtil.getMasterKey(serviceInfo.stackName)
    def endpoint = "https://$hostname/admin/functions/$functionName?code=$masterKey"
    return endpoint

}

def createAsset(serviceInfo) {

  def config = serviceInfo.serviceCatalog
  def envId = serviceInfo.envId
  def resourceName = serviceInfo.resourceName

  def storageAccountName = serviceInfo.storageAccountName
  azureUtil.createStorageAccount(storageAccountName)
  sendAssetCompletedEvent(storageAccountName, "storage_account", serviceInfo)

  if (serviceInfo.isQueueEnabled) {
    def namespace = azureUtil.getNamespace(serviceInfo)
    azureUtil.createQueue(namespace, resourceName)
    sendAssetCompletedEvent(resourceName, "service_bus", serviceInfo)
    sendAssetCompletedEvent(namespace, "servicebus_namespace", serviceInfo)

  }

  if (serviceInfo.isStreamEnabled) {
    def namespace = azureUtil.getNamespace(serviceInfo)
    azureUtil.createEventHub(namespace, resourceName)
    sendAssetCompletedEvent(resourceName, "event_hubs", serviceInfo)
    sendAssetCompletedEvent(namespace, "eventhubs_namespace", serviceInfo)

  }

  if (serviceInfo.isStorageEnabled) {
    azureUtil.createStorageBlob(resourceName, storageAccountName)
    sendAssetCompletedEvent(resourceName, "storage_container", serviceInfo)
  }

  if (serviceInfo.isDbEnabled) {

    def accountName = azureUtil.getDatabaseAccountName(serviceInfo)
    azureUtil.createCosmosDB(accountName, resourceName)
    sendAssetCompletedEvent(accountName, "cosmosdb", serviceInfo)
  }
}

def createFunctionApp(serviceInfo) {

  def stackName = serviceInfo.stackName

  azureUtil.createFunctionApp(stackName, serviceInfo.storageAccountName)
  sendAssetCompletedEvent(stackName, "functionapp", serviceInfo)

  azureUtil.setAppInsights(stackName)

  if (serviceInfo.isQueueEnabled || serviceInfo.isStreamEnabled) {
    def namespace = azureUtil.getNamespace(serviceInfo)
    def connStr = azureUtil.getRootManageSharedAccessKey(serviceInfo.resourceType, namespace)

    azureUtil.setSASConnectionString(stackName, connStr)
  }
  if (serviceInfo.isDbEnabled) {
    def accountName = azureUtil.getDatabaseAccountName(serviceInfo)
    def connStr = azureUtil.getPrimaryConnectionString(serviceInfo.resourceType, accountName)
    azureUtil.setFunctionAppSettingVariable(stackName, "AzureWebJobsCosmosDBConnectionStringName", connStr)
  }
  azureUtil.deployFunction(stackName)

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
  sh "cp -rf _azureconfig/${type}_bin ./bin"

}

////https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer#cron-expressions
////TODO this terrible method will be removed when we fix the cron expression from UI

def sendAssetCompletedEvent(resourceName, resourceType, serviceInfo) {
  def id

  if (resourceType == "functionapp" || resourceType == "eventhubs_namespace" || resourceType == "servicebus_namespace" || resourceType == "storage_account" || resourceType == "cosmosdb") {
    id = azureUtil.getResourceId(resourceType.replace("_", " "), resourceName)
  } else  {
    id = resourceName
  }

  events.sendCompletedEvent('CREATE_ASSET', null, utilModule.generateAssetMap(serviceInfo.serviceCatalog['platform'], id, resourceType, serviceInfo.serviceCatalog), serviceInfo.envId)
}

return this
