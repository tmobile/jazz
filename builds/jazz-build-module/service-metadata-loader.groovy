#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

echo "Service metadata module loaded successfully"

/**
 * The service metadata loader module. This module will load all service metadata from respective catalog tables and
 * get it ready for Jenkins builds. It loads data for all service types.
*/


@Field def configLoader


def initialize(configData){
    configLoader = configData
}


/**
 * Load the service metadata from Catalog
 *
 */
def loadServiceMetadata(service_id){
	withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID',
		credentialsId: configLoader.AWS_CREDENTIAL_ID, secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {

		def table_name = "${configLoader.INSTANCE_PREFIX}_services_prod"
		def serviceObj = sh (
				script: "aws --region ${configLoader.AWS.DEFAULTS.REGION} dynamodb get-item --table-name $table_name --key '{\"SERVICE_ID\": {\"S\":\"$service_id\"}}' --output json" ,
				returnStdout: true
			).trim()

		if(serviceObj){
			def service_data = parseJson(serviceObj)
			def data = service_data.Item.SERVICE_METADATA.M
			def deployment_targets = service_data.Item.SERVICE_DEPLOYMENT_TARGETS.M
			def metadata = [:]
			def catalog_metadata = [:]
			def deployment_targets_metadata = [:]


			for(item in data){
				metadata[item.key] = parseValue(item.value)
				catalog_metadata[item.key] = parseValue(item.value)
			}
			for (target in deployment_targets) {
				deployment_targets_metadata[target.key] = target.value.S
			}
			metadata['service_id'] = service_data.Item.SERVICE_ID.S
			metadata['service'] = service_data.Item.SERVICE_NAME.S
			metadata['domain'] = service_data.Item.SERVICE_DOMAIN.S
			metadata['created_by'] = service_data.Item.SERVICE_CREATED_BY.S
			metadata['type'] = service_data.Item.SERVICE_TYPE.S
			metadata['runtime'] = service_data.Item.SERVICE_RUNTIME.S
			if(service_data.Item.SERVICE_DEPLOYMENT_ACCOUNTS){
			  metadata['accountId'] = service_data.Item.SERVICE_DEPLOYMENT_ACCOUNTS.L[0].M.accountId.S
			  metadata['region'] = service_data.Item.SERVICE_DEPLOYMENT_ACCOUNTS.L[0].M.region.S
			  metadata['provider'] = service_data.Item.SERVICE_DEPLOYMENT_ACCOUNTS.L[0].M.provider.S
			} else {
			  if(configLoader.AZURE && configLoader.AZURE.IS_ENABLED instanceof Boolean && configLoader.AZURE.IS_ENABLED){
					metadata['accountId'] = configLoader.AZURE.DEFAULTS.ACCOUNTID
					metadata['region'] = configLoader.AZURE.DEFAULTS.REGION
					metadata['provider'] = configLoader.AZURE.DEFAULTS.PROVIDER
			  } else {
					metadata['accountId'] = configLoader.AWS.DEFAULTS.ACCOUNTID
					metadata['region'] = configLoader.AWS.DEFAULTS.REGION
					metadata['provider'] = configLoader.AWS.DEFAULTS.PROVIDER 
			  }
			}
			metadata['catalog_metadata'] = catalog_metadata
			metadata['deployment_targets'] = deployment_targets_metadata
			if(service_data.Item.SERVICE_SLACK_CHANNEL){
				metadata['slack_channel'] = service_data.Item.SERVICE_SLACK_CHANNEL.S
			}
			if (service_data.Item.SERVICE_DEPLOYMENT_DESCRIPTOR) { /* Lets load the deployment_descriptor if it exists */
				metadata['deployment_descriptor'] = service_data.Item.SERVICE_DEPLOYMENT_DESCRIPTOR.S
			}
			return metadata
		}
	}
}

def parseValue(data) {
  def parsedValue
  for (d in data){
    parsedValue = d.value
  }
  return parsedValue
}

@NonCPS
def parseJson(jsonString) {
    def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
    def m = [:]
    m.putAll(lazyMap)
    return m
}

 return this
