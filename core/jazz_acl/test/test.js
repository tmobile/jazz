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

const index = require('../index');
const casbinUtil = require('../components/casbin');
const sinon = require('sinon');
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const validationUtil = require('../components/validation');
const auth = require("../components/scm/login");
const bitbucketUtil = require("../components/scm/bitbucket");
const gitlabUtil = require("../components/scm/gitlab");
const services = require("../components/scm/services");
const request = require('request');
chai.use(chaiAsPromised);

describe("Validation tests", () => {
  describe("Validate basic input tests", () => {
    it("validate throws error when inputs are not provided", () => {
      expect(() => validationUtil.validateBasicInput()).to.throw();
    });

    it("validate throws error when method is missing", () => {
      expect(() => validationUtil.validateBasicInput({ method: '' })).to.throw();
    });

    it("validate throws error when path is missing", () => {
      expect(() => validationUtil.validateBasicInput({ method: 'GET', path: '' })).to.throw();
    });

    it("validate throws error when user is not authenticated", () => {
      expect(() => validationUtil.validateBasicInput({ method: 'GET', path: 'policies' })).to.throw();
    });
  });

  describe("Validate get policies input tests", () => {
    it("validate throws error when service id is missing", () => {
      expect(() => validationUtil.validateGetPoliciesInput({ query: {} })).to.throw();
    });
  });

  describe("Validate post policies input tests", () => {
    it("validate throws error when body is missing", () => {
      expect(() => validationUtil.validatePostPoliciesInput({})).to.throw();
    });

    it("validate throws error when service id is missing", () => {
      expect(() => validationUtil.validatePostPoliciesInput({ body: {} })).to.throw();
    });

    it("validate throws error when policies are missing", () => {
      expect(() => validationUtil.validatePostPoliciesInput({ body: { serviceId: '342342' } })).to.throw();
    });

    it("validate throws error when policy keys are missing", () => {
      expect(() => validationUtil.validatePostPoliciesInput({ body: { serviceId: '342342', policies: [{ userId: '23222' }] } })).to.throw();
    });
  });

  describe("Validate get check perms input", () => {
    it("validate throws error when userId is missing", () => {
      expect(() => validationUtil.validateGetCheckPermsInput({ query: {} })).to.throw();
    });

    it("validate throws error when service Id is missing", () => {
      expect(() => validationUtil.validateGetCheckPermsInput({ query: { "userId": "231313" } })).to.throw();
    });

    it("validate throws error when permission is missing", () => {
      expect(() => validationUtil.validateGetCheckPermsInput({ query: { "userId": "231313", "serviceId": "3432424" } })).to.throw();
    });

    it("validate throws error when category is missing", () => {
      expect(() => validationUtil.validateGetCheckPermsInput({ query: { "userId": "231313", "serviceId": "3432424", "permission": "write" } })).to.throw();
    });
  });

  describe("Validate get services input", () => {
    it("validate throws error when userId is missing", () => {
      expect(() => validationUtil.validateGetServicesInput({ query: {} })).to.throw();
    });
  });
});

