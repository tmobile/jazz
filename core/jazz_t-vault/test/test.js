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

const assert = require('chai').assert;
const expect = require('chai').expect;
const sinon = require('sinon');
const awsContext = require('aws-lambda-mock-context');
const index = require('../index');
const configModule = require("../components/config.js");
const vault = require("../components/utils/vault.js");
const validations = require("../components/utils/validations.js");


describe('Validations', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "resourcePath": "test/service",
      "body": {
        "name": "tester",
        "owner": "test",
        "description": "testsafe"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
  });

  it('should resolve while validating create safe input params with valid input', (done) => {
    validations.validateCreateSafeInput(event)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject while validating create safe input params with empty input', (done) => {
    event.body = {};
    validations.validateCreateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating create safe input params with out event.body', (done) => {
    delete event.body;
    validations.validateCreateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating create safe input params with out required fields', (done) => {
    delete event.body.name;
    validations.validateCreateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - name'
        });
      });
    done();
  });

  it('should resolve while validating update safe input params with valid input', (done) => {
    validations.validateUpdateSafeInput(event)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject while validating update safe input params with empty input', (done) => {
    event.body = {};
    validations.validateUpdateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating update safe input params with out event.body', (done) => {
    delete event.body;
    validations.validateUpdateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should resolve while validating valid safename as path param', (done) => {
    event.path = { "safename": "testsafe" }
    validations.validateSafeInput(event)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject while validating empty path param', (done) => {
    event.path = {};
    validations.validateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input path cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating with out event.path', (done) => {
    validations.validateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input path cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating path params with out safename', (done) => {
    event.path = { "name": "test" };
    validations.validateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required in path- safename'
        });
      });
    done();
  });

  it('should resolve while validating create user in safe input params with valid input', (done) => {
    event.body = { "username": "test@test.com" }
    validations.validateUserInSafeInput(event)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject while validating create user in safe input params with empty input', (done) => {
    event.body = {};
    validations.validateUserInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating create user in safe input params with out event.body', (done) => {
    delete event.body;
    validations.validateUserInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating create user in safe input params with out required fields', (done) => {
    event.body = { "name": "safe" };
    validations.validateUserInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - username'
        });
      });
    done();
  });

  it('should resolve while validating create role in safe input params with valid input', (done) => {
    event.body = { "arn": "arn:aws:iam::1234567889:role/test_role" }
    validations.validateRoleInSafeInput(event)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject while validating create role in safe input params with empty input', (done) => {
    event.body = {};
    validations.validateRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating create role in safe input params with out event.body', (done) => {
    delete event.body;
    validations.validateRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating create role in safe input params with out required fields', (done) => {
    event.body = { "name": "safe" };
    validations.validateRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - arn'
        });
      });
    done();
  });

  it('should resolve while validating valid rolename as query param', (done) => {
    event.query = { "rolename": "testrole" }
    validations.validateGetRoleInSafeInput(event)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject while validating empty query param', (done) => {
    event.query = {};
    validations.validateGetRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Query cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating with out event.query', (done) => {
    validations.validateGetRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Query cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating query params with out rolename', (done) => {
    event.query = { "name": "test" };
    validations.validateGetRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required in query- rolename'
        });
      });
    done();
  });

  it('should resolve while validating create user in vault input params with valid input', (done) => {
    event.body = { "username": "test@test.com", "password": "test" }
    validations.validateUserInVaultInput(event)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject while validating create user in vault input params with empty input', (done) => {
    event.body = {};
    validations.validateUserInVaultInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating create user in vault input params with out event.body', (done) => {
    delete event.body;
    validations.validateUserInVaultInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating create user in vault input params with out required fields', (done) => {
    event.body = { "name": "safe" };
    validations.validateUserInVaultInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - username, password'
        });
      });
    done();
  });

  it('should resolve while validating delete user from vault input params with valid input', (done) => {
    event.body = { "username": "test@test.com", "password": "test" }
    validations.validateUserInVaultDeleteInput(event)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject while validating delete user from vault input params with empty input', (done) => {
    event.body = {};
    validations.validateUserInVaultDeleteInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating delete user from vault input params with out event.body', (done) => {
    delete event.body;
    validations.validateUserInVaultDeleteInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating delete user from vault input params with out required fields', (done) => {
    event.body = { "name": "safe" };
    validations.validateUserInVaultDeleteInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - username'
        });
      });
    done();
  });

  it('should resolve with valid iam role arn', (done) => {
    let arn = "arn:aws:iam::123456788909:role/test_role";
    validations.validateRoleArn(arn)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject with in valid iam role arn', (done) => {
    let arn = "arn:aws:iam::1234567889:role/test_role";
    validations.validateRoleArn(arn)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'The provided arn is not valid - arn:aws:iam::1234567889:role/test_role'
        });
      });
    done();
  });

  it('should resolve with valid length of fields', (done) => {
    let data = { "name": "test", "description": "test safe details" }
    validations.validateFieldLength(data)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should reject if the inputs does not satisfy the required field length constraints', (done) => {
    let data = { "name": "te", "description": "test " }
    validations.validateFieldLength(data)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) not satisfying the char length {"name":3,"description":10} -  name,description'
        });
      });
    done();
  });

  it('should resolve with non empty inputs', (done) => {
    let data = { "username": "test@test.com", "password": "test" }
    validations.genericInputValidation(data)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should rejects with non empty inputs', (done) => {
    let data = {};
    validations.genericInputValidation(data)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input cannot be empty'
        });
      });
    done();
  });

});

