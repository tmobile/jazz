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

    echo "assigning env values from installer"

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
  }
}

//TODO add in getters and setters 
