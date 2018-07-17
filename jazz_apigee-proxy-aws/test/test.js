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
const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
const AWS = require('aws-sdk-mock');

describe('handler tests', () => {
  let event, context;
  beforeEach(() => {
    context = awsContext();
    event = {
      "region": "us-east-1",
      "functionName": "apigeejazz3-mytest-testapi-prod",
      "body": "{\"test\":\"body\"}",
      "resource": "/{proxy+}",
      "requestContext": {
        "resourceId": "123456",
        "apiId": "1234567890",
        "resourcePath": "/{proxy+}",
        "httpMethod": "POST",
        "requestId": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
        "accountId": "123456789012",
        "identity": {
          "apiKey": null,
          "userArn": null,
          "cognitoAuthenticationType": null,
          "caller": null,
          "userAgent": "Custom User Agent String",
          "user": null,
          "cognitoIdentityPoolId": null,
          "cognitoIdentityId": null,
          "cognitoAuthenticationProvider": null,
          "sourceIp": "127.0.0.1",
          "accountId": null
        },
        "stage": "prod"
      },
      "queryStringParameters": {
        "foo": "bar"
      },
      "headers": {
        "Via": "1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)",
        "Accept-Language": "en-US,en;q=0.8",
        "CloudFront-Is-Desktop-Viewer": "true",
        "CloudFront-Is-SmartTV-Viewer": "false",
        "CloudFront-Is-Mobile-Viewer": "false",
        "X-Forwarded-For": "127.0.0.1, 127.0.0.2",
        "CloudFront-Viewer-Country": "US",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Upgrade-Insecure-Requests": "1",
        "X-Forwarded-Port": "443",
        "Host": "1234567890.execute-api.us-east-1.amazonaws.com",
        "X-Forwarded-Proto": "https",
        "X-Amz-Cf-Id": "cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA==",
        "CloudFront-Is-Tablet-Viewer": "false",
        "Cache-Control": "max-age=0",
        "User-Agent": "Custom User Agent String",
        "CloudFront-Forwarded-Proto": "https",
        "Accept-Encoding": "gzip, deflate, sdch"
      },
      "pathParameters": {
        "proxy": "path/to/resource"
      },
      "method": "POST",
      "stageVariables": {
        "baz": "qux"
      },
      "path": "/path/to/resource"
    };
  });

  afterEach(() => {
    event = {};
    context = {};
  });

  it("return error message when there is no payload response", () => {

    index.handler(event, context, (err, res) => {
      expect(err).to.eq("No payload response recieved.");
    });
  });

  it("return error message when common lamba fails", () => {
    AWS.mock('Lambda', 'invoke', (params, callback) => {
      callback("error");
    });

    index.handler(event, context, (err, res) => {
      expect(JSON.parse(err).errorType).to.eq("Common Lambda Integration Error");
      AWS.restore('Lambda');
    });
  });

  it("throw error when lambda fails due to missing param", () => {
    event.functionName = null;
    const data = {
      "Payload":
        "{\"message\":\"handled error\"}"
    };

    AWS.mock('Lambda', 'invoke', (params, callback) => {
      callback(null, data);
    });

    index.handler(event, context, (err, res) => {
      expect(JSON.parse(err).errorType).to.eq("Missing Required Params");
      AWS.restore('Lambda');
    });
  });

  it("successfully invoke lambda", () => {
    const data = {
      "Payload": "\"Success\""
    };

    AWS.mock('Lambda', 'invoke', (params, callback) => {
      callback(null, data);
    });

    index.handler(event, context, (err, res) => {

      expect(res).to.eq("Success");
      AWS.restore('Lambda');
    });
  });

  it("throw error when underlying lambda fails due to unhandled error", () => {
    const data = {
      "Payload":
        "{\"errorMessage\":\"unhandled error\"}"
    };

    AWS.mock('Lambda', 'invoke', (params, callback) => {
      callback(null, data);
    });

    index.handler(event, context, (err, res) => {

      expect(JSON.parse(err).errorType).to.eq("Service Unavailable");
      expect(JSON.parse(err).message).to.eq("unhandled error");
      AWS.restore('Lambda');
    });
  });

  it("throw error when underlying lambda fails due to handled error", () => {
    const data = {
      "Payload":
        "{\"message\":\"handled error\"}"
    };

    AWS.mock('Lambda', 'invoke', (params, callback) => {
      callback(null, data);
    });

    index.handler(event, context, (err, res) => {

      expect(JSON.parse(err).errorType).to.eq("Service Unavailable");
      expect(JSON.parse(err).message).to.eq("handled error");
      AWS.restore('Lambda');
    });
  });
});
