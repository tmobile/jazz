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

const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
const configObj = require('../components/config.js');

describe('jazz_email', function () {

  beforeEach(function () {
    event = {
      "stage": "test",
      "method": "POST",
      "principalId": "test@test.com",
      "body": {}
    };
    callback = (err, responseObj) => {
      if (err) {
        return err;
      } else {
        return JSON.stringify(responseObj);
      }
    };
    err = {
      "errorType": "foo",
      "message": "bar"
    };
    callbackObj = {
      "callback": callback
    };
    config = configObj.getConfig(event, context);
    context = awsContext();
  });

  describe('validation tests', () => {
    it("should indicate that event is missing/empty", () => {
      let errorMessage = "invalid or missing arguments";
      let errorType = 'BadRequest';
      let errorCodeNum = "101";
      let tempEvent = {};

      index.validateInput(tempEvent)
        .catch(error => {
          expect(error).to.include({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          })
        });
    });

    it("should indicate that event is missing method property", () => {
      let errorMessage = "invalid or missing arguments";
      let errorType = 'BadRequest';
      let errorCodeNum = "101";
      let tempEvent = {
        "stage": "test",
        "principalId": "test@test.com"
      }

      index.validateInput(tempEvent)
        .catch(error => {
          expect(error).to.include({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          })
        });
    });

    it("should raise error when event is missing prinicipal id property", () => {
      let errorMessage = "You aren't authorized to access this resource";
      let errorType = 'Forbidden';
      let errorCodeNum = "102";
      let tempEvent = {
        "stage": "test",
        "method": "POST",
      }

      index.validateInput(tempEvent)
        .catch(error => {
          expect(error).to.include({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          })
        });
    });

    it("should raise error when event is not of method type POST", () => {
      let errorMessage = "Service operation not supported";
      let errorType = 'BadRequest';
      let errorCodeNum = "103";
      event.method = "GET";

      index.validateInput(event)
        .catch(error => {
          expect(error).to.include({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          })
        });
    });

    it("should raise error when event is missing body property", () => {
      let errorMessage = "Required params - from, to, subject missing";
      let errorType = 'BadRequest';
      let errorCodeNum = "104";
      let tempEvent = {
        "stage": "test",
        "method": "POST",
        "principalId": "test@test.com"
      }

      index.validateInput(tempEvent)
        .catch(error => {
          expect(error).to.include({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          })
        });
    });

    it("should raise error when event.body is missing from property", () => {
      let errorMessage = "Required params - from, to, subject missing";
      let errorType = 'BadRequest';
      let errorCodeNum = "104";

      index.validateInput(event)
        .catch(error => {
          expect(error).to.include({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          })
        });
    });

    it("should raise error when event.body is missing to property", () => {
      let errorMessage = "Required params - from, to, subject missing";
      let errorType = 'BadRequest';
      let errorCodeNum = "104";
      event.body.from = "allie@test.com";

      index.validateInput(event)
        .catch(error => {
          expect(error).to.include({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          })
        });
    });

    it("should raise error when event.body is missing subject property", () => {
      let errorMessage = "Required params - from, to, subject missing";
      let errorType = 'BadRequest';
      let errorCodeNum = "104";
      event.body.from = "allie@test.com";
      event.body.to = "bob@test.com";

      index.validateInput(event)
        .catch(error => {
          expect(error).to.include({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          })
        });
    });

    it("should raise error when config file cannot be loaded", () => {
      let errorMessage = "Internal error, please reach out to admins";
      let errorType = 'InternalServerError';
      let errorCodeNum = "101";
      event.stage = "";

      index.handler(event, context, (error, data) => {
          expect(error).to.equal(JSON.stringify({
            errorCode: errorCodeNum,
            errorType: errorType,
            message: errorMessage
          }))
        });
    });

    it("should indicate that event is successfully validated", () => {
      event.body.from = "allie@test.com";
      event.body.to = "bob@test.com";
      event.body.subject = "validation tests";

      index.validateInput(event)
        .then(res => {
          expect(res).to.deep.equal(event);
        });
    });
  });

  describe('handler', () => {
    it("should indicate appropriate error(BadRequest) when validateInput returns error", () => {
      const result = {
        errorCode: "104",
        errorType: "BadRequest",
        message: "Required params - from, to, subject missing"
      }
      const validateInput = sinon.stub(index, "validateInput").rejects(result);

      index.handler(event, context, (error, data) => {
        expect(error).to.equal(JSON.stringify(result));
        sinon.assert.calledOnce(validateInput);
        validateInput.restore();
      });
    });

    it("should indicate appropriate error(BadRequest) when validateInput is rejected without error type", () => {
      const result = {
        code: "104",
        message: "Required params - from, to, subject missing"
      }
      const retResult = {
        errorCode: "104",
        errorType :"BadRequest",
        message: "Required params - from, to, subject missing"
      }
      const validateInput = sinon.stub(index, "validateInput").rejects(result);

      index.handler(event, context, (error, data) => {
        expect(error).to.equal(JSON.stringify(retResult));
        sinon.assert.calledOnce(validateInput);
        validateInput.restore();
      });
    });

    it("should indicate appropriate error(InternalServerError) when validateInput is rejected without error type or error code", () => {
      const result = {
        message: "Required params - from, to, subject missing"
      }
      const validateInput = sinon.stub(index, "validateInput").rejects(result);
      event.body.to = "bob@test.com";
      const retError = {
        errorCode: "106",
        errorType: "InternalServerError",
        message: "Failed while sending email to: " + event.body.to
      }

      index.handler(event, context, (error, data) => {
        expect(error).to.equal(JSON.stringify(retError));
        sinon.assert.calledOnce(validateInput);
        validateInput.restore();
      });
    });

    it("should indicate success", () => {
      const result = {
        result : "success",
        message : "testId"
      }
      const validateInput = sinon.stub(index, "validateInput").resolves();
      const sendEmail = sinon.stub(index, "sendEmail").resolves();

      index.handler(event, context, (error, data) => {
        expect(data).to.equal(JSON.stringify(result));
        sinon.assert.calledOnce(validateInput);
        sinon.assert.calledOnce(sendEmail);
        validateInput.restore();
        sendEmail.restore();
      });
    });





  });
});