// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
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

'use strict';

const request = require('request');
const errorHandler = require("./components/error-handler.js")();
const responseObj = require("./components/response.js");
const CronParser = require("./components/cron-parser.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const util = require('util');
const validateARN = require("./components/validate-arn.js");
const crud = require("./components/crud")();

/**
    Serverless create service
    @author:
    @version: 1.0
**/
var user_id;
var serviceId;
var serviceDataObject;
var authToken;
var handler = (event, context, cb) => {

  let deploymentTargets = {};
  let deploymentAccounts = [];
  var config = configModule.getConfig(event, context);
  logger.init(event, context);
  var service_creation_data = event.body;
  try {
    var isValidName = function (name) {
      return /^[A-Za-z0-9\-]+$/.test(name);
    };

    if (!service_creation_data) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Service inputs are not defined")));
    } else if (!service_creation_data.service_type) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("'service_type' is not defined")));
    } else if (!service_creation_data.service_name || !isValidName(service_creation_data.service_name)) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("'service_name' is not defined or has invalid characters")));
    } else if (service_creation_data.service_type !== "website" && (!service_creation_data.runtime)) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("'runtime' is not defined")));
    } else if (service_creation_data.domain && !isValidName(service_creation_data.domain)) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Namespace is not appropriate")));
    } else if (service_creation_data.service_name && service_creation_data.service_name.length > 20) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("'Service Name' can have up to 20 characters")));
    } else if (service_creation_data.domain && service_creation_data.domain.length > 20) {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("'Namespace' can have up to 20 characters")));
    }
    // validate service types
    const allowedSvcTypes = Object.keys(config.DEPLOYMENT_TARGETS);
    if (allowedSvcTypes.indexOf(service_creation_data.service_type) !== -1) {
      logger.info(`Valid service type provided ${service_creation_data.service_type}`);
    } else {
      return cb(JSON.stringify(errorHandler.throwInputValidationError(`Invalid service type provided - ${service_creation_data.service_type}`)));
    }

    // validate deployment targets
    if (service_creation_data.deployment_targets && typeof service_creation_data.deployment_targets === "object") {
      const allowedSubServiceType = config.DEPLOYMENT_TARGETS[service_creation_data.service_type];
      deploymentTargets = validateDeploymentTargets(allowedSubServiceType, service_creation_data.deployment_targets, service_creation_data.service_type)
      if (deploymentTargets.error) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError(deploymentTargets.error)));
      }
    } else {
      return cb(JSON.stringify(errorHandler.throwInputValidationError(`Deployment targets is missing or is not in a valid format`)));
    }

     //validate list of providers
    if(Array.isArray(service_creation_data.deployment_accounts) && service_creation_data.deployment_accounts){
      if(!validateProviders(config, service_creation_data.deployment_accounts)){
        logger.error('Invalid provider in the input')
        return cb(JSON.stringify(errorHandler.throwInputValidationError('Invalid provider in the input')))
      }
    }

    // Validate and set deployment accounts
    let primaryAccountCount = 0;

    if (service_creation_data.deployment_accounts && Array.isArray(service_creation_data.deployment_accounts)) {
      let providerValues = validateMultipleProviders(service_creation_data.deployment_accounts);
      if(!providerValues){
        logger.error('Deployment accounts has multiple providers which is not supported now!');
        return cb(JSON.stringify(errorHandler.throwInputValidationError('Deployment accounts has multiple providers which is not supported now!')));
      }
      for (let eachDeploymentAccount of service_creation_data.deployment_accounts) {
        if(eachDeploymentAccount.provider == 'aws'){
          if ((typeof eachDeploymentAccount.primary == "boolean") && eachDeploymentAccount.primary) {
            primaryAccountCount++
            let deploymentAccount = {
              'accountId': eachDeploymentAccount.accountId || config.PRIMARY_DEPLOYMENT_ACCOUNT.AWS.accountId,
              'region': eachDeploymentAccount.region || config.PRIMARY_DEPLOYMENT_ACCOUNT.AWS.region,
              'provider': eachDeploymentAccount.provider || config.PRIMARY_DEPLOYMENT_ACCOUNT.AWS.provider,
              'primary': eachDeploymentAccount.primary
            }
            deploymentAccounts.push(deploymentAccount);
          } else {
            if (eachDeploymentAccount.accountId && eachDeploymentAccount.region && eachDeploymentAccount.provider) {
              deploymentAccounts.push(eachDeploymentAccount);
            } else {
              logger.error('accountId, region and provider are required for a non-primary deployment account');
              return cb(JSON.stringify(errorHandler.throwInputValidationError('accountId, region and provider are required for a non-primary deployment account')));
            }
          }
        } else if (eachDeploymentAccount.provider == 'azure'){
          if((typeof eachDeploymentAccount.primary == "boolean") && eachDeploymentAccount.primary){
            primaryAccountCount++
            let deploymentAccount = {
              'accountId': eachDeploymentAccount.accountId || config.PRIMARY_DEPLOYMENT_ACCOUNT.AZURE.accountId,
              'region': eachDeploymentAccount.region || config.PRIMARY_DEPLOYMENT_ACCOUNT.AZURE.region,
              'provider': eachDeploymentAccount.provider || config.PRIMARY_DEPLOYMENT_ACCOUNT.AZURE.provider,
              'primary': eachDeploymentAccount.primary
            }
            deploymentAccounts.push(deploymentAccount);
          } else {
            if (eachDeploymentAccount.accountId && eachDeploymentAccount.region && eachDeploymentAccount.provider) {
              deploymentAccounts.push(eachDeploymentAccount);
            } else {
              logger.error('accountId, region and provider are required for a non-primary deployment account');
              return cb(JSON.stringify(errorHandler.throwInputValidationError('accountId, region and provider are required for a non-primary deployment account')));
            }
          }
        }
      }

      if (primaryAccountCount == 0) {
        logger.error('Invalid input! At least one primary deployment account is required')
        return cb(JSON.stringify(errorHandler.throwInputValidationError('Invalid input! At least one primary deployment account is required')))
      }
      if (primaryAccountCount > 1) {
        logger.error('Invalid input! Only one primary deployment account is allowed')
        return cb(JSON.stringify(errorHandler.throwInputValidationError('Invalid input! Only one primary deployment account is allowed')))
      }
    } else {
      return cb(JSON.stringify(errorHandler.throwInputValidationError(`Deployment accounts is missing or is not in a valid format`)));
    }

    user_id = event.principalId;
    if (!user_id) {
      logger.error(`Authorizer did not send the user information, please check if authorizer is enabled and is functioning as expected!`);
      return cb(JSON.stringify(errorHandler.throwUnAuthorizedError(`User is not authorized to access this service`)));
    }

    logger.info(`Request event: ${JSON.stringify(event)}`);

    getToken(config)
      .then((authToken) => getServiceData(service_creation_data, authToken, config, deploymentTargets, deploymentAccounts))
      .then((inputs) => createService(inputs))
      .then(() => startServiceOnboarding(service_creation_data, config, serviceId))
      .then((result) => {
        return cb(null, responseObj(result, service_creation_data));
      })
      .catch(function (err) {
        logger.error(`Error while creating service : ${JSON.stringify(err)}`);
        if (err.jenkins_api_failure) {
          serviceDataObject.body = {
            "STATUS": "creation_failed"
          };
          crud.update(serviceId, serviceDataObject, (serviceUpdateError, results) => {
            if (serviceUpdateError) {
              var errorMessage = {
                "message": `Error occurred while updating service with failed status.`,
                "error": err
              };
              return cb(JSON.stringify(errorHandler.throwInternalServerError(errorMessage)));
            } else {
              logger.error(`Updated service catalog with failed status.`);
              return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
            }
          });
        } else if (err.result === 'inputError') {
          return cb(JSON.stringify(errorHandler.throwInputValidationError(err.message)));
        } else {
          return cb(JSON.stringify(errorHandler.throwInternalServerError(err.message)));
        }
      });

  } catch (e) {
    logger.error(e);
    cb(JSON.stringify(errorHandler.throwInternalServerError(e)));
  }
}

