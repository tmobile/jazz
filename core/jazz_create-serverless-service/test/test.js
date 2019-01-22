// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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
const index = require('../index');
const request = require('request');
const awsContext = require('aws-lambda-mock-context');
const sinon = require('sinon');
const logger = require("../components/logger.js");
const CronParser = require("../components/cron-parser.js");
const configModule = require("../components/config.js");

let event, context, callback, spy, stub, checkCase, authStub,service_creation_data;

//setup a spy to wrap around async logic/logic that need extraneous sources
spy = sinon.spy();

//setup a helper function to check for expected outputs given different input parameters
checkCase = (eventProp, eventProp2, propValue, errMessage, errType) => {
  //if there is a second prop defined, than the value to be changed is in a nested object
  if (eventProp2) {
    event[eventProp][eventProp2] = propValue;
  } else if (eventProp) {
    event[eventProp] = propValue;
  }
  //check if handler returns error notification with expected error type and message
  let bool = index.handler(event, context, callback).includes(errMessage) &&
    index.handler(event, context, callback).includes(errType);
  return bool;
};

describe('create-serverless-service', function () {

  describe("cron-parser.js", function () {
    let validCronExp;

    beforeEach(function () {
      validCronExp = "1 * * * ? *";
    });

    it("should return null if given an empty or missing expression", function () {
      let bool = true;
      let invalidValues = [null, undefined, ""];
      //if cronParser states any of the above values are defined, have this test fail
      for (i in invalidValues) {
        if (CronParser.isDefined(invalidValues[i]) != null) {
          bool = false;
        }
      };
      assert.isTrue(bool);
    });

    it("should return 'valid' if given a valid expression", function () {
      let bool = false;
      if (CronParser.validateCronExpression(validCronExp).result == 'valid') {
        bool = true;
      }
      assert.isTrue(bool);
    });
  });

  describe("index.handler", function () {

    //set up for default valid values to pass into handler()
    let reqStub;
    beforeEach(function () {
      event = {
        "stage": "test",
        "headers": {
          "Authorization": "fr1end$hip_1s_mAg1c"
        },
        "principalId": "@pp1eJack",
        "body": {
          "service_name": "test-service",
          "service_type": "function",
          "domain": "test-domain",
          "runtime": "nodejs",
          "approvers": ['tw1light_$pArkle'],
          "rateExpression": "1 * * * ? *",
          "slack_channel": "mlp_fim",
          "require_internal_access": false,
          "create_cloudfront_url": false
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
    });
    afterEach(() => {
      if (reqStub) {
        reqStub.restore()
      }
      if (stub) {
        stub.restore();
      }
    })


    /*
     * Given an event object with no event.body, handler() should indicate service inputs are missing
     * @param {object} event, contains a null or undefined body property
     * @params {object, function} default aws context and callback function as assigned above respectively
     * @returns index.handler() should return an InternalServerError notification
     */

    it("should inform user of error if given an event with no body property", function () {
      let errMessage = "Service inputs are not defined";
      let errType = "BadRequest";
      let bothCases = checkCase("body", null, null, errMessage, errType) &&
        checkCase("body", null, undefined, errMessage, errType);
      assert.isTrue(bothCases);
    });

    /*
     * Given an event object with missing body.service_type, handler() should indicate missing service_type
     * @param {object} event, contains an event.body.service_type that is either undefined or null
     * @params {object, function} default aws context and callback function as assigned above respectively
     * @returns index.handler() should return an InternalServerError notification
     */

    it("should inform user of error if given an event with no body.service_type", function () {
      let errMessage = "'service_type' is not defined";
      let errType = "BadRequest";
      let bothCases = checkCase("body", "service_type", null, errMessage, errType) &&
        checkCase("body", "service_type", null, errMessage, errType);
      assert.isTrue(bothCases);
    });

    /*
     * Given an event with an invalid body.service_name, handler() should indicate service name has specified issues
     * @param {object} event, contains either a missing or invalid body.service_name property
     * @params {object, function} default aws context and callback function as assigned above respectively
     * @returns index.handler() should return a descriptive InternalServerError notification
     */

    it("should inform user of error if given an event with an invalid body.service_name", function () {
      //no characters
      let invalidName1 = "";
      //contains a non-alphanumeric character
      let invalidName2 = "Rar!ty";
      let nameValues = [null, undefined, invalidName1, invalidName2];
      let errMessage = "'service_name' is not defined or has invalid characters";
      let errType = "BadRequest";
      let allCases = true;
      //if checkCase() returns false for any of the nameValues assigned above, have allCases be false
      for (i in nameValues) {
        if (!checkCase("body", "service_name", nameValues[i], errMessage, errType)) {
          allCases = false;
        }
      }
      assert.isTrue(allCases);
    });

    it("should inform user of error if given an event with an invalid body.service_name (more than 20 characters)", () => {
      let invalidName = "service-name-with-more-than-20-characters"
      let errMessage = "'Service Name' can have up to 20 characters";
      let errType = "BadRequest";
      let allCases =  checkCase("body", "service_name", invalidName, errMessage, errType)
      assert.isTrue(allCases);
    });

    /*
     * Given an event indicating a lambda or api service but no runtime, handler() informs of missing Runtime
     * @param {object} event, contains a service type that isn't "website", and no body.runtime
     * @params {object, function} default aws context and callback function as assigned above respectively
     * @returns index.handler() should return an InternalServerError notification
     */

    it("should inform of error if given no event.body.runtime for a service other than website", () => {
      let runtime = "";
      let errType = "BadRequest";
      let errMessage = "'runtime' is not defined";
      let allCases = checkCase("body", "runtime", runtime, errMessage, errType) &&
        checkCase("body", "runtime", null, errMessage, errType) &&
        checkCase("body", "runtime", undefined, errMessage, errType);
      assert.isTrue(allCases);
    });

    /*
     * Given an event with an invalid body.domain, handler informs of inappropriate domain
     * @param {object} event, contains a domain that has one or more invalid characters
     * @params {object, function} default aws context and callback function as assigned above respectively
     * @returns index.handler() should return an InternalServerError notification
     */

    it("should inform user of error if invalid domain value", function () {
      //invalid if containing a non-alphanumeric character
      let invalidName2 = "f!utterShy";
      let errMessage = "Namespace is not appropriate";
      let errType = "BadRequest";
      let invalidCase = checkCase("body", "domain", invalidName2, errMessage, errType);
      assert.isTrue(invalidCase);
    });

    it("should inform user of error if invalid domain value (more than 20 characters)", () => {
      let invalidName = "domain-with-more-than-20-characters";
      let errMessage = "'Namespace' can have up to 20 characters";
      let errType = "BadRequest";
      let invalidCase = checkCase("body", "domain", invalidName, errMessage, errType);
      assert.isTrue(invalidCase);
    });

    /*
     * Given an event with no principalId provided, handler() indicates user isn't authorized
     * @param {object} event, contains a principalId value that is either undefined or null
     * @params {object, function} default aws context and callback function as assigned above respectively
     * @returns index.handler() should return an UnAuthorized error notification
     */

    it("should state the user isn't authorized if no principalId is given", function () {
      let errMessage = "User is not authorized to access this service";
      let errType = "Forbidden";
      let bothCases = checkCase("principalId", null, null, errMessage, errType) &&
        checkCase("principalId", null, undefined, errMessage, errType);
      assert.isTrue(bothCases);
    });
    /*
     * Given successful parameters and setup, handler() should send a POST http request
     * @params {object, object, function} default event, aws context, callback
     * @returns index.handler() should attempt an http POST if given valid paramters
     */

    it("should give success message if service onboarding in Jenkins setup attempt is succesfull", () => {
      let responseObject_getToken = {
        statusCode: 200,
        body: {
          data: {
            "token": "ghd93-3240-2343"
          }
        }
      };
      let responseObject_createService = {
        statusCode: 200,
        body: {
          data: {
            "service_id": "ghd93-3240-2343"
          }
        }
      };
      let responseObject_serviceOnboarding = {
        statusCode: 200,
        body: {
          message: "Service Creation Success"
        }
      };
      event.stage = "dev";
      let config = configModule.getConfig(event, context);
      // wrapping requests
      reqStub = sinon.stub(request, "Request", (obj) => {
        // Matching response Object to the corresponding Request call
        if (obj.uri === (config.SERVICE_API_URL + config.TOKEN_URL)) {
          return obj.callback(null, responseObject_getToken, responseObject_getToken.body);
        } else if (obj.uri === "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/services") {

          return obj.callback(null, responseObject_createService, responseObject_createService.body);

        } else if (obj.url === '{conf-jenkins-host}/job/create-service/buildWithParameters') {

          return obj.callback(null, responseObject_serviceOnboarding, responseObject_serviceOnboarding.body);
        }
      });

      //trigger the spy wrapping the logger by calling handler() with valid params
      let callFunction = index.handler(event, context, (err, res) => {
        reqStub.restore()
          expect(res.data).to.be.equal("Successfully created your service.");
      })
    });

    it("should Return the Error message if jenkinks job failed ", () => {
      let bool = false;
      let responseObject_getToken = {
        statusCode: 200,
        body: {
          data: {
            "token": "ghd93-3240-2343"
          }
        }
      };
      let responseObject_createService = {
        statusCode: 200,
        body: {
          data: {
            "service_id": "ghd93-3240-2343"
          }
        }
      };
      let responseObject_serviceOnboarding = {
        statusCode: 401,
        body: {
          message: "Service onboarding jenkings build Failed"
        }
      };
      let responseObject_update = {
        statusCode: 200,
        body: {
          data: "Service catalog updated"
        }
      };
      event.stage = "dev";
      let config = configModule.getConfig(event, context);
      // wrapping requests
      reqStub = sinon.stub(request, "Request", (obj) => {
        // Matching response Object to the corresponding Request call
        if (obj.uri === (config.SERVICE_API_URL + config.TOKEN_URL)) {
          return obj.callback(null, responseObject_getToken, responseObject_getToken.body);
        } else if (obj.uri === "https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/services") {
          return obj.callback(null, responseObject_createService, responseObject_createService.body);
        } else if (obj.url === '{conf-jenkins-host}/job/create-service/buildWithParameters') {
          let errObject = {
            message: responseObject_serviceOnboarding.body.message,
            jenkins_api_failure: true
          }
          return obj.callback(errObject, responseObject_serviceOnboarding, responseObject_serviceOnboarding.body);
        } else if (obj.uri = 'https://{conf-apikey}.execute-api.{conf-region}.amazonaws.com/dev/jazz/services/ghd93-3240-2343') {
          obj.callback(null, responseObject_update, responseObject_update.body);
        }
      });
      let callFunction = index.handler(event, context, (err, res) => {
        err = JSON.parse(err);
        if (err.message == "Service onboarding jenkings build Failed") {
          bool = true;
        }
        assert.isTrue(bool);
      })
    })
  })
  describe("getToken", () => {
    let config, event;
    beforeEach(() => {
      event = {
        "stage": "test",
        "headers": {
          "Authorization": "fr1end$hip_1s_mAg1c"
        },
        "principalId": "@pp1eJack",
        "body": {
          "service_name": "test-service",
          "service_type": "function",
          "domain": "test-domain",
          "runtime": "nodejs",
          "approvers": ['tw1light_$pArkle'],
          "rateExpression": "1 * * * ? *",
          "slack_channel": "mlp_fim",
          "require_internal_access": false,
          "create_cloudfront_url": false
        }
      };
      config = configModule.getConfig(event, context);
    })

    it("Should Return authToken when called with valid paramenters", () => {
      let bool = false;
      let responseObject = {
        statusCode: 200,
        body: {
          data: {
            "token": "ghd93-3240-2343"
          }
        }
      };
      let reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      index.getToken(config).then((res) => {
        if (res && res === "ghd93-3240-2343") {
          bool = true;
        }
        assert.isTrue(bool);
      })
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    })

    it("Should Return error message  when called with invalid paramenters", () => {
      let bool = false;
      let errMessage = "Could not get authentication token for updating service catalog.";
      let responseObject = {
        statusCode: 401,
        body: {
          message: "invalid pramenters",
          data: null
        }
      };
      let reqStub = sinon.stub(request, "Request", (obj) => {
        //Returning Failure Response
        return obj.callback(null, responseObject, responseObject.body);
      });

      index.getToken(config).then(() => {
        assert.fail()
      }).catch((err) => {
        if (err.error && err.error === errMessage) {
          bool = true
        }
        assert.isTrue(bool);
      })
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    })

  })
  describe("getServiceData", () => {
    beforeEach(function () {
      event = {
        "stage": "test",
        "headers": {
          "Authorization": "fr1end$hip_1s_mAg1c"
        },
        "principalId": "@pp1eJack",
        "body": {
          "service_name": "test-service",
          "service_type": "function",
          "domain": "test-domain",
          "runtime": "nodejs",
          "approvers": ['tw1light_$pArkle'],
          "rateExpression": "1 * * * ? *",
          "slack_channel": "mlp_fim",
          "require_internal_access": false,
          "create_cloudfront_url": false
        }
      };
      service_creation_data = event.body;
      context = awsContext();
      callback = (err, responseObj) => {
        if (err) {
          return err;
        } else {
          return JSON.stringify(responseObj);
        }
      };
    });

    it("should should return error when passed an invalid rateExpression", () => {
      let cronValues = [null, "", "P!nk!e_P!e"];
      let authToken = "temp-auth-token";
      let config = configModule.getConfig(event, context);
      let bool = false;
      for (let cron in cronValues) {
        service_creation_data.rateExpression = cron
        index.getServiceData(service_creation_data, authToken, config).catch((errorMsg) => {

          if (errorMsg.result === "invalid") {
            bool = true;
          }
          assert.isTrue(bool);
        })
      }

    });

    it("should return input object with METADATA values for valid input parameters for service type function (for different event sources)", () => {
      let authToken = "temp-auth-token";
      let eventsList = ["s3", "dynamodb", "sqs", "kinesis"];
      service_creation_data.rateExpression = ""
      let config = configModule.getConfig(event, context);

      eventsList.forEach(each => {
        let eachEvent = {
          type: each,
          source: "temp-" + each + "-source",
          action: "temp-" + each + "-action"
        }
        
        service_creation_data.events = [eachEvent]
        
        index.getServiceData(service_creation_data, authToken, config)
        .then((input) => {
          let action = 'event_action_' + each;
          let source = 'event_source_' + each;
          expect(input.METADATA).to.have.all.keys(action, source)
        });
      })
    });

    it("should return input error for invalid input parameters for service type function (for different event sources)", () => {
      let authToken = "temp-auth-token";
      let eventsList = ["", "invalidEvent"];
      service_creation_data.rateExpression = ""
      let config = configModule.getConfig(event, context);

      eventsList.forEach(each => {
        let eachEvent = {
          type: each,
          source: each,
          action: "temp-" + each + "-action"
        }

        service_creation_data.events = [eachEvent]

        index.getServiceData(service_creation_data, authToken, config)
        .catch(error => {
          expect(error).to.include({ result: 'inputError', message: each + ' name is invalid.' });
        });
      })
    });

    it("should return input error for invalid input parameters for service type function (for invalid event source name)", () => {
      let authToken = "temp-auth-token";
      let eventsList = ["-startWithInvalidChar", "_startWithInvalidChar", ".startWithInvalidChar", "endWithInvalidChar-", "endWithInvalidChar_", "endWithInvalidChar."];
      service_creation_data.rateExpression = ""
      let config = configModule.getConfig(event, context);

      eventsList.forEach(each => {
        let eachEvent = {
          type: "S3",
          source: each,
          action: "temp-" + each + "-action"
        }

        service_creation_data.events = [eachEvent]

        index.getServiceData(service_creation_data, authToken, config)
        .catch(error => {
          expect(error).to.include({ result: 'inputError', message: 'S3 name is invalid.' });
        });
      })
    })

  })
  describe("createService", () => {
    let input;
    beforeEach(() => {
      input = {
        TOKEN: 'temp-auth-token',
        SERVICE_API_URL: undefined,
        SERVICE_API_RESOURCE: undefined,
        SERVICE_NAME: 'test-service',
        DOMAIN: 'test-domain',
        DESCRIPTION: undefined,
        TYPE: 'function',
        RUNTIME: 'nodejs',
        REGION: "east,UST",
        USERNAME: '@pp1eJack',
        STATUS: 'creation_started',
        SLACKCHANNEL: 'mlp_fim',
        METADATA: {
          require_internal_access: false,
          eventScheduleRate: 'cron(1 * * * ? *)',
          eventScheduleEnable: true
        }
      }
    })

    it("should send an http POST given valid input parameters ", () => {
      stub = sinon.stub(request, "Request", spy);
      //trigger the spy wrapping the request by calling handler() with valid params
      let callFunction = index.createService(input);
      stub.restore();
      assert.isTrue(spy.called);
    })

    it("should Return service id of Created Service in case of successfull service creation", () => {
      let bool = false;
      let responseObject = {
        statusCode: 200,
        body: {
          data: {
            "service_id": "ghd93-3240-2343"
          }
        }
      };
      let reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      let createserviceReturn = index.createService(input);
      createserviceReturn.then((res) => {
        if (res && res === "ghd93-3240-2343") {
          bool = true;
        }
        assert.isTrue(bool);
      })
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    })

    it("Should Return error when service creation failed", () => {
      let bool = false;
      let responseObject = {
        statusCode: 401,
        body: {
          message: "401 UNAUTHORIZED"
        }
      };
      let reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      let createserviceReturn = index.createService(input);
      let errMessage = "Error creating service " + input.DOMAIN + "." + input.SERVICE_NAME + " in service catalog"
      createserviceReturn.catch((err) => {

        if (err.message && err.message === errMessage) {
          bool = true;
        }
        assert.isTrue(bool);
      })
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

  })
  describe("startServiceOnboarding", () => {
    let config, service_id, event;
    beforeEach(() => {
      event = {
        "stage": "test",
        "headers": {
          "Authorization": "fr1end$hip_1s_mAg1c"
        },
        "principalId": "@pp1eJack",
        "body": {
          "service_name": "test-service",
          "service_type": "function",
          "domain": "test-domain",
          "runtime": "nodejs",
          "approvers": ['tw1light_$pArkle'],
          "rateExpression": "1 * * * ? *",
          "slack_channel": "mlp_fim",
          "require_internal_access": false,
          "create_cloudfront_url": false

        }
      };
      service_creation_data =  event.body;
      config = configModule.getConfig(event, context);
      service_id = "ghd93-3240-2343";
    })

    it("should return error message if request to start jenkins job failed ", () => {
      let bool = false;
      let responseObject = {
        statusCode: 401,
        body: {
          message: "401 UNAUTHORIZED Jenkins Job Not triggered"
        }
      };
      let reqStub = sinon.stub(request, "Request", (obj) => {
        let errObject = {
          message: responseObject.body.message,
          jenkins_api_failure: true
        }
        return obj.callback(errObject, responseObject, responseObject.body);
      });
      index.startServiceOnboarding(service_creation_data, config, service_id).then(() => {
        assert.fail();
      }).catch((err) => {
        if (err.jenkins_api_failure && err.message != null) {
          bool = true;
        }
        assert.isTrue(bool);
      })
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    })

    it("should return error message when jenkins job has failed", () => {
      let bool = false;
      let errMessage = "Failed to kick off service onboarding job."
      let responseObject = {
        statusCode: 401,
        body: {
          message: "401 UNAUTHORIZED Jenkins Job Failed"
        }
      };
      let reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      index.startServiceOnboarding(service_creation_data, config, service_id).then(() => {
        assert.fail();
      }).catch((err) => {
        if (err.jenkins_api_failure && err.message && err.message === errMessage) {
          bool = true;
        }
        assert.isTrue(bool);
      })
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    })

    it("should return success message when jenkins job has executed succesfully", () => {
      let bool = false;
      let Message = "Successfully created your service.";
      let responseObject = {
        statusCode: 200,
        body: {
          message: "Service Creation Success"
        }
      };
      let reqStub = sinon.stub(request, "Request", (obj) => {
        return obj.callback(null, responseObject, responseObject.body);
      });
      index.startServiceOnboarding(service_creation_data, config, service_id).then((res) => {

        if (res && res === Message) {
          bool = true;
        }
        assert.isTrue(bool);
      })
      sinon.assert.calledOnce(reqStub);
      reqStub.restore()
    })

  })
})
