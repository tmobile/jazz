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

//Validations
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

  it('should reject while validating create safe input params without event.body', (done) => {
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

  it('should reject while validating create safe input params without required fields', (done) => {
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

  it('should reject while validating update safe input params without event.body', (done) => {
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

  it('should reject while validating without event.path', (done) => {
    validations.validateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Input path cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating path params without safename', (done) => {
    event.path = { "name": "test" };
    validations.validateSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required in path - safename'
        });
      });
    done();
  });

  it('should resolve while validating create user in safe input params with valid input', (done) => {
    event.body = { "username": "test@test.com", "permission": "read" }
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

  it('should reject while validating create user in safe input params without event.body', (done) => {
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

  it('should reject while validating create user in safe input params without required fields', (done) => {
    event.body = { "name": "safe" };
    validations.validateUserInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - username, permission'
        });
      });
    done();
  });

  it('should resolve while validating create role in safe input params with valid input', (done) => {
    event.body = { "arn": "arn:aws:iam::1234567889:role/test_role", "permission": "read" }
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

  it('should reject while validating create role in safe input params without event.body', (done) => {
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

  it('should reject while validating create role in safe input params without required fields', (done) => {
    event.body = { "name": "safe" };
    validations.validateRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - arn, permission'
        });
      });
    done();
  });

  it('should resolve while validating valid rolename as query param', (done) => {
    event.query = { "arn": "arn:aws:iam::1234567889:role/test_role" }
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

  it('should reject while validating without event.query', (done) => {
    validations.validateGetRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Query cannot be empty'
        });
      });
    done();
  });

  it('should reject while validating query params without rolename', (done) => {
    event.query = { "rolename": "test" };
    validations.validateGetRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required in query - arn'
        });
      });
    done();
  });

  it('should reject while validating delete role in safe without arn', (done) => {
    validations.validateDeleteRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - arn'
        });
      });
    done();
  });

  it('should resolve while validating delete role with valid arn', (done) => {
    event.body.arn = "arn:aws:iam::123456788909:role/test_role";
    validations.validateDeleteRoleInSafeInput(event)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) are required - username, password'
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

  it('should reject while validating create user in vault input params without event.body', (done) => {
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

  it('should reject while validating create user in vault input params without required fields', (done) => {
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

  it('should reject while validating delete user from vault input params without event.body', (done) => {
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

  it('should reject while validating delete user from vault input params without required fields', (done) => {
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

  it('should reject with invalid iam role arn', (done) => {
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
          message: 'Following field(s) not satisfying the char length {"name":3,"description":10} - name,description'
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

  it('should resolve with valid enum values', (done) => {
    let data = { "permission": "read" }
    validations.validateEnum(data)
      .then((result) => {
        assert(true);
      })
    done();
  });

  it('should rejects with invalid enum values', (done) => {
    let data = { "permission": "read-write" }
    validations.validateEnum(data)
      .catch((err) => {
        expect(err).to.include({
          errorType: 'inputError',
          message: 'Following field(s) has invalid values - permission. Expecting values are {"permission":["read","write"]}'
        });
      });
    done();
  });
});

//Create Safe
describe('Create safe', () => {
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
    const createSafeStub = sinon.stub(vault, "createSafe").callsFake((config, service_data, vaultToken, cb) => {
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
    const createSafeStub = sinon.stub(vault, "createSafe").callsFake((config, service_data, vaultToken, cb) => {
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

//Get Safe
describe('Get safe details', () => {
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
    let getSafeStub = sinon.stub(vault, "getSafeDetails").callsFake((config, service_data, vaultToken, cb) => {
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
    let getSafeStub = sinon.stub(vault, "getSafeDetails").callsFake((config, service_data, vaultToken, cb) => {
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

//Update Safe
describe('Update safe', () => {
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
      body: { "data": { "message": `Safe testsafe successfully updated.` } }
    };
  });

  it('should update safe in tvault with valid input', (done) => {
    let updateSafeStub = sinon.stub(vault, "updateSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.updateSafe(event.body, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(updateSafeStub);
        updateSafeStub.restore();
      })
    done();
  });

  it('should rejects update safe in tvault if safe updation in tvault fails.', (done) => {
    let updateSafeStub = sinon.stub(vault, "updateSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.updateSafe(event.body, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(updateSafeStub);
        updateSafeStub.restore();
      });
    done();
  });
});

//Delete Safe
describe('Delete safe', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "resourcePath": "/safes/{safename}",
      "path": {
        "safename": "testsafe"
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
      body: { "data": { "message": `Safe testsafe successfully deleted.` } }
    };
  });

  it('should delete safe in tvault with valid input', (done) => {
    let deleteSafeStub = sinon.stub(vault, "deleteSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.deleteSafe(event.path.safename, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(deleteSafeStub);
        deleteSafeStub.restore();
      })
    done();
  });

  it('should rejects delete safe in tvault if safe deletion in tvault fails.', (done) => {
    let deleteSafeStub = sinon.stub(vault, "deleteSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.deleteSafe(event.path.safename, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(deleteSafeStub);
        deleteSafeStub.restore();
      });
    done();
  });
});

//Create user in safe
describe('Create user in safe', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "resourcePath": "/safes/{safename}/user",
      "path": {
        "safename": "testsafe"
      },
      "body": {
        "username": "test@test.com"
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
      body: { "data": { "message": `User test@test.com associated with safe testsafe` } }
    };
  });

  it('should create user in safe in tvault with valid input', (done) => {
    let createUserInSafeStub = sinon.stub(vault, "createUserInSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.createUserInSafe(event.body, event.path.safename, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(createUserInSafeStub);
        createUserInSafeStub.restore();
      })
    done();
  });

  it('should rejects create user in safe in tvault if the tvault api fails.', (done) => {
    let createUserInSafeStub = sinon.stub(vault, "createUserInSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.createUserInSafe(event.body, event.path.safename, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(createUserInSafeStub);
        createUserInSafeStub.restore();
      });
    done();
  });
});

//Delete user from safe
describe('Delete user from safe', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "resourcePath": "/safes/{safename}/user",
      "path": {
        "safename": "testsafe"
      },
      "body": {
        "username": "test@test.com"
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
      body: { "data": { "message": `User test@test.com successfully deleted` } }
    };
  });

  it('should delete user from safe in tvault with valid input', (done) => {
    let deleteUserFromSafeStub = sinon.stub(vault, "deleteUserFromSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.deleteUserFromSafe(event.body, event.path.safename, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(deleteUserFromSafeStub);
        deleteUserFromSafeStub.restore();
      })
    done();
  });

  it('should rejects delete user from safe in tvault if the tvault api fails.', (done) => {
    let deleteUserFromSafeStub = sinon.stub(vault, "deleteUserFromSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.deleteUserFromSafe(event.body, event.path.safename, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(deleteUserFromSafeStub);
        deleteUserFromSafeStub.restore();
      });
    done();
  });
});

//Create role in safe
describe('Create role in safe', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "resourcePath": "/safes/{safename}/role",
      "path": {
        "safename": "testsafe"
      },
      "body": {
        "rolename": "testrole"
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
      body: { "data": { "message": `Role successfully created` } }
    };
  });

  it('should create role in safe in tvault with valid input', (done) => {
    let createRoleInSafeStub = sinon.stub(vault, "createRole").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.createRoleInSafe(event.body, event.path.safename, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(createRoleInSafeStub);
        createRoleInSafeStub.restore();
      })
    done();
  });

  it('should rejects create role in safe in tvault if the tvault api fails.', (done) => {
    let createRoleInSafeStub = sinon.stub(vault, "createRole").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.createRoleInSafe(event.body, event.path.safename, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(createRoleInSafeStub);
        createRoleInSafeStub.restore();
      });
    done();
  });
});

