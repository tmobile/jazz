
const expect = require('chai').expect;
const index = require('../index');
const nock = require('nock');
const endpointHost = "https://localhost/admin/functions";
const endpointPath = "/myfunction?code=xyz";

let event;

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
                    "functionARN": endpointHost + endpointPath,
                    "inputJSON": {
                        "name": "applesdadasdasd777"
                    }
                }
            };

        });

        it('endpoint OK', (done) => {
            stub(202);
            index.handler(event, context, (error, records) => {
                expect(records.data.execStatus).to.eq("Success");
                expect(records.data.payload.StatusCode).to.eq(200);
                expect(records.input.functionARN).to.eq(endpointHost + endpointPath);
                done();
            });
        });

        it('endpoint error response', (done) => {
            stub(500);
            index.handler(event, context, (error, records) => {
                expect(records.data.execStatus).to.eq("FunctionInvocationError");
                expect(records.data.payload.StatusCode).to.eq(500);
                expect(records.input.functionARN).to.eq(endpointHost + endpointPath);
                done();
            });
        });
    });

})
