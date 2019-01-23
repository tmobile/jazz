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
chai.use(chaiAsPromised);

describe("Validation tests", () => {
  describe("Validate basic input tests", () => {
    it("validate throws error when inputs are not provided", () => {
      expect(() => validationUtil.validateBasicInput()).to.throw();
    });

    it("validate throws error when method is missing", () => {
      expect(() => validationUtil.validateBasicInput({method: ''})).to.throw();
    });

    it("validate throws error when path is missing", () => {
      expect(() => validationUtil.validateBasicInput({method: 'GET', path: ''})).to.throw();
    });

    it("validate throws error when user is not authenticated", () => {
      expect(() => validationUtil.validateBasicInput({method: 'GET', path: 'policies'})).to.throw();
    });
  });

  describe("Validate get policies input tests", () => {
    it("validate throws error when service id is missing", () => {
      expect(() => validationUtil.validateGetPoliciesInput({ query: {}})).to.throw();
    });
  });

  describe("Validate post policies input tests", () => {
    it("validate throws error when body is missing", () => {
      expect(() => validationUtil.validatePostPoliciesInput({})).to.throw();
    });

    it("validate throws error when service id is missing", () => {
      expect(() => validationUtil.validatePostPoliciesInput({body: {}})).to.throw();
    });

    it("validate throws error when policies are missing", () => {
      expect(() => validationUtil.validatePostPoliciesInput({body: {serviceId: '342342'}})).to.throw();
    });

    it("validate throws error when policy keys are missing", () => {
      expect(() => validationUtil.validatePostPoliciesInput({body: {serviceId: '342342', policies: [{userId: '23222'}]}})).to.throw();
    });
  });

  describe("Validate get check perms input", () => {
    it("validate throws error when userId is missing", () => {
      expect(() => validationUtil.validateGetCheckPermsInput({query: {}})).to.throw();
    });

    it("validate throws error when service Id is missing", () => {
      expect(() => validationUtil.validateGetCheckPermsInput({query: {"userId": "231313"}})).to.throw();
    });

    it("validate throws error when permission is missing", () => {
      expect(() => validationUtil.validateGetCheckPermsInput({query: {"userId": "231313", "serviceId": "3432424"}})).to.throw();
    });

    it("validate throws error when category is missing", () => {
      expect(() => validationUtil.validateGetCheckPermsInput({query: {"userId": "231313", "serviceId": "3432424", "permission": "write"}})).to.throw();
    });
  });

  describe("Validate get services input", () => {
    it("validate throws error when userId is missing", () => {
      expect(() => validationUtil.validateGetServicesInput({query: {}})).to.throw();
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
          policies: [{userId: "data", category: "manage", permission: "read"}]
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

    it('POST policies - add user successfully', async() => {
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

    it('POST policies - add user error', async() => {
      // arrange
      const addOrRemovePolicyStub = sinon.stub(casbinUtil, "addOrRemovePolicy").resolves({error: "Error"});
      const config = {};

      // act & assert
      await expect(index.processACLRequest(postEvent, config)).to.be.rejected;
      sinon.assert.calledOnce(addOrRemovePolicyStub);
      addOrRemovePolicyStub.restore();
    });

    it('POST policies - remove users successfully', async() => {
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

    it('POST policies - remove users throws error', async() => {
      // arrange
      const addOrRemovePolicyStub = sinon.stub(casbinUtil, "addOrRemovePolicy").resolves({error: "Error"});
      const config = {};
      postEvent.body.policies = [];

      // act & assert
      await expect(index.processACLRequest(postEvent, config)).to.be.rejected;
      sinon.assert.calledOnce(addOrRemovePolicyStub);
      addOrRemovePolicyStub.restore();
    });

    it('GET policies - get user throws error', async() => {
      // arrange
      const getPoliciesStub = sinon.stub(casbinUtil, "getPolicies").resolves({error: "Error"});
      const config = {};

      // act & assert
      await expect(index.processACLRequest(getEvent, config)).to.be.rejected;
      sinon.assert.calledOnce(getPoliciesStub);
      getPoliciesStub.restore();
    });

    it('GET policies - get user policies', async() => {
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

    it('GET checkpermission - authorize true', async() => {
      // arrange
      const getCheckPermissionsStub = sinon.stub(casbinUtil, "checkPermissions").resolves({authorized: true});
      const config = {};

      // act
      const result = await index.processACLRequest(getEvent, config);

      // assert
      expect(result.authorized).to.eq(true);
      sinon.assert.calledOnce(getCheckPermissionsStub);
      getCheckPermissionsStub.restore();
    });

    it('GET checkpermission - throws error', async() => {
      // arrange
      const getCheckPermissionsStub = sinon.stub(casbinUtil, "checkPermissions").resolves({error: "Error"});
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

    it('GET services - with service id for a given user', async() => {
      // arrange
      const policies = [{
        serviceId: "324234234",
        policies: [{category: "manage", permission: "read"}]
      }];

      const getCheckPermissionsStub = sinon.stub(casbinUtil, "getPolicyForServiceUser").resolves(policies);
      const config = {};

      // act
      const result = await index.processACLRequest(getEvent, config);

      // assert
      expect(result[0].serviceId).to.eq("324234234");
      sinon.assert.calledOnce(getCheckPermissionsStub);
      getCheckPermissionsStub.restore();
    });

    it('GET services - for a given user', async() => {
      // arrange
      getEvent.path = {};
      const policies = [{
        serviceId: "324234234",
        policies: [{category: "manage", permission: "read"}]
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