//Delete role from safe
describe('Delete role from safe', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "resourcePath": "/safes/{safename}/role",
      "path": {
        "safename": "testsafe"
      },
      "body": {
        "username": "testrole"
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
      body: { "data": { "message": `User test@test.com successfully deleted` } }
    };
  });

  it('should delete role from safe in tvault with valid input', (done) => {
    let deleteRoleFromSafeStub = sinon.stub(vault, "deleteRoleFromSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.deleteRoleFromSafe(event.body, event.path.safename, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(deleteRoleFromSafeStub);
        deleteRoleFromSafeStub.restore();
      })
    done();
  });

  it('should rejects delete role from safe in tvault if the tvault api fails.', (done) => {
    let deleteRoleFromSafeStub = sinon.stub(vault, "deleteRoleFromSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.deleteRoleFromSafe(event.body, event.path.safename, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(deleteRoleFromSafeStub);
        deleteRoleFromSafeStub.restore();
      });
    done();
  });
});

//Get role
describe('Get role details', () => {
  beforeEach(function () {
    event = {
      "method": "GET",
      "stage": "test",
      "resourcePath": "/safes/{safename}/role",
      "query": {
        "rolename": "testrole"
      },
      "path": {
        "safename": "testsafe"
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
      body: {
        "data": {

        }
      }
    };
  });

  it('should get role details with valid safename', (done) => {
    let getRoleInSafeStub = sinon.stub(vault, "getRoleInSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.getRoleInSafe(event.body, config, vaultToken)
      .then((result) => {
        expect(result.body.data).to.eq(response.body.data)
        sinon.assert.calledOnce(getRoleInSafeStub);
        getRoleInSafeStub.restore();
      })
    done();
  });

  it('should rejects get role details if the tvault api fails.', (done) => {
    let getRoleInSafeStub = sinon.stub(vault, "getRoleInSafe").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.getRoleInSafe(event.body, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(getRoleInSafeStub);
        getRoleInSafeStub.restore();
      });
    done();
  });
});

//Create user in vault
describe('Create user in vault', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "resourcePath": "/safes/user",
      "body": {
        "username": "test@test.com",
        "password": "tester"
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
      body: { "data": { "message": `User test@test.com successfully created` } }
    };
  });

  it('should create user in tvault with valid input', (done) => {
    let createUserInVaultStub = sinon.stub(vault, "createUserInVault").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.createUserInVault(event.body, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(createUserInVaultStub);
        createUserInVaultStub.restore();
      })
    done();
  });

  it('should rejects create user in tvault if the tvault api fails.', (done) => {
    let createUserInVaultStub = sinon.stub(vault, "createUserInVault").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.createUserInVault(event.body, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(createUserInVaultStub);
        createUserInVaultStub.restore();
      });
    done();
  });
});

