const assert = require('chai').assert;
const expect = require('chai').expect;
const awsContext = require('aws-lambda-mock-context');
const  AWS  =  require('aws-sdk-mock');
const sinon = require('sinon');
const index = require('../index');
const logger = require("../components/logger.js");
const errorHandlerModule = require("../components/error-handler.js");
const scmFactory = require("../scm/scmFactory.js");
const configModule = require("../components/config.js");
const responseObj = require("../components/response.js");
const rp = require('request-promise-native');

describe('User Management', function () {
	//Setting up default values for the aws event and context needed for handler params
	beforeEach(function () {
		event = {
			"method": "POST",
			"stage": "test",
			"resourcePath": "test/service/user/reset",
			"body": {
				"username": "username",
				"userid": "username",
				"verificationCode": "123",
				"email": "abc@xyz.com"
			}
		};
		context = awsContext();
		callback = (value) => {
			return value;
		};
		config = configModule.getConfig(event, context);
	});

	it('should throw error validateCreaterUserParams', function () {
		config.required_fields = {
			'userid': 'userid',
			'email': 'email',
			'verificationCode': 'verificationCode',
			'param': 'param'
		}
		index.validateCreaterUserParams(config, event.body)
			.catch(error => expect(error).to.include({
				errorCode: '102',
				errorType: 'BadRequest',
				message: 'Following field(s) are required - param'
			}));
	});

	it('should throw error 102 Following field(s) are required userid', function () {
		config.required_fields = ['userid', 'email', 'verificationCode'];
		event.body = {
			"username": "username",
			"userid": "",
			"verificationCode": "123",
			"email": "abc@xyz.com"
		}
		
		index.validateCreaterUserParams(config, event.body)
			.catch(error => expect(error).to.include({
				errorCode: '102',
				errorType: 'BadRequest',
				message: 'userid\'s value cannot be empty'
			}));
	});

	it('should throw Invalid User Registration Code', function () {
		config.required_fields = ['userid', 'email', 'usercode'];
		event.body = {
			"username": "username",
			"userid": "userid",
			"usercode": "aabd123",
			"email": "abc@xyz.com"
		}
		config.reg_codes = ['AAB123'];
		index.validateCreaterUserParams(config, event.body)
			.catch(error => expect(error).to.include({
				errorCode: '103',
				errorType: 'BadRequest',
				message: 'Invalid User Registration Code'
			}));

	});

	it('should not throw any error in validateCreaterUserParams', function () {
		config.required_fields = ['userid', 'email', 'usercode'];
		event.body = {
			"username": "username",
			"userid": "userid",
			"usercode": "aab123",
			"email": "abc@xyz.com"
		}
		config.reg_codes = ['AAB123'];		
		index.validateCreaterUserParams(config, event.body)
			.then(res => expect(res).to.include({
				username: 'username',
				userid: 'userid',
				usercode: 'AAB123',
				email: 'abc@xyz.com'
			}));

	});

	it("should throw a Service operation not supported error for undefined resourcePath", function () {
		event.resourcePath = undefined;
		var bool = index.handler(event, context, callback).includes("Service operation not supported") &&
			index.handler(event, context, callback).includes("101");
		assert.isFalse(bool);
	});

	it('missing context should return 101 error', function () {
		event = undefined;
		context = undefined;
		var bool = index.handler(event, context, callback).includes("Internal error, please reach out to admins") &&
			index.handler(event, context, callback).includes("101");		
		assert.isTrue(bool);
	});

	it("should throw a invalid or missing arguments", function () {
		event = {
			"method": undefined,
			"stage": "test",
			"resourcePath": "reset",
			"body": {
				"username": "username",
				"verificationCode": "123",
				"email": "abc@xyz.com"
			}
		};
		context = awsContext();
		var bool = index.handler(event, context, callback).includes("Service operation not supported") &&
			index.handler(event, context, callback).includes("101");
		assert.isFalse(bool);
	});

	it("should throw a invalid or missing arguments for undefined method", function () {
		event = {
			"method": 'GET',
			"stage": "test",
			"resourcePath": "reset",
			"body": {
				"username": "username",
				"verificationCode": "123",
				"email": "abc@xyz.com"
			}
		};
		context = awsContext();
		var bool = index.handler(event, context, callback).includes("Service operation not supported") &&
			index.handler(event, context, callback).includes("101");
		assert.isTrue(bool);
	});
});

