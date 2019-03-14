#!groovy
import groovy.transform.Field
import groovy.json.JsonSlurperClassic

echo "aws-apigateway.groovy module loaded successfully"

@Field def genericAmazonIntegration
@Field def optionsAmazonIntegration

def initialize() {
  genericAmazonIntegration = readFile("aws/apigateway-lambda-integration-specs/amazon-swagger-spec-generic.txt");
  optionsAmazonIntegration = readFile("aws/apigateway-lambda-integration-specs/amazon-swagger-spec-options.txt");
}

def writeTempFiles() {
  writeFile file: 'optionsSpecTemp.txt', text: optionsAmazonIntegration;
  writeFile file: 'genericSpecTemp.txt', text: genericAmazonIntegration;
}

def addApigatewayLambdaIntegration(filePath) {
  try {
    writeTempFiles();
    FindUserDefinedIntegrationSpec(filePath)
  } catch (ex) {
    echo "error in lambda integration"
    error ex.getMessage();
  } finally {
    if (fileExists('optionsSpecTemp.txt')) {
      sh "rm -rf optionsSpecTemp.txt"
    }
    if (fileExists('genericSpecTemp.txt')) {
      sh "rm -rf genericSpecTemp.txt"
    }
  }
}

// Find user defined 'x-amazon-apigateway-integration' for each method, if doesn't exist inject default one.
def FindUserDefinedIntegrationSpec(filePath) {
  try {
    def swaggerStr = readFile(filePath).trim()
    def parsed_json = parseJson(swaggerStr)
    def keys = parsed_json.keySet() as String[];
    def keys_of_paths = parsed_json.paths.keySet();

    for (key_of_a_path in keys_of_paths) {
      def methods_of_each_path = parsed_json.paths[key_of_a_path].keySet()
      for (method in methods_of_each_path) {
        def temp = parsed_json.paths[key_of_a_path][method]
        if (!temp["x-amazon-apigateway-integration"]) {
          echo "x-amazon-apigateway-integration does not exist."
          injectLambdaIntegration(method, filePath);
        }
      }
    }
  } catch (ex) {
    echo " RemoveUserDefinedIntegrationSpec :::: Error occurred" + ex.getMessage()
    error " RemoveUserDefinedIntegrationSpec :::: Error occurred" + ex.getMessage()
  }
}

@NonCPS
def parseJson(jsonString) {
  def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
  def m = [: ]
  m.putAll(lazyMap)
  return m
}

def injectLambdaIntegration(method, filePath) {
  if (method == 'options') {
    sh "sed -i '/\"$method\":.*{/ r optionsSpecTemp.txt' $filePath"
  } else {
    sh "sed -i '/\"$method\":.*{/ r genericSpecTemp.txt' $filePath"
  }
}

return this;
