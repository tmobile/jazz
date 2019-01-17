#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* Logic for accessing certain values from the given jazz-installer-vars json
*/

@Field def configData

echo "the module, 'config-loader', loaded successfully... congratulations..."

/**
 * Load the service metadata from Catalog
 *
 */
def loadConfigData(aws_credential_id, region, instance_prefix) {
  def table_name = "${instance_prefix}_JazzConfig"
  try {
    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID',
		credentialsId: aws_credential_id , secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
      def config_object = sh (
        script: "aws --region ${region} dynamodb scan --table-name $table_name  --output json" ,
        returnStdout: true
      ).trim()

      if (config_object) {
        def data = parseJson(config_object)
        def config_data = [:]
        for(item in data.Items[0]){
          config_data[item.key] = parseValue(item.value)
        }
        return config_data
      } else {
        error "No configurations defined in the config catalog."
      }
    }
  }catch(ex) {
    error "Failed to fetch the configuration details."
  }
}

def parseValue(value) {
  for (v in value ) {
    def type = v.key
    def parsed_value = v.value;

    if (type == 'M') {
      def parsed_value_map = [:];
      try {
        for (d in parsed_value) {
            parsed_value_map[d.key] = parseValue(parsed_value[d.key])
        }
      } catch (e) { }
      return parsed_value_map;
    } else if (type == 'L') {
      def parsed_value_list = [];
      try {
        for (def i = 0; i < parsed_value.length; i++) {
            parsed_value_list.push(parseValue(parsed_value[i]));
        }
      } catch (e) { }
      return parsed_value_list;
    } else {
      return singleParseValue(value);
    }
  }
};

def singleParseValue(data) {
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
