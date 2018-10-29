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
const request = require('request');

const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
const configObj = require('../components/config.js');

describe('jazz_admin', function () {

  beforeEach(function () {
    spy = sinon.spy();
    event = {
      "stage": "test",
      "method": "GET",
      "principalId" : "test@test.com",
      "body":{}
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

   it("should state that POST method is not supported", function () {
      event.method = "POST";
      index.handler(event, context, (error, data) => {
        expect(error).to.include('{"errorType":"BadRequest","message":"The requested method is not supported"}');
      });
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

  describe('getInstallerVarsJSON', () => {

    it("should indicate error while making request to gitlab repo", () => {
      config.SCM_TYPE = "gitlab";
      var responseObj = {
        statusCode: 401,
        body: {
          data: {},
          message: "Unauthorized"
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      index.getInstallerVarsJSON(config)
        .catch(error => {
          expect(error).to.include('Unauthorized');
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should indicate error while making request to bitbucket repo", () => {
      config.SCM_TYPE = "gitlab";
      var responseObj = {
        statusCode: 401,
        body: {
          data: {},
          message: "Unauthorized"
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      index.getInstallerVarsJSON(config)
        .catch(error => {
          expect(error).to.include('Unauthorized');
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should successfully get installer variables on request", () => {
      var responseObj = {
        statusCode: 200,
        body: "{\"CRED_ID\": \"jazzaws\", \"INST_PRE\": \"jazzsw\"}"
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      index.getInstallerVarsJSON(config)
        .then(res => {
          expect(res).to.deep.eq(JSON.parse(responseObj.body));
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });
  });

  describe('handler', () => {

    it("should indicate internal server error when admin file is not fetched", () => {
      var responseObj = {
        statusCode: 401,
        body: {
          data: {},
          message: "Unauthorized"
        }
      };
      const getInstallerVarsJSON = sinon.stub(index, "getInstallerVarsJSON").rejects(responseObj.body.message)
      message = '{"errorType":"InternalServerError","message":"Failed to load config file."}';
      index.handler(event, context, (err, res) => {
        expect(err).to.include(message);
      });

      sinon.assert.calledOnce(getInstallerVarsJSON);
      getInstallerVarsJSON.restore();
    });

    it("should return admin file as response on success", () => {
      var responseObj = {
        body: {
          "CRED_ID": "jazzaws", 
          "INST_PRE": "jazzsw"
        }
      };
      const getInstallerVarsJSON = sinon.stub(index, "getInstallerVarsJSON").resolves(responseObj.body);
      index.handler(event, context, (err, res) => { 
        expect(res.data.config).to.deep.eq(responseObj.body);
        sinon.assert.calledOnce(getInstallerVarsJSON);
        getInstallerVarsJSON.restore();
      });
    });
  });

});

