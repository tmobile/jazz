#!groovy?
 
  /*
 * azure deployment module for api gateway
 */
 
 
 
  
  echo "azure deployment api module loaded successfully"
 
  def createFunction(stackName){
  	
  	sh "zip -qr content.zip ."
  	echo "trying to encode zip as 64bit string" 
   	sh 'base64 content.zip -w 0 >b64zip'
   	def zip = readFile "b64zip";
   	def swaggerString = readFile "Api/azure-swagger.json";
  	echo swaggerString
  	withCredentials([
    string(credentialsId: 'AZURE_CLIENT_SECRET', variable: 'AZURE_CLIENT_SECRET'),
    string(credentialsId: 'AZURE_CLIENT_ID', variable: 'AZURE_CLIENT_ID'),
    string(credentialsId: 'AZURE_TENANT_ID', variable: 'AZURE_TENANT_ID'),
    string(credentialsId: 'AZURE_SUBSCRIPTION_ID', variable: 'AZURE_SUBSCRIPTION_ID')]) {
    
  		def payloadString = /{
  			"className" : "ApiApp",
    		"command" : "create",
			"data" : {
			    "resourceGroupName" : "oscar-test-resource-group",
			    "appName" : "OscarsTest",
			    "serviceName" : "oscar-api-management-service",
			    "apiId" : "oscar-test-api",
			    "tenantId" : "$AZURE_TENANT_ID",
			    "subscriptionId" : "$AZURE_SUBSCRIPTION_ID",
			    "clientId" : "$AZURE_CLIENT_ID",
			    "clientSecret" : "$AZURE_CLIENT_SECRET",
			    "zip" : "$zip",
			    "serviceName" : "oscar-api-management-service",
			    "basepath" : "api",
			    "swagger" : $swaggerString
		    }
		}/
  
  	invokeLambda([awsAccessKeyId: "$AWS_ACCESS_KEY_ID", awsRegion: 'us-east-1', awsSecretKey: "$AWS_SECRET_ACCESS_KEY" , functionName: 'jazzoscar-test-azure-create-service-prod', payload: payloadString, synchronous: true])
 
    //sh "az functionapp create -s oscarjazzstorageaccount -n $stackName --consumption-plan-location westus >> output.log"
   //deployFunction(stackName)
 	}
 }
 
  
  def deployFunction(stackName){
    sh "zip -qr content.zip ."
   sh "az functionapp deployment source config-zip  -n $stackName --src content.zip >> output.log"
   
   
   echo "trying to encode zip as 64bit string" 
   sh 'base64 content.zip -w 0 >b64zip'
   def zip = readFile "b64zip";
   
   
 }
 
 
  def createApi(gatewayName, tagName){
  	echo "azure function deployement---------------------->"
  	sh "jazz-azure-cli create --r oscar-jazz --s oscar-api-management-service --swg Api/azure-swagger.json --a oscar-test-api --b api"
  	echo "azure function deployement END---------------------->"
  }
  
  
  def createApiThroughLambda(gatewayName, tagName){
  
  	def swaggerString = readFile "Api/azure-swagger.json"
	
    withCredentials([
    string(credentialsId: 'AZURE_CLIENT_SECRET', variable: 'AZURE_CLIENT_SECRET'),
    string(credentialsId: 'AZURE_CLIENT_ID', variable: 'AZURE_CLIENT_ID'),
    string(credentialsId: 'AZURE_TENANT_ID', variable: 'AZURE_TENANT_ID'),
    string(credentialsId: 'AZURE_SUBSCRIPTION_ID', variable: 'AZURE_SUBSCRIPTION_ID')]) {
    
  		def payloadString = /{
  			"action" : "create",
			"data" : {
			    "resourceGroupName" : "oscar-jazz",
			    "serviceName" : "oscar-api-management-service",
			    "apiId" : "oscar-echo-api",
			    "tenantId" : "$AZURE_TENANT_ID",
			    "subscriptionId" : "$AZURE_SUBSCRIPTION_ID",
			    "clientId" : "$AZURE_CLIENT_ID",
			    "clientSecret" : "$AZURE_CLIENT_SECRET",
			    "swagger" : $swaggerString,
			    "basepath" : "api"
		    }
		}/
  		
  		
  		invokeLambda([awsAccessKeyId: "$AWS_ACCESS_KEY_ID", awsRegion: 'us-east-1', awsSecretKey: "$AWS_SECRET_ACCESS_KEY" , functionName: 'jazzoscar-test-oscar-jenkins-2-prod', payload: payloadString, synchronous: true])
    	}
      }

  
  def deleteApiThroughLambda(gatewayName, tagName){
    	 
    withCredentials([
    string(credentialsId: 'AZURE_CLIENT_SECRET', variable: 'AZURE_CLIENT_SECRET'),
    string(credentialsId: 'AZURE_CLIENT_ID', variable: 'AZURE_CLIENT_ID'),
    string(credentialsId: 'AZURE_TENANT_ID', variable: 'AZURE_TENANT_ID'),
    string(credentialsId: 'AZURE_SUBSCRIPTION_ID', variable: 'AZURE_SUBSCRIPTION_ID')]) {
    
  		def payloadString = /{
  			"action" : "delete",
			"data" : {
			    "resourceGroupName" : "oscar-jazz",
			    "serviceName" : "oscar-api-management-service",
			    "apiId" : "oscar-echo-api",
			    "tenantId" : "$AZURE_TENANT_ID",
			    "subscriptionId" : "$AZURE_SUBSCRIPTION_ID",
			    "clientId" : "$AZURE_CLIENT_ID",
			    "clientSecret" : "$AZURE_CLIENT_SECRET"
		    }
		}/
  		  		
  		invokeLambda([awsAccessKeyId: "$AWS_ACCESS_KEY_ID", awsRegion: 'us-east-1', awsSecretKey: "$AWS_SECRET_ACCESS_KEY" , functionName: 'jazzoscar-test-oscar-jenkins-2-prod', payload: payloadString, synchronous: true])
    	}
      }
  
 
 
 
  
  def loadAzureConfig(runtime, scmModule, repo_credential_id) {
   checkoutConfigRepo(scmModule, repo_credential_id)
   selectConfig(runtime)
 }
 
  def checkoutConfigRepo(scmModule, repo_credential_id) {
 
    def configPackURL = scmModule.getCoreRepoCloneUrl("azure-config-pack")
 
    dir('_azureconfig') {
     checkout([$class: 'GitSCM', branches: [
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
  
  def writeSwaggerFile(stackName){
  	sh "sed -i -- 's/\${domain}/${stackName}/g' Api/azure-swagger.json"
  }
 
  //https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer#cron-expressions
 //TODO this terrible method will be removed when we fix the cron expression from UI

 return this