//Delete user from vault
describe('Delete user from vault', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "resourcePath": "/safes/user",
      "body": {
        "username": "test@test.com"
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
      body: { "data": { "message": `User test@test.com successfully deleted` } }
    };
  });

  it('should delete user in tvault with valid input', (done) => {
    let deleteUserFromVaultStub = sinon.stub(vault, "deleteUserFromVault").callsFake((config, service_data, vaultToken, cb) => {
      return cb(null, response);
    });

    index.deleteUserFromVault(event.body, config, vaultToken)
      .then((result) => {
        sinon.assert.calledOnce(deleteUserFromVaultStub);
        deleteUserFromVaultStub.restore();
      })
    done();
  });

  it('should rejects delete user from tvault if the tvault api fails.', (done) => {
    let deleteUserFromVaultStub = sinon.stub(vault, "deleteUserFromVault").callsFake((config, service_data, vaultToken, cb) => {
      return cb({ message: "Intenal server error" });
    });

    index.deleteUserFromVault(event.body, config, vaultToken)
      .catch((error) => {
        expect(error).to.include({
          message: "Intenal server error"
        })
        sinon.assert.calledOnce(deleteUserFromVaultStub);
        deleteUserFromVaultStub.restore();
      });
    done();
  });
});

//Index file - Create safe
describe('Index file - Create safe', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "principalId": "test123",
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

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateCreateSafeInputStub = sinon.stub(validations, "validateCreateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createSafeStub = sinon.stub(index, "createSafe").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateCreateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createSafeStub);
      validateCreateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createSafeStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateCreateSafeInputStub = sinon.stub(validations, "validateCreateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createSafeStub = sinon.stub(index, "createSafe").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateCreateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createSafeStub);
      validateCreateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createSafeStub.restore();
    })
    done();
  });

  it('should create safe in tvault with valid input', (done) => {
    const validateCreateSafeInputStub = sinon.stub(validations, "validateCreateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createSafeStub = sinon.stub(index, "createSafe").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateCreateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(createSafeStub);
      validateCreateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateCreateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateCreateSafeInputStub = sinon.stub(validations, "validateCreateSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createSafeStub = sinon.stub(index, "createSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateCreateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createSafeStub);
      validateCreateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createSafeStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - name" };
    const validateCreateSafeInputStub = sinon.stub(validations, "validateCreateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createSafeStub = sinon.stub(index, "createSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - name" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateCreateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createSafeStub);
      validateCreateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateFieldLength throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) not satisfying the char length - name" };
    const validateCreateSafeInputStub = sinon.stub(validations, "validateCreateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createSafeStub = sinon.stub(index, "createSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) not satisfying the char length - name" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateCreateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createSafeStub);
      validateCreateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createSafeStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateCreateSafeInputStub = sinon.stub(validations, "validateCreateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const createSafeStub = sinon.stub(index, "createSafe").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateCreateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(createSafeStub);
      validateCreateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createSafeStub.restore();
    })
    done();
  });

  it('should throw error if createSafe fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateCreateSafeInputStub = sinon.stub(validations, "validateCreateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves(vaultToken);
    const createSafeStub = sinon.stub(index, "createSafe").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateCreateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(createSafeStub);
      validateCreateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createSafeStub.restore();
    })
    done();
  });
});

