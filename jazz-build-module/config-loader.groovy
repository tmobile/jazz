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

return this
