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
