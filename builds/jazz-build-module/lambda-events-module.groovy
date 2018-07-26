#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* -- Lambda event notification module
*/

@Field def config_loader


def initialize(configLoader){
    config_loader = configLoader
}


def checkS3AndUpdateServerless(s3BucketName) {
  try {
    sh "aws s3api head-bucket --bucket $s3BucketName --output json"
    echo "Bucket exists and have access"
    def sedCommand = "s/events/eventsDisabled/g";
    sedCommand = sedCommand + "; /#Start:isS3EventEnabled/,/#End:isS3EventEnabled/d"
    sh "sed -i -- '$sedCommand' ./serverless.yml"
    return true
  } catch (ex) {//bucket exists but with no access
    def res
    try {
      res = sh(script: "aws s3api head-bucket --bucket $s3BucketName --output json 2<&1 | grep -c 'Forbidden'", returnStdout: true).trim()
    } catch (e) {
      echo "Bucket does not exist"
      return false;
    }
    if (res) {
      echo "Bucket exists and don't have access"
      error ex.getMessage()
    }
  }
}

def updateLambdaPermissionAndNotification(lambdaARN, s3BucketName, action) {
  try {
    echo "update lambda config using cli"
    UUID uuid = UUID.randomUUID();
    def statementId = uuid.toString();
    sh "aws lambda --region ${config_loader.AWS.REGION} add-permission --function-name $lambdaARN --statement-id $statementId --action lambda:InvokeFunction --principal s3.amazonaws.com --source-arn arn:aws:s3:::$s3BucketName --output json"
    def existing_notifications = getbucketNotificationConfiguration(s3BucketName)
    putbucketNotificationConfiguration(existing_notifications,lambdaARN, s3BucketName, action)
  } catch (ex) {
    echo "Error while updating permission and lambda configuration"
    error ex.getMessage()
  }
}

def getbucketNotificationConfiguration(s3BucketName){
  def existing_notifications = [:]
  try{
    def existing_notificationsObj = sh(returnStdout: true, script: "aws s3api get-bucket-notification-configuration --bucket $s3BucketName --output json")
	  echo "existing_notificationsObj: $existing_notificationsObj"
    existing_notifications = parseJson(existing_notificationsObj)
    return existing_notifications
  } catch (ex) {
    return existing_notifications
  }
}

def putbucketNotificationConfiguration(existing_notifications,lambdaARN, s3BucketName, action){
  def  new_lambda_configuration = [:]
  def events = action.split(",")
  def lambdaFunctionConfigurations = []
  new_lambda_configuration.LambdaFunctionArn = lambdaARN
  new_lambda_configuration.Events = events

 try{
   if(existing_notifications.containsKey("LambdaFunctionConfigurations")){
     for(item in existing_notifications.LambdaFunctionConfigurations ){
        lambdaFunctionConfigurations.add(item)
     }
     lambdaFunctionConfigurations.add(new_lambda_configuration)
   }else{
     lambdaFunctionConfigurations.add(new_lambda_configuration)
   }
   existing_notifications.LambdaFunctionConfigurations = lambdaFunctionConfigurations
   def newNotificationJson = JsonOutput.toJson(existing_notifications)
   sh "aws s3api put-bucket-notification-configuration --bucket $s3BucketName --notification-configuration \'${newNotificationJson}\' --output json"
 }catch(ex){
 }
}

/**
 * Non-lazy JSON parser
 */

@NonCPS
def parseJson(jsonString) {
    def nonLazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
    return nonLazyMap
}

return this
