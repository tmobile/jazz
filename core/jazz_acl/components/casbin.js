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

const casbin = require('casbin');
const TypeORMAdapter = require('typeorm-adapter');
const logger = require('./logger.js');
const errorHandlerModule = require("./error-handler.js")();
const getList = require("./getList.js");
const globalConfig = require("../config/global-config.json");

/* Create a connection to the DB*/
async function dbConnection(config) {
  let conn;
  try {
    conn = await TypeORMAdapter.default.newAdapter({
      type: config.CASBIN.TYPE,
      host: config.CASBIN.HOST,
      port: config.CASBIN.PORT,
      username: config.CASBIN.USER,
      password: config.CASBIN.PASSWORD,
      database: config.CASBIN.DATABASE,
      timeout: config.CASBIN.TIMEOUT
    });
  } catch (err) {
    if (err.name !== "AlreadyHasActiveConnectionError") {
      logger.error(err.message);
      throw (errorHandlerModule.throwInternalServerError(err.message));
    }
  }

  return conn;
}

/* Get the policies from casbin given the serviceId*/
async function getPolicies(serviceId, config) {
  const values = [`${serviceId}_manage`, `${serviceId}_code`, `${serviceId}_deploy`];
  let result = await getFilteredPolicy(1, values, config);
  if (result && result.error) {
    return result;
  }
  result = massagePolicies(result);

  return result;
}

/* Get the policies from casbin given the values and index*/
async function getFilteredPolicy(index, values, config) {
  let result = {};
  let conn, enforcer;

  try {
    conn = await dbConnection(config);
    enforcer = await casbin.newEnforcer("./config/rbac_model.conf", conn);
    const promisedPolicies = values.map(async value => await enforcer.getFilteredPolicy(index, value));
    const policies = await Promise.all(promisedPolicies);
    result = policies;
  } catch (err) {
    logger.error(err.message);
    result.error = err.message;
  } finally {
    if (conn) {
      await conn.close();
    }
  }

  return result;
}

/* Check permissions for a user */
async function checkPermissions(userId, serviceId, category, permission, config) {
  let result = {};
  let conn;
  try {
    if (userId === config.SERVICE_USER) {
      result.authorized = true;
    } else {
      conn = await dbConnection(config);
      const user_id = userId.toLowerCase()
      const enforcer = await casbin.newEnforcer('./config/rbac_model.conf', conn);
      result.authorized = enforcer.enforce(user_id, `${serviceId}_${category}`, permission);
    }
    logger.debug("result in checkPermissions: " + JSON.stringify(result));
  } catch (err) {
    logger.error(err.message);
    result = {
      error: err.message
    };
  } finally {
    if (conn) {
      await conn.close();
    }
  }

  return result;
}

/* Add and/or Remove filtered policy */
async function addOrRemovePolicy(serviceId, config, action, policies) {
  logger.debug("addOrRemovePolicy action: " + JSON.stringify(action));
  let result = {};
  let conn, enforcer;
  const objects = [`${serviceId}_manage`, `${serviceId}_code`, `${serviceId}_deploy`];
  let totalPolicies = 0;
  try {
    let getPolicies = await getFilteredPolicy(1, objects, config);

    if (getPolicies && getPolicies.error) { //if there was any error capture that
      result.error = getPolicies.error;
      return result;
    }
    getPolicies = getPolicies.filter(policy => policy.length > 0);
    totalPolicies = getPolicies.length;

    if (getPolicies.length) { //found previous policies to be removed
      let removeResult = [];
      if (totalPolicies) {
        conn = await dbConnection(config);
        enforcer = await casbin.newEnforcer('./config/rbac_model.conf', conn);

        // remove (incase of add, remove first)
        if (action === 'remove' || action === 'add') {
          const promises = getPolicies.map(policies => {
            return policies.map(policy => enforcer.removePolicy(policy[0], policy[1], policy[2]));
          });
          removeResult = await Promise.all(promises);
          if (removeResult.length !== totalPolicies) {
            result.error = `Rollback transaction - could delete ${removeResult.length} of ${totalPolicies} policies`;
          }
        }

        // add (after remove)
        if (action === 'add' && removeResult.length === totalPolicies) {
          result = await addPolicy(serviceId, policies, enforcer);
        }
      }
    } else { //only add (nothing to remove)
      if (action === 'add') {
        conn = await dbConnection(config);
        enforcer = await casbin.newEnforcer('./config/rbac_model.conf', conn);
        result = await addPolicy(serviceId, policies, enforcer);
        if (conn) {
          await conn.close();
        }
      }
    }
  } catch (err) {
    logger.error(err.message);
    result.error = err.message;
  } finally {
    if (totalPolicies) {
      await conn.close();
    }
  }

  return result;
}