//Index file - Update safe
describe('Index file - Update safe', () => {
  beforeEach(function () {
    event = {
      "method": "PUT",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/safes/{safename}",
      "path": {
        "safename": "testsafe"
      },
      "body": {
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
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateUpdateSafeInputStub = sinon.stub(validations, "validateUpdateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const updateSafeStub = sinon.stub(index, "updateSafe").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateUpdateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(updateSafeStub);
      validateUpdateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      updateSafeStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateUpdateSafeInputStub = sinon.stub(validations, "validateUpdateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const updateSafeStub = sinon.stub(index, "updateSafe").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateUpdateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(updateSafeStub);
      validateUpdateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      updateSafeStub.restore();
    })
    done();
  });

  it('should update safe in tvault with valid input', (done) => {
    const validateUpdateSafeInputStub = sinon.stub(validations, "validateUpdateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const updateSafeStub = sinon.stub(index, "updateSafe").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateUpdateSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(updateSafeStub);
      validateUpdateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      updateSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateUpdateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateUpdateSafeInputStub = sinon.stub(validations, "validateUpdateSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const updateSafeStub = sinon.stub(index, "updateSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateUpdateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(updateSafeStub);
      validateUpdateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      updateSafeStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - name" };
    const validateUpdateSafeInputStub = sinon.stub(validations, "validateUpdateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const updateSafeStub = sinon.stub(index, "updateSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - name" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateUpdateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(updateSafeStub);
      validateUpdateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      updateSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateFieldLength throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) not satisfying the char length - name" };
    const validateUpdateSafeInputStub = sinon.stub(validations, "validateUpdateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const updateSafeStub = sinon.stub(index, "updateSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) not satisfying the char length - name" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateUpdateSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(updateSafeStub);
      validateUpdateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      updateSafeStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateUpdateSafeInputStub = sinon.stub(validations, "validateUpdateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const updateSafeStub = sinon.stub(index, "updateSafe").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateUpdateSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(updateSafeStub);
      validateUpdateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      updateSafeStub.restore();
    })
    done();
  });

  it('should throw error if updateSafe fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateUpdateSafeInputStub = sinon.stub(validations, "validateUpdateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const updateSafeStub = sinon.stub(index, "updateSafe").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateUpdateSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(updateSafeStub);
      validateUpdateSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      updateSafeStub.restore();
    })
    done();
  });
});

//Index file - Get safe details
describe('Index file - Get safe details', () => {
  beforeEach(function () {
    event = {
      "method": "GET",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/safes/{safename}",
      "path": {
        "safename": "testsafe"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getSafeDetailsStub = sinon.stub(index, "getSafeDetails").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getSafeDetailsStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      getSafeDetailsStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getSafeDetailsStub = sinon.stub(index, "getSafeDetails").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getSafeDetailsStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      getSafeDetailsStub.restore();
    })
    done();
  });

  it('should get safe details with valid input', (done) => {
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getSafeDetailsStub = sinon.stub(index, "getSafeDetails").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(getSafeDetailsStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      getSafeDetailsStub.restore();
    })
    done();
  });

  it('should throw error if validateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getSafeDetailsStub = sinon.stub(index, "getSafeDetails").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getSafeDetailsStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      getSafeDetailsStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - name" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getSafeDetailsStub = sinon.stub(index, "getSafeDetails").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - name" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getSafeDetailsStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      getSafeDetailsStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const getSafeDetailsStub = sinon.stub(index, "getSafeDetails").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(getSafeDetailsStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      getSafeDetailsStub.restore();
    })
    done();
  });

  it('should throw error if getSafeDetails fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const getSafeDetailsStub = sinon.stub(index, "getSafeDetails").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(getSafeDetailsStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      getSafeDetailsStub.restore();
    })
    done();
  });
});

