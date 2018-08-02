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


def checkSQSAndAddLambdaTrigger(queueName, lambdaARN) {
  try {
    sh "aws sqs get-queue-url --queue-name $queueName --profile cloud-api --output json"
    echo "Queue exists and have access"
    addLambdaTriggerToSqsQueue(true, queueName, lambdaARN)
  } catch (ex) {
    addLambdaTriggerToSqsQueue(false, queueName, lambdaARN)
  }
}

def addLambdaTriggerToSqsQueue(isExists, queue_name, lambdaARN){
    if(isExists){
      def isDefined = listEventSourceMapping(queue_name, lambdaARN)
      if(!isDefined){
        createEventSourceMapping(queue_name, lambdaARN)
      }
    }else{
      createSqsQueue(queue_name, lambdaARN)
    }
}

def createSqsQueue(queue_name, lambdaARN){
  try{
    sh "aws sqs create-queue --queue-name ${queue_name} --attributes '{\"VisibilityTimeout\": \"165\"}' --profile cloud-api --output json"
    createEventSourceMapping(queue_name, lambdaARN)
  }catch(ex){
    echo "Failed to create the queue"
    error "Failed to create the queue"
  }
}

def createEventSourceMapping(queue_name, arn){
  try{
    def lambdaARN = arn.split(":(?!.*:.*)")[0];
    def queue_arn = "arn:aws:sqs:${config_loader.AWS.REGION}:${config_loader.AWS.ACCOUNTID}:${queue_name}"
    sh "aws lambda create-event-source-mapping --function-name ${lambdaARN} --event-source ${queue_arn} --profile cloud-api --output json"
  }catch(ex){
    echo "Failed to create the event source mapping"
    error "Failed to create the event source mapping"
  }
}

def listEventSourceMapping(queue_name, arn){
  try{
    def lambdaARN = arn.split(":(?!.*:.*)")[0];
    def queue_arn = "arn:aws:sqs:${config_loader.AWS.REGION}:${config_loader.AWS.ACCOUNTID}:${queue_name}"
    def response =  sh(
			script: "aws lambda list-event-source-mappings --function-name ${lambdaARN} --event-source ${queue_arn} --profile cloud-api --output json",
			returnStdout: true
		).trim()
    def mappings = parseJson(response)
    if(mappings.EventSourceMappings.size() > 0){
      return true
    }else{
      return false
    }
  }catch(ex){
    echo "Failed to list the event source mapping"
    error "Failed to list the event source mapping"
  }
}

@NonCPS
def parseJson(jsonString) {
    def lazyMap = new groovy.json.JsonSlurper().parseText(jsonString)
    def m = [:]
    m.putAll(lazyMap)
    return m
}

return this