async function addPolicy(serviceId, policies, enforcer) {
  let result = {};
  let savedPolicies = policies.map(async policy => await enforcer.addPolicy(policy.userId, `${serviceId}_${policy.category}`, policy.permission));
  savedPolicies = await Promise.all(savedPolicies);

  if (!savedPolicies.length) { //rollback deletion
    result.error = `Rollback transaction - could not add any policy`;
  } else if (savedPolicies.length !== policies.length) {
    result.error = `Rollback transaction - could add ${savedPolicies.length} of ${policies.length}`;
  }

  return result;
}

/* Get the permissions for a service given a userId */
async function getPolicyForServiceUser(serviceId, userId, config) {
  if (userId === config.SERVICE_USER) {
    const dbResult = await getList.getSeviceIdList(config, serviceId)
    if (dbResult && dbResult.error) {
      return dbResult
    }
    let result = attachAdminPolicies(dbResult.data);
    return result
  } else {
    const result = await getPolicies(serviceId, config);
    if (result && result.error) {
      return result;
    }
    let policies = formatPolicies(result);
    const user_id = userId.toLowerCase()
    let userPolicies = policies.filter(policy => policy.userId === user_id);
    userPolicies = userPolicies.map(policy => {
      return {
        permission: policy.permission,
        category: policy.category
      }
    });

    return [{
      serviceId: serviceId,
      policies: userPolicies
    }];
  }
}

/* attach admin policies */
function attachAdminPolicies(list) {
  let svcIdList = []
  list.forEach(eachId => {
    let svcIdObj = Object.assign({}, globalConfig.ADMIN_SERVICES_POLICIES);
    svcIdObj.serviceId = eachId;
    svcIdList.push(svcIdObj);
  });
  return svcIdList;
}

/* Get the policies for a userId*/
async function getPolicyForUser(userId, config) {
  let policies = [];
  if (userId === config.SERVICE_USER) {
    const dbResult = await getList.getSeviceIdList(config, null)
    if (dbResult && dbResult.error) {
      return dbResult
    }

    let result = attachAdminPolicies(dbResult.data);
    return result;
  } else {
    const user_id = userId.toLowerCase()
    let result = await getFilteredPolicy(0, [user_id], config);
    let serviceIdSeen = new Set();


    if (result && result.error) {
      return result;
    }

    result.forEach(policy => {
      policy.forEach(item => {
        const serviceId = item[1].split('_')[0];
        const policy = {
          category: item[1].split('_')[1],
          permission: item[2]
        };
        if (serviceIdSeen.has(serviceId)) {
          const foundPolicies = policies.find(r => r.serviceId === serviceId);
          if (foundPolicies) {
            foundPolicies.policies.push(policy);
          }
        } else {
          const policyObj = {};
          policyObj['serviceId'] = serviceId;
          policyObj['policies'] = [policy];
          policies.push(policyObj);
        }
        serviceIdSeen.add(serviceId);
      });
    });

    return policies;
  }
}

function massagePolicies(policies) {
  if (policies && !policies.error) {
    let filteredPolicies = policies.filter(el => el.length >= 1);
    if (filteredPolicies.length) {
      filteredPolicies =
        policies = filteredPolicies.map(policyArr => policyArr.map(policy => [policy[0], policy[1].split('_')[1], policy[2]]));
    } else {
      policies = [];
    }
  }

  return policies;
}

function formatPolicies(result) {
  let policies = [];
  result.forEach(policyArr =>
    policyArr.forEach(policy => policies.push({
      userId: policy[0],
      permission: policy[2],
      category: policy[1]
    })));

  return policies;
}

module.exports = {
  addOrRemovePolicy,
  getPolicies,
  getPolicyForServiceUser,
  getPolicyForUser,
  checkPermissions
};
