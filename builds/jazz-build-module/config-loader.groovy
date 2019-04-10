#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* Logic for accessing certain values from the given jazz-installer-vars json
*/

@Field def configData

echo "the module, 'config-loader', loaded successfully... congratulations..."

def initialize(installerVars){
  if(installerVars != null){
		def resultJson = parseJson(installerVars)

    echo "assigning env values from installer..."

    configData = resultJson

    echo "env values were set successfully"

    return configData
  }
}

//JSON parser
@NonCPS
def parseJson(def json) {
    new groovy.json.JsonSlurperClassic().parseText(json)
}

def getLambdaServiceList() {
    def service_list = ["cloud-logs-streamer", "deployments-event-handler", "environment-event-handler"]
    return service_list
}

def getApiServiceList() {
    def service_list = ["acl", "create-serverless-service", "environment-event-handler", "delete-serverless-service"]
    return service_list
}

return this
