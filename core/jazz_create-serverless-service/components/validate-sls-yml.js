// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

const yaml = require('js-yaml');
const fs   = require('fs');

const content = fs.readFileSync('./components/whitelist.yml');
const doc = yaml.safeLoad(content, 'utf8');

const concat = (x,y) =>
  x.concat(y)

const flatMap = (f,xs) =>
  xs.map(f).reduce(concat, [])

// If we use the version of JS that does not support flatMap
if(!Array.prototype.flatMap) {
  Array.prototype.flatMap = function(f) {
    return flatMap(f,this)
  }
}

// Loading the list of all types allowed
const allowedResourceList = Object.keys(doc.resources).flatMap(key => doc.resources[key]).map(obj => obj.Type);
const allowedEventNameList = Object.keys(doc.events).filter(name => name != 'stream'); // everything but stream as stream depend on type
const allowedStreamTypeList = doc.events['stream'].map(obj => obj.type); // Enlisting all allowed stream types
const allowedActions = Object.keys(doc.actions).flatMap(key => doc.actions[key].map(value => `${key}:${value}`)) // All actions in the 'resource:action' form like 'kinesis:DescribeStream'

const getReducerFunction = function(allowed) {
  return function(acc, curr) {
    if(!allowed.includes(curr)) acc.push(curr);
    return acc;
  }
}
// Accumulating all values that are not present in the whitelist
const reducer = function(acc, curr) {
  if(!allowedResourceList.includes(curr)) acc.push(curr);
  return acc;
}

/* Validates a given yml file's resources against whitelist yml */
const validateResources = function validateResourcesAgaistWhitelist(deploymentDescriptor) {
  const deploymentDescriptorDoc = yaml.load(deploymentDescriptor);
  if(deploymentDescriptorDoc.resources && deploymentDescriptorDoc.resources.Resources) {
    const resourcesElem = deploymentDescriptorDoc.resources.Resources;
    // Extracting all elements of 'Type' from under resources.Resources
    const allTargetResourceTypes = Object.keys(resourcesElem).map(name => resourcesElem[name].Type);
    // target minus all in whitelist should give us all oustanding resource types that a developer used outside the whitelist defined
    const outstandingResources = allTargetResourceTypes.reduce(getReducerFunction(allowedResourceList), []);
    return outstandingResources;
  } else {
    return []; // If the targetFileDoc.resources.Resources is not present there is nothing to worry about as we are not trying to create anything
  }
}

const validateEvents = function validateEventsAgaistWhitelist(deploymentDescriptor) {
  const deploymentDescriptorDoc = yaml.load(deploymentDescriptor);
  const functionElem = deploymentDescriptorDoc.functions;
  if(functionElem) {

    const outstandingEvents = Object.keys(functionElem).map(name => functionElem[name])
                                    .filter(eventElem => eventElem.events) // Only those with 'events' sub-element are interesting here
                                    .flatMap(functionContent => validateEventsElement(functionContent.events));
     return outstandingEvents;
  } else {
    return [];
  }
}

/* Validating all the events under functions/events
functions:
  some-random-name:
    name: SomeRandomName
      ...
    events:
      - schedule:
          rate: 160
          name: some-name
          enabled: true
      - stream:
          type: dynamodb
*/
const validateEventsElement = function validateEventsInsideFunction(element) {
    const allEventNames = element.flatMap(obj => Object.keys(obj))
                                                       .filter(name => name != 'stream'); // Everything but 'stream' that we'll handle separatelly
    const outstandingEventNames = allEventNames.reduce(getReducerFunction(allowedEventNameList), []);

    const allStreamTypes = element.flatMap(obj => obj['stream'])
                                  .filter(stream => stream) // Removing all null entries where 'stream' element could not be resolved
                                  .map(stream => stream.type)
                                  .filter(typeName => typeName); // If stream does not have 'type' then filtering that out as well
    const outstandingStreamTypes = allStreamTypes.reduce(getReducerFunction(allowedStreamTypeList), [])
                                                 .map(str => 'stream:'+str); // Attaching 'stream' word to make it different from event name

    return outstandingEventNames.concat(outstandingStreamTypes);
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
const validateActionsInProvider = function validateActionInProviderIamRoleStatements(deploymentDescriptor) {
  const deploymentDescriptorDoc = yaml.load(deploymentDescriptor);
  const providerElem = deploymentDescriptorDoc.provider;
  if(providerElem) {
    iamRoleElem = providerElem.iamRoleStatements;
    if(iamRoleElem) {
      return validatePolicyStatement(iamRoleElem); // Removing all the actions that are allowed thus not allowed will stay in
    } else {
      return [];
    }
  } else {
    return [];
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
               - Effect:
                 Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
*/
const validateActionsInResources = function validateActionsInResourceRolePolicy(deploymentDescriptor) {
  const deploymentDescriptorDoc = yaml.load(deploymentDescriptor);
  const resourcesElem = deploymentDescriptorDoc.resources;
  if(resourcesElem) { // 'resources' top element is present
    const capitalResourcesElem = resourcesElem.Resources;
    if(capitalResourcesElem) { // 'resources.Resources' element is present
      resourceValues = Object.keys(capitalResourcesElem).map(key => capitalResourcesElem[key]); // Here we are not intersted in keys but only in values that we extract
      return resourceValues.filter(aResource => aResource.Type==='AWS::IAM::Role' && // Only IAM Role resources we are interested in here
                                                aResource.Properties &&
                                                aResource.Properties.Policies)
                           .flatMap(aResource => aResource.Properties.Policies) // merging all policy arrays all together [[p1,p2], [p3,p4]] => [p1,p2,p3,p4]
                           .filter(policy => policy.PolicyDocument) //Only those policies with document we are integersted in
                           .map(policy => policy.PolicyDocument)
                           .filter(doc => doc.Statement) // Only documents with Statement inside
                           .flatMap(document => validatePolicyStatement(document.Statement));
    } else {
      return [];
    }
  } else {
    return [];
  }

}

// Inner function that is able to validate 'Statement' structure irrespecitve off place it is encountered
function validatePolicyStatement(statementElem) {
  return statementElem.filter(item => item.Effect === 'Allow' && item.Action) // Where Effect is 'Allow' and the Action sub element is present
                      .flatMap(elem => elem.Action) // Combining all action subarrays into one big flat list
                      .reduce(getReducerFunction(allowedActions),[]);
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
                - Effect:
                  Action:
                   - logs:CreateLogGroup
                   - logs:CreateLogStream

  @returns the list of oustanding actions that are not listed at whitelist.yml.
  Like ['ec2:CreateLaunchTemplate', 'ec2:CopyImage', ...]
*/
const validateActions = function validateActionsInProviderAndResources(deploymentDescriptor) {
  const outstandingActionsInProvider = validateActionsInProvider(deploymentDescriptor);
  const outstandingActionsInResources = validateActionsInResources(deploymentDescriptor);
  return outstandingActionsInProvider.concat(outstandingActionsInResources);
}

module.exports = {
  validateResources : validateResources,
  validateEvents : validateEvents,
  validateActions: validateActions}
