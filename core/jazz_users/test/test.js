const expect = require("chai").expect;
const awsContext = require("aws-lambda-mock-context");
const AWS = require('aws-sdk-mock');
const sinon = require("sinon");
const index = require('../index');
const validation = require("../components/validation.js");
const getList = require("../components/getList.js");
const configModule = require("../components/config.js");

describe('jazz_users', () => {
  var event, context, error;

  beforeEach(() => {
    event = {
      method: "GET",
      stage: "test",
      principalId: "abc"
    };
    context = awsContext();
    config = configModule.getConfig(event, context);
  });

  describe("validation", () => {
    it("throws error if event is undefined", () => {
      event = undefined;
      expect(() => validation.genericInputValidation(event)).to.throw();
    });

    it("throws error if method is undefined", () => {
      event.method = undefined;
      expect(() => validation.genericInputValidation(event)).to.throw();
    });

    it("throws error if method is undefined", () => {
      event.principalId = undefined;
      expect(() => validation.genericInputValidation(event)).to.throw();
    });

    it("Input validation is done successfully ", () => {
      let res = validation.genericInputValidation(event)
      expect(res).to.be.undefined;
    });
  });

  describe("handler", () => {

    it("should indicate internal server error if event is undefined/empty", () => {
      let genericValidation = sinon.stub(validation, "genericInputValidation").throws("Input parameters are missing.");
      event = undefined;
      index.handler(event, context, (err, res) => {
        expect(err).to.include("Input parameters are missing.");
        expect(err).to.include("InternalServerError")
        sinon.assert.calledOnce(genericValidation);
        genericValidation.restore();
      });
    });

    it("should indicate error while getting list of users", () => {
      error = '{"errorType":"InternalServerError","message":"Error while accessing user list"}';
      let genericValidation = sinon.stub(validation, "genericInputValidation");
      let listUsers = sinon.stub(getList, "listUsers").rejects("Error while accessing user list");
      index.handler(event, context, (err, res) => {
        expect(err).to.include(error);
        sinon.assert.calledOnce(genericValidation);
        sinon.assert.calledOnce(listUsers);
        genericValidation.restore();
        listUsers.restore();
      });
    });

    it("should successfully get users list", () => {
      let genericValidation = sinon.stub(validation, "genericInputValidation");
      let listUsers = sinon.stub(getList, "listUsers").resolves("userList");
      index.handler(event, context, (err, res) => {
        expect(res).to.have.all.keys("data", "input");
        expect(res.data).to.eq("userList");
        sinon.assert.calledOnce(genericValidation);
        sinon.assert.calledOnce(listUsers);
        genericValidation.restore();
        listUsers.restore();
      });
    });

    it("handler function doesn't execute for different methods", () => {
      event.method = "POST";
      let genericValidation = sinon.stub(validation, "genericInputValidation");
      index.handler(event, context, (err, res) => {
        sinon.assert.calledOnce(genericValidation);
        genericValidation.restore();
      });
    });

  });

  describe("getList", () => {
    it("should indicate error while sending request to cognito client to get list of users", () => {
      error = {
        message: "Internal server error"
      };

      AWS.mock("CognitoIdentityServiceProvider", "listUsers", function (params, callback) {
        callback(error, null);
      });

      getList.listUsers(config)
        .catch(err => {
          expect(err).to.include(error);
          AWS.restore("CognitoIdentityServiceProvider");
        });
    });

    it("should successfully send request to cognito client to get list of users", () => {
      let result = {
        Users: [{
          "Username": "abc123",
          "Attributes":[
            {
              "Name": "email",
              "Value": "abc@xyz.com"
            }
          ],
          "UserCreateDate": "2019-01-17T20:53:27.145Z",
          "UserLastModifiedDate": "2019-01-17T20:53:28.157Z",
          "Enabled": true,
          "UserStatus": "CONFIRMED"
        }, {
          "Username": "def123",
          "Attributes":[
            {
              "Name": "email",
              "Value": "xyz@abc.com"
            }
          ],
          "UserCreateDate": "2019-01-17T20:53:27.145Z",
          "UserLastModifiedDate": "2019-01-17T20:53:28.157Z",
          "Enabled": true,
          "UserStatus": "CONFIRMED"
        }]
      };

      let list = result.Users.map(each => {
        return each.Attributes[0].Value
      });

      AWS.mock("CognitoIdentityServiceProvider", "listUsers", function (params, callback) {
        callback(null, result);
      });

      getList.listUsers(config)
        .then(res => {
          list.forEach(each => {
            expect(res).to.include(each);
          });
        });
    });
  });

});
