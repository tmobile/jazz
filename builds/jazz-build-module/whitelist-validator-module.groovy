#!groovy?
import groovy.transform.Field

echo "whitelist-validator-module has been successfully loaded"

@Field def whitelistContent
@Field def whiteList
@Field def underResources
@Field def allowedResources

def initialize() {
  whitelistContent = readFile("sls-app/whitelist.yml")
  whiteList = readYaml(text: whitelistContent)
  underResources = whiteList['resources'].collect{key, val -> val}
  allowedResources = underResources.collect{firstLevel -> firstLevel.collect{secondLevel -> secondLevel['Type']}}.flatten()
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

return this
