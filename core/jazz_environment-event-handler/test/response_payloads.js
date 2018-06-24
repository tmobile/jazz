module.exports = () => {
    return {
        "tokenResponseObj200": tokenResponseObj200,
        "tokenResponseObj401": tokenResponseObj401,
        "tokenResponseObjInvalid": tokenResponseObjInvalid,
        "apiResponse": apiResponse,
        "envCreationResponseSuccess": envCreationResponseSuccess,
        "envCreationResponseError": envCreationResponseError,
        "createBranchSuccess": createBranchSuccess,
        "getEnvironmentLogicalId": getEnvironmentLogicalId,
        "environmentPayload": environmentPayload,
        "processEventInitialCommitSuccess": processEventInitialCommitSuccess,
        "processEventInitialCommitError": processEventInitialCommitError,
        "processEventUpdateEnvironmentError": processEventUpdateEnvironmentError,
        "createBranchError": createBranchError,
        "eventPayload": eventPayload,
        "deleteBranchSuccess": deleteBranchSuccess
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

var apiResponse = {
    statusCode: 200,
    body: {
        "data": {
            "message": "Successfully Updated environment for service:'test-env-oss-3', domain:'jazztesting', with logical_id: stg",
            "updatedEnvironment": {
                "service": "test-env-oss-3",
                "domain": "jazztesting",
                "last_updated": "2018-04-17T05:44:41:463",
                "status": "deployment_completed",
                "created_by": "c1bcc4bbe5b8a159",
                "physical_id": "master",
                "endpoint": "http://testsite.com/stg/index.html",
                "created": "2018-04-17T00:46:51:793",
                "id": "688c7433-fcad-004d-749a-36413602cfc9",
                "logical_id": "stg"
            }
        },
        "input": {
            "status": "deployment_completed",
            "endpoint": "http://testsite.com/stg/index.html",
            "last_updated": "2018-04-17T05:44:41:463"
        }
    }
};

var envCreationResponseSuccess = {
    statusCode: 200,
    body: {
        "data": {
            "result": "success",
            "environment_id": "71b6c698-0498-bff3-edad-a32432dbe8fc",
            "environment_logical_id": "prod"
        },
        "input": {
            "service": "test-env-oss-3",
            "created_by": "c1bcc4bbe5b8a159",
            "domain": "jazztesting",
            "physical_id": "master",
            "logical_id": "prod",
            "status": "inactive"
        }
    }
};

var envCreationResponseError = {
    "error": "Error creating stg environment for jazztesting_test-env-oss-3 in  catalog",
    "details": "The specified environment already exists, please choose a different logical id for your new environment"
}

var createBranchSuccess = {
    statusCode: 200,
    body: {
        "data": {
            "result": "success",
            "environment_id": "54c9852c-583b-2ffd-e4fc-597b53d975dc",
            "environment_logical_id": "h0ikekwdt7-dev"
        },
        "input": {
            "service": "test-env-oss-3",
            "created_by": "jazz-admin@abc.com",
            "domain": "jazztesting",
            "physical_id": "master",
            "friendly_name": "master",
            "logical_id": "h0ikekwdt7-dev",
            "status": "inactive"
        }
    }
};

var createBranchError = {
    statusCode: 400,
    body: {
        "message": "error"
    }
};

var deleteBranchSuccess = {
    statusCode: 200,
    body: {
        "data": {
            "result": "success",
            "environment": [{
                "physical_id": "master"
            }]
        },
        "input": {
            "service": "test-env-oss-3",
            "domain": "jazztesting",
            "version": "LATEST",
            "environment_id": "h0ikekwdt7-dev"
        }
    }
};

var deleteBranchError = {
    statusCode: 400,
    body: {
        "data": {
            "result": "error",
            "environment": [{
                "physical_id": "master"
            }]
        },
        "input": {
            "service": "test-env-oss-3",
            "domain": "jazztesting",
            "version": "LATEST",
            "environment_id": "h0ikekwdt7-dev"
        }
    }
};

var getEnvironmentLogicalId = {
    "statusCode": 200,
    "body": {
      "data": {
        "count": 2,
        "environment": [
          {
            "service": "test-env-oss-3",
            "domain": "jazztesting",
            "last_updated": "2018-04-18T22:05:50:198",
            "status": "deployment_started",
            "friendly_name": "master",
            "created_by": "jazz-admin@abc.com",
            "physical_id": "master",
            "endpoint": "http://testsite.com/stg/index.html",
            "created": "2018-04-18T14:12:11:076",
            "id": "581486f5-1381-cc8f-04cf-e33939d0f5e3",
            "logical_id": "6knr9d33tt-dev"
          }
        ]
      },
      "input": {
        "service": "test-env-oss-3",
        "domain": "jazztesting"
      }
    }
  };

  var environmentPayload = {
    "service": "test-env-oss-3",
    "created_by": "Tester",
    "domain": "jazztesting",
    "physical_id": "master",
    "status": "deployment_started",
    "endpoint": "http://testsite.com/stg/index.html"
};

var eventPayload = {
    "kinesis":{
        "kinesisSchemaVersion":"1.0",
        "partitionKey":"CALL_DELETE_WORKFLOW",
        "sequenceNumber":"49582744145785831874147508989126673490865670161183014914",
        "data":"eyJJdGVtIjp7IkVWRU5UX0lEIjp7IlMiOiJiZjEyY2M3Yi03ZWNkLTQyM2UtYTkwMi0yZjU2ZjhjZWQxYjMifSwiVElNRVNUQU1QIjp7IlMiOiIyMDE4LTA0LTE2VDE2OjM1OjQ5OjUzOSJ9LCJFVkVOVF9IQU5ETEVSIjp7IlMiOiJCSVRCVUNLRVQifSwiRVZFTlRfTkFNRSI6eyJTIjoiQ09NTUlUX1RFTVBMQVRFIn0sIlNFUlZJQ0VfTkFNRSI6eyJTIjoidGVzdC1lbnYtb3NzLTMifSwiRVZFTlRfU1RBVFVTIjp7IlMiOiJDT01QTEVURUQifSwiRVZFTlRfVFlQRSI6eyJTIjoiU0VSVklDRV9PTkJPQVJESU5HIn0sIlVTRVJOQU1FIjp7IlMiOiJjMWJjYzRiYmU1YjhhMTU5In0sIkVWRU5UX1RJTUVTVEFNUCI6eyJTIjoiMjAxOC0wNC0xNlQxNjozNTo0OToxODYifSwiU0VSVklDRV9DT05URVhUIjp7IlMiOiJ7XCJyZXBvc2l0b3J5XCI6XCJodHRwczovL3Rlc3RyZXBvLmNvbS9wcm9qZWN0cy9DQVMvcmVwb3MvamF6enRlc3RpbmdfdGVzdC1kZWJ1Zy1kZWVwdS9icm93c2VcIixcImRvbWFpblwiOlwiamF6enRlc3RpbmdcIixcImJyYW5jaFwiOlwibWFzdGVyXCJ9In19fQ==",
        "approximateArrivalTimestamp":1521632408.682
    },
    "eventSource":"aws:kinesis",
    "eventVersion":"1.0",
    "eventID":"shardId-000000000000:49582744145785831874147508989126673490865670161183014914",
    "eventName":"aws:kinesis:record",
    "invokeIdentityArn":"",
    "awsRegion":"us-east-1",
    "eventSourceARN":""
}

var processEventInitialCommitSuccess = {
    statusCode: 200,
    body: {
        "data": {
            "result": "success"
        }
    }
};

var processEventInitialCommitError = {
    statusCode: 400,
    body: {
        "message": "error"
    }
};

var processEventUpdateEnvironmentError = {
    statusCode: 400,
    body: {
        "message": "Error"
    }
};