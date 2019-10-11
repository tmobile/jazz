// =========================================================================
// Copyright ©  2017 T-Mobile USA, Inc.
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
const AWS = require('aws-sdk-mock');

const nock = require('nock');
var context, event;
const endpointHost = "https://localhost/admin/functions";
const endpointPath = "/myfunction?code=xyz";

describe('handler', () => {

    function stub(statusCode) {
        nock(endpointHost)
            .post(endpointPath)
            .reply(statusCode, "{}");

    }
    describe('invoke http', () => {
        beforeEach(() => {

            event = {
                "method": "POST",
                "stage": "test",
                "query": {
                    "service_name": "jazz-service",
                    "username": "xyz",
                    "last_evaluated_key": undefined
                },
                "body": {
                    "functionARN": endpointHost+ endpointPath,
                    "inputJSON": {
                        "name": "applesdadasdasd777"
                    }
                }
            };
            context = {};
        });

        it('test endpoint OK', (done) => {
            stub(202);
            index.handler(event, context, (error, records) => {
                expect(records.data.execStatus).to.eq("Success");
                done();
            });
        });

        it('test endpoint BAD request', (done) => {
            stub(500);
            index.handler(event, context, (error, records) => {
                expect(records.data.execStatus).to.eq("FunctionInvocationError");
                done();
            });
        });
    });

})
