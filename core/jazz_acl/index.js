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

const errorHandlerModule = require("./components/error-handler.js")();
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const validation = require("./components/validation.js");
const casbinUtil = require("./components/casbin.js");

async function handler(event, context) {

  //Initializations
  const config = configModule.getConfig(event, context);
  logger.init(event, context);

  try {
    validation.validateBasicInput(event);
    const aclResult = await exportable.processACLRequest(event, config);

    return {
      data: aclResult
    };
  } catch (err) {
    logger.error(err.message);

    return {
      data: err.message
    };
  }
};

async function processACLRequest(event, config) {

  //1. POST - add and delete the policy
  if (event.method === 'POST' && event.path === 'policies') {
    validation.validatePostPoliciesInput(event);

    const serviceId = event.body.serviceId;
    let result = {};

    //add policies
    if (event.body.policies && event.body.policies.length) {
      const policies = event.body.policies;
      result = await casbinUtil.addOrRemovePolicy(serviceId, config, 'add', policies);

      if (result && result.error) {
        throw (errorHandlerModule.throwInternalServerError(`Error adding the policy for service ${serviceId}. ${result.error}`));
      }
    } else {//delete policies
      result = await casbinUtil.addOrRemovePolicy(serviceId, config, 'remove');

      if (result && result.error) {
        throw (errorHandlerModule.throwInternalServerError(result.error));
      }
    }

    return { "success" : true };
  }

  //2. GET the policy for the given service id
  if (event.method === 'GET' && event.path === 'policies') {

    validation.validateGetPoliciesInput(event);
    const serviceId = event.query.serviceId;
    const result = await casbinUtil.getPolicies(serviceId, config);

    if (result && result.error) {
      throw (errorHandlerModule.throwInternalServerError(result.error));
    }

    let policies = [];
    result.forEach(policyArr =>
      policyArr.forEach(policy => policies.push({
        userId: policy[0],
        permission: policy[2],
        category: policy[1]
      })
    ));

    return {
      serviceId: serviceId,
      policies: policies
    };
  }

  //3. GET the permissions for a given user
  if (event.method === 'GET' && event.path === 'services') {
    //TODO implement the method here

    return [];
  }

  //4. GET the permissions for a specific service for a given user
  if (event.method === 'GET' && event.path === 'checkPermission') {
    //TODO implement the method here

    return [];
  }
}

const exportable = {
  handler,
  processACLRequest
};

module.exports = exportable;
