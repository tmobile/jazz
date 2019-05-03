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

const addRepoPermission = async (config, serviceInfo, policies) => {
  await exportable.removeAllRepoUsers(config, serviceInfo);
  const repo_name = `${serviceInfo.domain}_${serviceInfo.service}`;
  const repo_id = await exportable.getGitLabsProjectId(config, repo_name);
  let users_list = [];
  for (const policy of policies) {
    try {
      let permission = policy.permission.toUpperCase()
      let repoInfo = {
        "permission": config.ACCESS_LEVEL[permission],
        "gitlabRepoId": repo_id
      };

      if (config.PERMISSION_CATEGORIES.includes(policy.category)) {
        const gitlab_useId = await exportable.getGitlabUserId(config, policy.userId);
        repoInfo.gitlabUserId = gitlab_useId;
        let member_res = await exportable.getGitlabProjectMember(config, repoInfo);
        if (member_res.isMember)
          await exportable.updateProjectMemberPerms(config, repoInfo);
        else
          await exportable.addProjectMember(config, repoInfo);
        users_list.push(policy.userId);
      }
    } catch (e) {
      logger.error("addRepoPermission : " + JSON.stringify(e));
    }
  }
  return users_list;
};

const addProjectMember = async (config, repoInfo) => {
  try {
    let dataString = `user_id=${repoInfo.gitlabUserId}&access_level=${repoInfo.permission}`;
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}${repoInfo.gitlabRepoId}/members/`;
    const payload = getPayload(config, url, 'POST', dataString);
    let response = await sendRequest(payload);
    return response;
  } catch (e) {
    logger.error("addProjectMember : " + JSON.stringify(e));
    throw (e);
  };
}

const updateProjectMemberPerms = async (config, repoInfo) => {
  try {
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}${repoInfo.gitlabRepoId}/members/${repoInfo.gitlabUserId}/?access_level=${repoInfo.permission}`;
    const payload = getPayload(config, url, 'PUT', null);
    let response = await sendRequest(payload);
    return response;
  } catch (e) {
    logger.error("updateProjectMemberPerms : " + JSON.stringify(e));
    throw (e);
  };
}

const getGitlabProjectMember = async (config, repoInfo) => {
  try {
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}${repoInfo.gitlabRepoId}/members/${repoInfo.gitlabUserId}`;
    const payload = getPayload(config, url, 'GET', null);
    let response = await sendRequest(payload);
    if (response.statusCode === 200 || response.statusCode === 201)
      return { "isMember": true };
    else if (response.statusCode === 404)
      return { "isMember": false };
  } catch (e) {
    logger.error("getGitlabProjectMember : " + JSON.stringify(e));
    throw (e);
  };
}

const getGitlabUserId = async (config, userId) => {
  try {
    const gitlab_username = userId.replace(/[^a-zA-Z0-9_-]/g, '-');
    const url = `${config.HOSTNAME}${config.USER_API}${gitlab_username}`;
    const payload = getPayload(config, url, 'GET', null);
    const response = await sendRequest(payload);
    const results = JSON.parse(response.body);
    return results[0].id;
  } catch (e) {
    logger.error("getGitlabUserId : " + JSON.stringify(e));
    throw (e);
  };
}

const getGitLabsProjectId = async (config, repo_name) => {
  try {
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}?search=${repo_name}`;
    const payload = getPayload(config, url, 'GET', null);
    const response = await sendRequest(payload);
    const results = JSON.parse(response.body);
    return results[0].id;
  } catch (e) {
    logger.error("getGitLabsProjectId : " + JSON.stringify(e))
    throw (e);
  };
}

const removeAllRepoUsers = async (config, serviceInfo) => {
  try {
    const repo_name = `${serviceInfo.domain}_${serviceInfo.service}`;
    const repo_id = await exportable.getGitLabsProjectId(config, repo_name);
    const response = await exportable.getAllRepoUsers(config, repo_id);
    const users = JSON.parse(response.body);
    let list = [];
    if (users.length > 0) {
      for (const user of users) {
        try {
          await exportable.removeRepoUser(config, repo_id, user.id);
          list.push(user.name);
        } catch (e) {
          logger.error("Remove user failed for user : " + user.name);
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

const getAllRepoUsers = async (config, gitlabRepoId) => {
  try {
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}${gitlabRepoId}/members/all`;
    const payload = getPayload(config, url, 'GET', null);
    let response = await sendRequest(payload);
    return response;
  } catch (e) {
    logger.error("getAllRepoUsers : " + JSON.stringify(e));
    throw (e);
  }
}

const removeRepoUser = async (config, gitlabRepoId, user_id) => {
  try {
    const url = `${config.HOSTNAME}${config.REPO_BASE_API}${gitlabRepoId}/members/${user_id}`;
    const payload = getPayload(config, url, 'DELETE', null);
    let response = await sendRequest(payload);
    return response;
  } catch (e) {
    logger.error("removeRepoUser : " + JSON.stringify(e))
    throw (e);
  }
}

const sendRequest = async (payload) => {
  return new Promise((resolve, reject) => {
    logger.debug("payload: " + JSON.stringify(payload));
    request(payload, (error, response, body) => {
      logger.debug("Response: " + JSON.stringify(response));
      if (error) {
        logger.error("sendRequest error" + JSON.stringify(error));
        return reject(error);
      } else {
        if (((response.statusCode === 200 || response.statusCode === 201) && (response.body)) ||
          response.statusCode === 204 || response.statusCode === 404) { // Adding 404, since it is a valid condition
          return resolve(response);
        }
        return reject({ "error": "Error occured while executing request." });
      }
    });
  });
}

const getPayload = (config, url, method, dataString) => {
  let payload = {
    url: url,
    headers: {
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8',
      'Private-Token': config.PRIVATE_TOKEN
    },
    method: method,
    rejectUnauthorized: false
  };

  if (dataString) {
    payload.body = dataString;
  }
  return payload;
}

const exportable = {
  addRepoPermission,
  removeAllRepoUsers,
  getGitlabProjectMember,
  getAllRepoUsers,
  removeRepoUser,
  getGitLabsProjectId,
  getGitlabUserId,
  getGitlabProjectMember,
  updateProjectMemberPerms,
  addProjectMember
};

module.exports = exportable;
