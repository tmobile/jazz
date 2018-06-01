// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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
const validation = require('../validation');
const utils = require('../utils');
const responseObj = require("../components/response.js");
const request = require('request');
const sinon = require('sinon')
const moment = require('moment');

describe('index', () => {
	describe('handler tests', () => {
		let sandbox;
		let event;

		beforeEach(() => {
			sandbox = sinon.createSandbox();
			event = {
				resourcePath: 'help',
				method: 'GET',
				stage: 'test',
				query: {}
			};
		});

		afterEach(() => {
			sandbox.restore();
			event = {};
		});

		it('should return error message when method is invalid', () => {
			event.method = 'POST';
			index.handler(event, {}, (err, res) => {
				expect(JSON.parse(err).message).to.equal("Service inputs not defined.");
			});
		});

		it('should return error message when getCodeqInputsUsingQuery returns error', () => {
			event.resourcePath = 'codeq';
			
			index.handler(event, {}, (err, res) => {
				expect(err).to.equal("report error");
				sinon.assert.calledOnce(getCodeqInputsUsingQueryStub);

			});
		});

		it('should return metrics when getResponseForHelpPathString is called successfully', () => {
			const query = {};

			const getQueryStub = sinon.stub(utils, "getQuery").returns(query);
			const getMetricsStub = sinon.stub(utils, "getMetrics").returns({ metrics: ['code-coverage'] });

			index.handler(event, {}, (err, res) => {
				expect(res.data.metrics[0].name).to.equal("code-coverage");
				sinon.assert.calledOnce(getQueryStub);
				sinon.assert.calledOnce(getMetricsStub);

				getQueryStub.restore();
				getMetricsStub.restore();
			});
		});

		it('should return error message when getResponseForHelpPathString and no metrics are returned', () => {
			const getQueryStub = sinon.stub(utils, "getQuery");
			const getMetricsStub = sinon.stub(utils, "getMetrics").returns({error: "Error getting metrics"});

			index.handler(event, {}, (err, res) => {
				expect(JSON.parse(err).message).to.equal("Error getting metrics");			
				sinon.assert.calledOnce(getQueryStub);
				sinon.assert.calledOnce(getMetricsStub);

				getQueryStub.restore();
				getMetricsStub.restore();
			});
		});

		it('should return metrics when getResponseForHelpPathString is called successfully', () => {
			const query = {};

			const getQueryStub = sinon.stub(utils, "getQuery").returns(query);
			const getMetricsStub = sinon.stub(utils, "getMetrics").returns({ metrics: ['code-coverage'] });

			index.handler(event, {}, (err, res) => {
				expect(res.data.metrics[0].name).to.equal("code-coverage");
				sinon.assert.calledOnce(getQueryStub);
				sinon.assert.calledOnce(getMetricsStub);

				getQueryStub.restore();
				getMetricsStub.restore();
			});
		});

		it('should return metrics when getCodeqInputsUsingQuery is called successfully', () => {
			const query = {};
			event.resourcePath = 'codeq';
			const getQueryStub = sinon.stub(utils, "getQuery").returns(query);
			const missingFieldsStub = sinon.stub(validation, "validateMissingFields");
			const fromDateStub = sinon.stub(validation, "validateFromDate").returns('fromdate');
			const toDateStub = sinon.stub(validation, "validateToDate").returns('todate');
			const fromAfterToStub = sinon.stub(validation, "validateFromAfterTo").returns(true);
			const getMetricsStub = sinon.stub(utils, "getMetrics").returns({metrics: ['code-coverage']});
			const jazzTokenStub = sinon.stub(utils, 'getJazzToken').resolves({auth_token: 'auth_token'});
			const projectBranchStub = sinon.stub(utils, 'getProjectBranch').resolves({branch: 'testBranch'});
			const codeqReportStub = sinon.stub(utils, 'getCodeqReport').resolves({get_codeq_report: 'codeQReport'});
			
			index.handler(event, {}, (err, res) => {
				expect(res.data).to.equal("codeQReport");

				sinon.assert.calledOnce(getQueryStub);
				sinon.assert.calledOnce(getMetricsStub);
				sinon.assert.calledOnce(missingFieldsStub);
				sinon.assert.calledOnce(fromDateStub);
				sinon.assert.calledOnce(toDateStub);
				sinon.assert.calledOnce(fromAfterToStub);
				sinon.assert.calledOnce(getMetricsStub);
				sinon.assert.calledOnce(jazzTokenStub);
				sinon.assert.calledOnce(projectBranchStub);
				sinon.assert.calledOnce(codeqReportStub);

				getQueryStub.restore();
				getMetricsStub.restore();
				missingFieldsStub.restore();
				fromDateStub.restore();
				toDateStub.restore();
				fromAfterToStub.restore();
				getMetricsStub.restore();
				jazzTokenStub.restore();
				projectBranchStub.restore();
				codeqReportStub.restore();
			});
		});

		it('should call get report on error when getCodeqInputsUsingQuery is called with an error in promise chain', () => {
			const query = {};
			event.resourcePath = 'codeq';
			const getQueryStub = sinon.stub(utils, "getQuery").returns(query);
			const missingFieldsStub = sinon.stub(validation, "validateMissingFields");
			const fromDateStub = sinon.stub(validation, "validateFromDate").returns('fromdate');
			const toDateStub = sinon.stub(validation, "validateToDate").returns('todate');
			const fromAfterToStub = sinon.stub(validation, "validateFromAfterTo").returns(true);
			const getMetricsStub = sinon.stub(utils, "getMetrics").returns({metrics: ['code-coverage']});
			const jazzTokenStub = sinon.stub(utils, "getJazzToken").rejects({token_error: 'token error'});
			const getReportOnErrorStub = sinon.stub(index, 'getReportOnError').returns({output: 'report data' });
			
			index.handler(event, {}, (err, res) => {
				expect(res.output).to.equal("report data");

				sinon.assert.calledOnce(getQueryStub);
				sinon.assert.calledOnce(getMetricsStub);
				sinon.assert.calledOnce(missingFieldsStub);
				sinon.assert.calledOnce(fromDateStub);
				sinon.assert.calledOnce(toDateStub);
				sinon.assert.calledOnce(fromAfterToStub);
				sinon.assert.calledOnce(getMetricsStub);
				sinon.assert.calledOnce(jazzTokenStub);
				sinon.assert.calledOnce(getReportOnErrorStub);

				getQueryStub.restore();
				getMetricsStub.restore();
				missingFieldsStub.restore();
				fromDateStub.restore();
				toDateStub.restore();
				fromAfterToStub.restore();
				getMetricsStub.restore();
				jazzTokenStub.restore();
				getReportOnErrorStub.restore();
			});
		});

		it('should return error when getCodeqInputsUsingQuery is called and there is error in promise chain and getting report on error', () => {
			const query = {};
			event.resourcePath = 'codeq';
			const getQueryStub = sinon.stub(utils, "getQuery").returns(query);
			const missingFieldsStub = sinon.stub(validation, "validateMissingFields");
			const fromDateStub = sinon.stub(validation, "validateFromDate").returns('fromdate');
			const toDateStub = sinon.stub(validation, "validateToDate").returns('todate');
			const fromAfterToStub = sinon.stub(validation, "validateFromAfterTo").returns(true);
			const getMetricsStub = sinon.stub(utils, "getMetrics").returns({metrics: ['code-coverage']});
			const jazzTokenStub = sinon.stub(utils, "getJazzToken").rejects({token_error: 'token error'});
			const getReportOnErrorStub = sinon.stub(index, 'getReportOnError').returns({error: 'report error' });
			
			index.handler(event, {}, (err, res) => {
				expect(JSON.parse(err).message).to.equal("report error");

				sinon.assert.calledOnce(getQueryStub);
				sinon.assert.calledOnce(getMetricsStub);
				sinon.assert.calledOnce(missingFieldsStub);
				sinon.assert.calledOnce(fromDateStub);
				sinon.assert.calledOnce(toDateStub);
				sinon.assert.calledOnce(fromAfterToStub);
				sinon.assert.calledOnce(getMetricsStub);
				sinon.assert.calledOnce(jazzTokenStub);
				sinon.assert.calledOnce(getReportOnErrorStub);

				getQueryStub.restore();
				getMetricsStub.restore();
				missingFieldsStub.restore();
				fromDateStub.restore();
				toDateStub.restore();
				fromAfterToStub.restore();
				getMetricsStub.restore();
				jazzTokenStub.restore();
				getReportOnErrorStub.restore();
			});
		});
	});
	
	describe('getReportOnError tests', () => {
		let metrics = [];
		let serviceContext = {};

		beforeEach(() => {
			metrics = ['code-coverage'];
			serviceContext = { query: 'codeq'};
		});

		afterEach(() => {
			metrics = [];
			serviceContext = {};
		})

		it('should return report data when error code is 404 for getReportOnError', () => {
			const err = {
				report_error: 'report error',
				code: 404
			};
			
			const getReportStub = sinon.stub(utils, 'getReport').resolves({output: 'report data' });

			index.getReportOnError(err, metrics, {}, serviceContext)
			.then(result => {
				sinon.assert.calledOnce(getReportStub);

				expect(result.data.output).to.eq("report data");

				getReportStub.restore();
			});
		});

		it('should return report error when getReport rejects for getReportOnError', () => {
			const err = {
				report_error: 'report error',
				code: 500
			};

			let output = index.getReportOnError(err, metrics, {}, serviceContext)
			expect(output.error).to.eq('Unable to report metrics for the given input.');
		});

		it('should return quality error message when getReportOnError is called with decrypt error ', () => {
			const err = {
				decrypt_error: 'report error'
			};

			let result = index.getReportOnError(err, metrics, {}, serviceContext)

			expect(result.error).to.eq("Error getting quality report from provider.");
		});
	});
});