describe("inside index handler", function () {
	beforeEach(function () {		
		event = {
			"method": "POST",
			"stage": "test",
			"resourcePath": "test/service/user/reset",
			"body": {
				"username": "username",
				"userid": "username",
				"verificationCode": "123",
				"email": "abc@xyz.com"
			}
		};
		context = awsContext();
		config = configModule.getConfig(event, context);
		callback = (err, responseObj) => {
			if (err) {
				return err;
			} else {
				return JSON.stringify(responseObj);
			}
		};

	});

	it('Should return forgotPassword success ', function () {
		AWS.mock('CognitoIdentityServiceProvider', 'forgotPassword', function (params, callback) {
			callback(null, 'success');
		});
		index.handler(event, context, (err, res) => {
			expect(res.data.result).to.eq("success");			
		});
	});

	it('Should return forgotPassword fail ', function () {
		let responseObj = {
			"errorType": "102"
		}
		const forgotPassword = sinon.stub(index, "forgotPassword").rejects({
			errorType: "102"
		});
		index.handler(event, context, (err, res) => {      
      sinon.assert.calledOnce(forgotPassword);
			forgotPassword.restore();
			expect(err).to.include('errorType');
			return err;
		});
	});

	it('should check errorType in catch', function () {
		const validateResetParams = sinon.stub(index, "validateResetParams").resolves("success");
		const forgotPassword = sinon.stub(index, "forgotPassword").rejects({
			errorType: "102"
		});

		index.handler(event, context, (err, res) => {
      sinon.assert.calledOnce(validateResetParams);
      sinon.assert.calledOnce(forgotPassword);
			validateResetParams.restore();
			forgotPassword.restore();
			expect(JSON.parse(err).errorType).to.eq("102");
		});
	});

	it('should go in catch funtion err with no param', function () {
		const validateResetParams = sinon.stub(index, "validateResetParams").resolves("success");
		const forgotPassword = sinon.stub(index, "forgotPassword").rejects({
			error: "102"
		});
		index.handler(event, context, (err, res) => {
			sinon.assert.calledOnce(validateResetParams);
			sinon.assert.calledOnce(forgotPassword);
			validateResetParams.restore();
			forgotPassword.restore();
			expect(JSON.parse(err).error).to.eq("102");
		});
	});

	it('should go in catch funtion with error code', function () {
		const validateResetParams = sinon.stub(index, "validateResetParams").resolves("success");
		const forgotPassword = sinon.stub(index, "forgotPassword").rejects({
			code: "102",
			message: "error"
		});

		index.handler(event, context, (err, res) => {
			sinon.assert.calledOnce(validateResetParams);
			sinon.assert.calledOnce(forgotPassword);
			expect(JSON.parse(err).errorCode).to.eq("102");
			validateResetParams.restore();
			forgotPassword.restore();
		});
	});

	it('Should return email require error validateResetParams ', function () {
		event.body.email = undefined;
		let responseObj = {
			errorCode: '102',
			errorType: 'BadRequest',
			message: 'email is required field'
		}

		index.validateResetParams(event.body, config)
			.catch((error) => {
				expect(error).to.include(responseObj);
			});
	});
});

describe("inside index handler updatepwd", function () {
	beforeEach(function () {		
		event = {
			"method": "POST",
			"stage": "test",
			"resourcePath": "test/service/user/updatepwd",
			"body": {
				"username": "username",
				"userid": "username",
				"verificationCode": "123",
				"email": "abc@xyz.com",
				"password": "Passord"
			}
		};
		context = awsContext();
		config = configModule.getConfig(event, context);
		callback = (err, responseObj) => {
			if (err) {
				return err;
			} else {
				return JSON.stringify(responseObj);
			}
		};

	});

	it('Should return update password success ', function () {
		AWS.mock('CognitoIdentityServiceProvider', 'confirmForgotPassword', function (params, callback) {
			callback(null, 'success');
		});
		index.handler(event, context, (err, res) => {			
			expect(res.data.result).to.eq("success");			
		});
	});

	it('Should return updated password failure', function () {
		AWS.mock('CognitoIdentityServiceProvider', 'confirmForgotPassword', function (params, callback) {
			callback(null, 'success');
		});
		event.body.password = undefined;
		index.handler(event, context, (err, res) => {
			expect(err).to.includes("errorCode");			
		});
	});

	it('Should return email require error validateUpdatePasswordParams ', function () {
		event.body.email = undefined;
		let responseObj = {
			errorCode: '102',
			errorType: 'BadRequest',
			message: 'Email is required field'
		}

		index.validateUpdatePasswordParams(event.body)
			.catch((error) => {
				expect(error).to.include(responseObj);

			});
	});

	it('Should return verificationCode require error validateUpdatePasswordParams ', function () {
		event.body.verificationCode = undefined;
		let responseObj = {
			errorCode: '102',
			errorType: 'BadRequest',
			message: 'Verification code is required'
		}

		index.validateUpdatePasswordParams(event.body)
			.catch((error) => {
				expect(error).to.include(responseObj);
			});
	});

	it('should go in catch funtion err.errorType', function () {
		const validateUpdatePasswordParams = sinon.stub(index, "validateUpdatePasswordParams").resolves("success");
		const updatePassword = sinon.stub(index, "updatePassword").rejects({
			errorType: "102"
		});

		index.handler(event, context, (err, res) => {
			sinon.assert.calledOnce(validateUpdatePasswordParams);
			sinon.assert.calledOnce(updatePassword);
			validateUpdatePasswordParams.restore();
			updatePassword.restore();
			expect(JSON.parse(err).errorType).to.eq("102");
		});
	});

	it('should go in catch funtion err.code', function () {
		const validateUpdatePasswordParams = sinon.stub(index, "validateUpdatePasswordParams").resolves("success");
		const updatePassword = sinon.stub(index, "updatePassword").rejects({
			code: "102",
			message: "error"
		});

		index.handler(event, context, (err, res) => {
			sinon.assert.calledOnce(validateUpdatePasswordParams);
			sinon.assert.calledOnce(updatePassword);
			expect(JSON.parse(err).errorCode).to.eq("102");
			validateUpdatePasswordParams.restore();
			updatePassword.restore();
		});
	});

	it('should go in catch funtion err.errorType', function () {
		const validateUpdatePasswordParams = sinon.stub(index, "validateUpdatePasswordParams").resolves("success");
		const updatePassword = sinon.stub(index, "updatePassword").rejects({
			message: "error"
		});
		index.handler(event, context, (err, res) => {
			sinon.assert.calledOnce(validateUpdatePasswordParams);
			sinon.assert.calledOnce(updatePassword);
			expect(JSON.parse(err).errorCode).to.eq("106");
			validateUpdatePasswordParams.restore();
			updatePassword.restore();
		});
	});
})

