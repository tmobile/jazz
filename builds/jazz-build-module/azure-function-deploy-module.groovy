#!groovy?
import groovy.transform.Field
/*
* azure deployment module which handle all the azure resource CRUD
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

/**
 * Create azure function by service catalog data. Azure use function.json to configure trigger event and this function invoke a create azure service nodejs project to create function app and its trigger event resources.
 * @param serviceInfo  service catalog data from services table and also deployment info like env_id
 * @return endpoint of function
 */
def createFunction(serviceInfo){
  azureUtil.setAzureVar(serviceInfo)
  loadAzureConfig(serviceInfo)

  def masterKey = invokeAzureCreation(serviceInfo)

  def endpoint = "https://${serviceInfo.stackName}.azurewebsites.net/admin/functions/${serviceInfo.stackName}?code=$masterKey"
  return endpoint

}

/**
 * Call create azure service to get a list of resources/assets created by this service via tag and call sendCompletedEvent to populate the event table
 * @param serviceInfo   service catalog data from services table and also deployment info like env_id
 * @param assetList a list of trigger event resources which is not an azure resources such as database and table name
 */
def sendAssetCompletedEvent(serviceInfo, assetList) {

  def data = azureUtil.getAzureRequestPayload(serviceInfo)
  data.tagName = 'service'
  data.tagValue = serviceInfo.stackName
  def output = azureUtil.invokeAzureService(data, "getResourcesByServiceName")

  for (item in output.result) {
    def assetType = item.kind
    def id = item.id
    switch (item.type) {
      case "Microsoft.Storage/storageAccounts":
        assetType = "storage_account"
        break
      case "Microsoft.ServiceBus/namespaces":
        assetType = "servicebus_namespace"
        break
      case "Microsoft.EventHub/namespaces":
        assetType = "eventhubs_namespace"
        break
      case "Microsoft.DocumentDB/databaseAccounts":
        assetType = "cosmosdb_account"
        break
    }

    events.sendCompletedEvent('CREATE_ASSET', null, utilModule.generateAssetMap(serviceInfo.serviceCatalog['provider'], id, assetType, serviceInfo.serviceCatalog), serviceInfo.envId)

  }

  if (assetList) {
    for (item in assetList) {
      def id = item.azureResourceId
      def assetType = item.type
      events.sendCompletedEvent('CREATE_ASSET', null, utilModule.generateAssetMap(serviceInfo.serviceCatalog['provider'], id, assetType, serviceInfo.serviceCatalog), serviceInfo.envId)

    }
  }
}

/**
 * Use azure principle from jenkins credentials to create azure resources via azure nodejs SDK
 * @param serviceInfo   service catalog data from services table and also deployment info like env_id
 * @return master key for the endpoint
 */
def invokeAzureCreation(serviceInfo){

  sh "rm -rf _azureconfig"

  sh "zip -qr content.zip ."
  def zip = sh(script: 'readlink -f ./content.zip', returnStdout: true).trim()

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
    def resourceNameData = serviceInfo.resourceName
    if(resourceNameData != null){
      resourceNameData = resourceNameData.split('/')
      resourceNameData = resourceNameData[resourceNameData.length - 1]
      data.resourceName = resourceNameData
    } else {
      data.resourceName = resourceNameData
    }


    def repo_name = "jazz_azure-create-service"
    sh "rm -rf $repo_name"
    sh "mkdir $repo_name"

    def repocloneUrl = scmModule.getCoreRepoCloneUrl(repo_name)
    def masterKey

    dir(repo_name)
      {
        def assetList =[]
        checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: configLoader.REPOSITORY.CREDENTIAL_ID, url: repocloneUrl]]])
        sh "npm install -s"
        try {

          createStorageAccount(data, serviceInfo)

          if (type) {
            assetList = createEventResource(data, type, serviceInfo)
          }

          createFunctionApp(data)

          def output = azureUtil.invokeAzureService(data, "getMasterKey")
          masterKey = output.result.key
          deployFunction(data, zip, type)
          sendAssetCompletedEvent(serviceInfo, assetList)
          return masterKey
        } catch (ex) {
          echo "error occur $ex, rollback starting..."
          deleteResourceByTag(serviceInfo)
          error "Failed creating azure function $ex"
        } finally {
          echo "cleanup ...."
          sh "rm -rf ../content.zip"
          sh "rm -rf ../$repo_name"

        }
      }
  }
}

/**
 * Delete resources deletes all the created resources in this service
 * @param serviceInfo   service catalog data from services table and also deployment info like env_id
 * @return none
 */
def deleteResourceByTag(serviceInfo) {
  def data = azureUtil.getAzureRequestPayload(serviceInfo)
  data.tagName = 'service'
  data.tagValue = serviceInfo.stackName
  azureUtil.invokeAzureService(data, "deleteByTag")

}

/**
 * Invoke create azure service of create function command
 * @param data request payload which contains azure principle and resource name and type
 * @return none
 */
def createFunctionApp(data) {
  azureUtil.invokeAzureService(data, "createfunction")

}

/**
 * Invoke create azure service of deploy function command
 * @param data request payload which contains azure principle
 * @param zip a zip file of the function project from azure function template
 * @param type event source type
 * @return
 */
