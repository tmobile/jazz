// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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

/**
	SCM Factory
    @module: scmFactory.js
    @description: Factory to handle various SCM related activities
	@author:
	@version: 1.0
**/

/**
 * Generates a request URL that can create a user in gitlab
 * @param {*} config - config specific to gitlab
 * @param {*} userId - userId that needs to be created in gitlab
 * @param {*} password - password that needs to be set in gitlab
 */
var createUserInGitlabRequest = function(config, userId, password) {
    var encodedUserId = encodeURIComponent(userId);
    var encodedPwd = encodeURIComponent(password);
    
    //gitlabs username is restricted to alphanumeric and . _ - characters, 
    // so using email all email characters (except -, _) replaced with -
    var username = userId.replace(/'|!|#|%|&|\+|\?|\^|`|{|}|~|\@/g, '-');
    var encodedUsername = encodeURIComponent(username);

    var url = config.HOSTNAME + config.API_USER_ADD + '?&username=' + encodedUsername + '&password=' + encodedPwd + '&name=' + encodedUserId + '&email=' + encodedUserId + '&skip_confirmation=true';

    return {
        url: url,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8',
            'Private-Token' : config.PRIVATE_TOKEN
        },
        qs: {}
    };
};

/**
 * 
 * @param {*} config - config specific to bitbucket
 * @param {*} userId - userId that needs to be created in bitbucket
 * @param {*} password - password that needs to be set in gitlab
 */
var createUserInBitbucketRequest = function(config, userId, password) {
    var encodedUserId = encodeURIComponent(userId);
	var encodedPwd = encodeURIComponent(password);
	var url = config.HOSTNAME + config.API_USER_ADD + '?name=' + encodedUserId + '&password=' + encodedPwd + '&displayName=' + encodedUserId + '&emailAddress=' + encodedUserId + '&addToDefualtGroup=false&notify=false';

	return {
		url: url,
		auth: {
			user: config.USERNAME,
			password: config.PASSWORD
		},
		method: 'POST',
		rejectUnauthorized: false,
		headers: {
			'Accept': 'application/json',
			'Accept-Charset': 'utf-8',
			'X-Atlassian-Token': 'no-check'
		},
		qs: {}
	};
};

/**
 * SCM Factory that can create users in the specified SCM
 */
module.exports = class ScmFactory {

    constructor(config){
        this.config = config;
        this.addUserMap = {
            "gitlab": createUserInGitlabRequest,
            "bitbucket": createUserInBitbucketRequest,
        }
    }

    addUserRequest(userId, password){
        if (this.config && this.config.SCM_TYPE && this.addUserMap[this.config.SCM_TYPE]) {
            var scmConfig = this.config.SCM_CONFIG[this.config.SCM_TYPE];
            return this.addUserMap[this.config.SCM_TYPE](scmConfig, userId, password);
        }
    }
};
