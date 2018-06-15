
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


var requestSuccessCallback = [
  null,
  {
    "statusCode": 200,
    "body": "{\"message\":\"Endpoint /test\"}",
    "headers": {
      "x-powered-by": "Express",
      "content-type": "application/json; charset=utf-8",
      "content-length": "28",
      "etag": "W/\"1c-4XMzRqPsSsN5I5kTq4+teUq5Kkc\"",
      "date": "Fri, 15 Jun 2018 01:17:17 GMT",
      "connection": "close"
    },
    "request": {
      "uri": {
        "protocol": "http:",
        "slashes": true,
        "auth": null,
        "host": "localhost:4000",
        "port": "4000",
        "hostname": "localhost",
        "hash": null,
        "search": null,
        "query": null,
        "pathname": "/test",
        "path": "/test",
        "href": "http://localhost:4000/test"
      },
      "method": "GET",
      "headers": {}
    }
  },
  "{\"message\":\"Endpoint /test\"}"
];

var requestInternalErrorCallback = [
  null,
  {
    "statusCode": 500,
    "body": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>TypeError: (intermediate value) is not a constructor<br> &nbsp; &nbsp;at D:\\dev\\examples\\request-promise-native\\server.js:22:11<br> &nbsp; &nbsp;at &lt;anonymous&gt;<br> &nbsp; &nbsp;at process._tickCallback (internal/process/next_tick.js:160:7)</pre>\n</body>\n</html>\n",
    "headers": {
      "x-powered-by": "Express",
      "content-security-policy": "default-src 'self'",
      "x-content-type-options": "nosniff",
      "content-type": "text/html; charset=utf-8",
      "content-length": "372",
      "date": "Fri, 15 Jun 2018 01:19:55 GMT",
      "connection": "close"
    },
    "request": {
      "uri": {
        "protocol": "http:",
        "slashes": true,
        "auth": null,
        "host": "localhost:4000",
        "port": "4000",
        "hostname": "localhost",
        "hash": null,
        "search": null,
        "query": null,
        "pathname": "/test",
        "path": "/test",
        "href": "http://localhost:4000/test"
      },
      "method": "GET",
      "headers": {}
    }
  },
  "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>TypeError: (intermediate value) is not a constructor<br> &nbsp; &nbsp;at D:\\dev\\examples\\request-promise-native\\server.js:22:11<br> &nbsp; &nbsp;at &lt;anonymous&gt;<br> &nbsp; &nbsp;at process._tickCallback (internal/process/next_tick.js:160:7)</pre>\n</body>\n</html>\n"
];

module.exports = {
  tokenResponseObj200: tokenResponseObj200,
  tokenResponseObj401: tokenResponseObj401,
  tokenResponseObjInvalid: tokenResponseObjInvalid,
  requestSuccessCallback: requestSuccessCallback,
  requestInternalErrorCallback: requestInternalErrorCallback,
  assetPayload: require('./ASSET_PAYLOAD'),
  eventPayload: require('./EVENT_PAYLOAD'),
  recordsPayload: require('./RECORDS_PAYLOAD')
};