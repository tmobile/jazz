#!groovy?
import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* Logic for accessing certain values from the given jazz-installer-vars json
*/

@Field def g_aws_credential_id
@Field def g_env_name_prefix
@Field def g_cloudfront_origin_id
@Field def g_cognito
@Field def g_repository
@Field def g_api_build
@Field def g_lambda_build
@Field def g_website_build
@Field def g_api_id
@Field def g_jazz
@Field def g_jazz_s3
@Field def g_website_s3
@Field def g_jenkins
@Field def g_bitbucket

echo "the module, 'env-loader', loaded successfully... congratulations..."

def initialize(installerVarStr){
  if(installerVarStr != null && !installerVarStr.equals("")){
    def jsonParser = new groovy.json.JsonSlurper()
    def resultJson = jsonParser.parseText(installarVarStr)

    echo "assigning env values from installer..."

    setCognito(resultJson.Cognito)
    setRepoData(resultJson.repository)
    setApiBuild(resultJson.API_BUILD)
    setLambdaBuild(resultJson.Lambda)
    setWebsiteBuild(resultJson.Website)
    setApiId(resultJson.API_ID)
    setJazz(resultJson.Jazz)
    setJazzS3(resultJson.jazz_s3)
    setWebsiteS3(resultJson.Website_s3)
    setJenkins(resultJson.Jenkins)
    setBitbucket(resultJson.Bitbucket)

    g_aws_credential_id = resultJson.AWS_CREDENTIAL_ID
    g_env_name_prefix = resultJson.env_name_prefix
    g_cloudfront_origin_id = resultJson.CLOUDFRONT_ORIGIN_ID

    echo "env values were set successfully"
  }
}

//Getters Begin
def getAWSCredentialID(){
  return g_aws_credential_id
}

def getEnvNamePrefix(){
  return g_env_name_prefix
}

def getCloudfrontOriginId(){
  return g_cloudfront_origin_id
}

/*
* @param String fieldName -> provide the name of the field
* @returns String, the specific value for that field
*/
def getRepositoryField(fieldName){
  return g_repository."$fieldName"
}

def getApiBuildField(fieldName){
  return g_api_build."$fieldName"
}

def getLambdaBuildField(fieldName){
  return g_lambda_build."$fieldName"
}

def getWebsiteBuildField(fieldName){
  return g_website_build."$fieldName"
}

def getApiIdField(fieldName){
  return g_api_id."$fieldName"
}

def getJazzField(fieldName){
  return g_jazz."$fieldName"
}

def getJazzS3Field(fieldName){
  return g_jazz_s3."$fieldName"
}

def getWebsiteS3Field(fieldName){
  return g_website_s3."$fieldName"
}

def getJenkinsField(fieldName){
  return g_jenkins."$fieldName"
}

def getBitbucketField(fieldName){
  return g_bitbucket."$fieldName"
}

//Getters End

//Setters Begin
def setCognito(cognitoData){
  g_cognito = cognitoData
}

def setRepoData(repoData){
  g_repository = repoData
}

def setApiBuild(apiBuildData){
  g_api_build = apiBuildData
}

def setLambdaBuild(lambdaBuildData){
  g_lambda_build = lambdaBuildData
}

def setWebsiteBuild(websiteBuildData){
  g_website_build = websiteBuildData
}

def setApiId(apiIdData){
  g_api_id = apiIdData
}

def setJazz(jazzData){
  g_jazz = jazzData
}

def setJazzS3(jazzS3Data){
  g_jazz_s3 = jazzS3Data
}

def setWebsiteS3(websiteS3Data){
  g_website_s3 = websiteS3Data
}

def setJenkins(jenkinsData){
  g_jenkins = jenkinsData
}

def setBitbucket(bitbucketData){
  g_bitbucket = bitbucketData
}
//Setters End