var startServiceOnboarding = (service_creation_data, config, service_id) => {
  return new Promise((resolve, reject) => {
    try {
      var base_auth_token = "Basic " + new Buffer(util.format("%s:%s", config.SVC_USER, config.API_TOKEN)).toString("base64");
      var userlist = "";
      var approvers = service_creation_data.approvers;

      userlist = approvers.reduce((stringSoFar, approver) => {
        return stringSoFar + util.format("name=%s&", approver);
      }, "");

      var input = {
        token: config.JOB_TOKEN,
        admin_group: userlist,
        service_id: service_id
      };
      if (service_creation_data.deployment_descriptor)
      {
        input.deployment_descriptor = service_creation_data.deployment_descriptor
      }
      request({
        url: config.JOB_BUILD_URL,
        method: 'POST',
        headers: {
          "Authorization": base_auth_token
        },
        qs: input
      }, function (err, response, body) {
        if (err) {
          logger.error(`Error while starting service onboarding: ${err}`);
          err.jenkins_api_failure = true;
          reject(err);
        } else {
          if (response.statusCode <= 299) { // handle all 2xx response codes as success
            resolve(`Successfully created your service.`);
          } else {
            logger.error(`Failed while request to service onboarding job ${JSON.stringify(response)}`);
            var message = {
              'message': `Failed to kick off service onboarding job.`,
              'jenkins_api_failure': true
            };
            reject(message);
          }
        }
      });
    } catch (e) {
      logger.error(`Error during startServiceOnboarding: ${e.message}`);
      reject(e);
    }
  });
}

