#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* -- Lambda event notification module
*/

@Field def config_loader
@Field def utilModule

def initialize(configLoader, util){
  config_loader = configLoader
  utilModule = util
}

def checkKinesisStreamExists(stream_name) {
  try {
    sh "aws kinesis describe-stream --stream-name ${stream_name} --profile cloud-api --output json"
    echo "Stream exists and have access"
    return true
  } catch (ex) {
    def response
    try {
      response = sh(
        script: "aws kinesis describe-stream --stream-name ${stream_name} --profile cloud-api --output json 2<&1 | grep -c 'ResourceNotFoundException'",
        returnStdout: true
      ).trim()
    } catch (e) {
      echo "Error occured while describing the stream"
    }
    if (response) {
      echo "Stream does not exists"
      return false
    } else {
      error "Error occured while describing the stream details"
    }
  }
}

def updateKinesisResourceServerless(event_stream_arn){
  sh "sed -i -- 's/resources/resourcesDisabled/g' ./serverless.yml"
  sh "sed -i -- '/#Start:streamGetArn/,/#End:streamGetArn/d' ./serverless.yml"
  sh "sed -i -- 's/arnDisabled/arn/g' ./serverless.yml"
  sh "sed -i -- 's|{event_stream_arn}|${event_stream_arn}|g' ./serverless.yml"
}

def getRoleArn(role_name) {
  def role_arn
  try {
    def response = sh(
      script: "aws iam get-role --role-name ${role_name} --profile cloud-api --output json",
      returnStdout: true
    ).trim()
    def mappings = parseJson(response)
    echo "role details : $mappings "
    if(mappings.Role){
      role_arn = mappings.Role.Arn
    }
    return role_arn
  } catch (ex) {
    echo "Error occured while describing the role details: " + ex.getMessage()
  }
}

def checkSqsQueueExists(queueName) {
  try {
    sh "aws sqs get-queue-url --queue-name $queueName --profile cloud-api --output json"
    echo "Queue exists and have access"
    return true
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
      return false
    } else {
      error "Error occured while fetching the queue details"
    }
  }
}

def checkIfDifferentFunctionTriggerAttached(event_source_arn, lambda_arn){
   try {
      def response = listEventSourceMapping (event_source_arn)
      def mapping_details = parseJson(response)
      def isDifferentLambdaAttached  = false
      if(mapping_details.EventSourceMappings.size() > 0) {
        for (details in mapping_details.EventSourceMappings) {
          if(details.FunctionArn) {
            if (details.FunctionArn != lambda_arn ){
              isDifferentLambdaAttached  = true
              echo "Function trigger attached already: ${details.FunctionArn}"
              break;
            }
          }
        }
      }
      return isDifferentLambdaAttached
   } catch (ex) {
     error "Exception occured while listing the event source mapping."
   }
}

def listEventSourceMapping (event_source_arn) {
  def response
  try {
    response = sh(
      script: "aws lambda list-event-source-mappings --event-source-arn  ${event_source_arn} --profile cloud-api --output json",
      returnStdout: true
    ).trim()
    echo "mapping_details : $response"
  } catch (ex) {
    error "Exception occured while listing the event source mapping."
  }
  return response
}

def updateSqsResourceServerless(){
  sh "sed -i -- '/#Start:isSqsResourceNotExist/,/#End:isSqsResourceNotExist/d' ./serverless.yml"
}

def removeS3EventsFromServerless(isEventSchdld){
  def sedCommand = "/#Start:isS3EventEnabled/,/#End:isS3EventEnabled/d"
  sh "sed -i -- '$sedCommand' ./serverless.yml"
  if (isEventSchdld == false) {
    sh "sed -i -- 's/events:/ /g' ./serverless.yml"
  }
}