//Index file - Delete safe
describe('Index file - Delete safe', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/safes/{safename}",
      "path": {
        "safename": "testsafe"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteSafeStub = sinon.stub(index, "deleteSafe").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteSafeStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteSafeStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteSafeStub = sinon.stub(index, "deleteSafe").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteSafeStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteSafeStub.restore();
    })
    done();
  });

  it('should delete safe with valid input', (done) => {
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteSafeStub = sinon.stub(index, "deleteSafe").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(deleteSafeStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteSafeStub = sinon.stub(index, "deleteSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteSafeStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteSafeStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - name" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteSafeStub = sinon.stub(index, "deleteSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - name" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteSafeStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteSafeStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const deleteSafeStub = sinon.stub(index, "deleteSafe").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(deleteSafeStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteSafeStub.restore();
    })
    done();
  });

  it('should throw error if deleteSafe fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const deleteSafeStub = sinon.stub(index, "deleteSafe").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(deleteSafeStub);
      validateSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteSafeStub.restore();
    })
    done();
  });
});

//Index file - Create user in safe
describe('Index file - Create user in safe', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/safes/{safename}/user",
      "path": {
        "safename": "testsafe"
      },
      "body": {
        "username": "test@test.com",
        "permission": "read"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateUserInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateUserInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should create user in safe with valid input', (done) => {
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(validateEnumStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").rejects(error);
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.notCalled(validateUserInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateUserInSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) are required - username, permission" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) are required - username, permission" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - username" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - username" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateFieldLength throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) not satisfying the char length - name" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").rejects(error);
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) not satisfying the char length - name" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub)
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateEnum throws error', (done) => {
    let error = { "errorType": "inputError", "message": 'Following field(s) has invalid values - permission. Expecting values are {"permission":["read","write"]}' };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": 'Following field(s) has invalid values - permission. Expecting values are {"permission":["read","write"]}' }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub)
      sinon.assert.calledOnce(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(validateEnumStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });

  it('should throw error if createUserInSafe fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const createUserInSafeStub = sinon.stub(index, "createUserInSafe").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(validateEnumStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(createUserInSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createUserInSafeStub.restore();
    })
    done();
  });
});

//Index file - Delete user from safe
describe('Index file - Delete user from safe', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/safes/{safename}/user",
      "path": {
        "safename": "testsafe"
      },
      "body": {
        "username": "test@test.com"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromSafeStub = sinon.stub(index, "deleteUserFromSafe").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateUserInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();

    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromSafeStub = sinon.stub(index, "deleteUserFromSafe").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateUserInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromSafeStub.restore();
    })
    done();
  });

  it('should delete user from safe with valid input', (done) => {
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromSafeStub = sinon.stub(index, "deleteUserFromSafe").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(deleteUserFromSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").rejects(error);
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromSafeStub = sinon.stub(index, "deleteUserFromSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.notCalled(validateUserInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateUserInSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) are required - username" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromSafeStub = sinon.stub(index, "deleteUserFromSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) are required - username" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - username" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromSafeStub = sinon.stub(index, "deleteUserFromSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - username" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const deleteUserFromSafeStub = sinon.stub(index, "deleteUserFromSafe").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if deleteUserFromSafe fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateUserInSafeInputStub = sinon.stub(validations, "validateUserInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const deleteUserFromSafeStub = sinon.stub(index, "deleteUserFromSafe").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateUserInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(deleteUserFromSafeStub);
      validateSafeInputStub.restore();
      validateUserInSafeInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromSafeStub.restore();
    })
    done();
  });
});