/**
 * Function to check and validate if the list of providers for deployment_accounts are all same or different. If same return true else false
 */
function validateMultipleProviders(deployment_accounts){
  let providerValues = []
  for (let eachDeploymentAccount of deployment_accounts){
    providerValues.push(eachDeploymentAccount.provider)
  }
  return providerValues.every( (val, i, arr) => val === arr[0] )
}

/**
 * Function to check and validate the list of providers
 */
function validateProviders(config, deployment_accounts){
  for (let eachDeploymentAccount of deployment_accounts){
    if(config.PROVIDER_LIST.indexOf(eachDeploymentAccount.provider) == -1){
        return false
    }
  }
  return true
}

var getToken = (configData) => {
  return new Promise((resolve, reject) => {
    var svcPayload = {
      uri: configData.SERVICE_API_URL + configData.TOKEN_URL,
      method: 'post',
      json: {
        "username": configData.SERVICE_USER,
        "password": configData.TOKEN_CREDS
      },
      rejectUnauthorized: false
    };

    request(svcPayload, (error, response, body) => {
      if (response.statusCode === 200 && body && body.data) {
        authToken = body.data.token;
        return resolve(authToken);
      } else {
        return reject({
          "error": `Could not get authentication token for updating service catalog.`,
          "message": response.body.message
        });
      }
    });
  });
}

var createService = (service_data) => {
  return new Promise((resolve, reject) => {
    crud.create(service_data, (err, results) => {
      if (err) {
        reject({
          "message": err.error
        });
      } else {
        serviceId = results.data.service_id;
        logger.info(`created a new service in service catalog with service Id: ${serviceId}`);
        resolve(results.data.service_id);
      }
    });
  });
}

