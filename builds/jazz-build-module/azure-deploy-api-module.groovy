#!groovy?

/*
* azure deployment module for api gateway
*/

import groovy.json.*


echo "azure deployment api module loaded successfully"

def createApi(stackName) {
  writeSwaggerFile(stackName)
  sh "zip -qr content.zip ."
  def zip = sh(script: 'readlink -f ./content.zip', returnStdout: true).trim()
  def swagger = sh(script: 'readlink -f Api/azure-swagger.json', returnStdout: true).trim()

  if (environment_logical_id == "prod") {
    logicalId = config['service_id'].substring(0, 7) + environment_logical_id
  } else {
    logicalId = environment_logical_id.split('-')[0] //13 + 10
  }
  def sgName = "${configLoader.INSTANCE_PREFIX}${logicalId}"
  def storageName = sgName.replaceAll("[^a-zA-Z0-9]", "")

  withCredentials([
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_PASSWORD', passwordVariable: 'AZURE_CLIENT_SECRET', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_CLIENTID', passwordVariable: 'AZURE_CLIENT_ID', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_TENANTID', passwordVariable: 'AZURE_TENANT_ID', usernameVariable: 'UNAME'],
    [$class: 'UsernamePasswordMultiBinding', credentialsId: 'AZ_SUBSCRIPTIONID', passwordVariable: 'AZURE_SUBSCRIPTION_ID', usernameVariable: 'UNAME']
  ]) {
    def payloadString = [
      className : "ApiApp",
      command   : "create",
      data      : [
        resourceGroupName : azureRG,
        storageName       : storageName,
        appName           : stackName,
        tags: [
          application : configLoader.INSTANCE_PREFIX,
          owner       : config['created_by'],
          domain      : config['domain'],
          STAGE       : environment_logical_id,
          environment : environment_logical_id,
          service     : stackName
        ],
        serviceName       : AzureApim,
        apiId             : stackName,
        tenantId          : AZURE_TENANT_ID,
        subscriptionId    : AZURE_SUBSCRIPTION_ID,
        clientId          : AZURE_CLIENT_ID,
        clientSecret      : AZURE_CLIENT_SECRET,
        zip               : zip,
        basepath          : stackName,
        swagger           : swagger
      ]
    ]

    apigateway = "/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$azureRG/providers/Microsoft.ApiManagement/service/$AzureApim"

    def repo_name = "jazz_azure-create-service"
    sh 'rm -rf ' + repo_name
    sh 'mkdir ' + repo_name

    def repocloneUrl = scmModule.getCoreRepoCloneUrl(repo_name)

    dir(repo_name)
      {
        checkout([$class: 'GitSCM', branches: [[name: '*/' + params.scm_branch]], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: configLoader.REPOSITORY.CREDENTIAL_ID, url: repocloneUrl]]])
        sh "npm install -s"
        def json = JsonOutput.toJson(payloadString)
        writeFile(file:'payload.json', text: json)
        sh "./bin/jazz-azure-cli ./payload.json"
      }

    sh 'rm -rf ' + repo_name
  }
}


def deleteApi(gatewayName, tagName) {


}


def loadAzureConfig(runtime, scmModule, repo_credential_id) {
  checkoutConfigRepo(scmModule, repo_credential_id)
  selectConfig(runtime)
}

def checkoutConfigRepo(scmModule, repo_credential_id) {

  def configPackURL = scmModule.getCoreRepoCloneUrl("azure-config-pack")

  dir('_azureconfig') {
    checkout([$class                    : 'GitSCM', branches: [
      [name: '*/master']
    ], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [
      [credentialsId: repo_credential_id, url: configPackURL]
    ]])
  }

}

def selectConfig(runtime) {
  echo "load azure config...."
  if (runtime.indexOf("nodejs") > -1) {
    sh "cp _azureconfig/host.json ./host.json"
    sh "cp -rf _azureconfig/Trigger ."
    sh "cp -rf _azureconfig/Api ."
  }

}

def writeSwaggerFile(stackName) {
  sh "sed -i -- 's/\${domain}/${stackName}/g' Api/azure-swagger.json"
}


return this
