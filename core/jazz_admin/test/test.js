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

  describe('validateQueryInput', () => {
    it("should indicate error if path is not specified in the query", function () {
      event = {
        method: "POST",
        principalId: "foo@foo.com",
        query: {}
      }
      index.validateQueryInput(event)
        .catch(error => {
          expect(error.message).to.be.eq("Json path is not provided in query.");
        });
    });

    it("should indicate error if id is not specified in the query", function () {
      event = {
        method: "POST",
        principalId: "foo@foo.com",
        query: { path: "NewPath" }
      }
      index.validateQueryInput(event)
        .catch(error => {
          expect(error.message).to.be.eq("Unique id is not provided in query.");
        });
    });

    it("should indicate error if value is not specified in the query", function () {
      event = {
        method: "POST",
        principalId: "foo@foo.com",
        query: { path: "NewPath", id: "testid" }
      }
      index.validateQueryInput(event)
        .catch(error => {
          expect(error.message).to.be.eq("Unique value is not provided in query.");
        });
    });

    it("should return success if query has all required values", function () {
      event = {
        method: "POST",
        principalId: "foo@foo.com",
        query: { path: "NewPath", id: "testid", value: "test value" }
      }
      index.validateQueryInput(event)
        .then(res => {
          expect(res.result).to.be.eq("success");
        });
    });

  });

  describe('validateInputForDelete', () => {
    it("should indicate error if event does not have body if it is not having query", function () {
      event = {
        method: "DELETE",
        principalId: "foo@foo.com"
      }
      index.validateInputForDelete(event)
        .catch(error => {
          expect(error.message).to.be.eq("Input cannot be empty. Please give list of keys to be deleted.");
        });
    });

    it("should indicate error if body is not an array if it is not having query", function () {
      event = {
        method: "DELETE",
        principalId: "foo@foo.com",
        body: { test: "foo" }
      }
      index.validateInputForDelete(event)
        .catch(error => {
          expect(error.message).to.be.eq("Please give list of keys to be deleted.");
        });
    });

    it("should return success if body has list of keys to be deleted if it is not having query", function () {
      event = {
        principalId: "foo@foo.com",
        body: [{ path: "NewPath", id: "testid", value: "test value" }]
      }
      index.validateInputForDelete(event)
        .then(res => {
          expect(res.result).to.be.eq("success");
        });
    });

     it("should return error if query does not have valid data for 2nd level deletion", function () {
      event = {
        principalId: "foo@foo.com",
        query: { path: "NewPath#new", id: "testid#id", value: "test value" }
      }
      index.validateInputForDelete(event)
        .catch(err => {
          expect(err.message).to.be.eq("Please give the correct mapping in query");
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
    let configs, event;
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
      event = {
        body: {
          "ABC.abc": {
            "hdjshkjs": "sdhj"
          }
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

      index.addConfiguration(configs, event)
        .catch(error => {
          expect(error.message).to.be.eq(err.message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should return correct json on adding admin configuration", () => {
      let input = { body: { "ABC.test": "newtest", "INST_PRE": "TESTCRED", "LIST": { "newItem": "newvalue" } } };
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

      index.addConfiguration(data, input)
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
      index.addConfiguration(configs, event)
        .then(res => {
          expect(res).to.deep.eq(responseObj);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should return correct json on list iteration while adding admin configuration", () => {
      let event = {
        query: {
          id: "TESTID",
          path: "TEST.TESTLIST",
          value: "1234"
        },
        body:
        {
          "ABC": {
            "test_ABC": "123",
            "new_test": "aaa"
          },
          "TLIST": {
            "newentry": "newEntry"
          },
          "C_ID": "abc@123"
        }
      };

      let data = {
        CRED_ID: "jazzaws",
        INST_PRE: "jazzsw",
        TEST: { test: "Abc", test23: "xyz", TESTLIST: [{ TESTID: "1234", ABC: { test_ABC: "xyz" }, TLIST: [{ "newItem": "newvalue" }] }, { TESTID: "xyz" }], }
      }
      let resp = { "message": "success" }

      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        const filter = params.Item.TEST.TESTLIST.filter(obj => obj.TESTID === '1234');
        expect(filter[0].ABC.test_ABC).to.be.eql("123");
        expect(filter[0].ABC).haveOwnProperty('new_test');
        expect(filter[0]).haveOwnProperty('C_ID');
        expect(filter[0].C_ID).to.be.eql("abc@123");
        expect(filter[0].ABC.new_test).to.be.eql("aaa");
        expect(filter[0].TLIST.length).to.be.eql(2);
        return cb(null, resp);
      });

      index.addConfiguration(data, event)
        .then(res => {
          expect(res.message).to.deep.eq(resp.message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should return error while giving non listable item in query list iteration while adding admin configuration", () => {
      let event = {
        query: {
          id: "TESTID",
          path: "TEST.TESTLIST",
          value: "1234"
        },
        body:
        {
          "ABC": {
            "test_ABC": "123",
            "new_test": "aaa"
          },
          "TLIST": {
            "newentry": "newEntry"
          },
          "C_ID": "abc@123"
        }
      };

      let data = {
        CRED_ID: "jazzaws",
        INST_PRE: "jazzsw",
        TEST: { test: "Abc", test23: "xyz", TESTLIST: { TESTID: "1234", ABC: { test_ABC: "xyz" }, TLIST: [{ "newItem": "newvalue" }] } }
      }
      let resp = { "message": "success" }

      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(null, resp);
      });

      index.addConfiguration(data, event)
        .catch(err => {
          expect(err.message).to.deep.eq("Expecting Array but found Object/String.");
          AWS.restore("DynamoDB.DocumentClient");
        });
    });
  });

  describe('deleteConfiguration', () => {
    let configs, event;
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
      event = { body: ["ABC.abc"] }
    });

    it("should indicate error while deleting admin config", () => {
      let err = {
        "errorType": "BadRequest",
        "message": "Invalid table name"
      }
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });

      index.deleteConfiguration(configs, event)
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
      index.deleteConfiguration(configs, event)
        .then(res => {
          expect(res).to.deep.eq(responseObj);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should return correct json on DELETE while giving valid input", () => {
      let input = { body: ["ABC.test", "INST_PRE"] };
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

    it("should return correct json on list iteration while deleting admin configuration", () => {
      let event = {
        query: {
          id: "TESTID",
          path: "TEST.TESTLIST",
          value: "1234"
        }
      };

      let data = {
        CRED_ID: "jazzaws",
        INST_PRE: "jazzsw",
        TEST: { test: "Abc", test23: "xyz", TESTLIST: [{ TESTID: "1234", ABC: { test_ABC: "xyz" }, TLIST: [{ "newItem": "newvalue" }] }, { TESTID: "xyz" }], }
      }
      let resp = { "message": "success" }

      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        const filter = params.Item.TEST.TESTLIST.filter(obj => obj.TESTID === '1234');
        expect(params.Item.TEST.TESTLIST.length).to.be.eql(1);
        expect(filter.length).to.be.eql(0);
        return cb(null, resp);
      });

      index.deleteConfiguration(data, event)
        .then(res => {
          expect(res.message).to.deep.eq(resp.message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should return correct json on 2 level list iteration while deleting admin configuration", () => {
      let event = {
        query: {
          id: "TESTID#second_id",
          path: "TEST.TESTLIST#TLIST",
          value: "1234#123"
        }
      };

      let data = {
        CRED_ID: "jazzaws",
        INST_PRE: "jazzsw",
        TEST: { test: "Abc", test23: "xyz", TESTLIST: [{ TESTID: "1234", ABC: { test_ABC: "xyz" }, TLIST: [{ newItem: "newvalue", second_id: "123" }, { newItem: "newvalue1", second_id: "12345" }] }, { TESTID: "xyz" }], }
      }
      let resp = { "message": "success" }

      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        const topfilter = params.Item.TEST.TESTLIST.filter(obj => obj.TESTID === '1234');
        const filter = topfilter[0].TLIST.filter(obj => obj.second_id === '123');
        expect(topfilter[0].TLIST.length).to.be.eql(1);
        expect(filter.length).to.be.eql(0);
        return cb(null, resp);
      });

      index.deleteConfiguration(data, event)
        .then(res => {
          expect(res.message).to.deep.eq(resp.message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should return error while giving non listable item in query 2 level list iteration while deleting admin configuration", () => {
      let event = {
        query: {
          id: "TESTID#second_id",
          path: "TEST.TESTLIST#TLIST",
          value: "1234#123"
        }
      };

      let data = {
        CRED_ID: "jazzaws",
        INST_PRE: "jazzsw",
        TEST: { test: "Abc", test23: "xyz", TESTLIST: [{ TESTID: "1234", ABC: { test_ABC: "xyz" }, TLIST: { newItem: "newvalue", second_id: "123" } }, { TESTID: "xyz" }], }
      }

      let resp = { "message": "success" }

      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(null, resp);
      });

      index.deleteConfiguration(data, event)
        .catch(err => {
          expect(err.message).to.deep.eq("Expecting Array but found Object/String.");
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