//Index file - Create role in safe
describe('Index file - Create role in safe', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/safes/{safename}/role",
      "path": {
        "safename": "testsafe"
      },
      "body": {
        "arn": "arn:aws:iam::1234567889:role/test_role",
        "permission": "read"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should create role in safe with valid input', (done) => {
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(validateEnumStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").rejects(error);
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.notCalled(validateRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateRoleInSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) are required - arn, permission" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) are required - arn, permission" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - arn" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - arn" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.notCalled(validateRoleInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub)
      sinon.assert.notCalled(validateEnumStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateRoleArn throws error', (done) => {
    let error = { "errorType": "inputError", "message": "The provided role is not valid." };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").rejects(error);
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "The provided role is not valid." }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub)
      sinon.assert.notCalled(validateEnumStub);;
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateEnum throws error', (done) => {
    let error = { "errorType": "inputError", "message": 'Following field(s) has invalid values - permission. Expecting values are {"permission":["read","write"]}' };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": 'Following field(s) has invalid values - permission. Expecting values are {"permission":["read","write"]}' }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub)
      sinon.assert.calledOnce(validateEnumStub);;
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(validateEnumStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if createRoleInSafe fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateRoleInSafeInputStub = sinon.stub(validations, "validateRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const validateEnumStub = sinon.stub(validations, "validateEnum").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const createRoleInSafeStub = sinon.stub(index, "createRoleInSafe").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(validateEnumStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(createRoleInSafeStub);
      validateSafeInputStub.restore();
      validateRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      validateEnumStub.restore();
      getVaultTokenStub.restore();
      createRoleInSafeStub.restore();
    })
    done();
  });
});

//Index file - Delete role from safe
describe('Index file - Delete role from safe', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/safes/{safename}/role",
      "path": {
        "safename": "testsafe"
      },
      "body": {
        "arn": "arn:aws:iam::1234567889:role/test_role"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateDeleteRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateDeleteRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });

  it('should delete role from safe with valid input', (done) => {
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateDeleteRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").rejects(error);
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.notCalled(validateDeleteRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateDeleteRoleInSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) are required - arn" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) are required - arn" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateDeleteRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - arn" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - arn" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateDeleteRoleInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateRoleArn throws error', (done) => {
    let error = { "errorType": "inputError", "message": "The provided arn is not valid - arn:aws:iam::1234567889:role/test_role" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "The provided arn is not valid - arn:aws:iam::1234567889:role/test_role" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateDeleteRoleInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateDeleteRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });

  it('should throw error if deleteRoleFromSafe fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateDeleteRoleInSafeInputStub = sinon.stub(validations, "validateDeleteRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const deleteRoleFromSafeStub = sinon.stub(index, "deleteRoleFromSafe").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateDeleteRoleInSafeInputStub);
      sinon.assert.calledTwice(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(deleteRoleFromSafeStub);
      validateSafeInputStub.restore();
      validateDeleteRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      deleteRoleFromSafeStub.restore();
    })
    done();
  });
});

