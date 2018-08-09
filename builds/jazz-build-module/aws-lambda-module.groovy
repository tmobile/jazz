/**
 * Query AWS for the ARN of a lambda
 * 
 * @param stackName Stack name used to query for the lamba ARN.
 * @return object with the ARN for the lambda.
 */
def getLambdaARN (stackName) {
    def arn = "";

    try {
        def cloudformation_resources = "";
        cloudformation_resources = sh(returnStdout: true, script: "aws cloudformation describe-stacks --output json --stack-name ${stackName} --profile cloud-api")

        def parsedObject = parseJson(cloudformation_resources);
        def outputs = parsedObject.Stacks[0].Outputs;

        for (output in outputs) {
            if (output.OutputKey == "HandlerLambdaFunctionQualifiedArn") {
                arn = output.OutputValue
            }
        }
    } catch (ex) {
        error ex.getMessage();
    }

    def tokens = arn.split(':')
    def version
    def alias
    if (tokens[7].substring(0,1).isNumber()) {
        version = tokens[7]
        alias = ""
    } else {
        version = ""
        alias = tokens[7]
    }
    
    return [ arn: arn, region: tokens[3], accountId: tokens[4], functionName: tokens[6], version: version, alias: alias ]
}

@NonCPS
def parseJson(jsonString) {
    def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
    def m = [:]
    m.putAll(lazyMap)
    return m
}

return this
