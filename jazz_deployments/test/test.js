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

describe('jazz_deployments', function () {
  var tableName, global, spy, stub, err, errMessage, errType, dataObj, event, context, callback, callbackObj, logMessage, logStub, indexName, responseObj;

  beforeEach(function () {
    spy = sinon.spy();
    event = {
      "stage": "test",
      "method": "",
      "path": {
        "id": "k!ngd0m_0f_mewni"
      },
      "query": {
        "service": "mag!c",
        "domain": "k!ngd0m",
        "environment": "test-branch"
      },
      "body": {
        "service_id": "dc1b2f36-49c2-ca59-5c88-2a1b930f5607",
        "request_id": "d33f1d40-dea4-4b59-93e7-5d351146a7e2",
        "service": "mag!c",
        "environment_logical_id": "test-branch",
        "scm_branch": "feature/test",
        "status": "successful",
        "domain": "k!ngd0m",
        "provider_build_url": "http://test/job/build_pack_api/211",
        "provider_build_id": "211",
        "scm_commit_hash": "abc123xyz",
        "scm_url": "http://test/k!ngd0m_mag!c.git"
      },
      "headers": {
        "Authorization": "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
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
    tableName = config.DEPLOYMENT_TABLE;
    global = {
      authorization: event.headers.Authorization
    };

  });

  describe('genericInputValidation', () => {
    it("should indicate that method is missing/empty", () => {
      errType = "BadRequest";
      errMessage = "method cannot be empty";
      var invalidArray = ["", null, undefined];
      var genericInputValidation;
      for (i in invalidArray) {
        event.method = invalidArray[0];
        genericInputValidation = index.genericInputValidation(event);
        expect(genericInputValidation.then((res) => {
          return res;
        })).to.be.rejectedWith(errMessage)
      };
    });
  
    it("should indicate that query params and path params are missing for GET method", () => {
      event.path = "";
      event.query = "";
      event.method = "GET";
      errType = "BadRequest";
      errMessage = "GET API can be called only with following query params: domain, service and environment OR GET API can be called only with deployment_id as path param.";
      var genericInputValidation = index.genericInputValidation(event);
      expect(genericInputValidation.then((res) => {
        return res;
      })).to.be.rejectedWith(errMessage)
    });
  
    it("should indicate error if deployment_id is unavailable for GET, PUT and DELETE methods", () => {
      errType = "BadRequest";
      errMessage = "Missing input parameter deployment id";
      event.path.id = "";
      var methods = ["GET", "PUT", "DELETE"];
      var genericInputValidation;
      for (method in methods) {
        event.method = methods[method];
        genericInputValidation = index.genericInputValidation(event);
        expect(genericInputValidation.then((res) => {
          return res;
        })).to.be.rejectedWith(errMessage)
      }
    });
  
    it("should indicate error if update data is not unavailable for PUT method", () => {
      errType = "BadRequest";
      errMessage = "Deployment data is required for updating a deployment";
      event.body = {};
      event.method = "PUT";
      var genericInputValidation = index.genericInputValidation(event);
      expect(genericInputValidation.then((res) => {
        return res;
      })).to.be.rejectedWith(errMessage)
    });
  
    it("should indicate error if create payload is unavailable for POST method", () => {
      errType = "BadRequest";
      errMessage = "Deployment details are required for creating a deployment";
      event.body = {};
      event.path = {};
      event.method = "POST";
      var genericInputValidation = index.genericInputValidation(event);
      expect(genericInputValidation.then((res) => {
        return res;
      })).to.be.rejectedWith(errMessage)
    });
  
    it("should indicate error if deployment_id is unavailable for POST method with re-build path", () => {
      errType = "BadRequest";
      errMessage = "Re-build API can be called with deployment_id as path param";
      event.body = {};
      event.path = {
        id: undefined
      };
      event.method = "POST";
      var genericInputValidation = index.genericInputValidation(event);
      expect(genericInputValidation.then((res) => {
        return res;
      })).to.be.rejectedWith(errMessage)
    });
  });
  
  describe('validateDeploymentDetails', () => {
    it("should validate data for create payload for new deployment", () => {
      event.query = {};
      event.path = {};
      config = configObj(event);
      var validateDeploymentDetails = index.validateDeploymentDetails(config, event.body);
      expect(validateDeploymentDetails.then((res) => {
        return res;
      })).to.eventually.deep.equal(null);
    });
  
    it("should indicate invalid status error while validating create payload for new deployment", () => {
      event.query = {};
      event.path = {};
      event.body.status = "invalid-status";
      message = "Only following values can be allowed for status field -"
      config = configObj(event);
      var validateDeploymentDetails = index.validateDeploymentDetails(config, event.body);
      expect(validateDeploymentDetails.then((res) => {
        return res;
      })).to.be.rejectedWith(message);
    });
  
    it("should indicate empty data error while validating create payload for new deployment", () => {
      event.query = {};
      event.path = {};
      event.body = {};
      message = "Input payload cannot be empty"
      config = configObj(event);
      var validateDeploymentDetails = index.validateDeploymentDetails(config, event.body);
      expect(validateDeploymentDetails.then((res) => {
        return res;
      })).to.be.rejectedWith(message);
    });
  
    it("should indicate missing required data error while validating create payload for new deployment", () => {
      event.query = {};
      event.path = {};
      event.body.service = "";
      message = "Following field(s) value cannot be empty -"
      var validateDeploymentDetails = index.validateDeploymentDetails(config, event.body);
      expect(validateDeploymentDetails.then((res) => {
        return res;
      })).to.be.rejectedWith(message);
    });
  });
  
  describe('addNewDeploymentDetails', () => {
    it("should add new deployment details to dynamodb", () => {
      event.path = {};
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(null, dataObj);
      });
      var addNewDeploymentDetails = index.addNewDeploymentDetails(event.body, tableName);
      expect(addNewDeploymentDetails.then((res) => {
        expect(res).to.include.keys('result')
        return res;
      }));
      AWS.restore("DynamoDB.DocumentClient")
    });
  
    it("should indicate error while adding new deployment details to dynamodb", () => {
      event.path = {};
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });
      var addNewDeploymentDetails = index.addNewDeploymentDetails(event.body, tableName);
      expect(addNewDeploymentDetails.then((res) => {
        return res;
      })).to.be.rejectedWith(err.message);
      AWS.restore("DynamoDB.DocumentClient")
    });
  });

  describe('validateQueryParams', () => {
    it("should validate query params for deployments list", () => {
      var validateQueryParams = index.validateQueryParams(config, event.query);
      expect(validateQueryParams.then((res) => {
        return res;
      })).to.eventually.deep.equal(null);
    });
  
    it("should indicate invalid field error while validating query params", () => {
      event.query.invalid = "";
      message = "Following fields are invalid : "
      var validateQueryParams = index.validateQueryParams(config, event.query);
      expect(validateQueryParams.then((res) => {
        return res;
      })).to.be.rejectedWith(message);
    });
  });

  describe('getDeploymentDetailsByQueryParam', () => {
    it("should get list of deployments form dynamdb if query params are defined", () => {
      var responseObj = {
        count: 1,
        deployments: [event.body]
      }
      AWS.mock("DynamoDB", "scan", (params, cb) => {
        var dataObj = {
          Items: [event.body]
        };
        return cb(null, dataObj);
      });
      var getDeploymentDetailsByQueryParam = index.getDeploymentDetailsByQueryParam(tableName, event.query);
      expect(getDeploymentDetailsByQueryParam.then((res) => {
        return res;
      })).to.eventually.deep.equal(responseObj);
      AWS.restore("DynamoDB");
    });
  
    it("should indicate error if DynamoDB.scan fails", () => {
      AWS.mock("DynamoDB", "scan", (params, cb) => {
        return cb(err, null);
      });
      var getDeploymentDetailsByQueryParam = index.getDeploymentDetailsByQueryParam(tableName, event.query);
      expect(getDeploymentDetailsByQueryParam.then((res) => {
        return res;
      })).to.be.rejectedWith(err.message);
      AWS.restore("DynamoDB");
    });
  });

  describe('getDeploymentDetailsById', () => {
    it("should get deployment data by deployment_id using DynamoDB.DocumentClient.query", () => {
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      var getDeploymentDetailsById = index.getDeploymentDetailsById(tableName, event.path.id);
      expect(getDeploymentDetailsById.then((res) => {
        return res;
      })).to.eventually.deep.equal(event.body)
      AWS.restore("DynamoDB.DocumentClient");
    })
  
    it("should indicate error while accessing deployment data by deployment_id of archived/missing deployments", () => {
      message = "Cannot get details for archived/missing deployments.";
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        event.body.DEPLOYMENT_STATUS = "archived"
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      var getDeploymentDetailsById = index.getDeploymentDetailsById(tableName, event.path.id);
      expect(getDeploymentDetailsById.then((res) => {
        return res;
      })).to.be.rejectedWith(message);
      AWS.restore("DynamoDB.DocumentClient");
    });
  
    it("should indicate error while accessing deployment data by deployment_id using DynamoDB.DocumentClient.quer", () => {
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        event.body.DEPLOYMENT_STATUS = "archived"
        return cb(err, null);
      });
      var getDeploymentDetailsById = index.getDeploymentDetailsById(tableName, event.path.id);
      expect(getDeploymentDetailsById.then((res) => {
        return res;
      })).to.be.rejectedWith(err.message);
      AWS.restore("DynamoDB.DocumentClient");
    });
  });
  
  describe('validateUpdateInput', () => {
    it("should validate update payload for deployment", () => {
      var update_data = {
        status: "in_progress"
      }
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      var validateUpdateInput = index.validateUpdateInput(config, update_data, tableName, event.path.id);
      expect(validateUpdateInput.then((res) => {
        expect(res).to.include(update_data);
        AWS.restore("DynamoDB.DocumentClient");
        return res;
      }));
    });
  
    it("should indicate error while validating update payload for deployment", () => {
      var update_data = {
        status: "invalid-status"
      };
      message = "Only following values can be allowed for status field -"
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      var validateUpdateInput = index.validateUpdateInput(config, update_data, tableName, event.path.id);
      expect(validateUpdateInput.then((res) => {
        return res;
      })).to.be.rejectedWith(message);
      AWS.restore("DynamoDB.DocumentClient");
    });
  });

  describe('updateDeploymentDetails', () => {
    it("should update deployment data using DynamoDB.DocumentClient.update", () => {
      var update_data = {
        status: "aborted"
      };
      var dataObj = {
        data: event.body
      }
      AWS.mock("DynamoDB.DocumentClient", "update", (param, cb) => {
        return cb(null, dataObj);
      });
      var updateDeploymentDetails = index.updateDeploymentDetails(tableName, update_data, event.path.id);
      expect(updateDeploymentDetails.then((res) => {
        return res;
      })).to.eventually.deep.equal(dataObj);
      AWS.restore("DynamoDB.DocumentClient");
    });
  
    it("should indicate error while updating deployment data using DynamoDB.DocumentClient.update", () => {
      var update_data = {
        status: "aborted"
      };
      AWS.mock("DynamoDB.DocumentClient", "update", (param, cb) => {
        return cb(err, null);
      });
      var updateDeploymentDetails = index.updateDeploymentDetails(tableName, update_data, event.path.id);
      expect(updateDeploymentDetails.then((res) => {
        return res;
      })).to.be.rejectedWith(err.message);
      AWS.restore("DynamoDB.DocumentClient");
    });
  });

  describe('deleteServiceByID', () => {
    it("Should delete deployment data from the dynamoDB using DynamoDB.DocumentClient.delete", () => {
      var responseObj = {
        deploymentId: event.path.id
      }
      AWS.mock("DynamoDB.DocumentClient", "delete", (param, cb) => {
        var dataObj = {
          data: {}
        }
        return cb(null, dataObj);
      });
      var deleteServiceByID = index.deleteServiceByID(event.body, tableName, event.path.id);
      expect(deleteServiceByID.then((res) => {
        return res;
      })).to.eventually.deep.equal(responseObj);
      AWS.restore("DynamoDB.DocumentClient");
    });
  
    it("Should indicate error while deleting deployment data from the dynamoDB using DynamoDB.DocumentClient.delete", () => {
      AWS.mock("DynamoDB.DocumentClient", "delete", (param, cb) => {
        return cb(err, null);
      });
      var deleteServiceByID = index.deleteServiceByID(event.body, tableName, event.path.id);
      expect(deleteServiceByID.then((res) => {
        return res;
      })).to.be.rejectedWith(err.message);
      AWS.restore("DynamoDB.DocumentClient");
    });
  });

  describe('getToken', () => {
    it("should successfully get token on making login request", () => {
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      };
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var getToken = index.getToken(config);
      expect(getToken.then((res) => {
        return res;
      }));
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should successfully get token on making login request", () => {
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      };
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var getToken = index.getToken(config);
      expect(getToken.then((res) => {
        return res;
      })).to.eventually.deep.equal(responseObj.body.data.token);
      reqStub.restore();
    });
  
    it("should indicate error while making request to login api", () => {
      var responseObj = {
        statusCode: 400,
        body: {
          data: {},
          message: "Could not get authentication token"
        }
      };
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var getToken = index.getToken(config);
      expect(getToken.then((res) => {
        return res;
      })).to.be.rejectedWith(responseObj.body.message);
      reqStub.restore();
    });
  
    it("should indicate error while making request to login api", () => {
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(err, null, null)
      });
      var getToken = index.getToken(config);
      expect(getToken.then((res) => {
        return res;
      })).to.be.rejectedWith(err.message);
      reqStub.restore();
    });
  });

  describe('getServiceDetails', () => {
    it("should successfully get service details by making request to services api", () => {
      var authToken = "zaqwsxcderfv.qawsedrftg.qxderfvbhy";
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            service: "mag!c",
            domain: "k!ngd0m",
            type: "api"
          },
          input: {
            service_id: event.path.id
          }
        }
      };
      responseObj.body = "{\"data\":{\"service\":\"mag!c\",\"domain\":\"k!ngd0m\",\"type\":\"api\"},\"input\":{\"service_id\":\"k!ngd0m_0f_mewni\"}}"
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var getServiceDetails = index.getServiceDetails(config, event.body.service_id, authToken);
      expect(getServiceDetails.then((res) => {
        res.should.have.deep.property('data.service');
        return res;
      }));
      reqStub.restore();
    });
  
    it("should indicate error while accessing service details by making request to services api", () => {
      var authToken = "zaqwsxcderfv.qawsedrftg.qxderfvbhy";
      var responseObj = {
        statusCode: 404,
        body: {
          data: {
            errorType: "NotFound"
          },
          input: {
            service_id: event.path.id
          }
        },
        message: "Service not available with provided service_id"
      };
      responseObj.body = "{\"data\":{\"errorType\":\"NotFound\"},\"input\":{\"service_id\":\"k!ngd0m_0f_mewni\"}}"
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var getServiceDetails = index.getServiceDetails(config, event.body.service_id, authToken);
      expect(getServiceDetails.then((res) => {
        res.should.have.deep.property('data.errorType');
        return res;
      }));
      reqStub.restore();
    });
  });

  describe('buildNowRequest', () => {
    it("should successfully initiate deployment re-build", () => {
      var serviceDetails = {
        data: { 
          service: "mag!c",
          domain: "k!ngd0m",
          type: "api"
        }
      },responseObj = {
        statusCode: 200,
        body: {
          data: {}
        }
      }, result = { 
        result: 'success', 
        message: 'deployment started.' 
      }
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var buildNowRequest = index.buildNowRequest(serviceDetails, config, event.body);
      expect(buildNowRequest.then((res) => {
        return res;
      })).to.eventually.deep.equal(result);
      reqStub.restore();
    });
  
    it("should indicate notFound error while initiating deployment re-build", () => {
      var serviceDetails = {
        data: { 
          service: "mag!c",
          domain: "k!ngd0m",
          type: "api"
        }
      },responseObj = {
        statusCode: 404,
        body: {
          data: {}
        }
      }, result = { 
        result: 'notFound', 
        message: 'Unable to re-build ' + serviceDetails.data.service + ' as requested service is unavailable.' 
      }
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var buildNowRequest = index.buildNowRequest(serviceDetails, config, event.body);
      expect(buildNowRequest.then((res) => {
        return res;
      })).to.be.rejectedWith(result);
      reqStub.restore();
    });
  
    it("should indicate error while initiating deployment re-build", () => {
      var serviceDetails = {
        data: { 
          service: "mag!c",
          domain: "k!ngd0m",
          type: "api"
        }
      },responseObj = {
        statusCode: 500,
        body: {
          data: {}
        }
      };
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      var buildNowRequest = index.buildNowRequest(serviceDetails, config, event.body);
      expect(buildNowRequest.then((res) => {
        return res;
      })).to.be.rejectedWith('unknown error occurred');
      reqStub.restore();
    });
  });

  describe('processDeploymentCreation', () => {
    it("should process deployment creation", () => {
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(null, dataObj);
      });
      var processDeploymentCreation = index.processDeploymentCreation(config, event.body, tableName);
      expect(processDeploymentCreation.then((res) => {
        expect(res).to.include.keys('result')
        AWS.restore("DynamoDB.DocumentClient");
        return res;
      }));
    });
  
    it("should indicate error while  processing deployment creation", () => {
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });
      var processDeploymentCreation = index.processDeploymentCreation(config, event.body, tableName);
      expect(processDeploymentCreation.then((res) => {
        return res;
      })).to.be.rejectedWith(err.message);
      AWS.restore("DynamoDB.DocumentClient");
    });
  });

  describe('processDeploymentsList', () => {
    it("should process deployment list", () => {
      var responseObj = {
        count: 1,
        deployments: [event.body]
      }
      AWS.mock("DynamoDB", "scan", (params, cb) => {
        var dataObj = {
          Items: [event.body]
        };
        return cb(null, dataObj);
      });
      var processDeploymentsList = index.processDeploymentsList(config, event.query, tableName);
      expect(processDeploymentsList.then((res) => {
        expect(res).to.include.keys('deployments');
        AWS.restore("DynamoDB");
        return res;
      }));
    });
  
    it("should indicate error while  processing deployment list", () => {
      AWS.mock("DynamoDB", "scan", (params, cb) => {
        return cb(err, null);
      });
      var processDeploymentsList = index.processDeploymentsList(config, event.query, tableName);
      expect(processDeploymentsList.then((res) => {
        return res;
      })).to.be.rejectedWith(err.message);
      AWS.restore("DynamoDB");
    });
  });
  
  describe('processDeploymentsUpdate', () => {
    it("should process deployments update", () => {
      var update_data = {
        status: "in_progress"
      }
      var dataObj = {
        Items: [event.body]
      }
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        event.body.status = update_data.status;
        return cb(null, dataObj);
      });
      AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
        var dataObj = {
          Items: [event.body]
        };
        return cb(null, dataObj);
      });
      var processDeploymentsUpdate = index.processDeploymentsUpdate(config, event.body, tableName, event.path.id);
      expect(processDeploymentsUpdate.then((res) => {
        return res;
      })).to.eventually.deep.equal(dataObj);
      AWS.restore("DynamoDB.DocumentClient");
    });
  
    it("should indicate error while processing deployments update", () => {
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var obj = {
          Items: [event.body]
        }
        return cb(null, obj);
      });
      AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
        var dataObj = {
          Items: [event.body]
        };
        return cb(err, dataObj);
      });
      var processDeploymentsUpdate = index.processDeploymentsUpdate(config, event.body, tableName, event.path.id);
      expect(processDeploymentsUpdate.then((res) => {
        AWS.restore("DynamoDB.DocumentClient");
        return res;
      })).to.be.rejectedWith(err.message);
      
    });
  });

  describe('processDeploymentsDeletion', () => {
    it("should process deployments deletion", () => {
      var responseObj = {
        deploymentId: event.path.id
      }
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var deploymentObj = {
        Items: [event.body]
      }
        return cb(null, deploymentObj);
      });
      AWS.mock("DynamoDB.DocumentClient", "delete", (param, cb) => {
        var dataObj = {
          data: {}
        }
        return cb(null, dataObj);
      });
      var processDeploymentsDeletion = index.processDeploymentsDeletion(tableName, event.path.id);
      expect(processDeploymentsDeletion.then((res) => {
        AWS.restore("DynamoDB.DocumentClient");
        return res;
      })).to.eventually.deep.equal(responseObj);
    });
  
    it("should indicate error while processing deployments deletion", () => {
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var deploymentObj = {
        Items: [event.body]
      }
        return cb(null, deploymentObj);
      });
      AWS.mock("DynamoDB.DocumentClient", "delete", (param, cb) => {
        var dataObj = {
          data: {}
        }
        return cb(err, null);
      });
      var processDeploymentsDeletion = index.processDeploymentsDeletion(tableName, event.path.id);
      expect(processDeploymentsDeletion.then((res) => {
        AWS.restore("DynamoDB.DocumentClient");
        return res;
      })).to.be.rejectedWith(err.message);
    });
  });

  describe('reBuildDeployment', () => {
    it("should successfully re-build the  provided deployment", () => {
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      },result = { 
        result: 'success', 
        message: 'deployment started.' 
      };
      reqStub = sinon.stub(request, "Request", (obj) => {
        if(obj.method.toLowerCase() === 'post') {
          return obj.callback(null, responseObj, responseObj.body)
        } else if (obj.method === 'get') {
          responseObj.body = "{\"data\":{\"service\":\"mag!c\",\"domain\":\"k!ngd0m\",\"type\":\"api\"},\"input\":{\"service_id\":\"k!ngd0m_0f_mewni\"}}"
          return obj.callback(null, responseObj, responseObj.body)
        }
      });
      var reBuildDeployment = index.reBuildDeployment(event.body, config);
      expect(reBuildDeployment.then((res) => {
        reqStub.restore();
        return res;
      })).to.eventually.deep.equal(result);
    });
  
    it("should indicate error while re-building the deployment", () => {
      var responseObj = {
        statusCode: 400,
        body: {
          data: {},
          message: err.message
        }
      },result = { 
        result: 'success', 
        message: 'deployment started.' 
      };
      reqStub = sinon.stub(request, "Request", (obj) => {
        if(obj.method.toLowerCase() === 'post') {
          return obj.callback(null, responseObj, responseObj.body)
        } else if (obj.method === 'get') {
          responseObj.body = "{\"data\":{\"service\":\"mag!c\",\"domain\":\"k!ngd0m\",\"type\":\"api\"},\"input\":{\"service_id\":\"k!ngd0m_0f_mewni\"}}"
          return obj.callback(null, responseObj, responseObj.body)
        }
      });
      var reBuildDeployment = index.reBuildDeployment(event.body, config);
      expect(reBuildDeployment.then((res) => {      
        return res;
      })).to.be.rejectedWith(err.message);
      reqStub.restore();
    });
  });

  describe('handler', () => {
    it("should indicate error during the generic validation",() => {
      event.method = undefined;
      message = '{"errorType":"BadRequest","message":"method cannot be empty"}';
      index.handler(event, context,(err, res) => {
          err.should.be.equal(message);
          return err;
      })
    });
  
    it("should successfully create new deployment using POST method",() => {
      event.method = "POST";
      event.path =  {};
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(null, dataObj);
      });
      index.handler(event, context,(err, res) => {
          res.should.have.deep.property('data.deployment_id');
          AWS.restore("DynamoDB.DocumentClient");
          return res;
      })
    });
  
    it("should indicate error while creating new deployment using POST method",() => {
      event.method = "POST";
      event.path =  {};
      message = '{"errorType":"InternalServerError","message":"unexpected error occurred"}';
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });
      index.handler(event, context,(err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB.DocumentClient");
        return res;
      })
    });
  
    it("should successfully initiate re-build deployment using POST method",() => {
      event.method = "POST";
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      };
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      reqStub = sinon.stub(request, "Request", (obj) => {
        if(obj.method.toLowerCase() === 'post') {
          return obj.callback(null, responseObj, responseObj.body)
        } else if (obj.method === 'get') {
          responseObj.body = "{\"data\":{\"service\":\"mag!c\",\"domain\":\"k!ngd0m\",\"type\":\"api\"},\"input\":{\"service_id\":\"k!ngd0m_0f_mewni\"}}"
          return obj.callback(null, responseObj, responseObj.body)
        }
      });
      index.handler(event, context,(err, res) => {
          res.should.have.deep.property('data.result');
          AWS.restore("DynamoDB.DocumentClient");
          reqStub.restore();
          return res;
      })
    });
  
    it("should indicate internal server error while initiating re-build deployment using POST method",() => {
      event.method = "POST";
      var responseObj = {
        statusCode: 400,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      };
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      message = '{"errorType":"InternalServerError","message":"unhandled error occurred"}'
      index.handler(event, context,(err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB.DocumentClient");
        reqStub.restore();
        return res;
      })
    });
  
    it("should indicate NotFound error while initiating re-build deployment using POST method",() => {
      event.method = "POST";
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      };
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      reqStub = sinon.stub(request, "Request", (obj) => {
        if(obj.method.toLowerCase() === 'post') {
          if(obj.uri === config.SERVICE_API_URL+config.TOKEN_URL){
            return obj.callback(null, responseObj, responseObj.body)
          } else {
            responseObj.statusCode = 404;
            return obj.callback(null, responseObj, responseObj.body)
          }
        } else if (obj.method === 'get') {
          responseObj.body = "{\"data\":{\"service\":\"mag!c\",\"domain\":\"k!ngd0m\",\"type\":\"api\"},\"input\":{\"service_id\":\"k!ngd0m_0f_mewni\"}}"
          return obj.callback(null, responseObj, responseObj.body)
        }
      });
      message = '{"errorType":"NotFound","message":"Unable to re-build mag!c as requested service is unavailable."}'
      index.handler(event, context,(err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB.DocumentClient");
        reqStub.restore();
        return res;
      })
    });
  
    it("should indicate internal server error while initiating re-build deployment using POST method",() => {
      event.method = "POST";
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      };
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      reqStub = sinon.stub(request, "Request", (obj) => {
        if(obj.method.toLowerCase() === 'post') {
          return obj.callback(null, responseObj, responseObj.body)
        } else if (obj.method === 'get') {
          responseObj.body = "{\"data\":{\"errorType\":\"NotFound\"},\"input\":{\"service_id\":\"k!ngd0m_0f_mewni\"}}"
          return obj.callback(err, null, null)
        }
      });
      message = '{"errorType":"InternalServerError","message":"unhandled error occurred"}'
      index.handler(event, context,(err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB.DocumentClient");
        reqStub.restore();
        return res;
      })
    });
  
    it("should successfully get list of deployments with provided query params using GET method", () => {
      event.method = "GET";
      event.path = {};
      AWS.mock("DynamoDB", "scan", (params, cb) => {
        var dataObj = {
          Items: [event.body]
        };
        return cb(null, dataObj);
      });
      index.handler(event, context, (err, res) => {
          res.should.have.deep.property('data.deployments')
          AWS.restore("DynamoDB");
          return res
      })
    });
  
    it("should indicate error while fecthing list of deployments with provided query params using GET method", () => {
      event.method = "GET";
      event.path = {};
      message = '{"errorType":"InternalServerError","message":"unexpected error occurred"}'
      AWS.mock("DynamoDB", "scan", (params, cb) => {
        return cb(err, null);
      });
      index.handler(event, context, (err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB");
        return err;
      })
    });
  
    it("should successfully get deployment with provided path param using GET method", () => {
      event.method = "GET";
      event.query = {};
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        event.body.deployment_id = event.path.id;
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      index.handler(event, context, (err, res) => {
          res.should.have.deep.property('data.deployment_id');
          AWS.restore("DynamoDB.DocumentClient");
          return res
      })
    });
  
    it("should indicate error while fetching deployment data with provided path param using GET method", () => {
      event.method = "GET";
      event.query = {};
      message ='{"errorType":"NotFound","message":"Cannot get details for archived/missing deployments."}'
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        event.body.deployment_id = event.path.id;
        event.body.DEPLOYMENT_STATUS = 'archived'
        var dataObj = {
          Items: [event.body]
        }
        return cb(null, dataObj);
      });
      index.handler(event, context, (err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB.DocumentClient");
        return err;
      })
    });
  
    it("should successfully update deployment data using PUT method", () => {
      event.method = "PUT";
      var dataObj = {
        data: event.body
      }
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var obj = {
          Items: [event.body]
        }
        return cb(null, obj);
      });
      AWS.mock("DynamoDB.DocumentClient", "update", (param, cb) => {
        return cb(null, dataObj);
      });
      index.handler(event, context, (err, res) => {
        res.should.have.deep.property('data.message');
        AWS.restore("DynamoDB.DocumentClient");
        return res;
      })
    });
  
    it("should indicate error while updating deployment data using PUT method", () => {
      event.method = "PUT";
      var dataObj = {
        data: event.body
      };
      message ='{"errorType":"NotFound","message":"Cannot find deployment details with id :'+event.path.id+'"}'
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var obj = {
          Items: []
        }
        return cb(null, obj);
      });
      AWS.mock("DynamoDB.DocumentClient", "update", (param, cb) => {
        return cb(null, dataObj);
      });
      index.handler(event, context, (err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB.DocumentClient");
        return err;
      })
    });
  
    it("should successfully delete deployment data using DELETE method", () => {
      event.method = "DELETE";
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var deploymentObj = {
          Items: [event.body]
        }
        return cb(null, deploymentObj);
      });
      AWS.mock("DynamoDB.DocumentClient", "delete", (param, cb) => {
        var dataObj = {
          data: {}
        }
        return cb(null, dataObj);
      });
      index.handler(event, context, (err, res) => {
        res.should.have.deep.property('data.message');
        AWS.restore("DynamoDB.DocumentClient");
        return res;
      })
    });
  
    it("should indicate notFound error while deleting deployment data using DELETE method", () => {
      event.method = "DELETE";
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        var deploymentObj = {
          Items: []
        }
        return cb(null, deploymentObj);
      });
      AWS.mock("DynamoDB.DocumentClient", "delete", (param, cb) => {
        var dataObj = {
          data: {}
        }
        return cb(null, dataObj);
      });
      message ='{"errorType":"NotFound","message":"Cannot find deployment details with id :'+event.path.id+'"}'
      index.handler(event, context, (err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB.DocumentClient");
        return err;
      })
    });
  
    it("should indicate error while deleting deployment data using DELETE method", () => {
      event.method = "DELETE";
      message ='{"errorType":"InternalServerError","message":"unexpected error occurred "}'
      AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
        return cb(err, null);
      });
      index.handler(event, context, (err, res) => {
        err.should.be.equal(message);
        AWS.restore("DynamoDB.DocumentClient");
        return err;
      })
    });
  });
});