def deployFunction(data, zip, type) {

  data.zip = zip
  azureUtil.invokeAzureService(data, "deployFunction")
  data.zip = ""
  if (type) {
    azureUtil.invokeAzureService(data, "installFunctionExtensions")

  }

}

/**
 * Invoke create azure service of create storage account.  Storage account is required for all azure functionapp aka azure function
 * @param data request payload which contains azure principle
 * @param serviceInfo   service catalog data from services table and also deployment info like env_id
 * @return
 */
def createStorageAccount(data, serviceInfo) {
  data.appName = azureUtil.getStorageAccount(serviceInfo.serviceCatalog, serviceInfo.envId, serviceInfo.storageAccountName)
  azureUtil.invokeAzureService(data, "createStorage")

}

/**
 * Invoke create azure service to create trigger events if not exists
 * @param data
 * @param type
 * @param serviceInfo   service catalog data from services table and also deployment info like env_id
 * @return assets list
 */
def createEventResource(data, type, serviceInfo) {

  data.eventSourceType = type

  def items =[]
  if (type == 'CosmosDB') {
    data.database_account = azureUtil.getCosmosAccount(serviceInfo.serviceCatalog, serviceInfo.envId, serviceInfo.storageAccountName)
    data.database = azureUtil.getCosmosDatabase(serviceInfo.serviceCatalog, serviceInfo.envId, data.resourceName)
    data.table = azureUtil.getCosmosTable(serviceInfo.serviceCatalog, serviceInfo.envId, data.resourceName)
    azureUtil.invokeAzureService(data, "createEventResource")
    output = azureUtil.invokeAzureService(data, "createDatabase")
    items.add(getAssetDetails(data.resourceName, "cosmosdb_database"))
    items.add(getAssetDetails(data.resourceName, "cosmosdb_collection"))
  } else if (type == 'ServiceBus') {
    data.namespace = azureUtil.getServicebusNamespace(serviceInfo.serviceCatalog, serviceInfo.envId, serviceInfo.storageAccountName)
    azureUtil.invokeAzureService(data, "createEventResource")
    items.add(getAssetDetails(data.resourceName, "servicebus_queue"))
  } else if (type == 'EventHubs') {
    data.namespace = azureUtil.getEventhubsNamespace(serviceInfo.serviceCatalog, serviceInfo.envId, serviceInfo.storageAccountName)
    azureUtil.invokeAzureService(data, "createEventResource")
    items.add(getAssetDetails(data.resourceName, "eventhubs_eventhub"))
  } else if (type == 'Storage') {

    azureUtil.invokeAzureService(data, "createEventResource")
    items.add(getAssetDetails(data.resourceName, "storage_blob_container"))
  }

  return items

}

/**
 * Azure function is defined by a function.json and this file is populated based on service catalog
 * @param serviceInfo  service catalog data from services table and also deployment info like env_id
 * @return none
 */
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

/**
 * Populate function.json based on service catalog info
 * @param serviceInfo  service catalog data from services table and also deployment info like env_id
 * @return none
 */
def selectConfig(serviceInfo) {
  echo "load azure config...."
  def functionName = serviceInfo.stackName
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

/**
 * Update the template of function.json based on service catalog
 * @param functionName function name
 * @param type resource type
 * @param resourceName name of a resource
 * @param serviceInfo   service catalog data from services table and also deployment info like env_id
 * @param version azure library version for each trigger events
 */
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

def getAssetDetails(id, assetType) {


  def assetItem = [
    type: assetType,
    azureResourceId: id
  ]

  return assetItem


}

/**
 *
 * @param service_config  service catalog data from services table
 * @return true if provider is provided and it is azure
 */
def isAzure(service_config) {
  return  service_config['provider'] != null && service_config['provider'] == "azure"
}

/**
 * Delete resources calls create azure service nodejs project to delete resources by matching tag
 * @param env env id for prod or dev
 * @param repo_credential_id
 * @param service_config  service catalog data from services table
 * @return none
 */
def deleteResources(env, repo_credential_id, service_config) {

  def stackName = "${configLoader.INSTANCE_PREFIX}-${service_config['domain']}-${service_config['service']}-${env}"

  def serviceInfo = [
    'stackName'         : stackName,
    "repoCredentialId"  : repo_credential_id,
    'envId'             : env,
    'serviceCatalog'    : service_config,
    'storageAccountName': 'NA'
  ]

  azureUtil.setAzureVar(serviceInfo)
  withCredentials([
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_PASSWORD', passwordVariable: 'AZURE_CLIENT_SECRET', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_CLIENTID', passwordVariable: 'AZURE_CLIENT_ID', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_TENANTID', passwordVariable: 'AZURE_TENANT_ID', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_SUBSCRIPTIONID', passwordVariable: 'AZURE_SUBSCRIPTION_ID', usernameVariable: 'UNAME']
  ]) {
    def repo_name = "jazz_azure-create-service"
    sh "rm -rf $repo_name"
    sh "mkdir $repo_name"

    def repocloneUrl = scmModule.getCoreRepoCloneUrl(repo_name)


    dir(repo_name)
      {
        checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: configLoader.REPOSITORY.CREDENTIAL_ID, url: repocloneUrl]]])
        sh "npm install -s"
        deleteResourceByTag(serviceInfo)
      }


  }

}


return this