describe('validation tests', () => {
  	it('should return missing fields when not all are provided within the query', () => {
		const requiredFields = ["domain", "service", "environment"];
		const query = {"domain": "value"};
		let validateMissingFields = validation.validateMissingFields(requiredFields, query);

		expect(validateMissingFields).to.eql("service, environment");
	});
	  
	it('should return no missing fields when all the fields are provided in the query', () => {
		const requiredFields = ["domain", "service", "environment"];
		const query = { "domain": "value", "service": "value", "environment": "value" };
		let validateMissingFields = validation.validateMissingFields(requiredFields, query);

		expect(validateMissingFields).to.eql("");
	});
	  
	it('should return valid from date using moment', () => {
		const from = '2018-05-11';
		let validFrom = validation.validateFromDate(from);

		expect(validFrom).to.eql("2018-05-11T12:00:00-0000");
	});
	
	it('should return default date when from is not provided', () => {
		const validFrom = validation.validateFromDate();
		const DATE_FORMAT = 'YYYY-MM-DDThh:mm:ss';
		const APPEND_ZEROES = '-0000';
		let expectedResult = moment().subtract(1, 'days').format(DATE_FORMAT) + APPEND_ZEROES;

		expect(validFrom).to.eql(expectedResult);
	});

	it('should return null when from date is invalid', () => {
		const validFrom = validation.validateFromDate(1234);
		
		expect(validFrom).to.eql(null);
	});
	  
	it('should return valid to date using moment', () => {
		const to = '2018-05-11';
		let validFrom = validation.validateToDate(to);

		expect(validFrom).to.eql("2018-05-11T12:00:00-0000");
	});
	
	it('should return default to date when to date is not provided', () => {
		const validFrom = validation.validateToDate();
		const DATE_FORMAT = 'YYYY-MM-DDThh:mm:ss';
		const APPEND_ZEROES = '-0000';
		let expectedResult = moment().format(DATE_FORMAT) + APPEND_ZEROES;

		expect(validFrom).to.eql(expectedResult);
	  });

	  it('should return null when to date is invalid', () => {
		const validFrom = validation.validateToDate(1234);
		
		expect(validFrom).to.eql(null);
	});
	  
	  it('should return false when from is after to date', () => {
		const from = '2018-05-10';
		const to = '2018-05-08';
		const result = validation.validateFromAfterTo(from , to);

		expect(result).to.eql(false);
	});
	  
	it('should return true when from is before to date', () => {
		const from = '2018-05-08';
		const to = '2018-05-10';
		const result = validation.validateFromAfterTo(from , to);

		expect(result).to.eql(true);
  	});
});