//Index file - Get role details from safe
describe('Index file - Get role details from safe', () => {
  beforeEach(function () {
    event = {
      "method": "GET",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/safes/{safename}/role",
      "path": {
        "safename": "testsafe"
      },
      "query": {
        "arn": "arn:aws:iam::1234567889:role/test_role"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateGetRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateSafeInputStub);
      sinon.assert.notCalled(validateGetRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });

  it('should get role details from safe with valid input', (done) => {
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateGetRoleInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").rejects(error);
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.notCalled(validateGetRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateGetRoleInSafeInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) are required - arn" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) are required - arn" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateGetRoleInSafeInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - arn" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - arn" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateGetRoleInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if validateRoleArn throws error', (done) => {
    let error = { "errorType": "inputError", "message": "The provided arn is not valid - arn:aws:iam::1234567889:role/test_role" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").resolves();

    let errResp = { "errorType": "BadRequest", "message": "The provided arn is not valid - arn:aws:iam::1234567889:role/test_role" };
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateGetRoleInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateGetRoleInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });

  it('should throw error if getRoleInSafe fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateSafeInputStub = sinon.stub(validations, "validateSafeInput").resolves();
    const validateGetRoleInSafeInputStub = sinon.stub(validations, "validateGetRoleInSafeInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateRoleArnStub = sinon.stub(validations, "validateRoleArn").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves(vaultToken);
    const getRoleInSafeStub = sinon.stub(index, "getRoleInSafe").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateSafeInputStub);
      sinon.assert.calledOnce(validateGetRoleInSafeInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateRoleArnStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(getRoleInSafeStub);
      validateSafeInputStub.restore();
      validateGetRoleInSafeInputStub.restore();
      genericInputValidationStub.restore();
      validateRoleArnStub.restore();
      getVaultTokenStub.restore();
      getRoleInSafeStub.restore();
    })
    done();
  });
});

//Index file - Create user in vault
describe('Index file - Create user in vault', () => {
  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/t-vault/user",
      "body": {
        "username": "test@test.com",
        "password": "tester"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateUserInVaultInputStub = sinon.stub(validations, "validateUserInVaultInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInVaultStub = sinon.stub(index, "createUserInVault").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateUserInVaultInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInVaultStub);
      validateUserInVaultInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createUserInVaultStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateUserInVaultInputStub = sinon.stub(validations, "validateUserInVaultInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInVaultStub = sinon.stub(index, "createUserInVault").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateUserInVaultInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInVaultStub);
      validateUserInVaultInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createUserInVaultStub.restore();
    })
    done();
  });

  it('should create user in tvault with valid input', (done) => {
    const validateUserInVaultInputStub = sinon.stub(validations, "validateUserInVaultInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInVaultStub = sinon.stub(index, "createUserInVault").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateUserInVaultInputStub);

      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(createUserInVaultStub);
      validateUserInVaultInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createUserInVaultStub.restore();
    })
    done();
  });

  it('should throw error if validateUserInVaultInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateUserInVaultInputStub = sinon.stub(validations, "validateUserInVaultInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInVaultStub = sinon.stub(index, "createUserInVault").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateUserInVaultInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInVaultStub);
      validateUserInVaultInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createUserInVaultStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - username" };
    const validateUserInVaultInputStub = sinon.stub(validations, "validateUserInVaultInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInVaultStub = sinon.stub(index, "createUserInVault").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - username" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateUserInVaultInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInVaultStub);
      validateUserInVaultInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createUserInVaultStub.restore();
    })
    done();
  });

  it('should throw error if validateFieldLength throws error', (done) => {
    let error = { "errorType": "inputError", "message": "The provided user is not valid." };
    const validateUserInVaultInputStub = sinon.stub(validations, "validateUserInVaultInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const createUserInVaultStub = sinon.stub(index, "createUserInVault").resolves();

    let errResp = { "errorType": "BadRequest", "message": "The provided user is not valid." }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateUserInVaultInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(createUserInVaultStub);
      validateUserInVaultInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createUserInVaultStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateUserInVaultInputStub = sinon.stub(validations, "validateUserInVaultInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const createUserInVaultStub = sinon.stub(index, "createUserInVault").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateUserInVaultInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(createUserInVaultStub);
      validateUserInVaultInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createUserInVaultStub.restore();
    })
    done();
  });

  it('should throw error if createUserInVault fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateUserInVaultInputStub = sinon.stub(validations, "validateUserInVaultInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const validateFieldLengthStub = sinon.stub(validations, "validateFieldLength").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const createUserInVaultStub = sinon.stub(index, "createUserInVault").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateUserInVaultInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(validateFieldLengthStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(createUserInVaultStub);
      validateUserInVaultInputStub.restore();
      genericInputValidationStub.restore();
      validateFieldLengthStub.restore();
      getVaultTokenStub.restore();
      createUserInVaultStub.restore();
    })
    done();
  });
});

