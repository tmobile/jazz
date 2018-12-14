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

const Enforcer = require('casbin').Enforcer;
const TypeORMAdapter = require('typeorm-adapter');
const logger = require('./logger.js');

async function dbConnection(config) {
  const conn = await TypeORMAdapter.default.newAdapter({
    type: config.CASBIN.TYPE,
    host: config.CASBIN.HOST,
    port: config.CASBIN.PORT,
    username: config.CASBIN.USER,
    password: config.CASBIN.PASSWORD,
    database: config.CASBIN.DATABASE,
    timeout: config.CASBIN.TIMEOUT
  });

  const enforcer = await Enforcer.newEnforcer('../config/rbac_model.conf', conn);
  return enforcer;
}

async function addPermissionForUser(serviceId, policies) {
  const result = {};

  try {
    const conn = await dbConnection(config);
    const enforcer = await Enforcer.newEnforcer('../config/rbac_model.conf', conn);

    policies.map(policy => {
      await enforcer.addPolicy(policy.userId, serviceId, policy.category, policy.permission);
    })

    // Save the policy back to DB.
    result.success = await enforcer.savePolicy();
  } catch(err) {
    result = {
      "success": false,
      "error": err.message
    };
  }
  conn.close();
  return true;
}

async function enforce(policy) {

  //TODO implement the enforce method
  return true;
}

/* Get the policies from casbin given the value*/
async function getFilteredPolicy(index, values, config) {
  const result = {};

  try {
    const conn = await dbConnection(config);
    const enforcer = await Enforcer.newEnforcer('../config/rbac_model.conf', conn);

    const policies = values.map(value => enforcer.getFilteredPolicy(index, value));
    result = {
      "success": true,
      "data": policies
    };
  } catch(err) {
    result = {
      "success": false,
      "error": err.message
    };
  }

  conn.close();
  return result;
}

async function removeFilteredPolicy(index, value) {
  //TODO: implement removeFilteredPolicy

  return true;
}

async function getPermissionForUser(user) {
  //TODO: implement getPermissionForUser

  return [];
}

module.exports = {
  addPermissionForUser,
  getFilteredPolicy,
  removeFilteredPolicy,
  addPermissionForUser
};
