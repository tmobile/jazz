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
});


describe('processACLRequest tests', () => {
  let postEvent;
  let getEvent;

  beforeEach(() => {
    postEvent = {
      method: 'POST',
      path: 'policies',
      body: {
        serviceId: "324234234",
        policies: [{userId: "data", category: "manage", permission: "read"}]
      }
    };

    getEvent = {
      method: 'GET',
      path: 'policies',
      query: {
        serviceId: "324234234",
      }
    }
  });

  afterEach(() => {
    postEvent = {};
    getEvent = {};
  });

  it('POST policies - add user successfully', async() => {
    // arrange
    const addOrRemovePolicyStub = sinon.stub(casbinUtil, "addOrRemovePolicy").resolves(true);
    const config = {};

    // act
    const result = await index.processACLRequest(postEvent, config);

    // assert
    expect(result.success).to.equal(true);
    sinon.assert.calledOnce(addOrRemovePolicyStub);
    addOrRemovePolicyStub.restore();
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
    const config = {};
    postEvent.body.policies = [];

    // act
    const result = await index.processACLRequest(postEvent, config);

    // assert
    expect(result.success).to.equal(true);
    sinon.assert.calledOnce(addOrRemovePolicyStub);
    addOrRemovePolicyStub.restore();
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
    expect(result.policies[0].userId).to.eq("user1");
    expect(result.serviceId).to.eq(getEvent.query.serviceId);
    sinon.assert.calledOnce(getPoliciesStub);
    getPoliciesStub.restore();
  });
});
