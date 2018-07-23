#!groovy
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import java.util.regex.Matcher
import groovy.transform.Field

@Field apigeeConfig
@Field apiversion
@Field mavenHome
@Field nodeHome
@Field apigeeModuleRoot
@Field events

/**
 * Initialize values in the apigee-module. Must be run from the same
 * directory as the apigee-module or its parent.
 */
def initialize(apigee_config, event_logger) {
    apigeeConfig = apigee_config
    mavenHome = tool name: "${apigeeConfig.maven}", type: 'maven'
    apiversion = "${apigeeConfig.buildVersion}.${env.BUILD_NUMBER}"
    apigeeModuleRoot = getModuleRoot()
    events = event_logger
}

/**
 * Create and deploy an Apigee API proxy
 *
 * @param swaggerFile The path to the swagger file for the API.
 * @param arn ARN object containing the full name as well as the component values.
 * @param env_key The type of deployment. e.g. PROD or TEST.
 * @param environment_logical_id The id used to differentiate proxies from different branches in the same domain.
 * @param config The config metadata.
 * @param context_map The base context to be used for event logging.
 * @return String with the url of the deployed API proxy.
 */
String deploy(swaggerFile, arn, env_key, environment_logical_id, config, context_map) {

    def email = config['created_by']
    def deployEnv = apigeeConfig.API_ENDPOINTS[env_key]
    def apigeeContextMap = [:]
    apigeeContextMap.putAll(context_map)
    apigeeContextMap.putAll(deployEnv)
    def hostUrl = getHostUrl(deployEnv, swaggerFile)

    dir (apigeeModuleRoot) {
        def templateValues = getTemplateValues(swaggerFile, environment_logical_id)
        def functionName = arn.functionName
        
        try {
            events.sendStartedEvent('APIGEE_API_PROXY_GEN', 'Creating Apigee API proxy configuration', apigeeContextMap)
            proxygen(templateValues)
	        events.sendCompletedEvent('APIGEE_API_PROXY_GEN', 'Completed Apigee API proxy configuration', apigeeContextMap)
        } catch(e) {
            echo "Failure during proxy generation: ${e}"
            currentBuild.result = "FAILED"
            events.sendFailureEvent('APIGEE_API_PROXY_GEN', e.getMessage(), apigeeContextMap)
            throw e
        }

        // echo out the projects: Build number, Build Version and Apiversion Number
        echo "Build Number is ${env.BUILD_NUMBER}"
        echo "Build Version is ${apigeeConfig.buildVersion}"
        echo "Apiversion Number is ${apiversion}"

        dir("gen/CoreAPI") {
            withCredentials([usernamePassword(credentialsId: apigeeConfig.apigeeCredId, passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                try {
                // call the script bundle.sh which will build the proxy files and upload them to artifactory. Note artifactory url is set in the script.
                    events.sendStartedEvent('APIGEE_API_PROXY_BUILD', 'Creating Apigee API proxy bundle', apigeeContextMap)
                    withEnv(["MVN_HOME=${mavenHome}"]) {
                        sh("cd Build;./bundle.sh ${templateValues.ProxyName} v1 ${functionName} ${apiversion} ${email}")
                    }
                    events.sendCompletedEvent('APIGEE_API_PROXY_BUILD', 'Completed Apigee API proxy bundle', apigeeContextMap)
                } catch (e) {
                    events.sendFailureEvent('APIGEE_API_PROXY_BUILD', e.getMessage(), apigeeContextMap)
                    throw e
                }

                try {
                    events.sendStartedEvent('APIGEE_API_PROXY_DEPLOY', 'Deploying Apigee API proxy bundle', apigeeContextMap)
                    sh("./Build/deploy.sh ${deployEnv.mgmt_host} ${deployEnv.mgmt_org} ${deployEnv.mgmt_env} ${templateValues.ProxyName} ${apiversion} ${USER} ${PASS} v1")
                    events.sendCompletedEvent('APIGEE_API_PROXY_DEPLOY', 'Completed Apigee API proxy bundle deployment', apigeeContextMap)
                } catch (e) {
                    events.sendFailureEvent('APIGEE_API_PROXY_DEPLOY', e.getMessage(), apigeeContextMap)
                    throw e
                }
            }
        }
        
    }
    
    return hostUrl
}

def delete(swaggerFile, env_key, environment_logical_id, config) {
    def templateValues = getTemplateValues(swaggerFile, environment_logical_id)    
    def deployEnv = apigeeConfig.API_ENDPOINTS[env_key]
    dir (apigeeModuleRoot) {
        withCredentials([usernamePassword(credentialsId: apigeeConfig.apigeeCredId, passwordVariable: 'PASS', usernameVariable: 'USER')]) {
            try {
                events.sendStartedEvent('APIGEE_API_PROXY_DELETE', 'Deleting Apigee API proxy.')
                sh("./Build/delete.sh ${deployEnv.mgmt_host} ${deployEnv.mgmt_org} ${deployEnv.mgmt_env} ${templateValues.ProxyName} ${USER} ${PASS}")
                events.sendCompletedEvent('APIGEE_API_PROXY_DELETE', 'Completed deletion of Apigee API proxy.')
            } catch (e) {
                events.sendFailureEvent('APIGEE_API_PROXY_DELETE', e.getMessage())
                throw e
            }
        }
    }
}

/**
 * Run the proxygen process to generate the api proxy definition files.
 *
 * @param templateValues A Map of token name, replacement values to use when filling templates.
 */
def proxygen(templateValues) {
    dir ('gen') {
        deleteDir()
    }    
    dir ('Templates/CoreAPI') {
        deleteDir()
    }
    dir ('Templates') {
        sh "mkdir ./CoreAPI"
        if (apigeeConfig.useSecure) {
            sh ("cp -r ./CoreAPI_secure/* ./CoreAPI")
        } else {
            sh ("cp -r ./CoreAPI_default/* ./CoreAPI")
        }
    }

    applyTemplate('Proxygen_template.properties', '.', 'Proxygen.properties', templateValues)
    sh ('cat Proxygen.properties')
    sh ("java -cp ./ProxyGen.jar com.tmobile.apigee.ProxyCodeGen Proxygen.properties")
    sh ("mv ./gen/CoreAPI/Proxies/* ./gen/CoreAPI")
    sh ("mkdir ./gen/CoreAPI/Build")
    sh ("cp ./Build/* ./gen/CoreAPI/Build")
}

/**
 * Construct the url of the newly created API proxy.
 *
 * @param deployEnv The deployment env used for this deployment.
 * @param swaggerFile The swagger file for this deployment.
 * @return String with the url for the deployed API proxy.
 */
String getHostUrl(deployEnv, swaggerFile) {
    def swaggerFileContent = readFile swaggerFile
    def swaggerObj = new JsonSlurperClassic().parseText(swaggerFileContent)
    def domain = swaggerObj.basePath.substring(1)
    def serviceName
    for (k in swaggerObj.paths.keySet()) {        
        def keyTokens = k.split('/')
        if (keyTokens.length < 2) {
            error "Path must contain at least one element after the initial / to indicate the service name."
        }
        serviceName = keyTokens[1]
        break;
    }
    return "https://${deployEnv.service_hostname}/${domain}/${serviceName}"
}

/**
 * Populate an map with values to be used when replacing tokens in templates.
 *
 * @param swaggerFile The swagger file to be used in order to parse values.
 * @param environment_logical_id The id used to differentiate proxies from different branches in the same domain.
 * @return Map with the template token replacement values.
 */
def getTemplateValues(swaggerFile, environment_logical_id) {
    def swaggerFileContent = readFile swaggerFile
    def swaggerObj = parseJson(swaggerFileContent)
    def apigeeSwaggerRoot = "${apigeeModuleRoot}/tmp"
    def apigeeSwagger = "${apigeeSwaggerRoot}/swagger.json"
    dir (apigeeSwaggerRoot) {
        deleteDir()
    }
    sh "mkdir ${apigeeSwaggerRoot}"

    // pre-process swagger
    echo "Modifying swagger paths for Apigee use"
    def serviceName = ""
    def modPaths = [:]
    for (path in swaggerObj.paths) {
        if (serviceName == "") {
            serviceName = path.key
        } else if (!path.key.startsWith(serviceName)) {
            error "${path.key} does not start with ${serviceName}!"
        }

        def key = path.key.substring(serviceName.size())
        if (key == "") {
            key = '/'
        }
        modPaths.put(key, path.value)
    }
    
    swaggerObj.basePath += serviceName
    swaggerObj.paths = modPaths
    def out = JsonOutput.prettyPrint(JsonOutput.toJson(swaggerObj))
    echo out
    writeFile file: apigeeSwagger, text: out
    echo "Swagger file modification complete."

    def proxyName = "${domain}-${serviceName.substring(1)}-${environment_logical_id}"
    echo "proxyName = ${proxyName}"
    def result = [
        SwaggerFile : apigeeSwagger,
        ProxyName : proxyName,
        ProxyDescription : "API proxy for ${proxyName}",
        TargetDescription : swaggerObj.info.title
    ]
    return result;
}

@NonCPS
def parseJson(inString) {
    return new JsonSlurperClassic().parseText(inString)  
}

/**
 * Determine the path to the root of the apigee module files.
 *
 * @return String with the full path to the apigee directory.
 */
String getModuleRoot() {
    def here = pwd()
    def tokens = here.split('/')
    def currentDir = tokens[tokens.length - 1]
    if (currentDir != 'build_modules') {
        here += '/build_modules'
    } 
    return "${here}/apigee"
}

/**
 * Replace all token values in a template file with the corresponding value
 * from a token:value map.
 *
 * @param templateFile The full path to the template file.
 * @param targetDir The directory into which filled template will be written.
 * @param targetFile The file name for the filled template. 
 * @param valueMap A map of token:value pairs used to replace tokens in the template file.
 */
def applyTemplate(templateFile, targetDir, targetFile, valueMap) {
    String template = readFile templateFile
    def filledIn = replaceAll(template, valueMap)
    def modTargetFile = targetFile

    while (modTargetFile.startsWith('/')) {
        modTargetFile = modTargetFile.substring(1)
    }

    dir (targetDir) {
        writeFile file: modTargetFile, text: filledIn
    }
}

/**
 * Replace all elements of a token in a string using a list of token:value pairs.
 *
 * @param templateString The string containing tokens to replace.
 * @param valueMap A map of token:value pairs used to replace tokens in the template file.
 * @return String containing the templateString with all tokens present in the valueMap replaced with their values.
 */
String replaceAll(templateString, valueMap) {
    String result = templateString
    for (kvp in valueMap) {
        def tokenString = '\\{\\{' + kvp.key + '\\}\\}';
        result = result.replaceAll(tokenString, Matcher.quoteReplacement(kvp.value))
    }
    return result
}

return this
