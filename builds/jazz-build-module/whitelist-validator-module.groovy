#!groovy?
import groovy.transform.Field

echo "whitelist-validator-module has been successfully loaded"

@Field def whitelistContent
@Field def whiteList
@Field def underResources
@Field def allowedResources
@Field def allowedActions

def initialize() {
  whitelistContent = readFile("sls-app/whitelist.yml")
  whiteList = readYaml(text: whitelistContent)
  underResources = whiteList['resources'].collect{key, val -> val}
  allowedResources = underResources.collect{firstLevel -> firstLevel.collect{secondLevel -> secondLevel['Type']}}.flatten()
  allowedActions = whiteList['actions'].collect{key, val -> val.collect{action -> "$key:$action".toString()}}.flatten()
}

def validate(cftJson) {
  def outstandingResources = []
  def templateUnderResources = cftJson['Resources']
  if(templateUnderResources != null) {
      def allTargetResourceTypes = templateUnderResources.collect{key, val -> val}['Type']
      outstandingResources = allTargetResourceTypes.clone()
      outstandingResources.removeAll(allowedResources)
  }
  return outstandingResources
}

/* Validating all Actions under 'provider/iamManagedPolicies'
   Example:
provider:
 name: aws
 iamRoleStatements:
   - Effect: "Allow"
     Action:
       - "s3:ListBucket"
*/
def validateActionsInProvider(deploymentDescriptor) {
  def deploymentDescriptorDoc = readYaml(text: deploymentDescriptor)
  def providerElem = deploymentDescriptorDoc['provider']
  if(providerElem) {
    def iamRoleElem = providerElem['iamRoleStatements']
    if(iamRoleElem) {
      return validatePolicyStatement(iamRoleElem)
    } else {
      return []
    }
  } else {
    return []
  }
}

/* Validating all Actions at resource/Resources/role[Type='AWS:IAM:Role]/Policies/Statement
   Example:
resources:
 Resources:
   myRole:
     Type: AWS::IAM::Role
     Properties:
       Path: /my/default/path/
       RoleName: MyRole
       Policies:
         - PolicyName: myPolicyName
           PolicyDocument:
             Version: '2017'
             Statement:
               - Effect: "Allow"
                 Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
*/
def validateActionsInResources(deploymentDescriptor) {
  def deploymentDescriptorDoc = readYaml(text: deploymentDescriptor)
  def resourcesElem = deploymentDescriptorDoc['resources']
  if(resourcesElem) { // 'resources' top element is present
    def capitalResourcesElem = resourcesElem.Resources
    if(capitalResourcesElem) { // 'resources.Resources' element is present
      return capitalResourcesElem.collect{name, content -> content} // Here we are not intersted in keys but only in values that we extract
                                 .findAll{it['Type'] == 'AWS::IAM::Role' && it['Properties'] && it['Properties']['Policies']} // Only IAM Role resources we are interested in here
                                 .collect{item -> item['Properties']['Policies']}
                                 .flatten() // merging all policy arrays all together [[p1,p2], [p3,p4]] => [p1,p2,p3,p4]
                                 .findAll{it['PolicyDocument']} //Only those policies with document we are integersted in
                                 .collect{policy -> policy['PolicyDocument']}
                                 .findAll{it['Statement']} // Only documents with Statement inside
                                 .collect{document -> validatePolicyStatement(document['Statement'])}
                                 .flatten()
    } else {
      return []
    }
  } else {
    return []
  }
}

// Inner function that is able to validate 'Statement' structure irrespecitve off place it is encountered
def validatePolicyStatement(statementElem) {
  def allRelevant = statementElem.flatten()
                                 .findAll{val -> val['Effect'] == 'Allow'}
                                 .collect{val -> val['Action']}
                                 .flatten()

  def outstandingResources = allRelevant.clone()
  outstandingResources.removeAll(allowedActions)
  return outstandingResources
}

/** Finding the oustanding actions that occured in either 'provider' or 'resources'
     top element
  @deploymentDescriptor is a string with a yml file inside that looks like
provider:
  name: aws
  iamRoleStatements:
    - Effect: "Allow"
      Action:
        - "s3:ListBucket"
resources:
  Resources:
    myRole:
      Type: AWS::IAM::Role
      Properties:
        Path: /my/default/path/
        RoleName: MyRole
        Policies:
          - PolicyName: myPolicyName
            PolicyDocument:
              Version: '2017'
              Statement:
                - Effect: "Allow"
                  Action:
                   - logs:CreateLogGroup
                   - logs:CreateLogStream

  @returns the list of oustanding actions that are not listed at whitelist.yml.
  Like ['ec2:CreateLaunchTemplate', 'ec2:CopyImage', ...]
*/
def validateActions(deploymentDescriptor) {
  def allTogether = []
  allTogether.addAll(validateActionsInProvider(deploymentDescriptor));
  allTogether.addAll(validateActionsInResources(deploymentDescriptor));
  return allTogether;
}

/* To identify the plugin element location an example is used as follows:
   https://github.com/serverless/examples/blob/master/aws-node-rest-api-with-dynamodb-and-offline/serverless.yml
*/
def validatePlugins(deploymentDescriptor) {
  def deploymentDescriptorDoc = readYaml(text: deploymentDescriptor)
  def pluginsElem = deploymentDescriptorDoc['plugins']
  if(pluginsElem) {
    def outstandingPlugins = pluginsElem.clone()
    outstandingPlugins.removeAll(allowedPlugins)
    return outstandingPlugins
  } else {
    return []
  }
}


return this
