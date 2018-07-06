const expect = require('chai').expect;
const awsContext = require('aws-lambda-mock-context');
const request = require('request');
const sinon = require('sinon');

const index = require('../index');
const configObj = require('../components/config.js');

describe('jazz_is-slack-channel-available', function () {
  var event, config, context, reqStub, err;

  beforeEach(function () {
    event = {
      method: "GET",
      query: {
        "slack_channel": "test-channel"
      },
      principalId: "abc@yz.com",
      stage: "test"
    }
    context = awsContext();
    config = configObj.getConfig(event, context);
    err = {
      "errorType": "svtfoe",
      "message": "starco"
    };
  })

  describe('genericInputValidation', () => {
    it("should indicate that method is undefined/empty", () => {
      event.method = "";
      index.genericInputValidation(event)
        .catch(error => expect(error).to.include({
          result: 'inputError',
          message: 'method cannot be empty'
        }));
    });

    it("should indicate that method is unsupported if it is not GET", () => {
      var invalidArray = ["POST", "PUT", "DELETE"];
      invalidArray.forEach(method => {
        event.method = method;
        index.genericInputValidation(event)
          .catch(error => expect(error).to.include({
            result: 'inputError',
            message: 'Unsupported method/request'
          }));
      });
    });

    it("should indicate that query parameter(slack_channel) is missing", () => {
      event.query = {};
      index.genericInputValidation(event)
        .catch(error => expect(error).to.include({
          result: 'inputError',
          message: 'Missing input parameter slack_channel'
        }));
    });

    it("should indicate unauthorized error", () => {
      event.principalId = "";
      index.genericInputValidation(event)
        .catch(error => expect(error).to.include({
          result: 'unauthorized',
          message: 'Unauthorized.'
        }));
    });

    it("should successfully validate input data", () => {
      index.genericInputValidation(event)
        .then(res => expect(res).to.eq(event.query.slack_channel))
    });
  });

  describe('getResponse', () => {
    var channel_url ,channel_name;

    beforeEach(() => {
      channel_url = config.public_channel_endpoint;
      channel_name = event.query.slack_channel;
    });

    it("should successfully search private slack channel in user's slack list", () => {
      var list = { ok: true,
        channels:
         [ { id: 'A1B2C3D4E', name: 'general', is_channel: true },
           { id: 'A1B2C3D4F', name: 'jazz', is_channel: true },
           { id: 'A1B2C3D4G', name: 'test-channel', is_channel: true },
           { id: 'A1B2C3D4H', name: 'random', is_channel: true },
           { id: 'A1B2C3D4I', name: 'test', is_channel: true } ] }
      var resObj = {
        body: JSON.stringify(list)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.getResponse(channel_url, channel_name)
        .then(res => {
          expect(res).to.eq('true');
          sinon.assert.calledOnce(reqStub);
          reqStub.restore();
        });
    });

    it("should successfully search group slack channel in user's slack list", () => {
      var list = { ok: true,
        groups:
         [ { id: 'A1B2C3D4E', name: 'general', is_channel: true },
           { id: 'A1B2C3D4F', name: 'jazz', is_channel: true },
           { id: 'A1B2C3D4G', name: 'test-channel', is_channel: true },
           { id: 'A1B2C3D4H', name: 'random', is_channel: true },
           { id: 'A1B2C3D4I', name: 'test', is_channel: true } ] }
      var resObj = {
        body: JSON.stringify(list)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.getResponse(channel_url, channel_name)
        .then(res => {
          expect(res).to.eq('true');
          sinon.assert.calledOnce(reqStub);
          reqStub.restore();
        });
    });

    it("should indicate false if slack channel is not available in user's slack list", () => {
      var list = { ok: true,
        channels:
         [ { id: 'A1B2C3D4E', name: 'general', is_channel: true },
           { id: 'A1B2C3D4F', name: 'jazz', is_channel: true },
           { id: 'A1B2C3D4H', name: 'random', is_channel: true },
           { id: 'A1B2C3D4I', name: 'test', is_channel: true } ] }
      var resObj = {
        body: JSON.stringify(list)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.getResponse(channel_url, channel_name)
        .then(res => {
          expect(res).to.eq('false');
          sinon.assert.calledOnce(reqStub);
          reqStub.restore();
        });
    });

    it("should indicate false if user's slack list is empty", () => {
      var list = { ok: true, channels: [] };
      var resObj = {
        body: JSON.stringify(list)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.getResponse(channel_url, channel_name)
        .then(res => {
          expect(res).to.eq('false');
          sinon.assert.calledOnce(reqStub);
          reqStub.restore();
        });
    });

    it("should indicate false if slack_token is invalid(invalid auth)", () => {
      var list = { ok: false, error: 'invalid_auth' };
      var resObj = {
        body: JSON.stringify(list)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.getResponse(channel_url, channel_name)
        .then(res => {
          expect(res).to.eq('false');
          sinon.assert.calledOnce(reqStub);
          reqStub.restore();
        });
    });

    it("should indicate error if request to slack api fails", () => {
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(err, null, null);
      });
      index.getResponse(channel_url, channel_name)
        .catch(error => {
          expect(error).to.eq(err);
          sinon.assert.calledOnce(reqStub);
          reqStub.restore();
        });
    });

  });

  describe('requestToChannels', () => {
    it("should successfully search provided slack_channel in the user's list", () => {
      const getResponse = sinon.stub(index, "getResponse").resolves('true');

      index.requestToChannels(config, event.query.slack_channel)
        .then(res => {
          expect(res).to.have.property('is_available');
          expect(res.is_available).to.be.true;
          sinon.assert.calledTwice(getResponse);
          getResponse.restore();
        });
    });

    it("should indicate that provided slack_channel is not available in the user's list", () => {
      const getResponse = sinon.stub(index, "getResponse").resolves('false');

      index.requestToChannels(config, event.query.slack_channel)
        .then(res => {
          expect(res).to.have.property('is_available');
          expect(res.is_available).to.be.false;
          sinon.assert.calledTwice(getResponse);
          getResponse.restore();
        });
    });

    it("should indicate error if request to slack api fails", () => {
      const getResponse = sinon.stub(index, "getResponse").rejects(err);

      index.requestToChannels(config, event.query.slack_channel)
        .catch(error => {
          expect(error).to.include({ errorType: 'svtfoe', message: 'starco' });
          sinon.assert.calledTwice(getResponse);
          getResponse.restore();
        });
    });

  });

  describe('handler', () => {
    it("should successfully search provided slack channel", () => {
      const genericInputValidation = sinon.stub(index, "genericInputValidation").resolves(event.query.slack_channel);
      const requestToChannels = sinon.stub(index, "requestToChannels").resolves({is_available: true});

      index.handler(event, context, (error, res) => {
        expect(res).to.have.deep.property('data.is_available');
        expect(res.data.is_available).to.be.true;
        sinon.assert.calledOnce(genericInputValidation);
        sinon.assert.calledOnce(requestToChannels);
        genericInputValidation.restore();
        requestToChannels.restore();
      });
    });

    it("should indicate that provided slack is not available", () => {
      const genericInputValidation = sinon.stub(index, "genericInputValidation").resolves(event.query.slack_channel);
      const requestToChannels = sinon.stub(index, "requestToChannels").resolves({is_available: false});

      index.handler(event, context, (error, res) => {
        expect(res).to.have.deep.property('data.is_available');
        expect(res.data.is_available).to.be.false;
        sinon.assert.calledOnce(genericInputValidation);
        sinon.assert.calledOnce(requestToChannels);
        genericInputValidation.restore();
        requestToChannels.restore();
      });
    });

    it("should indicate bad request if there is input error", () => {
      const genericInputValidation = sinon.stub(index, "genericInputValidation").rejects({
        result: "inputError",
        message: "Missing input parameter slack_channel"
      });

      index.handler(event, context, (error, res) => {
        expect(error).to.include('{"errorType":"BadRequest","message":"Missing input parameter slack_channel"}')
        sinon.assert.calledOnce(genericInputValidation);
        genericInputValidation.restore();
      });
    });

    it("should indicate unauthorized error", () => {
      const genericInputValidation = sinon.stub(index, "genericInputValidation").rejects({
        result: "unauthorized",
        message: "Unauthorized."
      });

      index.handler(event, context, (error, res) => {
        expect(error).to.include('{"errorType":"Unauthorized","message":"Unauthorized."}')
        sinon.assert.calledOnce(genericInputValidation);
        genericInputValidation.restore();
      });
    });

    it("should indicate internal server error", () => {
      const genericInputValidation = sinon.stub(index, "genericInputValidation").resolves(event.query.slack_channel);
      const requestToChannels = sinon.stub(index, "requestToChannels").rejects(err);

      index.handler(event, context, (error, res) => {
        expect(error).to.include('{"errorType":"InternalServerError","message":"Unhandled error."}');
        sinon.assert.calledOnce(genericInputValidation);
        sinon.assert.calledOnce(requestToChannels);
        genericInputValidation.restore();
        requestToChannels.restore();
      });
    });

  });
});