describe('processACLRequest tests', () => {
  describe('policies path tests', () => {
    let postEvent;
    let getEvent;

    beforeEach(() => {
      postEvent = {
        method: 'POST',
        resourcePath: 'policies',
        body: {
          serviceId: "324234234",
          policies: [{ userId: "data", category: "manage", permission: "read" }]
        }
      };

      getEvent = {
        method: 'GET',
        resourcePath: 'policies',
        query: {
          serviceId: "324234234",
        }
      };
    });

    afterEach(() => {
      postEvent = {};
      getEvent = {};
    });

    it('POST policies - add user successfully', async () => {
      // arrange
      const addOrRemovePolicyStub = sinon.stub(casbinUtil, "addOrRemovePolicy").resolves(true);
      const processScmPermissionsStub = sinon.stub(index, "processScmPermissions").resolves(true);
      const config = {};

      // act
      const result = await index.processACLRequest(postEvent, config);

      // assert
      expect(result.success).to.equal(true);
      sinon.assert.calledOnce(addOrRemovePolicyStub);
      sinon.assert.calledOnce(processScmPermissionsStub);
      addOrRemovePolicyStub.restore();
      processScmPermissionsStub.restore();
    });

    it('POST policies - add user error', async () => {
      // arrange
      const addOrRemovePolicyStub = sinon.stub(casbinUtil, "addOrRemovePolicy").resolves({ error: "Error" });
      const config = {};

      // act & assert
      await expect(index.processACLRequest(postEvent, config)).to.be.rejected;
      sinon.assert.calledOnce(addOrRemovePolicyStub);
      addOrRemovePolicyStub.restore();
    });

    it('POST policies - remove users successfully', async () => {
      // arrange
      const addOrRemovePolicyStub = sinon.stub(casbinUtil, "addOrRemovePolicy").resolves(true);
      const processScmPermissionsStub = sinon.stub(index, "processScmPermissions").resolves(true);
      const config = {};
      postEvent.body.policies = [];

      // act
      const result = await index.processACLRequest(postEvent, config);

      // assert
      expect(result.success).to.equal(true);
      sinon.assert.calledOnce(addOrRemovePolicyStub);
      sinon.assert.calledOnce(processScmPermissionsStub);
      addOrRemovePolicyStub.restore();
      processScmPermissionsStub.restore();
    });

    it('POST policies - remove users throws error', async () => {
      // arrange
      const addOrRemovePolicyStub = sinon.stub(casbinUtil, "addOrRemovePolicy").resolves({ error: "Error" });
      const config = {};
      postEvent.body.policies = [];

      // act & assert
      await expect(index.processACLRequest(postEvent, config)).to.be.rejected;
      sinon.assert.calledOnce(addOrRemovePolicyStub);
      addOrRemovePolicyStub.restore();
    });

    it('GET policies - get user throws error', async () => {
      // arrange
      const getPoliciesStub = sinon.stub(casbinUtil, "getPolicies").resolves({ error: "Error" });
      const config = {};

      // act & assert
      await expect(index.processACLRequest(getEvent, config)).to.be.rejected;
      sinon.assert.calledOnce(getPoliciesStub);
      getPoliciesStub.restore();
    });

    it('GET policies - get user policies', async () => {
      // arrange
      const policies = [[["user1", "admin", "manage"]]];
      const getPoliciesStub = sinon.stub(casbinUtil, "getPolicies").resolves(policies);
      const config = {};

      // act
      const result = await index.processACLRequest(getEvent, config);

      // assert
      expect(result.policies[0].userId).to.eq("user1");
      expect(result.serviceId).to.eq(getEvent.query.serviceId);
      sinon.assert.calledOnce(getPoliciesStub);
      getPoliciesStub.restore();
    });
  });

  describe('checkPermission path tests', () => {
    let getEvent;

    beforeEach(() => {
      getEvent = {
        method: 'GET',
        resourcePath: 'checkpermission',
        query: {
          userId: "3423",
          serviceId: "324234234",
          category: "manage",
          permission: "write"
        }
      };
    });

    afterEach(() => {
      getEvent = {};
    });

    it('GET checkpermission - authorize true', async () => {
      // arrange
      const getCheckPermissionsStub = sinon.stub(casbinUtil, "checkPermissions").resolves({ authorized: true });
      const config = {};

      // act
      const result = await index.processACLRequest(getEvent, config);

      // assert
      expect(result.authorized).to.eq(true);
      sinon.assert.calledOnce(getCheckPermissionsStub);
      getCheckPermissionsStub.restore();
    });

    it('GET checkpermission - throws error', async () => {
      // arrange
      const getCheckPermissionsStub = sinon.stub(casbinUtil, "checkPermissions").resolves({ error: "Error" });
      const config = {};

      // act & assert
      expect(index.processACLRequest(getEvent, config)).to.be.rejected;
      sinon.assert.calledOnce(getCheckPermissionsStub);
      getCheckPermissionsStub.restore();
    });
  });

  describe('services path tests', () => {
    let getEvent;

    beforeEach(() => {
      getEvent = {
        method: 'GET',
        resourcePath: 'services',
        path: {
          serviceId: "sdadaada"
        },
        query: {
          userId: "3423"
        }
      };
    });

    afterEach(() => {
      getEvent = {};
    });

    it('GET services - with service id for a given user', async () => {
      // arrange
      const policies = [{
        serviceId: "324234234",
        policies: [{ category: "manage", permission: "read" }]
      }];
      getEvent.resourcePath = 'services/123456';
      const getCheckPermissionsStub = sinon.stub(casbinUtil, "getPolicyForServiceUser").resolves(policies);
      const config = {};

      // act
      const result = await index.processACLRequest(getEvent, config);

      // assert
      expect(result[0].serviceId).to.eq("324234234");
      sinon.assert.calledOnce(getCheckPermissionsStub);
      getCheckPermissionsStub.restore();
    });

    it('GET services - for a given user', async () => {
      // arrange
      getEvent.path = {};
      const policies = [{
        serviceId: "324234234",
        policies: [{ category: "manage", permission: "read" }]
      }];

      const getCheckPermissionsStub = sinon.stub(casbinUtil, "getPolicyForUser").resolves(policies);
      const config = {};

      // act
      const result = await index.processACLRequest(getEvent, config);

      // assert
      expect(result[0].serviceId).to.eq("324234234");
      sinon.assert.calledOnce(getCheckPermissionsStub);
      getCheckPermissionsStub.restore();
    });
  });
});

