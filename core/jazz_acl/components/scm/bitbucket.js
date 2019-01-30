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

const request = require("request");
const logger = require("../logger.js");

const addRepoPermissionInBitbucket = async (config, serviceInfo, policies) => {
  let users_list = [];
  await exportable.removeAllRepoUsers(config, serviceInfo);
  for (const policy of policies) {
    try {
      let permission = policy.permission.toUpperCase()
      const repoInfo = {
        "repo_name": `${serviceInfo.domain}_${serviceInfo.service}`,
        "repo_user": policy.userId,
        "permission": `REPO_${permission}`
      };
      if (config.PERMISSION_CATEGORIES.includes(policy.category)) {
        await exportable.addPermsInBitbucketRepo(config, repoInfo);
        users_list.push(policy.userId);
      }
    } catch (e) {
      logger.error("Remove user failed for user : " + user.name);
    }
  }
  logger.debug("Updated users: " + users_list);
  return users_list;
};

const addPermsInBitbucketRepo = async (config, repoInfo) => {
  try {
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}${repoInfo.repo_name}${config.REPO_USER_PERM_API}${repoInfo.permission}&name=${repoInfo.repo_user}`;
    const payload = getPayload(config, url, 'PUT');
    let response = await sendRequest(payload);
    return response;
  } catch (e) {
    logger.error("addPermsInBitbucketRepo : " + JSON.stringify(e));
    throw (e);
  }
}

const removeAllRepoUsers = async (config, serviceInfo) => {
  try {
    const repo_name = `${serviceInfo.domain}_${serviceInfo.service}`;
    let response = await exportable.getRepoUsers(config, repo_name);
    let list = [];
    if (response.body) {
      const result = JSON.parse(response.body);
      if (result.values.length > 0) {
        for (const res of result.values) {
          let user
          try {
            user = res.user;
            await exportable.removeRepoUser(config, repo_name, user.name);
            list.push(user.name);
          } catch (e) {
            logger.error("Remove user failed for user : " + user.name);
          }
        }
      }
    }
    logger.debug("Removed users : " + list);
    return list;
  } catch (e) {
    logger.error("removeAllRepoUsers : " + JSON.stringify(e));
    throw (e);
  }
}

const getRepoUsers = async (config, repo_name) => {
  try {
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}${repo_name}/permissions/users?`;
    const payload = getPayload(config, url, 'GET');
    let response = await sendRequest(payload);
    return response;
  } catch (e) {
    logger.error("getRepoUsers : " + JSON.stringify(e));
    throw (e);
  }
}

const removeRepoUser = async (config, repo_name, user) => {
  try {
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}${repo_name}/permissions/users?name=${user}`;
    const payload = getPayload(config, url, 'DELETE');
    const response = await sendRequest(payload);
  } catch (e) {
    logger.error("removeRepoUser : " + JSON.stringify(e));
    throw (e);
  }
}

const sendRequest = async (payload) => {
  return new Promise((resolve, reject) => {
    logger.debug("payload: " + JSON.stringify(payload));
    request(payload, (error, response, body) => {
      logger.debug("Response: " + JSON.stringify(response));
      if (error) {
        logger.error("sendRequest: " + JSON.stringify(error));
        return reject(error);
      } else {
        if (response.statusCode === 200 || response.statusCode === 204
          || response.statusCode === 201 || response.statusCode === 404) { // Adding 404, since it is a valid condition
          return resolve(response);
        }
        return reject({ "error": "Error occured while executing request." });
      }
    });
  });
}

const getPayload = (config, url, method) => {
  return {
    url: url,
    auth: {
      user: config.USERNAME,
      password: config.PASSWORD
    },
    method: method,
    rejectUnauthorized: false
  };
}

const exportable = {
  addRepoPermissionInBitbucket,
  removeAllRepoUsers,
  addPermsInBitbucketRepo,
  getRepoUsers,
  removeRepoUser
};

module.exports = exportable;
