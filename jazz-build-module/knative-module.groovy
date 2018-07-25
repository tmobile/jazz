#!groovy

import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import java.util.regex.Matcher
import groovy.transform.Field
@Field repo_credential_id
@Field config
@Field events



/**
 * Initialize values in the knative-module. Must be run from the same
 * directory as the knative-module or its parent.
 */
def initialize(config, event_logger) {
    knativeConfig = config
    events = event_logger
}


def deploy(config, current_environment) {
    sh "kubectl apply -f service.yml"
    echo "deployed function ${config['domain']}-${config['service']}"
    sleep(60)
}


def loadKnativeConfig(String runtime) {
    def configPackURL = scmModule.getCoreRepoCloneUrl("knative-config-pack")

    dir('_config') {
        checkout([$class: 'GitSCM', branches: [
            [name: '*/master']
        ], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [
            [credentialsId: repo_credential_id, url: configPackURL]
        ]])
    }

    sh "cp _config/service.yml ./service.yml"
}

def writeKnativeFile(config, current_environment) {
    // sh "pwd"
    sh "sed -i -- 's/<service>/${config['domain']}-${config['service']}-${current_environment}/g' service.yml"
    echoKnativeFile()
}

def checksvc(config) {
	def ep = ''
while( true ) {
	        def knative_svcep = "";
		   // knative_svcep = sh (returnStdout: true, script: "kubectl get ep ${config['domain']}-${config['service']} -o=json")
		    knative_svcep = sh (returnStdout: true, script: "kubectl get services.serving.knative.dev ${config['domain']}-${config['service']}-${current_environment}  -o=custom-columns=NAME:.metadata.name,DOMAIN:.status.domain -o=json")
		    def parsedObject = parseJson(knative_svcep);
            def domain =parsedObject.status.domain;
			echo "spec:::: $domain"
			if (domain != null ){
				def host = parsedObject.status.domain;
				//def port = parsedObject.subsets[0].ports[0].port ;
				ep =   host 
				break
			}
			sleep(10)
}
echo "ep:::: $ep"
return ep  
}

def echoKnativeFile() {
    def serviceyml = readFile('service.yml').trim()
    echo "service.yml file data: $serviceyml"
}

@NonCPS
def parseJson(inString) {
    return new JsonSlurperClassic().parseText(inString)
}


return this