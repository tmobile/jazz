#!groovy
import groovy.transform.Field

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
        def httpVerbs = ['get', 'post', 'delete', 'put', 'connect', 'head', 'options', 'patch', 'trace'];
        for (verb in httpVerbs) {
            injectLambdaIntegration(verb, filePath);
        }
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

def injectLambdaIntegration(method, filePath) {
    
    echo "Injecting Amazon Api Gateway lambda integration spec"
    if (method == 'options') {
        sh  "sed -i '/\"$method\":.*{/ r optionsSpecTemp.txt' $filePath"
    } else {
        sh  "sed -i '/\"$method\":.*{/ r genericSpecTemp.txt' $filePath"
    }
}

return this;