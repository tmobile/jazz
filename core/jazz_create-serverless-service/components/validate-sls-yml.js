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
                                    .filter(eventElem => eventElem.events) // Only those with events are interesting here
                                    .flatMap(functionContent => validateEventsElement(functionContent.events));
     return outstandingEvents;
  } else {
    return [];
  }
}

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

module.exports = {
  validateResources : validateResources,
  validateEvents : validateEvents }
