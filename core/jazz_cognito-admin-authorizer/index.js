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

const errorHandlerModule = require("./components/error-handler.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const jwt = require("jsonwebtoken");
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const AWS = require('aws-sdk');
const _ = require('lodash');

var pems;
var cognitoUserPoolEndpoint;

module.exports.handler = (event, context, cb) => {

  var config = configModule.getConfig(event, context);
  logger.init(event, context);
  var errorHandler = errorHandlerModule(logger);

  if (!event || !event.authorizationToken) {
    logger.error('No access token, Request will be denied!');
    return cb("Unauthorized");
  }

  cognitoUserPoolEndpoint = `https://cognito-idp.${config.REGION}.amazonaws.com/${config.USER_POOL_ID}`;

  //Download PEM for your UserPool if not already downloaded
  if (!pems) {
    logger.info("NO PEM file");
    //Download the JWKs and save it as PEM
    request({
      url: `${cognitoUserPoolEndpoint}/.well-known/jwks.json`,
      json: true
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        pems = {};
        let keys = body.keys;
        for (let key of keys) {
          //Convert each key to PEM
          let key_id = key.kid;
          let modulus = key.n;
          let exponent = key.e;
          let key_type = key.kty;
          let jwk = {
            kty: key_type,
            n: modulus,
            e: exponent
          };
          let pem = jwkToPem(jwk);
          pems[key_id] = pem;
        }
        logger.info("PEM is downloaded. continue with validation: ");

        //Now continue with validating the token
        ValidateToken(pems, event, context, config, cb);
      } else {
        logger.info(`Unable to download JWKs: ${JSON.stringify(response)}`);
        logger.error(`Error: ${JSON.stringify(error)}`);
        //Unable to download JWKs, fail the call
        context.fail("error");
      }
    });
  } else {
    //PEMs are already downloaded, continue with validating the token
    ValidateToken(pems, event, context, config, cb);
  }

  function ValidateToken(pems, event, context, config, cb) {
    logger.info("Inside ValidateToken");
    let token = event.authorizationToken;
    //Fail if the token is not jwt
    let decodedJwt = jwt.decode(token, {
      complete: true
    });
    logger.info(`decodedJwt: ${JSON.stringify(decodedJwt)}`);
    if (!decodedJwt) {
      logger.error("Not a valid JWT token");
      return cb("Unauthorized");
    }

    //Fail if token is not from your UserPool
    if (decodedJwt.payload.iss != cognitoUserPoolEndpoint) {
      logger.error("invalid issuer");
      return cb("Unauthorized");
    }

    //Reject the jwt if it's not an 'Access Token'
    if (decodedJwt.payload.token_use != 'access') {
      logger.error("Not an access token");
      return cb("Unauthorized");
    }

    //Get the kid from the token and retrieve corresponding PEM
    let kid = decodedJwt.header.kid;
    let pem = pems[kid];
    if (!pem) {
      logger.error('Invalid access token');
      return cb("Unauthorized");
    }

    //Verify the signature of the JWT token to ensure it's really coming from your User Pool
    jwt.verify(token, pem, {
      issuer: cognitoUserPoolEndpoint
    }, (err, payload) => {
      if (err) {
        logger.error(`Error while verifying: ${JSON.stringify(err)}`);

        // Authorizer cannot send options headers, so we will fake that auth succeeded to lambda's w/o principal id
        // which will then send back unauthorized error to user
        if (err && err.name && err.name === 'TokenExpiredError') {

          //Get AWS AccountId and API Options
          let apiOptions = {};
          let tmp = event.methodArn.split(':');
          let apiGatewayArnTmp = tmp[5].split('/');
          let awsAccountId = tmp[4];
          apiOptions.region = tmp[3];
          apiOptions.restApiId = apiGatewayArnTmp[0];
          apiOptions.stage = apiGatewayArnTmp[1];
          let method = apiGatewayArnTmp[2];
          let resource = '/'; // root resource
          if (apiGatewayArnTmp[3]) {
            resource += apiGatewayArnTmp[3];
          }
          //fake that auth succeeded to lambda's w/o principal id
          let policy = new AuthPolicy("", awsAccountId, apiOptions);
          policy.allowAllMethods();
          context.succeed(policy.build());
          return;
        } else {
          return cb("Unauthorized");
        }
      } else {
        logger.info(JSON.stringify(payload));
        //Valid token. Generate the API Gateway policy for the user
        //Always generate the policy on value of 'sub' claim and not for 'username' because username is reassignable
        //sub is UUID for a user which is never reassigned to another user.

        const cognito = new AWS.CognitoIdentityServiceProvider({
          apiVersion: '2016-04-19',
          region: config.REGION
        });

        var params = {
          AccessToken: token
        };

        cognito.getUser(params, (err, data) => {
          if (err) {
            logger.error(`cognito.getUser error: ${JSON.stringify(err)}`);
            return cb("Unauthorized");
          } else {
            logger.info(`success with cognito.getUser: ${JSON.stringify(data)}`);
            let emailAddress = _.find(data.UserAttributes, {
              "Name": "email"
            });
            //Get AWS AccountId and API Options
            let apiOptions = {};
            let tmp = event.methodArn.split(':');
            let apiGatewayArnTmp = tmp[5].split('/');
            let awsAccountId = tmp[4];
            apiOptions.region = tmp[3];
            apiOptions.restApiId = apiGatewayArnTmp[0];
            apiOptions.stage = apiGatewayArnTmp[1];
            let method = apiGatewayArnTmp[2];
            let resource = '/'; // root resource
            if (apiGatewayArnTmp[3]) {
              resource += apiGatewayArnTmp[3];
            }
            if (emailAddress.Value === config.JAZZ_ADMIN) {
              //For more information on specifics of generating policy, refer to blueprint for API Gateway's Custom authorizer in Lambda console
              let policy = new AuthPolicy(emailAddress.Value, awsAccountId, apiOptions);
              policy.allowAllMethods();
              context.succeed(policy.build());
            } else {
              logger.error(`${emailAddress.Value} is not admin.`);
              return cb("Unauthorized");
            }

          }
        });
      }
    });
  }

  /**
   * AuthPolicy receives a set of allowed and denied methods and generates a valid
   * AWS policy for the API Gateway authorizer. The constructor receives the calling
   * user principal, the AWS account ID of the API owner, and an apiOptions object.
   * The apiOptions can contain an API Gateway RestApi Id, a region for the RestApi, and a
   * stage that calls should be allowed/denied for. For example
   * {
   *   restApiId: "xxxxxxxxxx",
   *   region: "us-east-1",
   *   stage: "dev"
   * }
   *
   * var testPolicy = new AuthPolicy("[principal user identifier]", "[AWS account id]", apiOptions);
   * testPolicy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");
   * testPolicy.denyMethod(AuthPolicy.HttpVerb.POST, "/pets");
   * context.succeed(testPolicy.build());
   *
   * @class AuthPolicy
   * @constructor
   */
  function AuthPolicy(principal, awsAccountId, apiOptions) {
    /**
     * The AWS account id the policy will be generated for. This is used to create
     * the method ARNs.
     *
     * @property awsAccountId
     * @type {String}
     */
    this.awsAccountId = awsAccountId;

    /**
     * The principal used for the policy, this should be a unique identifier for
     * the end user.
     *
     * @property principalId
     * @type {String}
     */
    this.principalId = principal;

    /**
     * The policy version used for the evaluation. This should always be "2012-10-17"
     *
     * @property version
     * @type {String}
     * @default "2012-10-17"
     */
    this.version = "2012-10-17";

    /**
     * The regular expression used to validate resource paths for the policy
     *
     * @property pathRegex
     * @type {RegExp}
     * @default '^\/[/.a-zA-Z0-9-\*]+$'
     */
    this.pathRegex = new RegExp('^[/.a-zA-Z0-9-\*]+$');

    // these are the internal lists of allowed and denied methods. These are lists
    // of objects and each object has 2 properties: A resource ARN and a nullable
    // conditions statement.
    // the build method processes these lists and generates the approriate
    // statements for the final policy
    this.allowMethods = [];
    this.denyMethods = [];

    if (!apiOptions || !apiOptions.restApiId) {
      this.restApiId = "*";
    } else {
      this.restApiId = apiOptions.restApiId;
    }
    if (!apiOptions || !apiOptions.region) {
      this.region = "*";
    } else {
      this.region = apiOptions.region;
    }
    if (!apiOptions || !apiOptions.stage) {
      this.stage = "*";
    } else {
      this.stage = apiOptions.stage;
    }
  }

  /**
   * A set of existing HTTP verbs supported by API Gateway. This property is here
   * only to avoid spelling mistakes in the policy.
   *
   * @property HttpVerb
   * @type {Object}
   */
  AuthPolicy.HttpVerb = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    HEAD: "HEAD",
    DELETE: "DELETE",
    OPTIONS: "OPTIONS",
    ALL: "*"
  };

  AuthPolicy.prototype = (() => {
    /**
     * Adds a method to the internal lists of allowed or denied methods. Each object in
     * the internal list contains a resource ARN and a condition statement. The condition
     * statement can be null.
     *
     * @method addMethod
     * @param {String} The effect for the policy. This can only be "Allow" or "Deny".
     * @param {String} he HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {String} The resource path. For example "/pets"
     * @param {Object} The conditions object in the format specified by the AWS docs.
     * @return {void}
     */
    function addMethod(effect, verb, resource, conditions) {
      if (verb !== "*" && !AuthPolicy.HttpVerb.hasOwnProperty(verb)) {
        throw new Error(`Invalid HTTP verb ${verb}. Allowed verbs in AuthPolicy.HttpVerb`);
      }

      if (!this.pathRegex.test(resource)) {
        throw new Error(`Invalid resource path: ${resource}. Path should match ${this.pathRegex}`);
      }

      let cleanedResource = resource;
      if (resource.substring(0, 1) == "/") {
        cleanedResource = resource.substring(1, resource.length);
      }
      let resourceArn = `arn:aws:execute-api:${this.region}:${this.awsAccountId}:${this.restApiId}/${this.stage}/${verb}/${cleanedResource}`;

      if (effect.toLowerCase() == "allow") {
        this.allowMethods.push({
          resourceArn: resourceArn,
          conditions: conditions
        });
      } else if (effect.toLowerCase() == "deny") {
        this.denyMethods.push({
          resourceArn: resourceArn,
          conditions: conditions
        });
      }
    };

    /**
     * Returns an empty statement object prepopulated with the correct action and the
     * desired effect.
     *
     * @method getEmptyStatement
     * @param {String} The effect of the statement, this can be "Allow" or "Deny"
     * @return {Object} An empty statement object with the Action, Effect, and Resource
     *                  properties prepopulated.
     */
    var getEmptyStatement = (effect) => {
      effect = effect.substring(0, 1).toUpperCase() + effect.substring(1, effect.length).toLowerCase();
      let statement = {};
      statement.Action = "execute-api:Invoke";
      statement.Effect = effect;
      statement.Resource = [];

      return statement;
    };

    /**
     * This function loops over an array of objects containing a resourceArn and
     * conditions statement and generates the array of statements for the policy.
     *
     * @method getStatementsForEffect
     * @param {String} The desired effect. This can be "Allow" or "Deny"
     * @param {Array} An array of method objects containing the ARN of the resource
     *                and the conditions for the policy
     * @return {Array} an array of formatted statements for the policy.
     */
    var getStatementsForEffect = (effect, methods) => {
      let statements = [];

      if (methods.length > 0) {
        let statement = getEmptyStatement(effect);

        for (let curMethod of methods) {
          if (!curMethod.conditions || !curMethod.conditions.length) {
            statement.Resource.push(curMethod.resourceArn);
          } else {
            let conditionalStatement = getEmptyStatement(effect);
            conditionalStatement.Resource.push(curMethod.resourceArn);
            conditionalStatement.Condition = curMethod.conditions;
            statements.push(conditionalStatement);
          }
        }

        if (statement.Resource && statement.Resource.length) {
          statements.push(statement);
        }
      }

      return statements;
    };

    return {
      constructor: AuthPolicy,

      /**
       * Adds an allow "*" statement to the policy.
       *
       * @method allowAllMethods
       */
      allowAllMethods: function () {
        addMethod.call(this, "allow", "*", "*", null);
      },

      /**
       * Adds a deny "*" statement to the policy.
       *
       * @method denyAllMethods
       */
      denyAllMethods: function () {
        addMethod.call(this, "deny", "*", "*", null);
      },

      /**
       * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
       * methods for the policy
       *
       * @method allowMethod
       * @param {String} The HTTP verb for the method, this should ideally come from the
       *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
       * @param {string} The resource path. For example "/pets"
       * @return {void}
       */
      allowMethod: function(verb, resource) {
        addMethod.call(this, "allow", verb, resource, null);
      },

      /**
       * Adds an API Gateway method (Http verb + Resource path) to the list of denied
       * methods for the policy
       *
       * @method denyMethod
       * @param {String} The HTTP verb for the method, this should ideally come from the
       *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
       * @param {string} The resource path. For example "/pets"
       * @return {void}
       */
      denyMethod: function(verb, resource) {
        addMethod.call(this, "deny", verb, resource, null);
      },

      /**
       * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
       * methods and includes a condition for the policy statement. More on AWS policy
       * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
       *
       * @method allowMethodWithConditions
       * @param {String} The HTTP verb for the method, this should ideally come from the
       *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
       * @param {string} The resource path. For example "/pets"
       * @param {Object} The conditions object in the format specified by the AWS docs
       * @return {void}
       */
      allowMethodWithConditions: function(verb, resource, conditions) {
        addMethod.call(this, "allow", verb, resource, conditions);
      },

      /**
       * Adds an API Gateway method (Http verb + Resource path) to the list of denied
       * methods and includes a condition for the policy statement. More on AWS policy
       * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
       *
       * @method denyMethodWithConditions
       * @param {String} The HTTP verb for the method, this should ideally come from the
       *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
       * @param {string} The resource path. For example "/pets"
       * @param {Object} The conditions object in the format specified by the AWS docs
       * @return {void}
       */
      denyMethodWithConditions: function(verb, resource, conditions) {
        addMethod.call(this, "deny", verb, resource, conditions);
      },

      /**
       * Generates the policy document based on the internal lists of allowed and denied
       * conditions. This will generate a policy with two main statements for the effect:
       * one statement for Allow and one statement for Deny.
       * Methods that includes conditions will have their own statement in the policy.
       *
       * @method build
       * @return {Object} The policy object that can be serialized to JSON.
       */
      build: function() {
        if ((!this.allowMethods || this.allowMethods.length === 0) &&
          (!this.denyMethods || this.denyMethods.length === 0)) {
          throw new Error("No statements defined for the policy");
        }

        let policy = {};
        policy.principalId = this.principalId;
        let doc = {};
        doc.Version = this.version;
        doc.Statement = [];

        doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, "Allow", this.allowMethods));
        doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, "Deny", this.denyMethods));

        policy.policyDocument = doc;

        return policy;
      }
    };

  })();

};
