#!groovy?
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
/**
 * JSON parser
 */
@NonCPS
def parseJson(def json) {
    new groovy.json.JsonSlurperClassic().parseText(json)
}

return this