describe('utils', () => {
	describe('getQuery tests', () => {
		it('should return query object when service context is provided', () => {
			let serviceContext = { query: {'CODEQ': 'code'}};
			let result = utils.getQuery(serviceContext);

			expect(result).to.deep.eq({ codeq: 'code' });
		});

		it('should return empty object when service context is empty', () => {
			let serviceContext = { query: {'CODEQ': 'code'}};
			let result = utils.getQuery({});

			expect(result).to.deep.eq({});
		});
	});

	describe('getAPIPath tests', () => {
		it('should return error message when wrong url is provided', () => {
			utils.getAPIPath(1234)
			.catch(err => expect(err.errorMessage).to.include('Invalid'));
		});

		it('should return path string when a valid url is provided', () => {
			utils.getAPIPath('/codeq')
			.then(result => expect(result.pathString).to.include('codeq'));
		});

		it('should return error message when no url is provided', () => {
			utils.getAPIPath()
			.catch(error => expect(error.errorMessage).to.include('Invalid'));
		});

		it('should return error message when invalid is provided', () => {
			utils.getAPIPath('wrongurlformat')
			.catch(error => expect(error.errorMessage).to.include('Invalid'));
		});
	});
	
	describe('getReport tests', () => {
		let config = {};

		beforeEach(() => {
			config = {
				"SERVICE_API_URL": "serviceurl",
				"HELP_SERVICE": "/helpurl",
				"METRIC_MAP": {
					"security": "vulnerabilities",
					"code-coverage": "coverage",
				}
			};
		});

		afterEach(() => {
			config = {};
		});

		it('should return error message when metrics are not provided', () => {
			utils.getReport()
			.catch(err => expect(err.code).to.eq(500));
		});

		it('should return empty values when only metrics is provided', () => {
			utils.getReport('metrics', null, config)
			.then(result => {
				expect(result.metrics.length).to.eq(7);
				expect(result.metrics[0].link).to.eq('serviceurl/helpurl?metrics=s');
				expect(result.metrics[0].name).to.eq('s');
				expect(result.metrics[0].values.length).to.eq(0);
			});
		});

		it('should return values with historyValues when sonar measures are provided', () => {
			const sonarMeasures = [{ 
					metric: 'vulnerabilities',
					history: [{'date': 'date1'}]
				}, 
				{
					metric: 'coverage',
					history: [{'date': 'date2'}]
				}
			];

			utils.getReport('metrics', sonarMeasures, config)
			.then(result => {
				expect(result.metrics.length).to.eq(2);
				expect(result.metrics[0].values[0].ts).to.eq('date2');
			});
		});

		describe('getMetrics tests', () => {
			let config = {};
			let messages = {};

			beforeEach(() => {
				config = {
					"ALLOWED_METRICS": ["security", "code-coverage", "code-smells", "lines-of-code", "files", "vulnerabilities"]
				};
				messages = {
					"MISSING_METRICS": "Following metric(s) are invalid - ",
					"INVALID_METRICS": "Invalid metrics provided - "
				};
			});
	
			afterEach(() => {
				config = {};
				messages = {};
			});
	
			it('should return metrics from config allowed metrics if no metrics are provided', () => {
				const expectedResult = utils.getMetrics({}, config);
				expect(expectedResult.metrics.length).to.eq(6);
			});

			it('should return error message when wrong metrics are provided', () => {
				const query = {
					metrics: 'random,security'
				};

				const expectedResult = utils.getMetrics(query, config, messages);
				expect(expectedResult.error).to.include('random');
			});

			it('should return error message when wrong metrics are provided', () => {
				const query = {
					metrics: 1234
				};

				const expectedResult = utils.getMetrics(query, config, messages);
				expect(expectedResult.error).to.include('Invalid');
			});
		});

		describe('getJazzToken tests', () => {
			let config = {};
			let sandbox;
			
			beforeEach(() => {
				sandbox = sinon.createSandbox();
				config = {
					"SERVICE_API_URL": "serviceurl",
					"TOKEN_URL": "/tokenurl",
					"SERVICE_USER": "svcuser",
					"TOKEN_CREDS": "123456"
				};
			});
	
			afterEach(() => {
				sandbox.restore();
				config = {};
			});
	
			it('should return auth token', () => {
				const response = { statusCode: 200 };
				const body = { data: { token: "token" }};
				const requestPromiseStub = sinon.stub(request, "Request").callsFake(obj => {
					return obj.callback(null, response, body);
				});

				const expectedResult = utils.getJazzToken(config)
				.then(result => {
					expect(result.auth_token).to.eq("token");
					sinon.assert.calledOnce(requestPromiseStub);
					requestPromiseStub.restore();
				});
			});

			it('should return error when response statusCode is not 200', () => {
				const response = { statusCode: 400, body: { message: "error"} };
				const body = { data: {} };
				const requestPromiseStub = sinon.stub(request, "Request").callsFake(obj => {
					return obj.callback(null, response, body);
				});

				const expectedResult = utils.getJazzToken(config)
				.catch(err => {
					expect(err.message).to.eq("error");
					sinon.assert.calledOnce(requestPromiseStub);
					requestPromiseStub.restore();
				});
			});
		});

		describe('getProjectBranch tests', () => {
			let config = {};
			let sandbox;
			let query = {
				environment: "1",
				domain: "domain",
				service: "service"
			};
			
			beforeEach(() => {
				sandbox = sinon.createSandbox();
				config = {
					"SERVICE_API_URL": "serviceurl",
					"ENV_SERVICE": "/envsvc"
				};
			});
	
			afterEach(() => {
				sandbox.restore();
				config = {};
				query: {};
			});
	
			it('should return project branch given the auth token', () => {
				const response = { statusCode: 200 };
				const body = { data: { environment: [{ physical_id: "master" }] }};
				const requestPromiseStub = sinon.stub(request, "Request").callsFake(obj => {
					return obj.callback(null, response, body);
				});

				const expectedResult = utils.getProjectBranch("token", query, config)
				.then(result => {
					expect(result.branch).to.eq("master");
					sinon.assert.calledOnce(requestPromiseStub);
					requestPromiseStub.restore();
				});
			});

			it('should return error when response statusCode is not 200', () => {
				const response = { statusCode: 400, body: { message: "error"} };
				const body = { data: {} };
				const requestPromiseStub = sinon.stub(request, "Request").callsFake(obj => {
					return obj.callback(null, response, body);
				});

				const expectedResult = utils.getProjectBranch("token", query, config)
				.catch(err => {
					expect(err.code).to.eq(400);
					sinon.assert.calledOnce(requestPromiseStub);
					requestPromiseStub.restore();
				});
			});
		});

		describe('getCodeqReport tests', () => {
			let config = {};
			let sandbox;
			let query = {
				domain: "domain",
				service: "service"
			};
			let metrics = ['security'];
			
			beforeEach(() => {
				sandbox = sinon.createSandbox();
				config = {
					"SONAR_PROJECT_KEY": "jazz",
					"SONAR_URL": "sonarurl",
					"METRIC_MAP": {
						"security": "vulnerabilities",
						"code-coverage": "coverage",
						"code-smells": "code_smells",
						"lines-of-code": "ncloc",
						"files": "files",
						"vulnerabilities": "high_severity_vulns"
					},
					"SERVICE_API_URL": "serviceurl",
					"HELP_SERVICE": "/helpurl"
				};
			});
	
			afterEach(() => {
				sandbox.restore();
				config = {};
				query: {};
			});
	
			it('should return report name and link when statusCode is 200', () => {
				const response = { statusCode: 200 };
				const body = { 
					data: {},
					sonarMeasures: [{ 
						metric: 'vulnerabilities',
						history: [{'date': 'date1'}]
					}, 
					{
						metric: 'coverage',
						history: [{'date': 'date2'}]
					}]
				};
				const requestPromiseStub = sinon.stub(request, "Request").callsFake(obj => {
					return obj.callback(null, response, body);
				});

				const expectedResult = utils.getCodeqReport(metrics, "master", "todate", "fromdate", query, config)
				.then(result => {
					expect(result.metrics.length).to.eq(1);
					expect(result.metrics[0].link).to.eq('serviceurl/helpurl?metrics=security');
					sinon.assert.calledOnce(requestPromiseStub);
					requestPromiseStub.restore();
				});
			});

			it('should return error when response statusCode is not 200', () => {
				const response = { statusCode: 400, body: { errors: [{ msg: "error" }]} };
				const body = { data: {} };
				const requestPromiseStub = sinon.stub(request, "Request").callsFake(obj => {
					return obj.callback(null, response, body);
				});

				const expectedResult = utils.getCodeqReport(metrics, "master", "todate", "fromdate", query, config)
				.catch(err => {
					expect(err.code).to.eq(400);
					expect(err.report_error).to.eq("error");
					sinon.assert.calledOnce(requestPromiseStub);
					requestPromiseStub.restore();
				});
			});
		});
	});
});