var getServiceData = (service_creation_data, authToken, configData, deploymentTargets, deploymentAccounts) => {
  return new Promise((resolve, reject) => {
    var inputs = {
      "TOKEN": authToken,
      "SERVICE_API_URL": configData.SERVICE_API_URL,
      "SERVICE_API_RESOURCE": configData.SERVICE_API_RESOURCE,
      "SERVICE_NAME": service_creation_data.service_name.toLowerCase(),
      "DOMAIN": service_creation_data.domain.toLowerCase(),
      "DESCRIPTION": service_creation_data.description,
      "TYPE": service_creation_data.service_type,
      "RUNTIME": service_creation_data.runtime,
      "REGION": service_creation_data.region,
      "USERNAME": user_id,
      "IS_PUBLIC_ENDPOINT": service_creation_data.is_public_endpoint || false,
      "STATUS": "creation_started"
    };

    var serviceMetadataObj = {};
    if (service_creation_data.tags) {
      inputs.TAGS = service_creation_data.tags;
    }

    if (service_creation_data.email) {
      inputs.EMAIL = service_creation_data.email;
    }

    if (service_creation_data.slack_channel) {
      inputs.SLACKCHANNEL = service_creation_data.slack_channel;
    }

    if ((service_creation_data.service_type === "api" || service_creation_data.service_type === "function") && (service_creation_data.require_internal_access)) {
      serviceMetadataObj.require_internal_access = service_creation_data.require_internal_access;
    }

    //Adding providerRuntime key in service catalog
    if (service_creation_data.service_type === "api" || service_creation_data.service_type === "function" || service_creation_data.service_type === "sls-app") {
      serviceMetadataObj.providerRuntime = service_creation_data.runtime;
    }
    
    //Adding providerTimeout key in service catalog
    if (service_creation_data.service_type === "api" || service_creation_data.service_type === "function") {
        // default to 30 seconds
        serviceMetadataObj.providerTimeout = configData.DEFAULT_PROVIDER_TIMEOUT;
    }

    inputs.DEPLOYMENT_ACCOUNTS = deploymentAccounts;

    // Pass the flag to enable authentication on API
    if (service_creation_data.service_type === "api") {
      inputs.DEPLOYMENT_TARGETS = deploymentTargets;
      serviceMetadataObj.enable_api_security = service_creation_data.enable_api_security || false;
      if (service_creation_data.authorizer_arn) {
        // Validate ARN format - arn:aws:lambda:region:account-id:function:function-name
        if (!validateARN(service_creation_data.authorizer_arn)) {
          return reject(JSON.stringify(errorHandler.throwInputValidationError("authorizer arn is invalid, expected format=arn:aws:lambda:region:account-id:function:function-name")));
        } else {
          serviceMetadataObj.authorizer_arn = service_creation_data.authorizer_arn;
        }
      }
    }

    // Disabling require_internal_access and enable_api_security when is_public_endpoint is true
    if (service_creation_data.service_type === "api" && service_creation_data.is_public_endpoint) {
      serviceMetadataObj.require_internal_access = false;
      serviceMetadataObj.enable_api_security = false;
    }

    if (service_creation_data.service_type === "website") {
      inputs.DEPLOYMENT_TARGETS = deploymentTargets;
      var create_cloudfront_url = "true";
      serviceMetadataObj.create_cloudfront_url = create_cloudfront_url;
      inputs.RUNTIME = 'n/a';
      if (service_creation_data.framework == 'angular' || service_creation_data.framework == 'react') {
        serviceMetadataObj.framework = service_creation_data.framework;
      }
    }
    // Add rate expression to the propertiesObject;
    if (service_creation_data.service_type === "function") {
      inputs.DEPLOYMENT_TARGETS = deploymentTargets;
      if (service_creation_data.rateExpression) {
        var cronExpValidator = CronParser.validateCronExpression(service_creation_data.rateExpression);
        if (cronExpValidator.result === 'valid') {
          var rate_expression = service_creation_data.rateExpression;
          var enable_eventschedule;
          if (service_creation_data.enableEventSchedule === false) {
            enable_eventschedule = service_creation_data.enableEventSchedule;
          } else {
            enable_eventschedule = true;
          }
          if (rate_expression && rate_expression.trim() !== "") {
            serviceMetadataObj["eventScheduleRate"] = "cron(" + rate_expression + ")";
          }
          if (enable_eventschedule && enable_eventschedule !== "") {
            serviceMetadataObj["eventScheduleEnable"] = enable_eventschedule;
          }
        } else {
          logger.error('cronExpValidator : ', cronExpValidator);
          reject(cronExpValidator);
        }
      }
      if (service_creation_data.rateInterval) {
        var rateExpValidator = CronParser.validateRateExpression(service_creation_data.rateInterval);
        if (rateExpValidator.result === 'valid') {
          var rate_interval = service_creation_data.rateInterval;
          var enable_eventschedule;
          if (service_creation_data.enableEventSchedule === false) {
            enable_eventschedule = service_creation_data.enableEventSchedule;
          } else {
            enable_eventschedule = true;
          }
          if (rate_interval && rate_interval.trim() !== "") {
            serviceMetadataObj["eventScheduleRate"] = "rate(" + rate_interval + ")";
          }
          if (enable_eventschedule && enable_eventschedule !== "") {
            serviceMetadataObj["eventScheduleEnable"] = enable_eventschedule;
          }
        } else {
          logger.error('rateExpValidator : ', rateExpValidator);
          reject(rateExpValidator);
        }
      }


      if (service_creation_data.events && service_creation_data.events.length) {
        //Process events into properties
        for (let idx = 0; idx < service_creation_data.events.length; idx++) {
          var eachEvent, eventSrc, eventAction;
          eachEvent = service_creation_data.events[idx];
          logger.info('event: ', JSON.stringify(eachEvent));
          let isEventNameValid = validateEventName(eachEvent.type, eachEvent.source, configData);
          if (isEventNameValid && isEventNameValid.result) {
            eventSrc = "event_source_" + eachEvent.type;
            eventAction = "event_action_" + eachEvent.type;
            serviceMetadataObj[eventSrc] = eachEvent.source;
            serviceMetadataObj[eventAction] = eachEvent.action;
          } else {
            if (!isEventNameValid) {
              isEventNameValid["message"] = `${eachEvent.type} is invalid.`
            }
            reject({ result: 'inputError', message: isEventNameValid.message });
          }
        }
      }
    }

    if (service_creation_data.service_type === "sls-app") { // application with a deployment descriptor
      inputs.DEPLOYMENT_TARGETS = deploymentTargets; // This part was missing on Apr-5 and we received: 'deployment_targets missing' error
      const deployDescrValidator = require('./components/validate-sls-yml');
      if (service_creation_data.deployment_descriptor) { // If deployment descriptor is present then validate
        try {
          const outstandingResources = deployDescrValidator.validateResources(service_creation_data.deployment_descriptor);
          if (outstandingResources.length) { // some resources that are not allowed were found this is bad
            reject({ result: 'inputError', message: `Invalid deployment_descriptor. The resource types not allowed ${outstandingResources}` });
          } else {
            const outstandingEvents = deployDescrValidator.validateEvents(service_creation_data.deployment_descriptor);
            if (outstandingEvents.length) { // some events that are not allowed were found so let's reject the request
              reject({ result: 'inputError', message: `Invalid deployment_descriptor. The event types not allowed ${outstandingEvents}` });
            } else {
              const outstandingActions = deployDescrValidator.validateActions(service_creation_data.deployment_descriptor);
              if (outstandingActions.length) {
                reject({ result: 'inputError', message: `Invalid deployment_descriptor. The action types not allowed ${outstandingActions}` });
              } else {
                inputs.DEPLOYMENT_DESCRIPTOR = service_creation_data.deployment_descriptor;
              }
            }
          }
        } catch (e) {
          reject({ result: 'inputError', message: `Invalid deployment_descriptor format. Nested exception is ${e}` });
        }
      }
    }

    inputs.METADATA = serviceMetadataObj;
    serviceDataObject = inputs;
    resolve(inputs);
  });
}

