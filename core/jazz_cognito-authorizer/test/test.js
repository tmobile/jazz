const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const request = require('request');

const aclServices = require("../components/acl-services");
const auth = require("../components/login");
chai.use(chaiAsPromised);

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

    await expect(aclServices.getServiceMetadata({}, "abc", "userId=123")).to.be.rejected;
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

    await expect(aclServices.getServiceMetadata({}, "abc", "userId=123")).to.be.rejected;
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

    await expect(aclServices.getServiceMetadata({}, "abc", "userId=123", "serviceId")).to.be.resolves;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });
});

describe("checkPermissionData", () => {
  it('checkPermissionData will be reject for status code 500', async () => {
    let responseObject = {
      statusCode: 500,
      body: {}
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(aclServices.checkPermissionData({}, "abc", "userId=123")).to.be.rejected;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });

  it('checkPermissionData will be reject for empty body', async () => {
    let responseObject = {
      statusCode: 200,
      body: {}
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(aclServices.checkPermissionData({}, "abc", "userId=123")).to.be.rejected;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });

  it('checkPermissionData will be resolve for valid response', async () => {
    let responseObject = {
      statusCode: 200,
      body: JSON.stringify({ data: { data: "dada" } })
    };

    reqStub = sinon.stub(request, "Request").callsFake((obj) => {
      return obj.callback(null, responseObject, responseObject.body);
    });

    await expect(aclServices.checkPermissionData({}, "abc", "userId=123&category=admin&permission=read&serviceId=123")).to.be.resolves;
    sinon.assert.calledOnce(reqStub);
    reqStub.restore();
  });
});
