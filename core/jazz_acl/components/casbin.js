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

async function addPermissionForUser(policy) {
  //TODO: implement the add permission policy for user

  return true;
}

async function enforce(policy) {

  //TODO implement the enforce method
  return true;
}

async function getFilteredPolicy(index, value) {
  //TODO: implement the getfilteredPolicy

  return [];
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
