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
		def service_Object = sh (
				script: "aws --region ${configLoader.AWS.REGION} dynamodb get-item --table-name $table_name --key '{\"SERVICE_ID\": {\"S\":\"$service_id\"}}' --output json" ,
				returnStdout: true
			).trim()

		if(service_Object){
			def service_data = parseJson(service_Object)
			def data = service_data.Item.SERVICE_METADATA.M
			def metadata = [:]
			def catalog_metadata = [:]

			for(item in data){
				metadata[item.key] = parseValue(item.value)
				catalog_metadata[item.key] = parseValue(item.value)
			}
			metadata['service_id'] = service_data.Item.SERVICE_ID.S
			metadata['service'] = service_data.Item.SERVICE_NAME.S
			metadata['domain'] = service_data.Item.SERVICE_DOMAIN.S
			metadata['created_by'] = service_data.Item.SERVICE_CREATED_BY.S
			metadata['type'] = service_data.Item.SERVICE_TYPE.S
			metadata['runtime'] = service_data.Item.SERVICE_RUNTIME.S
			metadata['region'] = configLoader.AWS.REGION
			metadata['catalog_metadata'] = catalog_metadata
			if(service_data.Item.SERVICE_SLACK_CHANNEL)
				metadata['slack_channel'] = service_data.Item.SERVICE_SLACK_CHANNEL.S

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
