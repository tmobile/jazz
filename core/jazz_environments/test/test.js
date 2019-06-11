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
const configModule = require('../components/config.js');
const crud = require('../components/crud')();
const errorHandler = require("../components/error-handler.js")();


describe('jazz_environments', function () {
  var tableName, global, spy, stub, err, errMessage, errType, dataObj, event, context, callback, callbackObj, logMessage, logStub, indexName, responseObj;

  beforeEach(function () {
    spy = sinon.spy();
    event = {
      "stage": "test",
      "method": "",
      "path": {
        "environment_id": "k!ngd0m_0f_mewni"
      },
      "query": {
        "service": "mag!c",
        "domain": "k!ngd0m"
      },
      "body": {
        "service": "mag!c",
        "domain": "k!ngd0m",
        "created_by": "g10$saryck",
        "physical_id": "test",
        "logical_id": "test",
        "status": "active",
        "deployment_descriptor":
        `TestYamlDta
        `
      },
      "headers": {
        "Authorization": "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
      },
      "principalId": "g10$saryck"
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
    config = configModule.getConfig(event, context);
    indexName = config.services_environment_index;
    tableName = config.services_environment_table;
    global = {
      authorization: event.headers.Authorization
    };

  });

  it("should indicate that method is missing/empty", function () {
    errType = "BadRequest";
    errMessage = "method cannot be empty";
    var invalidArray = ["", null, undefined];
    var genericInputValidation;
    for (i in invalidArray) {
      event.method = invalidArray[0];
      genericInputValidation = index.genericInputValidation(event);
      expect(genericInputValidation.then(function (res) {
        return res;
      })).to.be.rejectedWith(errMessage)
    };
  });

  it("should indicate that query params and path params are missing for GET method", function () {
    event.path = "";
    event.query = "";
    event.method = "GET";
    errType = "BadRequest";
    errMessage = "GET API can be called only with following query params: domain and service OR GET API can be called only with environment_logical_id as path param along with the following query parameters: 'domain' and 'service'.";
    var genericInputValidation = index.genericInputValidation(event);
    expect(genericInputValidation.then(function (res) {
      return res;
    })).to.be.rejectedWith(errMessage)
  });

  it("should indicate that required params are missing for GET method", function () {
    event.method = "GET";
    event.query.service = "";
    event.query.domain = "";
    errType = "BadRequest";
    errMessage = "GET API requires the following query params: domain and service";
    var genericInputValidation = index.genericInputValidation(event);
    expect(genericInputValidation.then(function (res) {
      return res;
    })).to.be.rejectedWith(errMessage)
  });

  it("should indicate that required query params and path params are missing for PUT method", function () {
    event.method = "PUT";
    event.path.environment_id = "";
    event.query.service = "";
    event.query.domain = "";
    errType = "BadRequest";
    errMessage = "PUT API can be called only with following path param : environment_logical_id AND service name and domain as query params";
    var genericInputValidation = index.genericInputValidation(event);
    expect(genericInputValidation.then(function (res) {
      return res;
    })).to.be.rejectedWith(errMessage)
  });

  it("should indicate that update data are missing for PUT method", function () {
    event.method = "PUT";
    errType = "BadRequest";
    errMessage = "Environment data is required for updating an environment";
    var invalidArray = ["", null, undefined];
    var genericInputValidation;
    for (i in invalidArray) {
      event.body = invalidArray[i];
      genericInputValidation = index.genericInputValidation(event);
      expect(genericInputValidation.then(function (res) {
        return res;
      })).to.be.rejectedWith(errMessage)
    }
  });

  it("should indicate that create data are missing for POST method", function () {
    event.method = "POST";
    errType = "BadRequest";
    errMessage = "Environment data is required for creating an environment";
    var invalidArray = ["", null, undefined];
    var genericInputValidation;
    for (i in invalidArray) {
      event.body = invalidArray[i];
      genericInputValidation = index.genericInputValidation(event);
      expect(genericInputValidation.then(function (res) {
        return res;
      })).to.be.rejectedWith(errMessage)
    }
  });

  it("should indicate unauthorized if principalId is unavailable", function () {
    errType = "Unauthorized";
    errMessage = "Unauthorized.";
    var invalidArray = ["", null, undefined];
    var methods = ["GET", "POST", "PUT"];
    var genericInputValidation;
    for (method in methods) {
      event.method = methods[method];
      for (i in invalidArray) {
        event.principalId = invalidArray[i];
        genericInputValidation = index.genericInputValidation(event);
        expect(genericInputValidation.then(function (res) {
          return res;
        })).to.be.rejectedWith(errMessage)
      }
    }
  });

  it("should validate data without environment_id as path param for GET method", function () {
    event.method = "GET";
    event.path.environment_id = "";
    var validateGetInput = index.validateGetInput(event);
    var query = event.query;
    expect(validateGetInput.then(function (res) {
      return res;
    })).to.eventually.deep.equal(query);
  });

  it("should validate data with environment_id as path param for GET method with environment_id", function () {
    event.method = "GET";
    var validateGetInput = index.validateGetInput(event);
    var query = event.query;
    query.logical_id = event.path.environment_id;
    expect(validateGetInput.then(function (res) {
      return res;
    })).to.eventually.deep.equal(query);
  });

  it("should indicate invalidate data for GET method", function () {
    event.method = "GET";
    var invalidData = {
      "abc": "hello"
    };
    var validateGetInput = index.validateGetInput(invalidData);
    var message = "Invalid set of parameters for the GET API"
    expect(validateGetInput.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
  });

  it("should get environments from dynamoDB with defined params for GET method", function () {
    event.method = "GET";
    var query = event.query;
    query.environment_id = event.path.environment_id;
    var input = query;
    var data = {
      count: 1,
      environment: [event.body]
    }
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: [event.body]
      }
      return cb(null, dataObj);
    });
    var getServiceEnvironmentByParams = index.getServiceEnvironmentByParams(query, indexName);
    expect(getServiceEnvironmentByParams.then(function (res) {
      return res;
    })).to.eventually.deep.equal({
      data,
      input
    });
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should indicate error while fetching data from dynamoDB with defined params for GET method", function () {
    event.method = "GET";
    var query = event.query;
    query.environment_id = event.path.environment_id;
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      return cb(err, null);
    });
    var getServiceEnvironmentByParams = index.getServiceEnvironmentByParams(query, indexName);
    expect(getServiceEnvironmentByParams.then(function (res) {
      return res;
    })).to.be.rejectedWith(err);
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should validate the update payload for PUT method", function () {
    event.method = "PUT";
    var validateUpdateInput = index.validateUpdateInput(event.body, event.path.environment_id);
    expect(validateUpdateInput.then(function (res) {
      return res;
    })).to.become()
  });

  it("should indicate error while validating the update payload for PUT method", function () {
    event.method = "PUT";
    event.body.status = "invalid_status";
    var message = "Only following values can be allowed for status field - active, inactive, pending_approval, deployment_started, deployment_failed, deployment_completed, deletion_started, deletion_failed, archived"
    var validateUpdateInput = index.validateUpdateInput(event.body, event.path.environment_id);
    expect(validateUpdateInput.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
  });

  it("should validate whether Environment Exists for PUT method", function () {
    event.method = "PUT";
    event.body.id = "123456";
    var data = {
      count: 1,
      environment: [event.body]
    }
    var result = {
      result: 'success',
      message: 'Environment exists',
      data: event.body.id
    }
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: [event.body]
      }
      return cb(null, dataObj);
    });
    var validateEnvironmentExists = index.validateEnvironmentExists(tableName, indexName, event.query.service, event.query.domain, event.path.environment_id)
    expect(validateEnvironmentExists.then(function (res) {
      return res;
    })).to.eventually.deep.equal(result);
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should indicate error if environement doesnot exists for PUT method", function () {
    event.method = "PUT";
    var result = {
      result: 'inputError',
      message: "Cannot find environment  with id: '" +
        event.path.environment_id +
        "', for service:'" +
        event.query.service +
        "', domain:'" +
        event.query.sdomain +
        "' to update"
    }
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: []
      }
      return cb(null, dataObj);
    });
    var validateEnvironmentExists = index.validateEnvironmentExists(tableName, indexName, event.query.service, event.query.domain, event.path.environment_id)
    expect(validateEnvironmentExists.then(function (res) {
      return res;
    })).to.be.rejectedWith(result);
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should indicate error if dynamoDB error occurred while validate environment exist for PUT method", function () {
    event.method = "PUT";
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      return cb(err, null);
    });
    var validateEnvironmentExists = index.validateEnvironmentExists(tableName, indexName, event.query.service, event.query.domain, event.path.environment_id)
    expect(validateEnvironmentExists.then(function (res) {
      return res;
    })).to.be.rejectedWith(err.message);
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should update the dynomoDB with Update payload input for PUT method", function () {
    event.method = "PUT";
    var update_payload = {
        'status': event.body.status
      },
      environment_key_id = "123456";
    AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
      var dataObj = {
        Attributes: event.body
      }
      return cb(null, dataObj);
    });
    var updateServiceEnvironment = index.updateServiceEnvironment(tableName, update_payload, environment_key_id);
    expect(updateServiceEnvironment.then(function (res) {
      return res;
    })).to.eventually.deep.equal(event.body);
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should indicate error while updating the dynomoDB with Update payload input for PUT method", function () {
    event.method = "PUT";
    var update_payload = {
        'status': event.body.status
      },
      environment_key_id = "123456";
    AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
      return cb(err, null);
    });
    var updateServiceEnvironment = index.updateServiceEnvironment(tableName, update_payload, environment_key_id);
    expect(updateServiceEnvironment.then(function (res) {
      return res;
    })).to.be.rejectedWith(err.message);
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should indicate error while adding new environment to the dynamoDB for POST method", function () {
    event.method = "POST";
    event.query = "";
    AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
      return cb(err, null);
    });
    var addNewEnvironment = index.addNewEnvironment(event.body, tableName);
    expect(addNewEnvironment.then(function (res) {
      return res;
    })).to.be.rejectedWith(err.message);
    AWS.restore("DynamoDB.DocumentClient")
  });

  it("should add new environment to the dynamoDB for POST method", function () {
    event.method = "POST";
    event.query = "";
    var dataObj = {};
    AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
      return cb(null, dataObj);
    });
    var addNewEnvironment = index.addNewEnvironment(event.body, tableName);
    expect(addNewEnvironment.then(function (res) {
      expect(res).to.include.keys('result')
      return res;
    }));
    AWS.restore("DynamoDB.DocumentClient")
  });

  it("should indicate error while validating create payload for POST method", function () {
    event.method = "POST";
    event.body.status = ""; // invalid status
    message = "Only following values can be allowed for status field - active, inactive, pending_approval, deployment_started, deployment_failed, deployment_completed, deletion_started, deletion_failed, archived";
    var validateEnvironmentData = index.validateEnvironmentData(tableName, event.body, indexName);
    expect(validateEnvironmentData.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
  });

  it("should indicate error while validating create payload for POST method", function () {
    event.method = "POST";
    event.body.service = ""; // empty service(required field)
    message = "Following field(s) value cannot be empty - service";
    var validateEnvironmentData = index.validateEnvironmentData(tableName, event.body, indexName);
    expect(validateEnvironmentData.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
  });

  it("should validate create payload for POST method", function () {
    event.method = "POST";
    var responseObj = {
      statusCode: 200,
      body: {
        data: {
          available: false
        }
      }
    };
    var result = {
      result: "success",
      message: "Valid environment data"
    }
    reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObj, responseObj.body)
    })
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: []
      }
      return cb(null, dataObj);
    })
    var validateEnvironmentData = index.validateEnvironmentData(tableName, event.body, indexName);
    expect(validateEnvironmentData.then(function (res) {
      return res;
    })).to.eventually.deep.equal(result);
    reqStub.restore();
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should indicate error if the environment already exists in the dynamoDB for POST method", function () {
    event.method = "POST";
    var responseObj = {
      statusCode: 200,
      body: {
        data: {
          available: false
        }
      }
    };
    var message = "The specified environment already exists, please choose a different logical id for your new environment";
    reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObj, responseObj.body)
    })
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: [event.body]
      }
      return cb(null, dataObj);
    })
    var validateEnvironmentData = index.validateEnvironmentData(tableName, event.body, indexName);
    expect(validateEnvironmentData.then(function (res) {
      return res;
    })).to.be.rejectedWith(message);
    reqStub.restore();
    AWS.restore("DynamoDB.DocumentClient");
  });

  it("should indicate error for GET method using handler function", function () {
    event.method = "GET";
    var output = event.body;
    event.body = "";
    event.path.environment_id = "";
    var result = '{"errorType":"InternalServerError","message":"Unexpected error occurred."}'
    AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
      return cb(err, null);
    })
    index.handler(event, context, (err, res) => {
      if (err) {
        err.should.be.equal(result)
        AWS.restore("DynamoDB.DocumentClient");
        return err
      } else {
        return res
      }
    });
  });

  it("should indicate success for GET method using handler function", function () {
    event.method = "GET";
    var output = event.body;
    event.body = "";
    event.path.environment_id = "";
    var resObj = {
      data: {
        count: 1,
        environment: [ output ]
      },
      input: event.query
    }
    AWS.mock("DynamoDB.DocumentClient", "query", (param, cb) => {
      var dataObj = {
        Items: [output]
      }
      return cb(null, dataObj);
    })
    index.handler(event, context, (err, res) => {
      if (err) {
        return err
      } else {
        res.should.have.deep.property('data');
        AWS.restore("DynamoDB.DocumentClient");
        return res
      }
    });
  });

  it("should indicate error for PUT method using handler function",function(){
    event.method = "PUT";
    var result = '{"errorType":"InternalServerError","message":"Unexpected error occurred."}'
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: [event.body]
      }
      return cb(null, dataObj);
    });
    AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
      return cb(err, null);
    });
    index.handler(event, context, (err, res) => {
      if(err){
        err.should.be.equal(result);
        AWS.restore("DynamoDB.DocumentClient");
        return err
      } else {
        return res
      }
    });
  })

  it("should indicate success for PUT method using handler function",function(){
    event.method = "PUT";
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: [event.body]
      }
      return cb(null, dataObj);
    });
    AWS.mock("DynamoDB.DocumentClient", "update", (params, cb) => {
      var dataObj = {
        Attributes: event.body
      }
      return cb(null, dataObj);
    });
    index.handler(event, context, (err, res) => {
      if(err){
        return err
      } else {
        res.should.have.deep.property('data.service');
        AWS.restore("DynamoDB.DocumentClient");
        return res
      }
    });
  })

  it("should indicate error if service does not exist for PUT method using handler function",function(){
    event.method = "PUT";
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: []
      }
      return cb(null, dataObj);
    });
    var result = '{"errorType":"BadRequest","message":"Cannot find environment  with id: '+event.path.environment_id+', for service:'+event.query.service+', domain:'+event.query.domain+' to update"}'
    index.handler(event, context, (err, res) => {
      if(err){
        AWS.restore("DynamoDB.DocumentClient");
        return err
      } else {
        return res
      }
    });
  })

  it("should indicate success for POST method using handler function",function(){
    event.method = "POST";
    var responseObj = {
      statusCode: 200,
      body: {
        available: false
      }
    };
    responseObj.body = "{\"data\" : {\"available\":false},\"input\" : {\"service\":\"mag!c\",\"domain\":\"k!ngd0m\"}}"
    reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObj, responseObj.body)
    })
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: []
      }
      return cb(null, dataObj);
    })
    AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
      var dataObj = {};
      return cb(null, dataObj);
    });
    index.handler(event, context, (err, res) => {
      if(err){
        return err
      } else {
        res.should.have.deep.property('data.environment_id');
        reqStub.restore();
        AWS.restore("DynamoDB.DocumentClient");
        return res
      }
    });

  });

  it("should indicate error for POST method using handler function",function(){
    event.method = "POST";
    var result = '{"errorType":"InternalServerError","message":"Unexpected error occurred."}'
    var responseObj = {
      statusCode: 200,
      body: {
        data: {
          available: false
        }
      }
    };
    reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObj, responseObj.body)
    })
    AWS.mock("DynamoDB.DocumentClient", "query", (params, cb) => {
      var dataObj = {
        Items: []
      }
      return cb(null, dataObj);
    })
    AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
      return cb(err, null);
    });
    index.handler(event, context, (err, res) => {
      if(err){
        err.should.be.equal(result);
        reqStub.restore();
        AWS.restore("DynamoDB.DocumentClient");
        return err
      } else {
        return res
      }
    });
  });

  it("should indicate error if service does not exist for POST method using handler function",function(){
    event.method = "POST";
    var result = '{"errorType":"BadRequest","message":"Service with domain: '+event.query.domain+' and service name:'+event.query.service+', does not exist."}'
    var responseObj = {
      statusCode: 200,
      body: {
        data: {
          available: true
        }
      }
    };
    responseObj.body = "{\"data\" : {\"available\":true},\"input\" : {\"service\":\"mag!c\",\"domain\":\"k!ngd0m\"}}"
    reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObj, responseObj.body)
    });
    index.handler(event, context, (err, res) => {
      if(err){
        err.should.be.equal(result);
        reqStub.restore();
        return err
      } else {
        return res
      }
    });
  });

  it("should indicate error if is-service-available has empty response data for POST method using handler function",function(){
    event.method = "POST";
    var result = '{"errorType":"BadRequest","message":"Error finding service: '+event.query.domain+"."+event.query.service+' in service catalog"}'
    var responseObj = {
      statusCode: 400,
      body: {
        data: {}
      }
    };
    responseObj.body = "{\"data\" : {},\"input\" : {\"service\":\"mag!c\",\"domain\":\"k!ngd0m\"}}"
    reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObj, responseObj.body)
    });
    index.handler(event, context, (err, res) => {
      if(err){
        err.should.be.equal(result);
        reqStub.restore();
        return err
      } else {
        return res
      }
    });
  })

  it("should indicate Unauthorized for empty/invalid principalId using handler function",function(){
    event.method = "GET";
    event.principalId = "";
    var result = '{"errorType":"Unauthorized","message":"Unauthorized."}'
    index.handler(event, context, (err, res) => {
      if(err){
        err.should.be.equal(result);
        return err
      } else {
        return res
      }
    })
  })

  it("should indicate error for invalid/empty method using handler function",function(){
    event.method = "";
    var result = '{"errorType":"BadRequest","message":"method cannot be empty"}'
    index.handler(event, context, (err, res) => {
      if(err){
        err.should.be.equal(result)
        return err
      } else {
        return res
      }
    })
  })

});
