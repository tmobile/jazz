const chai = require('chai');
const assert = require('chai').assert;
const expect = require('chai').expect;
const should = require('chai').should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const awsContext = require('aws-lambda-mock-context');
const AWS = require("aws-sdk-mock");
const request = require('request');
const sinon = require('sinon');

const index = require('../index');
const logger = require("../components/logger.js");
const configObj = require('../components/config.js');
const crud = require('../components/crud')();
const errorHandler = require("../components/error-handler.js")();
const validateutils = require("../components/validation.js");
const global_config = require("../config/global-config.json");

describe('jazz_assets', function () {
  var tableName, global, spy, stub, err, errMessage, errType, dataObj, event, context, callback, callbackObj, logMessage, logStub, indexName, responseObj;

  beforeEach(function () {
    spy = sinon.spy();
    event = {
      "stage": "test",
      "method": "",
      "path": {
        "id": "k!ngd0m_0f_mewni"
      },
      "body": {
        "environment": "stg",
        "service": "test2",
        "created_by": "zaqwsxcderfv",
        "status": "active",
        "provider": "aws",
        "provider_id": "arn:aws:execute-api:example",
        "tags": ["check"],
        "domain": "jazztest",
        "type": "apigateway"
      }
    };
    context = awsContext();
    callback = (err, responseObj) => {
      if (err) {
        return err;
      } else {
        return JSON.stringify(responseObj);
      }
    };
    err = {
      "errorType": "svtfoe",
      "message": "starco"
    };
    callbackObj = {
      "callback": callback
    };
    config = configObj(event);
    assetTable = config.ASSETS_TABLE;
    global = {
      "config": config,
      "global_config": global_config,
      "ASSETS_TABLE": config.ASSETS_TABLE
    }
  });

  describe('validation tests', () => {
    it("should validate create payload", () => {
      dataObj = {
        Items: []
      }
      AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
        return cb(null, dataObj);
      });
      var validateCreatePayload = validateutils.validateCreatePayload(event.body, assetTable)
        .then(res => {
          expect(res).to.include({
            result: 'success',
            message: 'Valid asset field combination'
          });
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should indicate empty input error while validating create payload", () => {
      var validateCreatePayload = validateutils.validateCreatePayload({}, assetTable)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Input asset data cannot be empty'
          })
        });
    });

    it("should indicate invalid input error while validating create payload", () => {
      var payload = Object.assign({}, event.body);
      payload.invalidKey = "invalid";
      var validateCreatePayload = validateutils.validateCreatePayload(payload, assetTable)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Following fields are invalid: invalidkey. '
          });
        });
    });

    it("should indicate that required input is missing while validating create payload", () => {
      const required_field = global.global_config.ASSETS_CREATION_REQUIRED_FIELDS;
      required_field.forEach(key => {
        const payload = Object.assign({}, event.body);
        const deleted_field = key;
        delete payload[key]
        var validateCreatePayload = validateutils.validateCreatePayload(payload, assetTable)
          .catch(error => {
            expect(error).to.include({
              result: 'inputError',
              message: 'Following field(s) are required - ' + deleted_field
            });
          });
      });
    });

    it("should indicate invalid input data type error while validating create payload", () => {
      var payload = Object.assign({}, event.body);
      payload.tags = "invalid";
      payload.type = ["invalidArray"]
      var validateCreatePayload = validateutils.validateCreatePayload(payload, assetTable)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: "The following field's value/type is not valid - tags, type"
          });
        });
    });

    it("should indicate invalid status and type value while validating create payload", () => {
      var payload = Object.assign({}, event.body);
      payload.status = "invalidStatus";
      payload.type = "invalidType"
      var validateCreatePayload = validateutils.validateCreatePayload(payload, assetTable)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: "The following field's value are not valid - status, type"
          });
        });
    });

    it("should indicate asset exist message while validating create payload", () => {
      dataObj = {
        Items: [event.body]
      }
      AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
        return cb(null, dataObj);
      });
      var validateCreatePayload = validateutils.validateCreatePayload(event.body, assetTable)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Asset with given data already exists.'
          });
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should indicate dynamoDB error while validating create payload if DynamoDB.DocumentClient.query() fails", () => {
      AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
        return cb(err, null);
      });
      var validateCreatePayload = validateutils.validateCreatePayload(event.body, assetTable)
        .catch(error => {
          expect(error).to.include(err);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should validate update payload", () => {
      var update_data = {
        status: 'deleted',
        tags: ['tag1']
      }
      dataObj = {
        Items: [event.body]
      }
      AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
        return cb(null, dataObj);
      });
      var validateUpdatePayload = validateutils.validateUpdatePayload(event.path.id, update_data, assetTable)
        .then(res => {
          expect(res).to.include({
            result: 'success'
          });
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should indicate dynamoDB error while validating update payload if DynamoDB.DocumentClient.query() fails", () => {
      var update_data = {
        status: 'deleted',
        tags: ['tag1']
      }
      AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
        return cb(err, null);
      });
      var validateUpdatePayload = validateutils.validateUpdatePayload(event.path.id, update_data, assetTable)
        .catch(error => {
          expect(error).to.include(err);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should validate search payload", () => {
      var validateSearchPayload = validateutils.validateSearchPayload(event.body)
        .then(res => {
          expect(res).to.include({
            result: 'success'
          });
        });
    });

    it("should indicate empty field error value while validating create payload", () => {
      var payload = Object.assign({}, event.body);
      payload.provider = "";
      var validateSearchPayload = validateutils.validateSearchPayload(payload, assetTable)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError',
            message: 'Following fields do not have a valid value - provider'
          });
        });
    });

  });

  describe('genericInputValidation', () => {
    it('should indicate method is missing/empty', () => {
      errMessage = "method cannot be empty";
      var invalidArray = ["", null, undefined];
      for (var i in invalidArray) {
        event.method = invalidArray[i];
        index.genericInputValidation(event)
          .catch(error => expect(error).to.include({
            result: "inputError",
            message: errMessage
          }));
      }
    });

    it('should indicate asset id is missing for GET and PUT', () => {
      errMessage = "Missing input parameter asset id";
      var methods = ["GET", "PUT"];
      event.path.id = "";
      for (var i in methods) {
        event.method = methods[i];
        index.genericInputValidation(event)
          .catch(error => expect(error).to.include({
            result: "inputError",
            message: errMessage
          }));
      }
    });

    it('should indicate asset update data is missing for PUT', () => {
      errMessage = "Asset data is required for updating an asset";
      event.method = "PUT";
      event.body = {};
      index.genericInputValidation(event)
        .catch(error => expect(error).to.include({
          result: "inputError",
          message: errMessage
        }))
    });

    it('should indicate asset create data is missing for POST', () => {
      errMessage = "Asset details are required for creating an asset";
      event.method = "POST";
      event.path = {};
      event.body = {};
      index.genericInputValidation(event)
        .catch(error => expect(error).to.include({
          result: "inputError",
          message: errMessage
        }))
    });

    it('should indicate search is not supported for POST if search path is missing', () => {
      errMessage = "Parameters are not supported for asset search";
      event.method = "POST";
      event.path.id = "";
      event.body = {};
      index.genericInputValidation(event)
        .catch(error => expect(error).to.include({
          result: "inputError",
          message: errMessage
        }))
    });

  });

  describe('updateAssetsData', () => {
    it("should successfully update assets data in dynamoDB", () => {
      var resObj = {
        Attributes: event.body
      }
      AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
        return cb(null, resObj);
      });
      index.updateAssetsData(event.path.id, event.body, assetTable)
        .then(res => {
          expect(res).to.have.property('data')
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should indicate error while updating assets data if DynamoDB.DocumentClient.update() fails", () => {

      AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
        return cb(err, null);
      });
      index.updateAssetsData(event.path.id, event.body, assetTable)
        .catch(error => {
          expect(error).to.include(err);
          AWS.restore("DynamoDB.DocumentClient");
        })
    });

    it("should indicate input error if update data is null", () => {
      index.updateAssetsData(event.path.id, {}, assetTable)
        .catch(error => {
          expect(error).to.include({
            result: 'inputError'
          });
        })
    });

    it("should indicate error if update data is non editable", () => {
      var update_data = {
        service: "invalid"
      };
      AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
        return cb(null, resObj);
      });
      index.updateAssetsData(event.path.id, update_data, assetTable)
        .then(res => expect(res).to.be.null)
        .catch(error => expect(error).to.be.null)
      AWS.restore("DynamoDB.DocumentClient");
    });

  });

  describe('createNewAsset', () => {
    it("should successfully create new Asset", () => {
      var resObj = {
        Items: [event.body]
      }
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(null, resObj);
      });
      index.createNewAsset(event.body)
        .then(res => {
          expect(res).to.have.property('assets_id')
          AWS.restore("DynamoDB.DocumentClient")
        });
    });

    it("should indicate error while creating new Asset if DynamoDB.DocumentClient.put() fails", () => {
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });
      index.createNewAsset(event.body)
        .catch(error => {
          expect(error).to.include({
            result: "databaseError"
          })
          AWS.restore("DynamoDB.DocumentClient")
        });
    });

  });

  describe('postSearch', () => {
    it("should successfully search provided asset", () => {
      dataObj = {
        Items: [event.body]
      }
      AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
        return cb(null, dataObj);
      });
      index.postSearch(event.body, assetTable)
        .then(res => {
          expect(res).to.include(event.body)
          AWS.restore("DynamoDB.DocumentClient")
        });
    });

    it("should indicate error if pDynamoDB.DocumentClient.query fails", () => {
      AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
        return cb(err, null);
      });
      index.postSearch(event.body, assetTable)
        .catch(error => {
          expect(error).to.include(err)
          AWS.restore("DynamoDB.DocumentClient")
        })
    });

  });

  describe('processAssetData', () => {
    it("should successfully get asset using asset_id", () => {
      dataObj = {
        Items: [event.body]
      }
      AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
        return cb(null, dataObj);
      });
      index.processAssetData(event.path.id, assetTable)
        .then(res => {
          expect(res).to.include(event.body)
          AWS.restore("DynamoDB.DocumentClient");
        })
    });

    it("should indicate not found error while fetching asset using asset_id if it doesn't exist", () => {
      dataObj = {
        Items: []
      }
      AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
        return cb(null, dataObj);
      });
      index.processAssetData(event.path.id, assetTable)
        .catch(error => {
          expect(error).to.include({
            result: "notFoundError"
          })
          AWS.restore("DynamoDB.DocumentClient");
        })
    });

    it("should indicate error while fetching asset using asset_id if DynamoDB.DocumentClient.get() fails", () => {
      AWS.mock("DynamoDB.DocumentClient", "get", (params, cb) => {
        return cb(err, null);
      });
      index.processAssetData(event.path.id, assetTable)
        .catch(error => {
          expect(error).to.include(err)
          AWS.restore("DynamoDB.DocumentClient");
        })
    });

  });

  describe('processAssetsUpdate', () => {
    it("should successfully process update data", () => {
      var update_data = {
        status: "active"
      };
      var resObj = {
        data: event.body,
        input: update_data
      }
      const validateUpdatePayload = sinon.stub(validateutils, "validateUpdatePayload").resolves(update_data);
      const updateAssetsData = sinon.stub(index, "updateAssetsData").resolves(resObj);
      index.processAssetsUpdate(event.path.id, update_data, assetTable)
        .then(res => {
          expect(res).to.include(resObj);
          sinon.assert.calledOnce(validateUpdatePayload);
          sinon.assert.calledOnce(updateAssetsData);
          validateUpdatePayload.restore();
          updateAssetsData.restore();
        });
    });

    it("should indicate error while processing update data", () => {
      var update_data = {
        status: "invalid"
      };
      const validateUpdatePayload = sinon.stub(validateutils, "validateUpdatePayload").resolves(update_data);
      const updateAssetsData = sinon.stub(index, "updateAssetsData").rejects(err);
      index.processAssetsUpdate(event.path.id, update_data, assetTable)
        .catch(error => {
          expect(error).to.include(err);
          sinon.assert.calledOnce(validateUpdatePayload);
          sinon.assert.calledOnce(updateAssetsData);
          validateUpdatePayload.restore();
          updateAssetsData.restore();
        });
    });

  });

  describe('processAssetCreation', () => {
    it("should successfully process asset creation", () => {
      var resObj = {
        asset_id: "12345"
      };
      const validateCreatePayload = sinon.stub(validateutils, "validateCreatePayload").resolves(event.body);
      const createNewAsset = sinon.stub(index, "createNewAsset").resolves(resObj);
      index.processAssetCreation(event.body, assetTable)
        .then(res => {
          expect(res).to.include(resObj);
          sinon.assert.calledOnce(validateCreatePayload);
          sinon.assert.calledOnce(createNewAsset);
          validateCreatePayload.restore();
          createNewAsset.restore();
        });
    });

    it("should indicate error while processing asset creation", () => {
      const validateCreatePayload = sinon.stub(validateutils, "validateCreatePayload").resolves(event.body);
      const createNewAsset = sinon.stub(index, "createNewAsset").rejects(err);
      index.processAssetCreation(event.body, assetTable)
        .catch(error => {
          expect(error).to.include(err);
          sinon.assert.calledOnce(validateCreatePayload);
          sinon.assert.calledOnce(createNewAsset);
          validateCreatePayload.restore();
          createNewAsset.restore();
        });
    });
  });

  describe('processAssetSearch', () => {
    it("should successfuly process asset serach", () => {
      var input_data = {
        service: event.body.service,
        domain: event.body.domain,
        environment: event.body.environment
      }
      var resObj = {
        data: event.body,
        input: input_data
      };
      const validateSearchPayload = sinon.stub(validateutils, "validateSearchPayload").resolves(event.body);
      const postSearch = sinon.stub(index, "postSearch").resolves(resObj);
      index.processAssetSearch(event.query, assetTable)
        .then(res => {
          expect(res).to.include(resObj);
          sinon.assert.calledOnce(validateSearchPayload);
          sinon.assert.calledOnce(postSearch);
          validateSearchPayload.restore();
          postSearch.restore();
        });
    });

    it("should indicate error while processing asset serach", () => {
      const validateSearchPayload = sinon.stub(validateutils, "validateSearchPayload").resolves(event.body);
      const postSearch = sinon.stub(index, "postSearch").rejects(err);
      index.processAssetSearch(event.query, assetTable)
        .catch(error => {
          expect(error).to.include(err);
          sinon.assert.calledOnce(validateSearchPayload);
          sinon.assert.calledOnce(postSearch);
          validateSearchPayload.restore();
          postSearch.restore();
        });
    });

  });

  describe('handler', () => {
    describe('handler with rejected genericInputValidation', () => {
      it("should indicate BadRequest error in genericInputValidation if method is undefined", () => {
        const genericInputValidation = sinon.stub(index, "genericInputValidation").rejects({
          result: "inputError",
          message: "method cannot be empty"
        });
        index.handler(event, context, (error, data) => {
          expect(error).to.include('{"errorType":"BadRequest","message":"method cannot be empty"}');
          sinon.assert.calledOnce(genericInputValidation);
        });
        genericInputValidation.restore();
      });

      it("should indicate internal server error", () => {
        var resObj = '{"errorType":"InternalServerError","message":"Unexpected Server Error"}';
        const genericInputValidation = sinon.stub(index, "genericInputValidation");
        index.handler(event, context,(error, data) => {
          console.log(error)
          expect(error).to.be.eq(resObj);
          sinon.assert.calledOnce(genericInputValidation);
          genericInputValidation.restore();
        });
      });

    });

    describe('handler with resolved genericInputValidation', () => {
      let genericInputValidation;
      beforeEach(() => {
        genericInputValidation = sinon.stub(index, "genericInputValidation").resolves();
      });

      afterEach(() => {
        genericInputValidation.restore();
      });

      it("should indicate not found error for invalid request", () => {
        var resObj = '{"errorType":"NotFound","message":"Requested Asset not found"}'
        event.method = "GET";
        event.path.id = undefined;
        index.handler(event, context, (error, data) => {
          expect(error).to.be.eq(resObj);
          sinon.assert.calledOnce(genericInputValidation);
        })
      })

      describe('GET method', () => {
        beforeEach(() => {
          event.method = "GET";
        });

        it("should successfully get asset by id", () => {
          const processAssetData = sinon.stub(index, "processAssetData").resolves(event.body)
          index.handler(event, context, (error, data) => {
            expect(data).to.include({data: event.body,})
            sinon.assert.calledOnce(genericInputValidation);
            sinon.assert.calledOnce(processAssetData);
            processAssetData.restore();
          });
        });
  
        it("should indicate internal server error while fetching asset by id", () => {
          var resObj = '{"errorType":"InternalServerError","message":"unexpected error occured"}'
          const processAssetData = sinon.stub(index, "processAssetData").rejects(err)
          index.handler(event, context, (error, data) => {
            expect(error).to.be.eq(resObj)
            sinon.assert.calledOnce(genericInputValidation);
            sinon.assert.calledOnce(processAssetData);
            processAssetData.restore();
          });
        });

        it("should indicate not found error while fetching asset by id", () => {
          var resObj = '{"errorType":"NotFound","message":"Invalid asset with id: '+event.path.id+'"}'
          const processAssetData = sinon.stub(index, "processAssetData").rejects({
            "result": "notFoundError",
            "message": 'Invalid asset with id: ' + event.path.id
          });
          index.handler(event, context, (error, data) => {
            expect(error).to.be.eq(resObj);
            sinon.assert.calledOnce(genericInputValidation);
            sinon.assert.calledOnce(processAssetData);
            processAssetData.restore();
          });
        });
  
      });

      describe('create new asset using POST method', () => {
        beforeEach(() => {
          event.method = "POST";
          event.path.id = undefined;
        });

        it("should successfully create new asset", () => {
          var resObj = { asset_id: '12345' }
          const processAssetCreation = sinon.stub(index, "processAssetCreation").resolves(resObj);
          index.handler(event, context, (error, data) => {
            expect(data).to.have.deep.property("data.asset_id");
            sinon.assert.calledOnce(processAssetCreation);
            processAssetCreation.restore();
          });
        });

        it("should indicate internal server error while creating new asset", () => {
          var resObj = '{"errorType":"InternalServerError","message":"unexpected error occured"}'
          const processAssetCreation = sinon.stub(index, "processAssetCreation").rejects(err);
          index.handler(event, context, (error, data) => {
            expect(error).to.be.eq(resObj);
            sinon.assert.calledOnce(processAssetCreation);
            processAssetCreation.restore();
          });
        });

        it("should indicate internal server error while creating new asset", () => {
          var resObj = '{"errorType":"InternalServerError","message":"Error adding Item to dynamodb '+err.message+'"}'
          const processAssetCreation = sinon.stub(index, "processAssetCreation").rejects({
            "result": "databaseError",
            "message": "Error adding Item to dynamodb " + err.message
          });
          index.handler(event, context, (error, data) => {
            expect(error).to.be.eq(resObj);
            sinon.assert.calledOnce(processAssetCreation);
            processAssetCreation.restore();
          });
        });

        it("should indicate BadRequest/empty payload error while creating new asset", () => {
          var resObj = '{"errorType":"BadRequest","message":"Input asset data cannot be empty"}'
          event.body = {};
          const processAssetCreation = sinon.stub(index, "processAssetCreation").rejects({
            "result": "inputError",
            "message": "Input asset data cannot be empty"
          });
          index.handler(event, context, (error, data) => {
            expect(error).to.be.eq(resObj);
            sinon.assert.calledOnce(processAssetCreation);
            processAssetCreation.restore();
          });
        });

      });

      describe('asset search using POST method', () => {
        beforeEach(() => {
          event.method = "POST";
          event.path.id = "search"
        });

        it("should successfully search provided asset", () => {
          const processAssetSearch = sinon.stub(index, "processAssetSearch").resolves(event.body);
          index.handler(event, context, (error, data) => {
            expect(data).to.have.property("data");
            sinon.assert.calledOnce(processAssetSearch);
            processAssetSearch.restore();
          });
        });

        it("should indicate internal server error while searching for provided asset", () => {
          var resObj = '{"errorType":"InternalServerError","message":"unexpected error occured"}';
          const processAssetSearch = sinon.stub(index, "processAssetSearch").rejects(err);
          index.handler(event, context, (error, data) => {
            expect(error).to.be.eq(resObj);
            sinon.assert.calledOnce(processAssetSearch);
            processAssetSearch.restore();
          });
        });

      });

      describe('Update asset using PUT method', () => {
        beforeEach(() => {
          event.method = "PUT";
        });

        it("should successfully update asset data", () => {
          var update_data = {
            status: "active"
          };
          var resObj = {
            data: event.body,
            input: update_data
          }
          const processAssetsUpdate = sinon.stub(index, "processAssetsUpdate").resolves(resObj);
          index.handler(event, context, (error, data) => {
            expect(data).to.include(resObj);
            sinon.assert.calledOnce(processAssetsUpdate);
            processAssetsUpdate.restore();
          });
        });

        it("should indicate internal server error while updating asset data", () => {
          var resObj = '{"errorType":"InternalServerError","message":"unexpected error occured"}';
          const processAssetsUpdate = sinon.stub(index, "processAssetsUpdate").rejects(err);
          index.handler(event, context, (error, data) => {
            expect(error).to.be.eq(resObj);
            sinon.assert.calledOnce(processAssetsUpdate);
            processAssetsUpdate.restore();
          });
        });

      })
    });
    
  })

});