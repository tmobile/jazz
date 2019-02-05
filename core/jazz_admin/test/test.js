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

const expect = require('chai').expect;
const sinon = require('sinon');
const AWS = require("aws-sdk-mock");
const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
const configObj = require('../components/config.js');

describe('jazz_admin', function () {

  beforeEach(function () {
    event = {
      "stage": "test",
      "method": "GET",
      "principalId": "test@test.com",
      "body": {}
    };
    config = configObj.getConfig(event, context);
    context = awsContext();
  });

  describe('validation tests', () => {

    it("should state that  method is not supported when event does not have method", function () {
      event = {
        "stage": "test",
        "principalId": "test@test.com",
        "body": {}
      };
      index.handler(event, context, (error, data) => {
        expect(error).to.include('{"errorType":"BadRequest","message":"Method cannot be empty"}');
      });
    });

    it("should indicate that method is missing when given an event with no event.method", function () {
      let invalidArray = ["", null, undefined];
      for (i in invalidArray) {
        event.method = invalidArray[i];
        index.handler(event, context, (error, data) => {
          expect(error).to.include('{"errorType":"BadRequest","message":"Method cannot be empty"}');
        });
      };
    });

    it("should state the user isn't authorized if no principalId is given", function () {
      event.principalId = "";
      index.handler(event, context, (error, data) => {
        expect(error).to.include('{"errorType":"Unauthorized","message":"User is not authorized to access this service|Authorization Incomplete"}');
      });
    });

    it("should state the user isn't authorized if principalId given is not same as admin id", function () {
      event.principalId = "foo@foo.com";
      index.handler(event, context, (error, data) => {
        expect(error).to.include('{"errorType":"Unauthorized","message":"This user is not authorized to access this service.');
      });
    });
  });

  describe('getConfiguration', () => {
    it("should indicate error while get admin config", () => {
      let err = {
        "errorType": "BadRequest",
        "message": "Invalid table name"
      }
      AWS.mock("DynamoDB", "scan", (params, cb) => {
        return cb(err, null);
      });

      index.getConfiguration()
        .catch(error => {
          expect(error.message).to.be.eq(err.message);
          AWS.restore("DynamoDB");
        });
    });

    it("should successfully get admin config on request", () => {
      let configs = {
        "Items": [{
          "AWS": {
            "M": {
              "ACCOUNTID": { "S": "xyz" },
              "API": {
                "M": {
                  "DEV": { "S": "xyz" },
                  "PROD": { "S": "xyz" },
                  "STG": { "S": "xyz" }
                }
              }
            }
          }
        }]
      };
      let responseObj = {
        statusCode: 200,
        body: {
          "AWS": {
            "ACCOUNTID": "xyz",
            "API": {
              "DEV": "xyz",
              "PROD": "xyz",
              "STG": "xyz"
            }
          }
        }
      };
      AWS.mock("DynamoDB", "scan", (params, cb) => {
        return cb(null, configs);
      });
      index.getConfiguration()
        .then(res => {
          expect(res).to.deep.eq(responseObj.body);
          AWS.restore("DynamoDB");
        });
    });
  });

  describe('addConfiguration', () => {
    let configs, input;
    beforeEach(function () {
      configs = {
        "AWS": {
          "ACCOUNTID": "xyz",
          "API": {
            "DEV": "xyz",
            "PROD": "xyz",
            "STG": "xyz"
          }
        }
      }
      input = {
        "ABC.abc": {
          "hdjshkjs": "sdhj"
        }
      }
    });

    it("should indicate error while adding admin config", () => {
      let err = {
        "errorType": "BadRequest",
        "message": "Invalid table name"
      }
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });

      index.addConfiguration(configs, input)
        .catch(error => {
          expect(error.message).to.be.eq(err.message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should return correct json on adding admin configuration", () => {
      let body = { "ABC.test": "newtest", "INST_PRE": "TESTCRED", "LIST": { "newItem": "newvalue" } };
      let data = {
        CRED_ID: "jazzaws",
        INST_PRE: "jazzsw",
        LIST: [{ item1: "Abc" }, { item2: "xyz" }],
        ABC: { test: "Abc", test23: "xyz" }
      }
      let resp = { "message": "success" }

      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        expect(params.Item.ABC.test).to.be.eql("newtest");
        expect(params.Item.INST_PRE).to.be.eql("TESTCRED");
        expect(params.Item.LIST.length).to.be.eql(3);
        return cb(null, resp);
      });

      index.addConfiguration(data, body)
        .then(res => {
          expect(res.message).to.deep.eq(resp.message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should successfully add admin config on request", () => {
      let responseObj = {
        "message": "success"
      };
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(null, responseObj);
      });
      index.addConfiguration(configs, input)
        .then(res => {
          expect(res).to.deep.eq(responseObj);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });
  });

  describe('deleteConfiguration', () => {
    let configs, input;
    beforeEach(function () {
      configs = {
        "AWS": {
          "ACCOUNTID": "xyz",
          "API": {
            "DEV": "xyz",
            "PROD": "xyz",
            "STG": "xyz"
          }
        }
      }
      input = ["ABC.abc"]
    });

    it("should indicate error while deleting admin config", () => {
      let err = {
        "errorType": "BadRequest",
        "message": "Invalid table name"
      }
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });

      index.deleteConfiguration(configs, input)
        .catch(error => {
          expect(error.message).to.be.eq(err.message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should successfully deleting admin config on request", () => {
      let responseObj = {
        "message": "success"
      };
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(null, responseObj);
      });
      index.deleteConfiguration(configs, input)
        .then(res => {
          expect(res).to.deep.eq(responseObj);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should return correct json on DELETE while giving valid input", () => {
      let input = ["ABC.test", "INST_PRE"];
      let configs = {
        CRED_ID: "jazzaws",
        INST_PRE: "jazzsw",
        ABC: { test: "Abc", test23: "xyz" }
      }
      let resp = { "message": "success" }

      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        expect(params.Item.ABC.test).to.be.eql(undefined);
        expect(params.Item.INST_PRE).to.be.eql(undefined);
        return cb(null, resp);
      });

      index.deleteConfiguration(configs, input)
        .then(res => {
          expect(res.message).to.deep.eq(resp.message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });
  });

  describe('handler', () => {
    beforeEach(function () {
      event = {
        "stage": "test",
        "method": "GET",
        "principalId": "test@test.com",
        "body": {}
      };

      config = configObj.getConfig(event, context);
      context = awsContext();
    });

    it("should indicate internal server error when admin configuration is not fetched", () => {
      let responseObj = {
        statusCode: 500,
        body: {
          data: {},
          message: "Failed to load admin configuration"
        }
      };
      const getConfiguration = sinon.stub(index, "getConfiguration").rejects(responseObj.body.message)
      index.handler(event, context, (err, res) => {
        expect(err).to.include(responseObj.body.message);
        sinon.assert.calledOnce(getConfiguration);
        getConfiguration.restore();
      });
    });

    it("should return admin configuration as response on success", () => {
      let responseObj = {
        body: {
          "CRED_ID": "jazzaws",
          "INST_PRE": "jazzsw"
        }
      };
      const getConfiguration = sinon.stub(index, "getConfiguration").resolves(responseObj.body);
      index.handler(event, context, (err, res) => {
        expect(res.data.config).to.deep.eq(responseObj.body);
        sinon.assert.calledOnce(getConfiguration);
        getConfiguration.restore();
      });
    });

    it("should return invalid input error when giving empty event.body on POST", () => {
      event = {
        "stage": "test",
        "method": "POST",
        "principalId": "test@test.com"
      };
      index.handler(event, context, (err, res) => {
        expect(err).to.include('{"errorType":"BadRequest","message":"Input cannot be empty"}');
      });
    });

    it("should return success response on POST while giving valid input", () => {
      event.method = "POST";
      event.body = {
        "ABC.abc": {
          "hdjshkjs": "sdhj"
        }
      };

      let res = { "message": "success" }
      let configs = {
        "CRED_ID": "jazzaws",
        "INST_PRE": "jazzsw"
      }
      const getConfiguration = sinon.stub(index, "getConfiguration").resolves(configs);
      const addConfiguration = sinon.stub(index, "addConfiguration").resolves(res);
      index.handler(event, context, (err, res) => {
        expect(res.message).to.deep.eq(res.message);
        sinon.assert.calledOnce(getConfiguration);
        sinon.assert.calledOnce(addConfiguration);
        getConfiguration.restore();
        addConfiguration.restore();
      });
    });

    it("should indicate internal server error when get configuration fails while adding", () => {
      let responseObj = {
        statusCode: 500,
        body: {
          data: {},
          message: "Failed to add admin configuration."
        }
      };

      event.method = "POST";
      event.body = {
        "ABC.abc": {
          "hdjshkjs": "sdhj"
        }
      };

      const getConfiguration = sinon.stub(index, "getConfiguration").rejects(responseObj.body.message);
      index.handler(event, context, (err, res) => {
        expect(err).to.include(responseObj.body.message);
        sinon.assert.calledOnce(getConfiguration);
        getConfiguration.restore();
      });
    });

    it("should indicate internal server error when admin configuration is not added", () => {
      let responseObj = {
        statusCode: 500,
        body: {
          data: {},
          message: "Failed to add admin configuration."
        }
      };

      event.method = "POST";
      event.body = {
        "ABC.abc": {
          "hdjshkjs": "sdhj"
        }
      };

      let configs = {
        "CRED_ID": "jazzaws",
        "INST_PRE": "jazzsw"
      }
      const getConfiguration = sinon.stub(index, "getConfiguration").resolves(configs);
      const addConfiguration = sinon.stub(index, "addConfiguration").rejects(responseObj.body.message);
      index.handler(event, context, (err, res) => {
        expect(err).to.include(responseObj.body.message);
        sinon.assert.calledOnce(getConfiguration);
        sinon.assert.calledOnce(addConfiguration);
        getConfiguration.restore();
        addConfiguration.restore();
      });
    });

    it("should return invalid input error when giving empty event.body on DELETE", () => {
      event = {
        "stage": "test",
        "method": "DELETE",
        "principalId": "test@test.com"
      };
      index.handler(event, context, (err, res) => {
        expect(err).to.include('{\"errorType\":\"BadRequest\",\"message\":\"Input cannot be empty. Please give list of keys to be deleted.\"}');
      });
    });

    it("should return invalid input error when giving invalid type of event.body on DELETE", () => {
      event = {
        "stage": "test",
        "method": "DELETE",
        "principalId": "test@test.com",
        "body": { "test": "aa" }
      };
      index.handler(event, context, (err, res) => {
        expect(err).to.include('{\"errorType\":\"BadRequest\",\"message\":\"Please give list of keys to be deleted.\"}');
      });

    });

    it("should return success response on DELETE while giving valid input", () => {
      event.method = "DELETE";
      event.body = ["ABC.abc"];

      let res = { "message": "success" }
      let configs = {
        "CRED_ID": "jazzaws",
        "INST_PRE": "jazzsw"
      }
      const getConfiguration = sinon.stub(index, "getConfiguration").resolves(configs);
      const deleteConfiguration = sinon.stub(index, "deleteConfiguration").resolves(res);
      index.handler(event, context, (err, res) => {
        expect(res.message).to.deep.eq(res.message);
        sinon.assert.calledOnce(getConfiguration);
        sinon.assert.calledOnce(deleteConfiguration);
        getConfiguration.restore();
        deleteConfiguration.restore();
      });
    });

    it("should indicate internal server error when get configuration fails while deleting", () => {
      let responseObj = {
        statusCode: 500,
        body: {
          data: {},
          message: "Failed to delete the specified admin configuration."
        }
      };
      event.method = "DELETE";
      event.body = ["ABC.abc"];

      const getConfiguration = sinon.stub(index, "getConfiguration").rejects(responseObj.body.message);
      index.handler(event, context, (err, res) => {
        expect(err).to.include(responseObj.body.message);
        sinon.assert.calledOnce(getConfiguration);
        getConfiguration.restore();
      });
    });

    it("should indicate internal server error when admin configuration is not deleted", () => {
      let responseObj = {
        statusCode: 500,
        body: {
          data: {},
          message: "Failed to delete the specified admin configuration."
        }
      };

      event.method = "DELETE";
      event.body = ["ABC.abc"];

      let configs = {
        "CRED_ID": "jazzaws",
        "INST_PRE": "jazzsw"
      }

      const getConfiguration = sinon.stub(index, "getConfiguration").resolves(configs);
      const deleteConfiguration = sinon.stub(index, "deleteConfiguration").rejects(responseObj.body.message);
      index.handler(event, context, (err, res) => {
        expect(err).to.include(responseObj.body.message);
        sinon.assert.calledOnce(getConfiguration);
        sinon.assert.calledOnce(deleteConfiguration);
        getConfiguration.restore();
        deleteConfiguration.restore();
      });
    });

  });
});
