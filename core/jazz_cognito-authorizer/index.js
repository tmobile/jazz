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
const errorHandlerModule = require("./components/error-handler.js");

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const auth = require("./components/login.js");
const aclServices = require("./components/acl-services");
const AuthPolicy = require("./components/auth-policy.js");

const jwt = require("jsonwebtoken");
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const AWS = require('aws-sdk');

var pems;
var cognitoUserPoolEndpoint;

async function handler(event, context, cb) {

  var config = configModule.getConfig(event, context);
  logger.init(event, context);

  logger.info('event: ' + JSON.stringify(event));
  let headers = exportable.changeToLowerCase(event.headers);

  if (!event || !headers.authorization) {
    logger.error('No access token, Request will be denied!');
    return cb("Unauthorized");
  }

  cognitoUserPoolEndpoint = `https://cognito-idp.${config.REGION}.amazonaws.com/${config.USER_POOL_ID}`;
  try {
    //Download PEM for your UserPool if not already downloaded
    if (!pems) {
      //Download the JWKs and save it as PEM
      let res = await wrapper(getPemDetails(cognitoUserPoolEndpoint));
      if (res.error) {
        logger.error("PEM retrieval failed. " + JSON.stringify(resp));
        throw ("Unauthorized");
      }
      pems = res.data;
    }

    //PEMs are already downloaded, continue with validating the token
    let resp = await wrapper(ValidateToken(pems, event));
    if (resp.error) {
      logger.error("Token validation failed. " + JSON.stringify(resp));
      throw ("Unauthorized");
    }

    var token = headers.authorization;
    let result = await wrapper(jwtValidation(token, resp.data, cognitoUserPoolEndpoint, event, context));
    if (result.error) {
      logger.error("jwtValidation validation failed. " + JSON.stringify(result));
      throw ("Unauthorized");
    }

    result = await wrapper(validateCognitoUser(token, config, event, cb));
    if (result.error) {
      logger.error("validateCognitoUser failed. " + JSON.stringify(result));
      throw ("Unauthorized");
    }

    await processCognitoUserDetails(event, context, result.data, config);

  } catch (exception) {
    logger.error("Error occurred. " + JSON.stringify(exception));
    return cb(exception); //any errors faced in token/user validation ends in 401 error
  }
};

async function ValidateToken(pems, event) {
  return new Promise((resolve, reject) => {
    let headers = exportable.changeToLowerCase(event.headers);
    var token = headers.authorization;
    //Fail if the token is not jwt
    var decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) {
      logger.error("Not a valid JWT token");
      return reject("Unauthorized");
    }

    //Fail if token is not from your UserPool
    if (decodedJwt.payload.iss != cognitoUserPoolEndpoint) {
      logger.error("invalid issuer");
      return reject("Unauthorized");
    }

    //Reject the jwt if it's not an 'Access Token'
    if (decodedJwt.payload.token_use != 'access') {
      logger.error("Not an access token");
      return reject("Unauthorized");
    }

    //Get the kid from the token and retrieve corresponding PEM
    var kid = decodedJwt.header.kid;
    var pem = pems[kid];
    if (!pem) {
      logger.error('Invalid access token');
      return reject("Unauthorized");
    }
    resolve(pem);
  });
}

const jwtValidation = async (token, pem, cognitoUserPoolEndpoint, event, context) => {
  return new Promise((resolve, reject) => {
    //Verify the signature of the JWT token to ensure it's really coming from your User Pool
    //Get the kid from the token and retrieve corresponding PEM

    jwt.verify(token, pem, { issuer: cognitoUserPoolEndpoint }, (err, payload) => {
      if (err) {
        return reject("Authorization Failure");
      } else {
        logger.debug("valid token : ");
        //Valid token. Generate the API Gateway policy for the user
        //Always generate the policy on value of 'sub' claim and not for 'username' because username is reassignable
        //sub is UUID for a user which is never reassigned to another user.
        return resolve();

      }
    });
  });
}

async function validateCognitoUser(token, config, event, cb) {
  return new Promise((resolve, reject) => {
    const cognito = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-19', region: config.REGION });

    var params = {
      AccessToken: token
    };
    cognito.getUser(params, (err, data) => {
      if (err) {
        logger.error("Cognito get user failed. " + JSON.stringify(err));
        return reject("Unauthorized");
      } else {
        var emailAddress = (data.UserAttributes).filter(data => data.Name === "email");
        //Get AWS AccountId and API Options
        var apiOptions = {};
        var tmp = event.methodArn.split(':');
        var apiGatewayArnTmp = tmp[5].split('/');
        var awsAccountId = tmp[4];
        apiOptions.region = tmp[3];
        apiOptions.restApiId = apiGatewayArnTmp[0];
        apiOptions.stage = apiGatewayArnTmp[1];
        var method = apiGatewayArnTmp[2];
        var resource = '/'; // root resource
        if (apiGatewayArnTmp[3]) {
          resource += apiGatewayArnTmp[3];
        }
        return resolve({ method: method, apiOptions: apiOptions, awsAccountId: awsAccountId, emailAddress: emailAddress });
      }
    });
  });
}