describe('Create Safe', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "resourcePath": "/safes",
      "body": {
        "name": "testsafe",
        "owner": "test",
        "description": "testsafe"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
    response = {
      statusCode: 200,
      body: { "data": { "message": `Safe testsafe and associated read/write/deny policies are created.` } }
    };
  });

  it('should create safe in tvault with valid input', (done) => {
    var createSafeStub = sinon.stub(vault, "createSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.createSafe(event.body, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(createSafeStub);
        createSafeStub.restore();
      })
    done();
  });

  it('should rejects create safe in tvault if safe creation in tvault fails.', (done) => {
    var createSafeStub = sinon.stub(vault, "createSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.createSafe(event.body, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(createSafeStub);
        createSafeStub.restore();
      });
    done();
  });

});

describe('Get Safe Details', () => {
  beforeEach(function () {
    event = {
      "method": "GET",
      "stage": "test",
      "resourcePath": "/safes/{safename}"
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
    response = {
      statusCode: 200,
      body: {
        "data": {
          "description": "test",
          "name": "safe1",
          "owner": "test@tst.com",
          "ownerid": null,
          "type": "",
          "users": {
            "test1-tst-com": {
              "permission": "write"
            },
            "test2-tst-com": {
              "permission": "write"
            }
          },
          "roles": {
            "123456_tstrole1": {
              "arn": "arn:aws:iam::123456:role/tstrole1",
              "permission": "write"
            },
            "123456_tstrole2": {
              "arn": "arn:aws:iam::123456:role/tstrole2",
              "permission": "write"
            }
          }
        }
      }
    };
  });

  it('should get safe details with valid safename', (done) => {
    var getSafeStub = sinon.stub(vault, "getSafeDetails").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.getSafeDetails(event.body, config, vaultToken)
      .then((result) => {
        expect(result.body.data).to.eq(response.body.data)
        sinon.assert.calledOnce(getSafeStub);
        getSafeStub.restore();
      })
    done();
  });

  it('should rejects get safe details if the tvault api fails.', (done) => {
    var getSafeStub = sinon.stub(vault, "getSafeDetails").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.getSafeDetails(event.body, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(getSafeStub);
        getSafeStub.restore();
      });
    done();
  });
});

describe('Update Safe', () => {
  beforeEach(function () {
    event = {
      "method": "PUT",
      "stage": "test",
      "resourcePath": "/safes/{safename}",
      "body": {
        "name": "testsafe",
        "owner": "test",
        "description": "testsafe"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
    response = {
      statusCode: 200,
      body: { "data": { "message": `Safe testsafe and associated read/write/deny policies are created.` } }
    };
  });

  it('should create safe in tvault with valid input', (done) => {
    var createSafeStub = sinon.stub(vault, "createSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.createSafe(event.body, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(createSafeStub);
        createSafeStub.restore();
      })
    done();
  });

  it('should rejects create safe in tvault if safe creation in tvault fails.', (done) => {
    var createSafeStub = sinon.stub(vault, "createSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.createSafe(event.body, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(createSafeStub);
        createSafeStub.restore();
      });
    done();
  });

});
