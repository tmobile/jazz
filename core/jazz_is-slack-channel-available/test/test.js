const expect = require('chai').expect;
const awsContext = require('aws-lambda-mock-context');
const AWS = require("aws-sdk-mock");
const request = require('request');
const sinon = require('sinon');

const index = require('../index');

describe('jazz_is-slack-channel-available', function () {
  var event;

  beforeEach(function() {
    event = {
      method: "GET",
      query: {
        "slack_channel": "test-channel"
      },
      principalId: "abc@yz.com"
    }
  })

  describe('genericInputValidation', () => {
    it("should indicate that method is undefined/empty", () => {
      event.method = "";
      index.genericInputValidation(event)
      .catch(error => {
        console.log(error);
        expect(error).to.include({ result: 'inputError', message: 'method cannot be empty' });
      })
    })
  })
});