async function processCognitoUserDetails(event, context, result, config) {
  //For more information on specifics of generating policy, refer to blueprint for API Gateway's Custom authorizer in Lambda console
  var policy = new AuthPolicy(result.emailAddress[0].Value, result.awsAccountId, result.apiOptions);
  let authResult;
  try {
    authResult = await getAuthorizationDetails(event, result.emailAddress[0].Value, event.path, config);
    logger.debug("authResult: " + JSON.stringify(authResult));
    if (authResult && authResult.allow) {
      policy.allowMethod(result.method, event.path);
    }
    else {
      policy.denyMethod(result.method, event.path);
    }
  } catch (exception) {
    logger.error("Unexpected error occurred while accessing acl APIs: " + JSON.stringify(exception));
    policy.denyMethod(result.method, event.path); //user is authorized but is forbidden to access resource due to errors
  }

  let authResponse = policy.build();
  if (authResult && authResult.data) {
    logger.debug("attaching service to auth response context : ")
    authResponse.context = {
      services: JSON.stringify(authResult.data)
    }
  }

  logger.debug("policy created: " + JSON.stringify(authResponse))
  context.succeed(authResponse);
}

async function getAuthorizationDetails(event, user, resource, config) {
  let authToken = await auth.getAuthToken(config);
  let headers = exportable.changeToLowerCase(event.headers);
  if (event.httpMethod === 'GET' && resource.indexOf("services") !== -1) {
    let header_key = config.SERVICE_ID_HEADER_KEY.toLowerCase();
    let serviceData = await aclServices.getServiceMetadata(config, authToken, user, headers[header_key]);
    logger.debug("serviceData: " + JSON.stringify(serviceData))
    let allow = false;
    if (event.resource.indexOf("/services/{id}") !== -1) {
      let serviceId = event.path.split('/')[3];
      if (serviceId && serviceData.length > 0) {
        let servicePolicies = serviceData.find(service => service.serviceId === serviceId);
        allow = servicePolicies.policies.length > 0 ? true : false;
      }
    } else {
      allow = true; //serviceData can be empty for call to /services unlike a call to /services{id}
    }
    return {
      allow: allow,
      data: serviceData
    };
  } else if (resource.indexOf("acl/policies") !== -1) {
    let permission;
    if (event.httpMethod === 'GET') {
      permission = 'read'
    } else if (event.httpMethod === 'POST') {
      permission = 'admin'
    } else {
      logger.error("Incorrect method for /acl/policies" + event.httpMethod);
      return errorHandlerModule.throwInputValidationError("Method not supported");
    }
    let header_key = config.SERVICE_ID_HEADER_KEY.toLowerCase();
    let permissionData = await aclServices.checkPermissionData(config, authToken, user, headers[header_key], "manage", permission);
    logger.debug("acl/policies Data : " + JSON.stringify(permissionData))
    return {
      allow: permissionData.authorized
    };
  } else {
    let category, permission;
    if (event.httpMethod === 'GET') {
      if (resource.indexOf("deployments") !== -1) {
        category = "deploy"
      } else {
        category = "manage";
      }
      permission = "read"
    } else {
      if (resource.indexOf("deployments") !== -1) {
        category = "deploy"
        permission = 'write'
      } else {
        category = "manage";
        permission = 'admin'
        if (resource.indexOf("logs") !== -1 || resource.indexOf("metrics") !== -1) {
          permission = 'read'
        }
      }
    }
    let header_key = config.SERVICE_ID_HEADER_KEY.toLowerCase();
    let permissionData = await aclServices.checkPermissionData(config, authToken, user, headers[header_key], category, permission);
    logger.debug("permissionData: " + JSON.stringify(permissionData))
    return {
      allow: permissionData.authorized
    };
  }
}

const getPemDetails = async (cognitoUserPoolEndpoint) => {
  return new Promise((resolve, reject) => {
    let pems = {};
    request({
      url: cognitoUserPoolEndpoint + '/.well-known/jwks.json',
      json: true
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var keys = body.keys;
        for (var i = 0; i < keys.length; i++) {
          //Convert each key to PEM
          var key_id = keys[i].kid;
          var modulus = keys[i].n;
          var exponent = keys[i].e;
          var key_type = keys[i].kty;
          var jwk = { kty: key_type, n: modulus, e: exponent };
          var pem = jwkToPem(jwk);
          pems[key_id] = pem;
        }
        //Now continue with validating the token

        return resolve(pems);
      } else {
        //Unable to download JWKs, fail the call
        logger.error("getPemDetails failed")
        return reject("Authorization Failed");
      }
    });
  });
}

const wrapper = (promise) => {
  return promise.then(data => {
    return ({ error: null, data: data });
  })
    .catch(err => {
      return ({ error: err, data: null })
    });
}

function changeToLowerCase(data) {
  let newArr = {};
  for (let key in data) {
    newArr[key.toLowerCase()] = data[key];
  }
  return newArr;
}

const exportable = {
  handler,
  ValidateToken,
  getPemDetails,
  jwtValidation,
  getAuthorizationDetails,
  validateCognitoUser,
  processCognitoUserDetails,
  wrapper,
  changeToLowerCase
};

module.exports = exportable;