def checkS3BucketExists(s3BucketName){
  try {
    sh "aws s3api head-bucket --bucket $s3BucketName --profile cloud-api --output json"
    echo "Bucket exists and have access"
    return true
  } catch (ex) {//bucket exists but with no access
    def res
    try {
      res = sh(script: "aws s3api head-bucket --bucket $s3BucketName --profile cloud-api --output json 2<&1 | grep -c 'Forbidden'", returnStdout: true).trim()
    } catch (e) {
      echo "Bucket does not exist "
      return false
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
    checkAndUpdateS3BucketNotificationConfiguration(existing_notifications, lambdaARN, s3BucketName, action)
  } catch (ex) {
    echo "Error while updating permission and lambda configuration"
    error ex.getMessage()
  }
}

def getbucketNotificationConfiguration(s3BucketName){
  def existing_notifications = [:]
  try {
    def existing_notificationsObj = sh(returnStdout: true, script: "aws s3api get-bucket-notification-configuration --bucket $s3BucketName --profile cloud-api --output json")
    echo "existing_notificationsObj: $existing_notificationsObj"
    existing_notifications = parseJson(existing_notificationsObj)
    return existing_notifications
  } catch (ex) {
    return existing_notifications
  }
}

def checkAndUpdateS3BucketNotificationConfiguration(existing_notifications, lambdaARN, s3BucketName, action){
  def new_lambda_configuration = [:]
  def new_s3_event_configuration = [:]
  def events = action.split(",")
  def lambdaFunctionConfigurations = []
  def new_events = []
  new_lambda_configuration.LambdaFunctionArn = lambdaARN

  if (existing_notifications != null && existing_notifications.size() > 0) {
    if(checkIfDifferentFunctionTriggerAttachedForS3(existing_notifications, lambdaARN, events)) {
      error "S3 bucket contains a different event source with same or higher priority event trigger already. Please remove the existing event trigger and try again."
    }
    new_s3_event_configuration = getS3Events(existing_notifications, events, lambdaARN)
  } else {
    new_events = checkAndConvertEvents(events)
    new_lambda_configuration.Events = new_events
    lambdaFunctionConfigurations.add(new_lambda_configuration)
    new_s3_event_configuration.LambdaFunctionConfigurations = lambdaFunctionConfigurations
  }

  echo "new notification configuration : $new_s3_event_configuration"
  if (new_s3_event_configuration != null && new_s3_event_configuration.size() > 0) {
    putbucketNotificationConfiguration(s3BucketName, new_s3_event_configuration)
  }
}

def putbucketNotificationConfiguration(s3BucketName, new_s3_event_configuration) {
  try{
    def newNotificationJson = "{}"
    if (new_s3_event_configuration != null && new_s3_event_configuration.size() > 0) {
      newNotificationJson = JsonOutput.toJson(new_s3_event_configuration)
    }
    def response = sh(
          script: "aws s3api put-bucket-notification-configuration --bucket $s3BucketName --notification-configuration \'${newNotificationJson}\' --profile cloud-api --output json",
          returnStdout: true
        ).trim()
  } catch(ex) {
    error "Error occured while updating the s3 bucket event notification configuration." + ex.getMessage()
  }
}

def checkIfDifferentFunctionTriggerAttachedForS3(existing_notifications, lambdaARN, events_action) {
 def existing_events = []
 def isDifferentEventSourceAttached = false
 def isExistsHigherPriorityEventTrigger = false

  for (item in existing_notifications) {
    eventConfigs = item.value
    for (event_config in eventConfigs) {
      existing_events.addAll(event_config.Events)
    }
  }

  for (item in events_action) {
    if ((item.contains("ObjectCreated") && existing_events.contains("s3:ObjectCreated:*")) ||
      (item.contains("ObjectRemoved") && existing_events.contains("s3:ObjectRemoved:*")) ||
      existing_events.contains(item)) {
      isExistsHigherPriorityEventTrigger = true
      break
    }
  }

  if(isExistsHigherPriorityEventTrigger) {
    if(existing_notifications.LambdaFunctionConfigurations) {
      for (lambdaConfigs in existing_notifications.LambdaFunctionConfigurations) {
        if(lambdaConfigs.LambdaFunctionArn != lambdaARN ){
          isDifferentEventSourceAttached = true
          echo "Function trigger attached already: ${lambdaConfigs.LambdaFunctionArn}"
          break;
        }
      }
    }
  }
  return isDifferentEventSourceAttached
}

def getS3Events(existing_notifications, events_action, lambdaARN){
  def existing_events = []
  def new_events = []
  def lambdaFunctionConfigurations = []
  def new_lambda_configuration = [:]
  def existing_event_configs = [:]
  def existing_event_configs_copy = [:]
  new_lambda_configuration.LambdaFunctionArn = lambdaARN

  for (item in events_action) {
    new_events.add(item)
  }

  for (item in existing_notifications) {
    existing_event_configs[item.key] = item.value
    existing_event_configs_copy[item.key] = item.value
    eventConfigs = item.value
    for (event_config in eventConfigs) {
      existing_events.addAll(event_config.Events)
    }
  }

  def cleanupIndex = -1
  echo "events . $events_action"

  // Checking the existing events
  // If the new event has (*)
  def isCreationEvent = false
  def isRemovalEvent = false
  if (new_events.contains("s3:ObjectCreated:*")) {
    isCreationEvent = true
  }
  if (new_events.contains("s3:ObjectRemoved:*")) {
    isRemovalEvent = true
  }

  def events_list = []
  if (new_events.size() > 0 && new_events != null) {
    events_list = checkAndConvertEvents(new_events)
  }

  cleanupIndex = -1
  def eventStr

  for (item in existing_notifications) {
    eventConfigs = item.value
    cleanupIndex = -1
    for (event_config in eventConfigs) {
      cleanupIndex++
       eventStr = event_config.Events.join(",")
      if ((eventStr.contains("ObjectCreated") && !eventStr.contains("s3:ObjectCreated:*") && isCreationEvent == true) ||
        (eventStr.contains("ObjectRemoved") && !eventStr.contains("s3:ObjectRemoved:*") && isRemovalEvent == true)) {
        existing_event_configs[item.key][cleanupIndex] = null
      }
    }
  }

  for (item in existing_notifications) {
    existing_event_configs[item.key].removeAll([null])
  }

  for (item in existing_event_configs) {
    if (item.value.size() <= 0) {
      existing_event_configs_copy.remove(item.key);
    }
  }

  if (existing_event_configs_copy.LambdaFunctionConfigurations) {
    for (item in existing_event_configs_copy.LambdaFunctionConfigurations) {
      if(item.LambdaFunctionArn != lambdaARN ){
        lambdaFunctionConfigurations.add(item)
      }
    }
  }
  if (events_list != null && events_list.size() > 0) {
    new_lambda_configuration.Events = new_events
    lambdaFunctionConfigurations.add(new_lambda_configuration)
  }
  if (lambdaFunctionConfigurations != null && lambdaFunctionConfigurations.size() > 0) {
    existing_event_configs_copy.LambdaFunctionConfigurations = lambdaFunctionConfigurations
  }

  echo "s3 event config : $existing_event_configs_copy"
  return existing_event_configs_copy
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

    if (new_events.contains("s3:ObjectRemoved:*")) {
      isRemovalEvent = true
    }

    for (item in events) {
      cleanupIndex++
      if (item.contains("ObjectCreated")) {
        isCreationEvent = true
        new_events[cleanupIndex] = null
      }
      if (isRemovalEvent == true && item.contains("ObjectRemoved")) {
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

def checkDynamoDbTableExists (event_source_dynamodb) {
  try {
    sh "aws dynamodb describe-table --table-name ${event_source_dynamodb} --region ${config_loader.AWS.REGION} --output json"
    echo "${event_source_dynamodb} exist."
    return true
   } catch (ex) {
    def response
    try {
      response = sh(
        script: "aws dynamodb describe-table --table-name ${event_source_dynamodb} --region ${config_loader.AWS.REGION} --output json 2<&1 | grep -c 'ResourceNotFoundException'",
        returnStdout: true
      ).trim()
    } catch (e) {
    }
    if (response) {
      return false
      echo "${event_source_dynamodb} does not exists"
    } else {
      error "Error occured while describing the dynamodb details"
    }
  }
}

def updateDynamoDbResourceServerless(event_stream_arn){
  sh "sed -i -- '/#Start:isDynamoDbtableNotExist/,/#End:isDynamoDbtableNotExist/d' ./serverless.yml"
  sh "sed -i -- '/#Start:dynamoDbstreamGetArn/,/#End:dynamoDbstreamGetArn/d' ./serverless.yml"
  sh "sed -i -- 's/streamArnDisabled/arn/g' ./serverless.yml"
  sh "sed -i -- 's|{event_dynamodb_stream_arn}|${event_stream_arn}|g' ./serverless.yml"

  sh "sed -i -- '/#Start:dynamoDbstreamGetArn/,/#End:dynamoDbstreamGetArn/d' ./policyFile.yml"
  sh "sed -i -- 's|{event_dynamodb_stream_arn}|${event_stream_arn}|g' ./policyFile.yml"
  sh  "sed -i -- 's/#ResourceDisabled/Resource/g' ./policyFile.yml"
}

def getDynamoDbStreamDetails(event_source_dynamodb) {
  def stream_details
  try {
     def streamList = sh(
      script: "aws dynamodbstreams list-streams --table-name ${event_source_dynamodb} --region ${config_loader.AWS.REGION} --output json",
      returnStdout: true
    ).trim()
    echo "dynamodb table stream details : $streamList"
    def streamListJson = parseJson(streamList)
    if (streamListJson.Streams.size() == 0) {
      echo "No streams are defined for the table."
      stream_details = createDynamodbStream(event_source_dynamodb)
    } else {
      stream_details = checkDynamoDbTableHasEnabledStream (streamListJson.Streams)
      if (!stream_details.isEnabled) {
        stream_details = createDynamodbStream(event_source_dynamodb)
      }
    }
    return stream_details
  } catch (ex) {
    error "Exception occured while listing the stream details of dynamodb table $event_source_dynamodb"
  }
}

def checkDynamoDbTableHasEnabledStream (Streams) {
  def stream_details = [
    "isEnabled" : false
  ]
  for (stream in Streams) {
      def streamDetails = sh(
        script: "aws dynamodbstreams describe-stream --stream-arn ${stream.StreamArn} --region ${config_loader.AWS.REGION} --output json",
        returnStdout: true
      ).trim()
      def streamDetailsJson = parseJson(streamDetails)
      if ((streamDetailsJson.StreamDescription.StreamStatus == "ENABLED") || (streamDetailsJson.StreamDescription.StreamStatus == "ENABLING")) {
        stream_details.isEnabled = true
        stream_details.isNewStream = false
        stream_details.StreamArn = stream.StreamArn
        break
      }
  }
  return stream_details
}

def createDynamodbStream(tableName) {
   def stream_details = [
    "isEnabled" : true,
    "isNewStream" : true
  ]

  try {
    def tableDetails = sh(
      script: "aws dynamodb update-table --table-name ${tableName} --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES --region ${config_loader.AWS.REGION} --output json",
      returnStdout: true
    ).trim()
    def tableDetailsJson = parseJson(tableDetails)
    stream_details.StreamArn = tableDetailsJson.TableDescription.LatestStreamArn
  } catch (ex){
    error "Exception occured while creating the dynamodb stream. "
  }
  return stream_details
}

def deleteEventSourceMapping (lambda_arn, assets_api, auth_token, service_config, env) {
  try {
    def response = listEventFunctionMapping(lambda_arn)
    def mapping_details = parseJson(response)

    if(mapping_details.EventSourceMappings.size() > 0) {
      for (details in mapping_details.EventSourceMappings) {
        def delResponse = sh(
          script: "aws lambda delete-event-source-mapping --uuid  ${details.UUID} --profile cloud-api --output json",
          returnStdout: true
        ).trim()
        echo "delete event source mapping: $delResponse"
      }
    }
    //Deleting dynamodb stream, which is created by jazz using aws cli
    if(service_config['event_source_dynamodb']) {
      checkAndDeleteDynamoDbStream(assets_api, auth_token, service_config, env)
    }
    //Deleting s3 event notification configuration, which is created by jazz using aws cli
    if(service_config['event_source_s3']) {
      def s3BucketName = getEventResourceNamePerEnvironment(service_config['event_source_s3'], env, "-")
      if(checkS3BucketExists(s3BucketName)) {
        deleteS3EventNotificationConfiguration(lambda_arn, s3BucketName, env)
      }
    }
  } catch (ex){
    echo "Exception occured while deleting event source mapping." + ex.getMessage()
  }
}

def deleteS3EventNotificationConfiguration(lambdaARN, s3BucketName, env) {
  def existing_notifications = getbucketNotificationConfiguration(s3BucketName)
  def existing_event_configs = [:]
  def existing_event_configs_copy = [:]
  def cleanupIndex = -1
  try {

    for (item in existing_notifications) {
      existing_event_configs[item.key] = item.value
      existing_event_configs_copy[item.key] = item.value
    }

    if(existing_notifications.LambdaFunctionConfigurations) {
      for (lambdaConfigs in existing_notifications.LambdaFunctionConfigurations) {
        cleanupIndex++
        if(lambdaConfigs.LambdaFunctionArn == lambdaARN ){
          existing_event_configs.LambdaFunctionConfigurations[cleanupIndex] = null
        }
      }
    }

    for (item in existing_notifications) {
      existing_event_configs[item.key].removeAll([null])
    }

    for (item in existing_event_configs) {
      if (item.value.size() <= 0) {
        existing_event_configs_copy.remove(item.key);
      }
    }

    existing_event_configs_copy.values().remove(null)
    putbucketNotificationConfiguration(s3BucketName, existing_event_configs_copy)
  } catch(ex) {
    echo "Exception occured while deleting the event notification configuration." + ex.getMessage()
  }

}

def listEventFunctionMapping (lambda_arn) {
  def response
  try {
    response = sh(
      script: "aws lambda list-event-source-mappings --function-name  ${lambda_arn} --profile cloud-api --output json",
      returnStdout: true
    ).trim()
    echo "mapping_details : $response"
  } catch (ex) {
    error "Exception occured while listing the event source mapping."
  }
  return response
}

def checkAndDeleteDynamoDbStream(assets_api, auth_token, service_config, env) {
  def assets = utilModule.getAssets(assets_api, auth_token, service_config, env)
  def assetList = parseJson(assets)
  def isNewStream = false
  if(assetList.data.assets.size()>0) {
    def isNewTable = checkResourceTypeInAssets(assetList.data.assets, "dynamodb")
    if(!isNewTable) {
      isNewStream = checkResourceTypeInAssets(assetList.data.assets, "dynamodb_stream")
    }
    if (isNewStream) {
      def table_name = splitAndGetResourceName(service_config['event_source_dynamodb'], env)
      deleteDynamoDbStream(table_name)
    }
  }
}

def deleteDynamoDbStream(table_name) {
  try {
    def response = sh(
      script: "aws dynamodb update-table --table-name ${table_name} --stream-specification StreamEnabled=false --profile cloud-api --output json",
      returnStdout: true
    ).trim()
    echo "Dynamodb stream details updated successfully. $response"
  } catch(ex) {
    echo "Error occured while disabling the dynamo db stream details."
  }
}

def checkResourceTypeInAssets(assetList, resource_type) {
  def isNewResource = false
  for (asset in assetList) {
    if(asset.asset_type == resource_type) {
      isNewResource = true
      break
    }
  }
  return isNewResource
}

def getEventResourceNamePerEnvironment(resource, env, concantinator) {
  if(env != "prod"){
    resource = "${resource}${concantinator}${env}"
  }
  return resource
}

def getSqsQueueName(event_source_sqs_arn, env) {
  def event_source_sqs = event_source_sqs_arn.split(":(?!.*:.*)")[1]
  return getEventResourceNamePerEnvironment(event_source_sqs, env, "_")
}

def splitAndGetResourceName(resource, env) {
  def resource_arn = resource.split("/")[1]
  return getEventResourceNamePerEnvironment(resource_arn, env, "_")
}

/**
* Non-lazy JSON parser
*/

@NonCPS
def parseJson(jsonString) {
  def m = [:]
  if(jsonString) {
    def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
    m.putAll(lazyMap)
  }
  return m
}

return this
