#!groovy?
import groovy.transform.Field

@Field def configLoader
@Field def resourceUtil


echo "azure util loaded successfully"

def initialize(configData, resourceUtility){

    configLoader = configData
    resourceUtil = resourceUtility
}


def deployFunction(stackName){
    sh "rm -rf _azureconfig"
    sh "zip -qr content.zip ."
    sh "az functionapp deployment source config-zip  -n $stackName --src content.zip --timeout 300000 -g ${configLoader.AZURE.RESOURCE_GROUP} >> output.log"
    echo "zip deploy done"
}

def createQueue(resourceName, name) {
    if (!isNameSpaceExists("servicebus", resourceName)) {
        sh "az servicebus namespace create -n $resourceName -g ${configLoader.AZURE.RESOURCE_GROUP} --location ${configLoader.AZURE.LOCATION} >> output.log"
    }
    sh "az servicebus queue create -n $name -g ${configLoader.AZURE.RESOURCE_GROUP} --namespace-name $resourceName >> output.log "

}

def isNameSpaceExists(type, name) {


    def nameExist =  sh(script:"az $type namespace exists --name $name -o tsv", returnStdout: true).trim()
    return nameExist.contains("NameInUse")
}

def createEventHub(resourceName, name) {
    if (!isNameSpaceExists("eventhubs", resourceName)) {
        sh "az eventhubs namespace create -n $resourceName -g ${configLoader.AZURE.RESOURCE_GROUP} --location ${configLoader.AZURE.LOCATION} >> output.log"
    }
    sh "az eventhubs eventhub create -n $name -g ${configLoader.AZURE.RESOURCE_GROUP} --namespace-name $resourceName --message-retention 1 >> output.log"

}


def createStorageBlob(name, storageAccountName) {

    def keyjson = sh (
            script:"az storage account keys list --account-name $storageAccountName  -o json",
            returnStdout: true
    ).trim()
    def keyMap = parseJson(keyjson)

    sh "az storage container create -n $name --account-key ${keyMap[0].value} --account-name $storageAccountName >> output.log"

}

def createStorageAccount(name) {

    def nameExist = sh(
            script: "az storage account check-name -n $name -o tsv",
            returnStdout: true
    ).trim()

    echo " heinalala storage account: $nameExist"

    if (!nameExist.contains("AlreadyExists")) {
        sh "az storage account create -n $name -g ${configLoader.AZURE.RESOURCE_GROUP} --location ${configLoader.AZURE.LOCATION} --sku Standard_LRS --encryption blob >> output.log"

    }

}

def createCosmosDB(accountName, dbName) {

    def nameExist = sh(
            script: "az cosmosdb check-name-exists -n $accountName -o tsv",
            returnStdout: true
    ).trim()

    echo " heinalala cosmosdb account: $nameExist"

    if (nameExist == "false") {
        sh "az cosmosdb create -n $accountName -g ${configLoader.AZURE.RESOURCE_GROUP} >> output.log"
        sh "az cosmosdb database create -n $accountName --db-name $dbName -g ${configLoader.AZURE.RESOURCE_GROUP} >> output.log"
        sh "az cosmosdb collection create -n $accountName --db-name $dbName --collection-name $dbName -g ${configLoader.AZURE.RESOURCE_GROUP} >> output.log"
    }

}
def createFunctionApp(stackName, storageAccountName) {

    sh "az functionapp create -n $stackName -s $storageAccountName -g ${configLoader.AZURE.RESOURCE_GROUP}  --consumption-plan-location ${configLoader.AZURE.LOCATION} >> output.log"

}

def setAppInsights(stackName) {

    sh "az functionapp config appsettings set -n $stackName -g ${configLoader.AZURE.RESOURCE_GROUP} --settings APPINSIGHTS_INSTRUMENTATIONKEY=${configLoader.AZURE.APP_INSIGHTS_KEY} >> output.log"
}


def setSASConnectionString(stackName, connStr) {

 //   sh "az functionapp config appsettings set -n $stackName -g ${configLoader.AZURE.RESOURCE_GROUP} --settings SAS_CONNSTR='$connStr' >> output.log"
    setFunctionAppSettingVariable(stackName, "SAS_CONNSTR", connStr);
}

def setFunctionAppSettingVariable(stackName, key, value) {

    sh "az functionapp config appsettings set -n $stackName -g ${configLoader.AZURE.RESOURCE_GROUP} --settings $key='$value' >> output.log"

}

def getResourceValue(type, name, queryKey) {

    return  getValue(type, name, queryKey, "show")
}

def getValue(type, name, queryKey, command) {

    return  sh (
            script: "az $type $command -n $name -g ${configLoader.AZURE.RESOURCE_GROUP} --query $queryKey -o tsv",
            returnStdout: true
    ).trim()


}
def getResourceHostname(type, name) {

    return getResourceValue(type, name, "defaultHostName")
}

def getResourceId(type, name) {

    return getResourceValue(type, name, "id")
}

def getRootManageSharedAccessKey(resourceType, resourceName) {

    def connStr = sh (
            script: "az $resourceType namespace authorization-rule keys list --namespace-name $resourceName -g ${configLoader.AZURE.RESOURCE_GROUP} --name RootManageSharedAccessKey --query primaryConnectionString -o tsv",
            returnStdout: true
    ).trim()

    return connStr
}

def getPrimaryConnectionString(resourceType, resourceName) {
//az cosmosdb list-keys  -n heinaaccountname -o tsv --query primaryMasterKey

    def key = getValue(resourceType, resourceName, "primaryMasterKey", "list-keys")
    return "AccountEndpoint=https://${resourceName}.documents.azure.com:443/;AccountKey=${key};"
}
def getMasterKey(stackName) {

    def userName = getProfileValue(stackName,"userName")
    def userPwd = getProfileValue(stackName,"userPWD")
    def pairText = "$userName:$userPwd"
    def token = pairText.bytes.encodeBase64().toString()

    echo "heinalala $userName, $userPwd, $token"

    def jwtToken = sh (
            script: "curl GET  \
			-H \"Authorization: Basic $token\" \
			\"https://${stackName}.scm.azurewebsites.net/api/functions/admin/token\"",
            returnStdout: true
    ).trim()


    def masterKeyString = sh (
            script: "curl GET  \
			-H \"Authorization: Bearer $jwtToken\" \
			\"https://${stackName}.azurewebsites.net/admin/host/systemkeys/_master\"",
            returnStdout: true
    ).trim()
    echo "heinalala masterstring: $masterKeyString"
    def masterJson = parseJson(masterKeyString)
    echo "heinalala json object:$masterJson"
    return masterJson.value
}


def getProfileValue(stackName, key) {

    return sh (
            script: "az functionapp deployment list-publishing-profiles -n $stackName -g ${configLoader.AZURE.RESOURCE_GROUP} --query \"[?publishMethod=='MSDeploy'].$key\" -o tsv",
            returnStdout: true
    ).trim()
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
/**
 * JSON parser
 */
@NonCPS
def parseJson(def json) {
    new groovy.json.JsonSlurperClassic().parseText(json)
}

return this