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
const errorHandler = require("../components/error-handler.js")();
const configObj = require("../components/config.js");
const responseObj = require("../components/response.js"); //Import the response module.


describe('jazz_events', function () {

    var config, spy, event, callback, callbackObj, context, err, dynamodb;
    var dynamoCheck = function (dynamoMethod, sinonSpy) {
        var serviceName;
        //assign the correct aws service depending on the method to be used
        if (dynamoMethod == "scan" || dynamoMethod == "getItem") {
            serviceName = "DynamoDB";
        }
        //mocking DocumentClient from DynamoDB and wrapping with predefined spy
        AWS.mock(serviceName, dynamoMethod, sinonSpy);
        //trigger the spy by calling handler()
        var callFunction = index.handler(event, context, callback);
        AWS.restore(serviceName);
        var bool = sinonSpy.called;
        return bool;
    };

    beforeEach(function () {
        spy = sinon.spy();
        event = {
            "method": "",
            "stage": "test",
            "query": {
                "service_name": "jazz-service",
                "username": "xyz",
                "last_evaluated_key": undefined
            },
            "body": {
                "service_context": {},
                "event_handler": "JENKINS",
                "event_name": "CREATE_SERVICE",
                "service_name": "jazz-service",
                "event_status": "COMPLETED",
                "event_type": "test",
                "username": "xyz",
                "event_timestamp": "2018-01-23T10:28:10:136"
            }
        };
        callback = (err, responseObj) => {
            if (err) {
                return err;
            } else {
                return JSON.stringify(responseObj);
            }
        };
        context = awsContext();
        err = {
            "errorType": "svtfoe",
            "message": "starco"
        };

        //creating an object with the callback function in order to wrap and test callback parameters
        callbackObj = {
            "callback": callback
        };
        config = configObj(event);

    });

    it("should attempt to get item data from dynamoDB by query params if 'GET' method and query params are defined", () => {
        event.method = "GET";
        var attemptBool = dynamoCheck("scan", spy);
        assert.isTrue(attemptBool);
    });

    it("should get items for provided query from dynamoDB in getEvents function", () => {
        config = configObj(event);
        AWS.mock("DynamoDB", "scan", (params, callback) => {
            return callback(null, event.body)
        });
        var getEvents = index.getEvents(event, config);
        expect(getEvents.then((res) => {
            return res;
        })).to.eventually.deep.equal(event.body);
        AWS.restore("DynamoDB");
    });

    it("should indicate error if invalid query data is provided", () => {
        event.query = {
            invalid: "invalid"
        };
        AWS.mock("DynamoDB", "scan", (params, callback) => {
            return callback(null, event.body)
        })
        var getEvents = index.getEvents(event, config);
        expect(getEvents.then((res) => {
            return res;
        })).to.become(null);
        AWS.restore("DynamoDB");
    });

    it("should indicate error if query data is undefined", () => {
        event.query = {};
        var getEvents = index.getEvents(event, config);
        expect(getEvents.then((res) => {
            return res;
        })).to.become(null);
    });

    it("should indicate error if DynamoDB.scan fails during GET request", () => {
        config = configObj(event);
        AWS.mock("DynamoDB", "scan", (params, callback) => {
            return callback(err, null)
        });
        var getEvents = index.getEvents(event, config);
        expect(getEvents.then((res) => {
            return res;
        })).to.be.rejectedWith(err);
        AWS.restore("DynamoDB");
    });

    it("should map event data from dynamodb for GET request", () => {
        var eventBody = event.body;
        var dbResult = {
            Items: [{
                'SERVICE_CONTEXT': {
                    S: eventBody.service_context
                },
                'EVENT_NAME': {
                    S: eventBody.event_name
                },
                'SERVICE_NAME': {
                    S: eventBody.service_name
                },
                'EVENT_TYPE': {
                    S: eventBody.event_type
                },
                'EVENT_STATUS': {
                    S: eventBody.event_status
                },
                'USERNAME': {
                    S: eventBody.username
                },
                'EVENT_TIMESTAMP': {
                    S: eventBody.event_timestamp
                },
                'EVENT_HANDLER': {
                    S: eventBody.event_handler
                }
            }]
        }
        var result = {
            events: [event.body]
        }
        var mapGetEventData = index.mapGetEventData(dbResult, event);
        expect(mapGetEventData.then((res) => {
            return res;
        })).to.eventually.deep.equal(responseObj(result, event.query));
    });

    it("should indicate Bad request if no data available in dynamodb for GET request", () => {
        var dbResult = {};
        var message = "Bad request. message: The query parameters supported are username, service_name, and last_evaluated_index"
        var mapGetEventData = index.mapGetEventData(dbResult, event);
        expect(mapGetEventData.then((res) => {
            return res;
        })).to.be.rejectedWith(message);
    });

    it("should validate events input for POST request", () => {
        event.query = {}
        var generalInputValidation = index.generalInputValidation(event);
        expect(generalInputValidation.then((res) => {
            return res;
        })).to.become(undefined)
    });

    it("indicate error if event input is undefined for POST method", () => {
        event.body = ""
        var message = "Service inputs not defined!"
        var generalInputValidation = index.generalInputValidation(event);
        expect(generalInputValidation.then((res) => {
            return res;
        })).to.be.rejectedWith(message)
    });

    it("indicate error if service_context of event is undefined for POST method", () => {
        event.body.service_context = ""
        var message = "service_context not provided!"
        var generalInputValidation = index.generalInputValidation(event);
        expect(generalInputValidation.then((res) => {
            return res;
        })).to.be.rejectedWith(message)
    });

    it("indicate error if event_handler of event is undefined for POST method", () => {
        event.body.event_handler = ""
        var message = "event_handler not provided!"
        var generalInputValidation = index.generalInputValidation(event);
        expect(generalInputValidation.then((res) => {
            return res;
        })).to.be.rejectedWith(message)
    });

    it("should indicate success while updating kinesis stream", () => {
        config = configObj(event);
        var kinesisObj = {
            "event_id": "id"
        }
        AWS.mock("Kinesis", "putRecord", (params, cb) => {
            return cb(null, kinesisObj);
        });
        var storeEventData = index.storeEventData(config, event.body);
        expect(storeEventData.then((res) => {
            expect(res).to.include.keys('data');
            return res;
        }));
        AWS.restore('Kinesis');
    });

    it("should indicate error while updating kinesis stream", () => {
        config = configObj(event);
        var message = "Error storing event."
        AWS.mock("Kinesis", "putRecord", (params, cb) => {
            return cb(err, null);
        })
        var storeEventData = index.storeEventData(config, event.body);
        expect(storeEventData.then((res) => {
            return res;
        })).to.be.rejectedWith(message);
        AWS.restore('Kinesis');
    });

    it("should validate event specific data", () => {
        config = configObj(event);
        var dataObj = {
            Item: event.body
        };
        AWS.mock("DynamoDB", "getItem", (params, callback) => {
            return callback(null, dataObj);
        });
        var validateEventInput = index.validateEventInput(config, event.body);
        expect(validateEventInput.then((res) => {
            return res;
        })).to.become(null);
        AWS.restore("DynamoDB");
    });

    it("should indicate error while validating event specific data if DynamoDB.getItem fails", () => {
        config = configObj(event);
        var message = "error reading event data from database"
        AWS.mock("DynamoDB", "getItem", (params, callback) => {
            return callback(err, null);
        });
        var validateEventInput = index.validateEventInput(config, event.body);
        expect(validateEventInput.then((res) => {
            return res;
        })).to.be.rejectedWith(message);
        AWS.restore("DynamoDB");
    });

    it("should indicate error while validating event specific data if event timestamp is invalid", () => {
        config = configObj(event);
        event.body.event_timestamp = "xyz";
        var message = "Invalid EVENT TIMESTAMP: xyz, The format should be YYYY-MM-DDTHH:mm:ss:SSS"
        var dataObj = {
            Item: event.body
        };
        AWS.mock("DynamoDB", "getItem", (params, callback) => {
            return callback(null, dataObj);
        });
        var validateEventInput = index.validateEventInput(config, event.body);
        expect(validateEventInput.then((res) => {
            return res;
        })).to.be.rejectedWith(message);
        AWS.restore("DynamoDB");
    });

    it("should indicate success to get list of events for provided query params with GET method", () => {
        event.method = "GET";
        var eventBody = event.body;
        var dbResult = {
            Items: [{
                'SERVICE_CONTEXT': {
                    S: eventBody.service_context
                },
                'EVENT_HANDLER': {
                    S: eventBody.event_handler
                },
                'EVENT_NAME': {
                    S: eventBody.event_name
                },
                'SERVICE_NAME': {
                    S: eventBody.service_name
                },
                'EVENT_STATUS': {
                    S: eventBody.event_status
                },
                'EVENT_TYPE': {
                    S: eventBody.event_type
                },
                'USERNAME': {
                    S: eventBody.username
                },
                'EVENT_TIMESTAMP': {
                    S: eventBody.event_timestamp
                }
            }]
        }
        var result = {
            events: [event.body]
        }
        AWS.mock("DynamoDB", "scan", (params, callback) => {
            return callback(null, dbResult)
        });
        index.handler(event, context, (err, res) => {
            res.should.have.deep.property('data.events');
            AWS.restore("DynamoDB")
            return res;
        
        });
    });

    it("should indicate error if DynamoDB.scan fails", () => {
        event.method = "GET";
        var eventBody = event.body;
        var result = '{"errorType":"InternalServerError","message":"An internal error occured. message: ' + err.message + '"}'
        AWS.mock("DynamoDB", "scan", (params, callback) => {
            return callback(err, null)
        });
        index.handler(event, context, (err, res) => {
            err.should.be.equal(result);
            AWS.restore("DynamoDB");
            return err;
        });
    });

    it("should indicate error if DynamoDB.scan return with empty list of events for provided query params with GET method", () => {
        event.method = "GET";
        var eventBody = event.body;
        var dbResult = {}
        var result = '{"errorType":"BadRequest","message":"Bad request. message: The query parameters supported are username, service_name, and last_evaluated_index"}'
        AWS.mock("DynamoDB", "scan", (params, callback) => {
            return callback(null, dbResult)
        });
        index.handler(event, context, (err, res) => {
            err.should.be.equal(result);
            AWS.restore("DynamoDB")
            return err;
        });
    });

    it("should indicate success for updating event data to kinesis stream in POST method", () => {
        event.method = "POST";
        var dataObj = {
            Item: event.body
        };
        var kinesisObj = {
            "event_id": "id"
        };
        AWS.mock("DynamoDB", "getItem", (params, callback) => {
            return callback(null, dataObj);
        });
        AWS.mock("Kinesis", "putRecord", (params, cb) => {
            return cb(null, kinesisObj);
        })
        index.handler(event, context, (err, res) => {
            res.should.have.deep.property('data.event_id');
            AWS.restore("DynamoDB");
            AWS.restore("Kinesis");
            return res;
        })
    });

    it("should indicate error while updating event data to kinesis stream in POST method", () => {
        event.method = "POST";
        var dataObj = {
            Item: event.body
        };
        var result = '{"errorType":"InternalServerError","message":"An internal error occured. message: Error storing event. ' + err.message + '"}'
        AWS.mock("DynamoDB", "getItem", (params, callback) => {
            return callback(null, dataObj);
        });
        AWS.mock("Kinesis", "putRecord", (params, cb) => {
            return cb(err, null);
        })
        index.handler(event, context, (err, res) => {
            err.should.be.equal(result);
            AWS.restore("DynamoDB");
            AWS.restore("Kinesis");
            return err;
        
        })
    });


    it("should indicate error if DynamoDB.getItem fails in POST method", () => {
        event.method = "POST";
        var dataObj = {};
        var result = '{"errorType":"BadRequest","message":"Bad request. message: Invalid event data. ' + event.body.event_type + '"}'
        AWS.mock("DynamoDB", "getItem", (params, callback) => {
            return callback(null, dataObj);
        });
        index.handler(event, context, (err, res) => {
            err.should.be.equal(result);
            AWS.restore("DynamoDB");
            return err;
        })
    });
});