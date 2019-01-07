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

const bitbucket = require("./bitbucket.js");
const gitlab = require("./gitlab.js");

module.exports = class ScmUtil {
  constructor(config) {
    this.config = config;
    this.scmMap = {
      "gitlab": {
        remove: gitlab.removeAllRepoUsers,
        add: gitlab.addRepoPermission
      },
      "bitbucket": {
        remove: bitbucket.removeAllRepoUsers,
        add: bitbucket.addRepoPermissionInBitbucket
      },
    }
  }

  async processScmPermissions(serviceInfo, policies, key) {
    if (this.config && this.config.SCM_TYPE && this.scmMap[this.config.SCM_TYPE]) {
      let scmConfig = this.config.SCM_CONFIG[this.config.SCM_TYPE];
      return await this.scmMap[this.config.SCM_TYPE][key](scmConfig, serviceInfo, policies)
    }
  }
};
