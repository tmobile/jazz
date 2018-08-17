#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* -- Lambda event notification module
*/

@Field def config_loader
@Field def queue_visibility_timeout = 165

def initialize(configLoader){
  config_loader = configLoader
}

def checkSQSAndAddLambdaTrigger(queueName, lambdaARN) {
  try {
    sh "aws sqs get-queue-url --queue-name $queueName --profile cloud-api --output json"
    echo "Queue exists and have access"
    addLambdaTriggerToSqsQueue(true, queueName, lambdaARN)
  } catch (ex) {
    def response
    try {
      response = sh(
        script: "aws sqs get-queue-url --queue-name $queueName --profile cloud-api --output json 2<&1 | grep -c 'NonExistentQueue'",
        returnStdout: true
      ).trim()
    } catch (e) {
    }
    if (response) {
      echo "Queue does not exists"
      addLambdaTriggerToSqsQueue(false, queueName, lambdaARN)
    } else{
      error "Unknown error occured"
    }
  }
}

def addLambdaTriggerToSqsQueue(isExists, queue_name, lambdaARN){
  if (isExists) {
    def isDefined = listEventSourceMapping(queue_name, lambdaARN)
    if (!isDefined) {
      createEventSourceMapping(queue_name, lambdaARN)
    }
  } else {
    createSqsQueue(queue_name, lambdaARN)
  }
}

def createSqsQueue(queue_name, lambdaARN){
  try {
    sh "aws sqs create-queue --queue-name ${queue_name} --attributes '{\"VisibilityTimeout\": \"${queue_visibility_timeout}\"}' --profile cloud-api --output json"
    createEventSourceMapping(queue_name, lambdaARN)
  } catch (ex) {
    echo "Failed to create the queue"
    error "Failed to create the queue"
  }
}

def createEventSourceMapping(queue_name, arn){
  try {
    def lambdaARN = arn.split(":(?!.*:.*)")[0];
    def queue_arn = "arn:aws:sqs:${config_loader.AWS.REGION}:${config_loader.AWS.ACCOUNTID}:${queue_name}"
    sh "aws lambda create-event-source-mapping --function-name ${lambdaARN} --event-source ${queue_arn} --profile cloud-api --output json"
  } catch (ex) {
    echo "Failed to create the event source mapping"
    error "Failed to create the event source mapping"
  }
}

def listEventSourceMapping(queue_name, arn){
  try {
    def lambdaARN = arn.split(":(?!.*:.*)")[0];
    def queue_arn = "arn:aws:sqs:${config_loader.AWS.REGION}:${config_loader.AWS.ACCOUNTID}:${queue_name}"
    def response = sh(
      script: "aws lambda list-event-source-mappings --function-name ${lambdaARN} --event-source ${queue_arn} --profile cloud-api --output json",
      returnStdout: true
    ).trim()
    def mappings = parseJson(response)
    if (mappings.EventSourceMappings.size() > 0) {
      return true
    } else {
      return false
    }
  } catch (ex) {
    echo "Failed to list the event source mapping"
    error "Failed to list the event source mapping"
  }
}

def checkS3AndUpdateServerless(s3BucketName, stackName, isEventSchdld) {
	try {
		sh "aws s3api head-bucket --bucket $s3BucketName --output json"
		echo "Bucket exists and have access"
    checkSlsResourcesAndUpdateServerless(s3BucketName, stackName, isEventSchdld)
		return true
	} catch(ex) {//bucket exists but with no access
		def res
		try {
			res = sh (script: "aws s3api head-bucket --bucket $s3BucketName --output json 2<&1 | grep -c 'Forbidden'", returnStdout: true).trim()
		} catch(e) {
			echo "Bucket does not exist"
      enableS3Events()
			return false;
		}
		if(res) {
			echo "Bucket exists and don't have access"
			error ex.getMessage()
		}
	}
}

def checkSlsResourcesAndUpdateServerless(s3BucketName, stackName, isEventSchdld){
  try {
    def isSlsResource = false
    def response = sh(
      script: "aws cloudformation list-stack-resources --stack-name ${stackName} --profile cloud-api --output json",
      returnStdout: true
    ).trim()
    echo "response: $response"
    def resources = parseJson(response)
    if(resources.StackResourceSummaries.size() > 0){
      for(resource in resources.StackResourceSummaries){
        if(resource.ResourceType == "AWS::S3::Bucket" && resource.PhysicalResourceId == "${s3BucketName}"){
          isSlsResource = true
        }
      }
    }
    if(isSlsResource == false ){
      removeS3Events()
      if(isEventSchdld == true){
        disableS3Events()
      } else {
        sh "sed -i -- 's/events:/ /g' ./serverless.yml"
      }
    } else {
      enableS3Events()
    }
  } catch (ex) {
    echo "Failed to list the stack resources"
    def res
    try {
			res = sh (script: "aws cloudformation list-stack-resources --stack-name ${stackName} --profile cloud-api --output json 2<&1 | grep -c 'ValidationError'", returnStdout: true).trim()
		} catch(e) {
      error "Failed to list the stack resources"
		}
		if (res) {
			removeS3Events()
      if (isEventSchdld == true) {
        disableS3Events()
      } else {
        sh "sed -i -- 's/events:/ /g' ./serverless.yml"
      }
		}
  }
}

def removeS3Events(){
  def sedCommand = "/#Start:isS3EventEnabled/,/#End:isS3EventEnabled/d"
	sh "sed -i -- '$sedCommand' ./serverless.yml"
}

def disableS3Events(){
  sh "sed -i -- 's/events/eventsDisabled/g' ./serverless.yml"
}

def enableS3Events(){
  sh "sed -i -- 's/eventsDisabled/events/g' ./serverless.yml"
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
  def existing_notifications = [:]
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
  def new_lambda_configuration = [:]
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
  for (item in events) {
    cleanupIndex++
    if (((item.contains("ObjectCreated") || item.contains("ObjectRemoved")) &&
      (existing_events.contains("s3:ObjectCreated:*") || existing_events.contains("s3:ObjectRemoved:*"))) || (existing_events.contains(item))) {
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
  def isRemovalEvent = false

  if (events.size() > 0 && events != null) {
    for (item in events) {
      new_events.add(item)
    }

    if(new_events.contains("s3:ObjectRemoved:*")){
      isRemovalEvent = true
    }

    for (item in events) {
      cleanupIndex++
      if (item.contains("ObjectCreated")) {
        isCreationEvent = true
        new_events[cleanupIndex] = null
      }
      if(isRemovalEvent == true && item.contains("ObjectRemoved")){
        new_events[cleanupIndex] = null
      }
    }
    new_events.removeAll([null])
    if (isCreationEvent == true) {
      new_events.add("s3:ObjectCreated:*")
    }
    if (isRemovalEvent == true) {
      new_events.add("s3:ObjectRemoved:*")
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
  def m = [:]
  m.putAll(lazyMap)
  return m
}

return this
