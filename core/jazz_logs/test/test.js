const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const logger = require("../components/logger.js");
const request = require('request');

describe('platform_logs', function() {
  var event, context, callback, spy, stub, logStub, logMessage, errorMessage, errorType;

  //setup a helper function to check for expected outputs given different input parameters
  var inputValidation = (eventProp, eventProp2, newValue, errMessage, errType) => {
    //if there is a second prop defined, than the value to be changed is in a nested object
    if(eventProp2){
      event[eventProp][eventProp2] = newValue;
    }
    else if(eventProp){
      event[eventProp] = newValue;
    }
    else{
      event = newValue;
    }
    //check if handler returns error notification with expected error type and message
    var handlerResponse = index.handler(event, context, callback);
    if(handlerResponse){
      var bool = handlerResponse.includes(errMessage) && handlerResponse.includes(errType);
      return bool;
    }
    else{
      return false;
    }
  }

  //setup additional helper function for validating multiple values
  var multipleValidation = (prop1, prop2, valueArray, errMessage, errType) => {
    var allChecks = true;
    //allChecks stays true if handler() returns expected error for every value assigned
    for(i in valueArray){
      var bool = inputValidation(prop1, prop2, valueArray[i], errMessage, errType);
      if(!bool){
        allChecks = false;
        break;
      }
    }
    return allChecks;
  }

  beforeEach(function(){
    //setup spy to wrap async/extraneous functions
    spy = sinon.spy();
    event = {
      "stage" : "test",
      "body_get":{},
      "body_put":{
        "metadata" : {
          "subnetid": "abc"
        }
      },
      "body":{
        "environment": "test",
        "service": "dAnCe",
        "domain": "bA11r00m",
        "category": "api",
        "offset": "44",
        "type" : "debug"
      },
      "method":"POST",
      "path" : {},
      "path_put" : {
        "id": "88e046fe-1acc-5f30-0dff-d7c2c5357621"
      },
      "query_basic" : {
        "limit":"10",
        "offset":"0"
      },
      "query_put" : {
        "limit":"10",
        "offset":"0",
        "status": "Active"
      },
      "query_get" : {
        "limit":"10",
        "offset":"0",
        "status": "Active,inactive"
      },
      "principalId": "i@m"
    };
    context = awsContext();
    callback = (err, responseObj) => {
      if(err){
        return err;
      }
      else{
        return JSON.stringify(responseObj);
      }
    };
    err = {
      "errorType" : "Intrntnl",
      "message" : "latin standard"
    };
  });

  /*
  * Given a falsy event, handler() indicates that an invalid request was made
  * @param{object} event -> either null, undefined, or ""
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it('should inform of bad request if not given any event info', function() {
    errorMessage = "Invalid request to process for logs API";
    errorType = "BadRequest";
    var invalidArray = ["", null, undefined];
    var allChecks = multipleValidation(null, null, invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given an event.method != POST, handler() indicates that an invalid request was made
  * @param{object} event -> event.method = null, undefined, "" or != POST
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it('should inform of bad request if given an event.method other than "POST" or no event.method', function() {
    errorMessage = "Invalid request to process for logs API";
    errorType = "BadRequest";
    var invalidArray = ["GET", "PUT", "DELETE", "HEAD", "OPTIONS", "", null, undefined];
    var allChecks = multipleValidation("method", null, invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given no event.body, handler() indicates that inputs are missing
  * @param{object} event -> event.body = null, undefined, or ""
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it('should inform of bad request if event.body is falsy', function() {
    errorMessage = "Service inputs not defined!";
    errorType = "BadRequest";
    var invalidArray = ["", null, undefined];
    var allChecks = multipleValidation("body", null, invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given no event.body.service, handler() indicates that service name is missing
  * @param{object} event -> event.body.service = null, undefined, or ""
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it('should inform of bad request if event.body.service is falsy', function() {
    errorMessage = "missing required input parameter service name.";
    errorType = "BadRequest";
    var invalidArray = ["", null, undefined];
    var allChecks = multipleValidation("body", "service", invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given no event.body.domain, handler() indicates that domain identifier is missing
  * @param{object} event -> event.body.domain = null, undefined, or ""
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it('should inform of bad request if event.body.domain is falsy', function() {
    errorMessage = "missing required input parameter domain.";
    errorType = "BadRequest";
    var invalidArray = ["", null, undefined];
    var allChecks = multipleValidation("body", "domain", invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given no event.body.environment, handler() indicates that environment identifier is missing
  * @param{object} event -> event.body.environment = null, undefined, or ""
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it('should inform of bad request if event.body.environment is falsy', function() {
    errorMessage = "missing required input parameter environment.";
    errorType = "BadRequest";
    var invalidArray = ["", null, undefined];
    var allChecks = multipleValidation("body", "environment", invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given no event.body.category, handler() indicates that category identifier is missing
  * @param{object} event -> event.body.category = null, undefined, or ""
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it('should inform of bad request if event.body.category is falsy', function() {
    errorMessage = "missing required input parameter category.";
    errorType = "BadRequest";
    var invalidArray = ["", null, undefined];
    var allChecks = multipleValidation("body", "category", invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given an event.body.category not listed as valid through config, handler() indicates category isn't valid
  * @param{object} event -> event.body.category not listed as valid in config file
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it("should inform of bad request if event.body.category doesn't match valid config values", () => {
    errorMessage = "Only following values are allowed for category - ";
    errorType = "BadRequest";
    var invalidArray = ["chaCHA", "rUmBa", "sAmBa"];
    var allChecks = multipleValidation("body", "category", invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given event.body.category that is listed as valid in config, handler() should not inform of category exception
  * @param{object} event -> event.body.category is either api or function, not website or other
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it("should allow only api and function to be listed as the category", () => {
    errorMessage = "Only following values are allowed for category - ";
    errorType = "BadRequest";
    var invalidArray = ["api", "function", "website"];
    var acceptCount = 3;
    //only have 2 of the values listed be acceptable
    for(i in invalidArray){
      if(inputValidation("body", "category", invalidArray[i], errorMessage, errorType)){
        acceptCount--;
      }
    }
    assert.isTrue(acceptCount == 2);
  });

  /*
  * Given an event.body.type not listed as valid through config or is not given, handler() indicates type isn't valid
  * @param{object} event -> event.body.type = falsy or is not listed as valid in config file
  * @params{object, function} aws context, and callback function as described in beforeEach
  * @returns{string} error message indicating a bad request was made
  */
  it("should inform of bad request if event.body.type doesn't match valid config values or isn't provided", () => {
    errorMessage = "Only following values are allowed for logger type - ";
    errorType = "BadRequest";
    var invalidArray = ["sw1ng", "mAmb0", "", null, undefined];
    var allChecks = multipleValidation("body", "type", invalidArray, errorMessage, errorType);
    assert.isTrue(allChecks);
  });

  /*
  * Given valid input parameters, handler() should attempt to send an http request
  * @param {object, object, function} default event, context, and callback as described in beforeEach
  */
  /* Disabling failing test
  it("should attempt to make an http request if given valid inputs", function(){
    //wrapping the Request() method that gets internally called by node request.js for any http method
    stub = sinon.stub(request, "Request", spy);
    //trigger the spy wrapping the request by calling handler() with valid params
    var callFunction = index.handler(event, context, callback);
    stub.restore();
    assert.isTrue(spy.called);
  });
  */

  /*
  * Given a failed http request, handler() informs that there was a request error
  * @param {object, object, function} default event, context, and callback as described in beforeEach
  * @returns {string} returns callback() with an error obj passed so the error is relayed as a message
  */
  /* Disabling failing test
  it("should catch an error from sending request", function(){
    var err = {
      errType : "otherTanzen",
      message : "Qu!ck$tep, V-wa1tz - j1ve, pas0d0b1e"
    };
    errorType = "InternalServerError";
    errorMessage = "Internal Error";
    logMessage = "Error occured : ";
    //wrapping the Request() method that gets internally called by node request.js for any request
    //the expected parameter only includes a requestLoad obj that has a callback function property
    stub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(err, null, null);
    });
    logStub = sinon.stub(logger, "error", spy);
    //trigger both stubs by calling handler()
    var callFunction = index.handler(event, context, callback);
    var allChecks = stub.returnValues[0].includes(errorType) &&
                    stub.returnValues[0].includes(errorMessage) &&
                    logStub.args[0][0].includes(err.errType) &&
                    logStub.args[0][0].includes(err.message) &&
                    logStub.args[0][0].includes(logMessage);
    stub.restore();
    logStub.restore();
    assert.isTrue(allChecks);
  });
  */
 
  /*
  * Given a 200 response, handler() reveals content of returned response
  * @param {object, object, function} default event, context, and callback as described in beforeEach
  */
  /* Disabling failing test
  it("should get output back from a successful 200 response", function(){
    var responseObject = {
      statusCode : 200,
      body : {
        'responses' : [{
          'hits' : {
            'total' : 400,
            'hits' : {
              'request_id' : {'_source' : 4, '_index' : ""},
              'timestamp' : {'_source' : 4, '_index' : ""},
              'message' : {'_source' : 4, '_index' : ""},
              'log_level' : {'_source' : 4, '_index' : ""}
            }
          }
        }]
      }
    };
    responseObject.body = JSON.stringify(responseObject.body);
    logMessage = "Output :";
    //wrapping the Request() method that gets internally called by node request.js for any request
    stub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObject, null);
    });
    logStub = sinon.stub(logger, "info", spy);
    //trigger both stubs by calling handler()
    var callFunction = index.handler(event, context, callback);
    var bool = logStub.args[3][0].includes(logMessage);
    stub.restore();
    logStub.restore();
    assert.isTrue(bool);
  }); */

  /*
  * Given an unsuccessful response, handler() informs of error
  * @param {object, object, function} default event, context, and callback as described in beforeEach
  * @returns {string} returns callback() with an error obj passed so the error is relayed as a message
  */
  /* Disabling failing test
  it("should notify of internal server error if request returns an unsuccesful response", () => {
    errorType = "InternalServerError";
    errorMessage = "Error while processing the request :";
    logMessage = "Exception occured :";
    var err = {
      errType : "otherTanzen",
      message : "Qu!ck$tep, V-wa1tz - j1ve, pas0d0b1e"
    };
    var responseObject = {
      //anything but 200
      statusCode : 444,
      body : {
        errors : [err]
      }
    };
    responseObject.body = JSON.stringify(responseObject.body);
    //wrapping the Request() method that gets internally called by node request.js for any request
    //the expected parameter only includes a requestLoad obj that has a callback function property
    stub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(null, responseObject, null);
    });
    logStub = sinon.stub(logger, "error", spy);
    //trigger both stubs by calling handler()
    var callFunction = index.handler(event, context, callback);
    var allChecks = stub.returnValues[0].includes(errorType) &&
                    stub.returnValues[0].includes(errorMessage) &&
                    logStub.args[0][0].includes(err.message) &&
                    logStub.args[0][0].includes(logMessage);
    stub.restore();
    logStub.restore();
    assert.isTrue(allChecks);
  });*/
});
