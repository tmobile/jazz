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
'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;
const awsContext = require('aws-lambda-mock-context');
const AWS = require("aws-sdk-mock");
const sinon = require('sinon');

const index = require('../index');
const configModule = require("../components/config.js");

let event, config, err, interestedEvents;

describe('jazz events handler tests: ', function () {
  beforeEach(() => {
    context = awsContext();
    event = {
      "stage": "test",
      "Records": [{
        "kinesis": {
          "partitionKey": "CREATE_ASSET",
          "sequenceNumber": "49584481860528260622422554690105735408360629197594427394",
          "data": "",
          "approximateArrivalTimestamp": 1526472764.125
        }
      },
      {
        "kinesis": {
          "partitionKey": "UPDATE_ASSET",
          "sequenceNumber": "49584481860528260622422554690105735408360629197594427395",
          "data": "",
          "approximateArrivalTimestamp": 1526472765.125
        }
      }]
    };
    config = configModule.getConfig(event, context);
    err = {
      "errorType": "foo",
      "message": "bar"
    };
  });

  describe('getEvents tests', function () {
    it("should indicate error if DynamoDB.DocumentClient.scan fails", () => {
      let message = "Unable to scan Event Names table to fetch interested events";
      AWS.mock("DynamoDB.DocumentClient", "scan", (params, cb) => {
        return cb(err, null);
      });
      index.getEvents(config)
        .catch(error => {
          expect(error.db_error).to.include(message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should get interested events and return them successfully", () => {
      let counter = 0;
      let payload1 = {
        Items: [
          {
            EVENT_NAME: {
              S: 'CREATE_DEPLOYMENT'
            }
          },
          {
            EVENT_NAME: {
              S: 'CREATE_ASSET'
            }
          },
          {
            EVENT_NAME: {
              S: 'UPDATE_DEPLOYMENT'
            }
          }
        ],
        LastEvaluatedKey: "T3ST_1"
      }

      let payload2 = {
        Items: [
          {
            EVENT_NAME: {
              S: 'CREATE_BRANCH'
            }
          },
          {
            EVENT_NAME: {
              S: 'UPDATE_BRANCH'
            }
          },
          {
            EVENT_NAME: {
              S: 'DELETE_BRANCH'
            }
          }
        ]
      }
      AWS.mock("DynamoDB.DocumentClient", "scan", (params, cb) => {
        if (counter === 0) {
          counter++;
          return cb(null, payload1);
        }
        else {
          return cb(null, payload2);
        }
      });
      index.getEvents(config)
        .then(res => {
          expect(res).to.have.length(6);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });
  });

  describe('processEachEvent tests', function () {
    beforeEach(() => {
      let payload = {
        "EVENT_ID": {
          "S": "T3ST-1D"
        },
        "TIMESTAMP": {
          "S": "2018-11-19T10:00:00:007"
        },
        "REQUEST_ID": {
          "S": "T3ST-REQUEST-1D"
        },
        "EVENT_HANDLER": {
          "S": "JENKINS"
        },
        "EVENT_NAME": {
          "S": "CREATE_ASSET"
        },
        "SERVICE_NAME": {
          "S": "jazztest-testapi"
        },
        "SERVICE_ID": {
          "S": "T3ST-S3RV1C3-1D"
        }
      }
      let encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
      event.Records[0].kinesis.data = encoded;
      interestedEvents = [
        'CREATE_DEPLOYMENT',
        'CREATE_ASSET',
        'UPDATE_DEPLOYMENT',
        'CREATE_BRANCH',
        'UPDATE_BRANCH',
        'DELETE_BRANCH'
      ]
    });

    it("should indicate error if DynamoDB.putItem fails", () => {
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });
      index.processEachEvent(event.Records[0], config, interestedEvents)
        .catch(error => {
          expect(error).to.deep.eq(err);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should process interested event", () => {
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        let data = {
          "message": "success"
        }
        return cb(null, data);
      });
      let message = {
        "message": "successfully processed interested event"
      };

      index.processEachEvent(event.Records[0], config, interestedEvents)
        .then(res => {
          expect(res).to.deep.eq(message);
          AWS.restore("DynamoDB.DocumentClient");
        });
    });

    it("should not process un-interested event", () => {
      event.Records[0].kinesis.partitionKey = "DELETE_ASSET";
      let message = {
        "message": "successfully processed un-interested event"
      };

      index.processEachEvent(event.Records[0], config, interestedEvents)
        .then(res => {
          expect(res).to.deep.eq(message);
        });
    });
  });

  describe('processRecords tests', function () {
    beforeEach(() => {
      interestedEvents = [
        'CREATE_DEPLOYMENT',
        'CREATE_ASSET',
        'UPDATE_DEPLOYMENT',
        'CREATE_BRANCH',
        'UPDATE_BRANCH',
        'DELETE_BRANCH'
      ]
    });

    it("should not indicate an error when DynamoDB.DocumentClient.put throws an error", () => {
      AWS.mock("DynamoDB.DocumentClient", "put", (params, cb) => {
        return cb(err, null);
      });
      index.processRecords(config, event, interestedEvents)
        .then(res => {
          expect(res).to.be.undefined;
          AWS.restore("DynamoDB.DocumentClient");
        })
    });

    it("should successfully process interested events", () => {
      let result = [
        { "message": "successfully processed interested event" },
        { "message": "successfully processed interested event" }
      ];
      const processEachEvent = sinon.stub(index, "processEachEvent")
        .resolves({ "message": "successfully processed interested event" });

      index.processRecords(config, event, interestedEvents)
        .then(res => {
          expect(res).to.deep.eq(result);
          sinon.assert.calledTwice(processEachEvent)
          processEachEvent.restore();
        });
    });
  });

  describe('handler', function() {
    it("should successfully process event", () => {
      const getEvents = sinon.stub(index, "getEvents").resolves(interestedEvents);
      const processRecords = sinon.stub(index, "processRecords").resolves();

      index.handler(event, context, (error, data) => {
        sinon.assert.calledOnce(getEvents);
        sinon.assert.calledOnce(processRecords);
        getEvents.restore();
        processRecords.restore();
      });
    });
  });

});