describe("inside index handler else condition", function () {
	beforeEach(function () {		
		event = {
			"method": "POST",
			"stage": "test",
			"resourcePath": "test/service/user/something",
			"body": {
				"username": "username",
				"userid": "username",
				"usercode": "123",
				"email": "abc@xyz.com",
				"userpassword": "Passord"
			}
		};
		context = awsContext();
		config = configModule.getConfig(event, context);
		callback = (err, responseObj) => {
			if (err) {
				return err;
			} else {
				return JSON.stringify(responseObj);
			}
		};

	});

	it('Should return createUser ', function () {
		const validateCreaterUserParams = sinon.stub(index, "validateCreaterUserParams").resolves("success");
		const createUser = sinon.stub(index, "createUser").resolves("success");
		const rpStub = sinon.stub(rp, 'Request').returns(Promise.resolve("Success"));
		const getRequestToCreateSCMUser = sinon.stub(index, "getRequestToCreateSCMUser").resolves();

		index.handler(event, context, (err, res) => {
			expect(res.data.result).to.eq("success");
			sinon.assert.calledOnce(validateCreaterUserParams);
			sinon.assert.calledOnce(createUser);
			sinon.assert.calledOnce(getRequestToCreateSCMUser);
			sinon.assert.calledOnce(rpStub);
			validateCreaterUserParams.restore();
			createUser.restore();
			getRequestToCreateSCMUser.restore();
			rpStub.restore();
		});
	});

	it('Should return createUser error ', function () {
		const validateCreaterUserParams = sinon.stub(index, "validateCreaterUserParams").resolves("success");
		const createUser = sinon.stub(index, "createUser").resolves("success");
		const rpStub = sinon.stub(rp, 'Request').returns(Promise.reject({
			result: 'reject'
		}));
		const getRequestToCreateSCMUser = sinon.stub(index, "getRequestToCreateSCMUser").resolves();

		index.handler(event, context, (err, res) => {
			expect(JSON.parse(err).errorCode).to.eq("101");
			sinon.assert.calledOnce(validateCreaterUserParams);
			sinon.assert.calledOnce(createUser);
			sinon.assert.calledOnce(getRequestToCreateSCMUser);
			sinon.assert.calledOnce(rpStub);
			validateCreaterUserParams.restore();
			createUser.restore();
			getRequestToCreateSCMUser.restore();
			rpStub.restore();
		});
	});

	it('Should return createUser error ', function () {
		const validateCreaterUserParams = sinon.stub(index, "validateCreaterUserParams").resolves("success");
		const createUser = sinon.stub(index, "createUser").resolves();
		const rpStub = sinon.stub(rp, 'Request').returns(Promise.reject({
			code: "102",
			message: "error"
		}));
		const getRequestToCreateSCMUser = sinon.stub(index, "getRequestToCreateSCMUser").resolves();

		index.handler(event, context, (err, res) => {
			expect(JSON.parse(err).errorCode).to.eq("102");
			sinon.assert.calledOnce(validateCreaterUserParams);
			sinon.assert.calledOnce(createUser);
			sinon.assert.calledOnce(rpStub);
			validateCreaterUserParams.restore();
			createUser.restore();
			getRequestToCreateSCMUser.restore();
			rpStub.restore();
		});
	});

	it('Should return createUser error ', function () {
		const validateCreaterUserParams = sinon.stub(index, "validateCreaterUserParams").resolves("success");
		const createUser = sinon.stub(index, "createUser").resolves();
		const rpStub = sinon.stub(rp, 'Request').returns(Promise.reject({
			errorType: "102",
			message: "error"
		}));
		const getRequestToCreateSCMUser = sinon.stub(index, "getRequestToCreateSCMUser").resolves();
		index.handler(event, context, (err, res) => {
			expect(JSON.parse(err).errorType).to.eq("102");
			sinon.assert.calledOnce(validateCreaterUserParams);
			sinon.assert.calledOnce(createUser);
			sinon.assert.calledOnce(rpStub);
			validateCreaterUserParams.restore();
			createUser.restore();
			getRequestToCreateSCMUser.restore();
			rpStub.restore();
		});
	});
});