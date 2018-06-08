module.exports = () => {
	return {
		"tokenResponseObj200": tokenResponseObj200
	};
};


var tokenResponseObj200 = {
	"statusCode": 200,
	"body": {
		"data": {
			"user_id": "JazzAdmin",
			"name": "Jazz Admin",
			"email": "jazz@serverless.com",
			"token": "JAZZLOGINTOKENTEST"
		},
		"input": {
			"usrname": "jazzAdmin"
		}
	}
};

var tokenResponseObj401 = {
	"statusCode": 401,
	"message": {
		"errorMessage": "401 - {\"errorCode\":\"100\",\"errorType\":\"Unauthorized\",\"message\":\"Authentication Failed for user: jazzAdmin- with message: 80090308: LdapErr: DSID-0C0903D0, comment: AcceptSecurityContext error, data 52e, v2580\\u0000\"}",
		"errorType": "StatusCodeError",
		"stackTrace": [
			"new StatusCodeError (test message)"
		]
	}
};

var tokenResponseObjInvalid = {
	"statusCode": 200,
	"body": {
		"data": "",
		"input": {
			"usrname": "jazzAdmin"
		}
	}
};


var assetPayload = {
	"service": "test-env-oss-3",
	"created_by": "Tester",
	"domain": "jazztesting",
	"physical_id": "bugfix/test_02",
	"status": "deployment_started",
	"endpoint": "http://testsite.com/stg/index.html"
};

var serviceContext = {
	"service_type": "website",
	"branch": "feature/clearwater_tab",
	"runtime": "",
	"domain": "jazz",
	"iam_role": "aanand12",
	"environment": "38sktlzm0d-dev",
	"region": "",
	"message": "No Message",
	"provider": "aws",
	"provider_id": "s3://jazz-webapp-0b0e2eb1/38sktlzm0d-dev",
	"type": "s3",
	"created_by": "aanand12"
}