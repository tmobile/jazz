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
    putbucketNotificationConfiguration(existing_notifications, lambdaARN, s3BucketName, action)
  } catch (ex) {
    echo "Error while updating permission and lambda configuration"
    error ex.getMessage()
  }
}

def getbucketNotificationConfiguration(s3BucketName){
  def existing_notifications = [: ]
  try {
    def existing_notificationsObj = sh(returnStdout: true, script: "aws s3api get-bucket-notification-configuration --bucket $s3BucketName --output json")
    echo "existing_notificationsObj: $existing_notificationsObj"
    existing_notifications = parseJson(existing_notificationsObj)
    return existing_notifications
  } catch (ex) {
    return existing_notifications
  }
}

def putbucketNotificationConfiguration(existing_notifications, lambdaARN, s3BucketName, action){
  def new_lambda_configuration = [: ]
  def events = action.split(",")
  def lambdaFunctionConfigurations = []
  def new_events = []
  new_lambda_configuration.LambdaFunctionArn = lambdaARN

  try {
    if (existing_notifications.containsKey("LambdaFunctionConfigurations")) {
      def existing_lambda_configs = existing_notifications.LambdaFunctionConfigurations
      new_events = getLambdaEvents(existing_notifications, events)
      if (new_events != null && new_events.size() > 0) {
        for (item in existing_lambda_configs) {
          lambdaFunctionConfigurations.add(item)
        }
        new_lambda_configuration.Events = new_events
        lambdaFunctionConfigurations.add(new_lambda_configuration)
      }
    } else {
      new_events = checkAndConvertEvents(events)
      new_lambda_configuration.Events = new_events
      lambdaFunctionConfigurations.add(new_lambda_configuration)
    }
    if (lambdaFunctionConfigurations != null && lambdaFunctionConfigurations.size() > 0) {
      existing_notifications.LambdaFunctionConfigurations = lambdaFunctionConfigurations
      def newNotificationJson = JsonOutput.toJson(existing_notifications)
      def response = sh(returnStdout: true, script: "aws s3api put-bucket-notification-configuration --bucket $s3BucketName --notification-configuration \'${newNotificationJson}\' --output json")
    }
  } catch (ex) {
  }
}

def getLambdaEvents(existing_notifications, events){
  def existing_events = []
  def new_events = []
  for (item in events) {
    new_events.add(item)
  }
  for (item in existing_notifications.LambdaFunctionConfigurations) {
    existing_events.addAll(item.Events)
  }
  def cleanupIndex = -1
  echo "events . $events"

  // Removing the existing events from the new event list
  def event_names
  for (item in events) {
    cleanupIndex++
    if (item.contains("ObjectCreated") && existing_events.contains("s3:ObjectCreated:*")) {
      new_events[cleanupIndex] = null
    } else if (existing_events.contains(item)) {
      new_events[cleanupIndex] = null
    }
  }
  new_events.removeAll([null])
  def events_list = []
  if (new_events.size() > 0 && new_events != null) {
    events_list = checkAndConvertEvents(new_events)
  }
  return events_list
}

def checkAndConvertEvents(events){
  def new_events = []
  // converting the new events to * event
  def cleanupIndex = -1
  def isCreationEvent = false
  if (events.size() > 0 && events != null) {
    for (item in events) {
      new_events.add(item)
    }

    for (item in events) {
      cleanupIndex++
      if (item.contains("ObjectCreated")) {
        isCreationEvent = true
        new_events[cleanupIndex] = null
      }
    }
    new_events.removeAll([null])
    if (isCreationEvent == true) {
      new_events.add("s3:ObjectCreated:*")
    }
  }
  echo "new_events : $new_events"
  return new_events
}

/**
* Non-lazy JSON parser
*/

@NonCPS
def parseJson(jsonString) {
  def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
  def m = [: ]
  m.putAll(lazyMap)
  return m
}
return this