//Index file - Delete user from vault
describe('Index file - Delete user from vault', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/t-vault/user",
      "body": {
        "username": "test@test.com"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('should throw error if the method is empty', (done) => {
    delete event.method;
    const validateUserInVaultDeleteInputStub = sinon.stub(validations, "validateUserInVaultDeleteInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromVaultStub = sinon.stub(index, "deleteUserFromVault").resolves();
    let error = "{\"errorType\":\"BadRequest\",\"message\":\"Method cannot be empty\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateUserInVaultDeleteInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromVaultStub);
      validateUserInVaultDeleteInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromVaultStub.restore();
    })
    done();
  });

  it('should throw error if the principalId is not there', (done) => {
    delete event.principalId;
    const validateUserInVaultDeleteInputStub = sinon.stub(validations, "validateUserInVaultDeleteInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromVaultStub = sinon.stub(index, "deleteUserFromVault").resolves();
    let error = "{\"errorType\":\"Unauthorized\",\"message\":\"You aren't authorized to access this service\"}";

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(error);
      sinon.assert.notCalled(validateUserInVaultDeleteInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromVaultStub);
      validateUserInVaultDeleteInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromVaultStub.restore();
    })
    done();
  });

  it('should create user in tvault with valid input', (done) => {
    const validateUserInVaultDeleteInputStub = sinon.stub(validations, "validateUserInVaultDeleteInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromVaultStub = sinon.stub(index, "deleteUserFromVault").resolves();

    index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateUserInVaultDeleteInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);

      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(deleteUserFromVaultStub);
      validateUserInVaultDeleteInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromVaultStub.restore();
    })
    done();
  });

  it('should throw error if validateUserInVaultDeleteInput throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Input cannot be empty" };
    const validateUserInVaultDeleteInputStub = sinon.stub(validations, "validateUserInVaultDeleteInput").rejects(error);
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromVaultStub = sinon.stub(index, "deleteUserFromVault").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Input cannot be empty" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateUserInVaultDeleteInputStub);
      sinon.assert.notCalled(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromVaultStub);
      validateUserInVaultDeleteInputStub.restore();
      genericInputValidationStub.restore();

      getVaultTokenStub.restore();
      deleteUserFromVaultStub.restore();
    })
    done();
  });

  it('should throw error if genericInputValidation throws error', (done) => {
    let error = { "errorType": "inputError", "message": "Following field(s) has empty value - username" };
    const validateUserInVaultDeleteInputStub = sinon.stub(validations, "validateUserInVaultDeleteInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").rejects(error);
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves();
    const deleteUserFromVaultStub = sinon.stub(index, "deleteUserFromVault").resolves();

    let errResp = { "errorType": "BadRequest", "message": "Following field(s) has empty value - username" }
    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errResp));
      sinon.assert.calledOnce(validateUserInVaultDeleteInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.notCalled(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromVaultStub);
      validateUserInVaultDeleteInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromVaultStub.restore();
    })
    done();
  });

  it('should throw error if getVaultToken fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateUserInVaultDeleteInputStub = sinon.stub(validations, "validateUserInVaultDeleteInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").rejects(error);
    const deleteUserFromVaultStub = sinon.stub(index, "deleteUserFromVault").resolves();

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateUserInVaultDeleteInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.notCalled(deleteUserFromVaultStub);
      validateUserInVaultDeleteInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromVaultStub.restore();
    })
    done();
  });

  it('should throw error if deleteUserFromVault fails', (done) => {
    let error = { "error": "InternalServerError", "message": "Internal server error" };
    const validateUserInVaultDeleteInputStub = sinon.stub(validations, "validateUserInVaultDeleteInput").resolves();
    const genericInputValidationStub = sinon.stub(validations, "genericInputValidation").resolves();
    const getVaultTokenStub = sinon.stub(vault, "getVaultToken").resolves("s.token");
    const deleteUserFromVaultStub = sinon.stub(index, "deleteUserFromVault").rejects(error);

    let errorResp = { "errorType": "InternalServerError", "message": "InternalServerError" };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
      sinon.assert.calledOnce(validateUserInVaultDeleteInputStub);
      sinon.assert.calledOnce(genericInputValidationStub);
      sinon.assert.calledOnce(getVaultTokenStub);
      sinon.assert.calledOnce(deleteUserFromVaultStub);
      validateUserInVaultDeleteInputStub.restore();
      genericInputValidationStub.restore();
      getVaultTokenStub.restore();
      deleteUserFromVaultStub.restore();
    })
    done();
  });
});

//Index file - Delete user from vault
describe('Index file - Common scenarios', () => {
  beforeEach(function () {
    event = {
      "method": "DELETE",
      "stage": "test",
      "principalId": "test123",
      "resourcePath": "/t-vault/user",
      "body": {
        "username": "test@test.com"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
    config = configModule.getConfig(event, context);
    vaultToken = "s.ktdfdsfltn";
  });

  it('Should throw error if not a valid resourcePath', (done) => {
    event.resourcePath = "something";
    let errorResp = { "errorType": "BadRequest", "message": "The requested method is not supported." };

    index.handler(event, context, (err, res) => {
      expect(err).to.eq(JSON.stringify(errorResp));
    })
    done();
  });
});