function validateDeploymentTargets(allowedSubServiceType, deployment_targets, svcType) {
  if (deployment_targets.hasOwnProperty(svcType)) {
    const type = deployment_targets[svcType];
    if (allowedSubServiceType.indexOf(type) !== -1) {
      return deployment_targets;
    } else {
      return { error: `Invalid deployment_target: ${type} for service type: ${svcType}, valid deployment_targets: ${allowedSubServiceType}` };
    }
  } else {
    return { error: `No deployment_targets are defined for this service type - ${svcType}` };
  }
}

var validateEventName = (eventType, sourceName, config) => {
  let eventSourceName = '', sourceType = eventType.toLowerCase(), logicalIdLen = 15,
    resultObj = {
      result: "",
      message: ""
    };

  if (!eventType || !sourceName) {
    resultObj.result = false;
    resultObj.message = `Event type and/or source name cannot be empty.`;
    return resultObj;
  }

  let eventSourceObject = {
    's3': sourceName,
    'sqs': sourceName.split(':').pop(),
    'dynamodb': sourceName.split('/').pop(),
    'kinesis': sourceName.split('/').pop(),
    'cosmosdb': sourceName.split('/').pop(),
    'eventhub': sourceName.split('/').pop(),
    'storageaccount': sourceName.split('/').pop(),
    'servicebusqueue': sourceName.split('/').pop()
  };

  eventSourceName = eventSourceObject[sourceType];
  if (!eventSourceName) {
    resultObj.result = false;
    resultObj.message = `Event type '${eventType}' is invalid.`;
    return resultObj;
  }

  if (eventSourceName && (eventSourceName.startsWith("-") || eventSourceName.startsWith("_") || eventSourceName.startsWith(".") || eventSourceName.endsWith("-") || eventSourceName.endsWith("_") || eventSourceName.endsWith("."))) {
    resultObj.result = false;
    resultObj.message = `${eventSourceName} cannot begin or end with special character`;
    return resultObj;
  }

  let mapType = config.EVENT_SOURCE_NAME[sourceType];
  let regexPattern = new RegExp(mapType.regexPattern);

  if (eventSourceName.length >= mapType.minLength && eventSourceName.length <= (mapType.maxLength - logicalIdLen) && (regexPattern).test(eventSourceName)) {
    resultObj.result = true;
    resultObj.message = `Source name of ${eventType} is valid.`;
    return resultObj;
  } else {
    resultObj.result = false;
    resultObj.message = `Source name of ${eventType} is invalid. '${eventSourceName}' should have valid length and/or pattern.`;
    return resultObj;
  }
};

module.exports = {
  handler: handler,
  startServiceOnboarding: startServiceOnboarding,
  getToken: getToken,
  createService: createService,
  getServiceData: getServiceData
}
