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

const errorHandler = require("./components/error-handler.js")();
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const validation = require("./components/validation.js");
const casbinUtil = require("./components/casbin.js");
const util = require("./components/util.js");
const scmUtil = require("./components/scm/index.js");
const services = require("./components/scm/services.js");
const auth = require("./components/scm/login.js");
const globalConfig = require("./config/global-config.json");

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
      data: null,
      error: err.message
    };
  }
};

async function processACLRequest(event, config) {
  let resourcePath = event.resourcePath;
  let path = event.path;

  //1. POST - add and delete the policy
  if (event.method === 'POST' && resourcePath.indexOf("policies") !== -1) {
    validation.validatePostPoliciesInput(event);

    const serviceId = event.body.serviceId;
    let result = {};

    //add policies
    if (event.body.policies && event.body.policies.length) {
      const policies = util.createRule(event.body.policies, globalConfig.POLICY);

      result = await casbinUtil.addOrRemovePolicy(serviceId, config, 'add', policies);
      if (result && result.error) {
        throw (errorHandler.throwInternalServerError(`Error adding the policy for service ${serviceId}. ${result.error}`));
      }

      await exportable.processScmPermissions(config, serviceId, policies, 'add');
    } else {//delete policies
      result = await casbinUtil.addOrRemovePolicy(serviceId, config, 'remove');

      if (result && result.error) {
        throw (errorHandler.throwInternalServerError(result.error));
      }

      await exportable.processScmPermissions(config, serviceId, null, 'remove');
    }

    return { success: true };
  }

  //2. GET the policy for the given service id
  if (event.method === 'GET' && resourcePath.indexOf("policies") !== -1) {

    validation.validateGetPoliciesInput(event);
    const serviceId = event.query.serviceId;
    const result = await casbinUtil.getPolicies(serviceId, config);

    if (result && result.error) {
      throw (errorHandler.throwInternalServerError(result.error));
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
  if (event.method === 'GET' && resourcePath.indexOf("services") !== -1) {
    validation.validateGetServicesInput(event);
    let result;
    if (path && path.serviceId) {
      result = await casbinUtil.getPolicyForServiceUser(path.serviceId, event.query.userId, config);
    } else {
      result = await casbinUtil.getPolicyForUser(event.query.userId, config);
    }

    if (result && result.error) {
      throw (errorHandler.throwInternalServerError(result.error));
    }

    return result;
  }

  //4. GET the permissions for a specific service for a given user
  if (event.method === 'GET' && resourcePath.indexOf("checkpermission") !== -1) {
    validation.validateGetCheckPermsInput(event);
    const query = event.query;
    const result = await casbinUtil.checkPermissions(query.userId, query.serviceId, query.category, query.permission, config);

    if (result && result.error) {
      throw (errorHandler.throwInternalServerError(result.error));
    }

    return result;
  }
}


async function processScmPermissions(config, serviceId, policies, key) {
  try {
    let scm = new scmUtil(globalConfig);
    let authToken = await auth.getAuthToken(config);
    let serviceData = await services.getServiceMetadata(config, authToken, serviceId);
    let res = await scm.processScmPermissions(serviceData, policies, key);
    return (res);
  } catch (ex) {
    throw (JSON.stringify(errorHandler.throwInternalServerError(ex)));
  }
}

const exportable = {
  handler,
  processACLRequest,
  processScmPermissions
};

module.exports = exportable;
