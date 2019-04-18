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

const createRule = (policies, config) => {
  const userPolicies = groupBy(policies, 'userId');
  let newPolicies = [];
  for (let key in userPolicies) {
    let userPolicy = userPolicies[key];
    const manageAdminPolicy = userPolicy.filter(policy => policy.category === 'manage' && policy.permission === 'admin');
    let managePolicy = userPolicy.filter(policy => policy.category === 'manage');
    let codePolicy = userPolicy.filter(policy => policy.category === 'code');
    let deployPolicy = userPolicy.filter(policy => policy.category === 'deploy');
    const user_id = key.toLowerCase()

    managePolicy = managePolicy.map(policy => { return { permission: policy.permission, category: policy.category, userId: user_id } });
    codePolicy = codePolicy.map(policy => { return { permission: policy.permission, category: policy.category, userId: user_id } });
    deployPolicy = deployPolicy.map(policy => { return { permission: policy.permission, category: policy.category, userId: user_id } });

    if (manageAdminPolicy.length > 0) {
      let adminPolicies = config.MANAGE_ADMIN;
      adminPolicies = adminPolicies.map(policy => { return { permission: policy.permission, category: policy.category, userId: user_id } });
      newPolicies = newPolicies.concat(adminPolicies);
    } else if ((codePolicy.length > 0 || deployPolicy.length > 0)) {
      let readPolicy = config.READ;
      readPolicy = readPolicy.map(policy => { return { permission: policy.permission, category: policy.category, userId: user_id } });
      newPolicies = codePolicy.length > 0 ? newPolicies.concat(codePolicy) : newPolicies;
      newPolicies = deployPolicy.length > 0 ? newPolicies.concat(deployPolicy) : newPolicies;
      newPolicies = managePolicy.length > 0 ? newPolicies.concat(managePolicy) : newPolicies.concat(readPolicy);
    } else if (codePolicy.length === 0 && deployPolicy.length === 0 && managePolicy.length > 0) {
      let manageReadPolicy = config.MANAGE_READ;
      manageReadPolicy = manageReadPolicy.map(policy => { return { permission: policy.permission, category: policy.category, userId: user_id } });
      newPolicies = newPolicies.concat(managePolicy);
      newPolicies = newPolicies.concat(manageReadPolicy);
    }
  }
  return newPolicies;
}



const groupBy = (array, prop) => {
  return array.reduce(function (groups, item) {
    let val = item[prop];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
}


module.exports = {
  createRule,
  groupBy
};