describe("getAuthToken", () => {
  it('getAuthToken will be reject for status code 500', async () => {
    let responseObject = {
      statusCode: 500,
      body: {}
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(auth.getAuthToken({}, "abc")).to.be.rejected;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });

  it('getAuthToken will be reject for empty body', async () => {
    let responseObject = {
      statusCode: 200,
      body: {}
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(auth.getAuthToken({}, "abc")).to.be.rejected;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });

  it('getAuthToken will be resolve for valid response', async () => {
    let responseObject = {
      statusCode: 200,
      body: { data: { token: "dada" } }
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(auth.getAuthToken({}, "abc")).to.be.resolves;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });
});

describe("getServiceMetadata", () => {
  it('getServiceMetadata will be reject for status code 500', async () => {
    let responseObject = {
      statusCode: 500,
      body: {}
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(services.getServiceMetadata({}, "abc", "id")).to.be.rejected;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });

  it('getServiceMetadata will be reject for empty body', async () => {
    let responseObject = {
      statusCode: 200,
      body: {}
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(services.getServiceMetadata({}, "abc", "id")).to.be.rejected;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });

  it('getServiceMetadata will be resolve for valid response', async () => {
    let responseObject = {
      statusCode: 200,
      body: JSON.stringify({ data: { data: "dada" } })
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(services.getServiceMetadata({}, "abc", "id")).to.be.resolves;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });
});

describe("ScmUtil -- Bitbucket", () => {
  it('addRepoPermissionInBitbucket for given policies of a service', async () => {
    const policies = [{ category: "code", permission: "read", userId: "test" }];
    const serviceInfo = { service: "dada", domain: "test" };
    const config = { "PERMISSION_CATEGORIES": ["code"] };
    const removeAllRepoUsersStub = sinon.stub(bitbucketUtil, "removeAllRepoUsers").resolves();
    const addPermsInBitbucketRepoStub = sinon.stub(bitbucketUtil, "addPermsInBitbucketRepo").resolves();

    const result = await bitbucketUtil.addRepoPermissionInBitbucket(config, serviceInfo, policies);
    sinon.assert.calledOnce(removeAllRepoUsersStub);
    sinon.assert.calledOnce(addPermsInBitbucketRepoStub);
    removeAllRepoUsersStub.restore();
    addPermsInBitbucketRepoStub.restore();
  });

  it('addRepoPermissionInBitbucket will give the users list who has code categorized permission', async () => {
    const policies = [{ category: "code", permission: "read", userId: "test" }, { category: "manage", permission: "read", userId: "test1" }];
    const serviceInfo = { service: "dada", domain: "test" };
    const config = { "PERMISSION_CATEGORIES": ["code"] };
    const removeAllRepoUsersStub = sinon.stub(bitbucketUtil, "removeAllRepoUsers").resolves();
    const addPermsInBitbucketRepoStub = sinon.stub(bitbucketUtil, "addPermsInBitbucketRepo").resolves();

    const result = await bitbucketUtil.addRepoPermissionInBitbucket(config, serviceInfo, policies);

    expect(result.length).to.equal(1);
    expect(result[0]).to.equal("test");
    sinon.assert.calledOnce(removeAllRepoUsersStub);
    sinon.assert.calledOnce(addPermsInBitbucketRepoStub);
    removeAllRepoUsersStub.restore();
    addPermsInBitbucketRepoStub.restore();
  });

  it('removeAllRepoUsers will remove all the permissions of the given service', async () => {
    const serviceInfo = { service: "dada", domain: "test" };
    const config = {};
    const resp = { values: [{ user: { name: "test" } }] };
    const res = { body: JSON.stringify(resp) }
    const getRepoUsersStub = sinon.stub(bitbucketUtil, "getRepoUsers").resolves(res);
    const removeRepoUserStub = sinon.stub(bitbucketUtil, "removeRepoUser").resolves();

    const result = await bitbucketUtil.removeAllRepoUsers(config, serviceInfo);
    sinon.assert.calledOnce(getRepoUsersStub);
    sinon.assert.calledOnce(removeRepoUserStub);
    getRepoUsersStub.restore();
    removeRepoUserStub.restore();
  });

  it('removeAllRepoUsers will give the users list who has permission on the given service', async () => {
    const serviceInfo = { service: "dada", domain: "test" };
    const config = {};
    const resp = { values: [{ user: { name: "test" } }, { "user": { name: "test2" } }] };
    const res = { body: JSON.stringify(resp) }
    const getRepoUsersStub = sinon.stub(bitbucketUtil, "getRepoUsers").resolves(res);
    const removeRepoUserStub = sinon.stub(bitbucketUtil, "removeRepoUser").resolves();

    const result = await bitbucketUtil.removeAllRepoUsers(config, serviceInfo);
    expect(result.length).to.equal(2);
    expect(result[0]).to.equal("test");
    sinon.assert.calledOnce(getRepoUsersStub);
    getRepoUsersStub.restore();
    removeRepoUserStub.restore();
  });
});

describe("ScmUtil -- Gitlab", () => {
  it('addRepoPermissionInGitlab for given policies of a service', async () => {
    const policies = [{ category: "code", permission: "read", userId: "test" }];
    const serviceInfo = { service: "dada", domain: "test" };
    const config = {
      "PERMISSION_CATEGORIES": ["code"],
      "ACCESS_LEVEL": {
        "READ": 20,
        "WRITE": 30
      }
    };
    const removeAllRepoUsersStub = sinon.stub(gitlabUtil, "removeAllRepoUsers").resolves();
    const getGitLabsProjectIdStub = sinon.stub(gitlabUtil, "getGitLabsProjectId").resolves("repo_id");
    const getGitlabUserIdStub = sinon.stub(gitlabUtil, "getGitlabUserId").resolves("user_id");
    const getGitlabProjectMemberStub = sinon.stub(gitlabUtil, "getGitlabProjectMember").resolves({ isMember: false });
    const addProjectMemberStub = sinon.stub(gitlabUtil, "addProjectMember").resolves();

    const result = await gitlabUtil.addRepoPermission(config, serviceInfo, policies);
    sinon.assert.calledOnce(getGitLabsProjectIdStub);
    sinon.assert.calledOnce(removeAllRepoUsersStub);
    removeAllRepoUsersStub.restore();
    getGitLabsProjectIdStub.restore();
    getGitlabUserIdStub.restore();
    getGitlabProjectMemberStub.restore();
    addProjectMemberStub.restore();
  });

  it('addRepoPermissionInGitlab will give the users list who has code categorized permission', async () => {
    const policies = [{ category: "code", permission: "read", userId: "test" }];
    const serviceInfo = { service: "dada", domain: "test" };
    const config = {
      "PERMISSION_CATEGORIES": ["code"],
      "ACCESS_LEVEL": {
        "READ": 20,
        "WRITE": 30
      }
    };
    const removeAllRepoUsersStub = sinon.stub(gitlabUtil, "removeAllRepoUsers").resolves();
    const getGitLabsProjectIdStub = sinon.stub(gitlabUtil, "getGitLabsProjectId").resolves("repo_id");
    const getGitlabUserIdStub = sinon.stub(gitlabUtil, "getGitlabUserId").resolves("user_id");
    const getGitlabProjectMemberStub = sinon.stub(gitlabUtil, "getGitlabProjectMember").resolves({ isMember: false });
    const addProjectMemberStub = sinon.stub(gitlabUtil, "addProjectMember").resolves();

    const result = await gitlabUtil.addRepoPermission(config, serviceInfo, policies);
    sinon.assert.calledOnce(getGitLabsProjectIdStub);
    sinon.assert.calledOnce(removeAllRepoUsersStub);
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal("test");
    removeAllRepoUsersStub.restore();
    getGitLabsProjectIdStub.restore();
    getGitlabUserIdStub.restore();
    getGitlabProjectMemberStub.restore();
    addProjectMemberStub.restore();
  });

  it('removeAllGitlabRepoUsers will remove all the permissions of the given service', async () => {
    const serviceInfo = { service: "dada", domain: "test" };
    const config = {};
    const resp = [{ id: "a", name: "test" }, { id: "b", name: "test2" }];
    const res = { body: JSON.stringify(resp) }
    const getAllRepoUsersStub = sinon.stub(gitlabUtil, "getAllRepoUsers").resolves(res);
    const getGitLabsProjectIdStub = sinon.stub(gitlabUtil, "getGitLabsProjectId").resolves("repo_id");
    const removeRepoUserStub = sinon.stub(gitlabUtil, "removeRepoUser").resolves();

    const result = await gitlabUtil.removeAllRepoUsers(config, serviceInfo);
    sinon.assert.calledOnce(getAllRepoUsersStub);
    sinon.assert.calledOnce(getGitLabsProjectIdStub);
    getAllRepoUsersStub.restore();
    getGitLabsProjectIdStub.restore();
    removeRepoUserStub.restore();
  });

  it('removeAllGitlabRepoUsers will give the users list who has permission on the given service', async () => {
    const serviceInfo = { service: "dada", domain: "test" };
    const config = {};
    const resp = [{ id: "a", name: "test" }, { id: "b", name: "test2" }];
    const res = { body: JSON.stringify(resp) }
    const getAllRepoUsersStub = sinon.stub(gitlabUtil, "getAllRepoUsers").resolves(res);
    const getGitLabsProjectIdStub = sinon.stub(gitlabUtil, "getGitLabsProjectId").resolves("repo_id");
    const removeRepoUserStub = sinon.stub(gitlabUtil, "removeRepoUser").resolves();

    const result = await gitlabUtil.removeAllRepoUsers(config, serviceInfo);
    sinon.assert.calledOnce(getAllRepoUsersStub);
    sinon.assert.calledOnce(getGitLabsProjectIdStub);
    expect(result.length).to.equal(2);
    expect(result[0]).to.equal("test");
    getAllRepoUsersStub.restore();
    getGitLabsProjectIdStub.restore();
    removeRepoUserStub.restore();
  });
});
