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
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const validation = require("./components/validation.js");
const casbinUtil = require("./components/casbin.js");

module.exports.handler = (event, context, cb) => {

  //Initializations
  const errorHandler = errorHandlerModule();
  const config = configModule.getConfig(event, context);
  logger.init(event, context);

  try {

    validation.validateInput(event)
      .then(() => processACL(event))
      .catch(err => {
        logger.error(JSON.stringify(err));
        return cb(JSON.stringify(err));
      });

  } catch (e) {
    logger.error()
    cb(JSON.stringify(errorHandler.throwInternalServerError(e.message)));
  }
};

async function processACL(event) {

  const pathParams = event.path;
  const serviceId = pathParams.id;

  //1. POST the policy when service is created
  if (event.method === 'POST' && event.path === 'policies') {
      const policies = event.body;
      const policy = {};
      //TODO Implement the code here

      /*policies.map(p => {
        policy = {
          user: p.user,
          serviceId: p.serviceId,
          permission: p.permission,
          category: p.category
        };

        const result = await casbinUtil.addPermissionForUser(policy);
        if (!result) {
          throw new Error(`Error adding the policy for user ${policy.user} with category ${policy.category}`);
        }
      });*/
    }

  //2. GET the policy for the given service id
  if(event.method === 'GET' && event.path === 'policies' && serviceId) {
    //TOD Implement the method here
  }

  //3. PUT - update or remove the policiy for a service
  if(event.method === 'PUT' && event.path === 'policies' && serviceId) {
    //TODO implement the method here
  }

  //4. DELETE - remove the policy for a given service
  if(event.method === 'DELETE' && event.path === 'policies' && serviceId) {
    //TODO implement the method here
  }

  //5. GET the permissions for a given user
  if(event.method === 'GET' && event.path === 'services' && pathParams.user) {
    //TODO implement the method here
  }

  //6. GET the permissions for a specific service for a given user
  if(event.method === 'GET' && event.path === 'checkUserPermission' && serviceId && pathParams.user && pathParams.permission && pathParams.category) {
    //TODO implement the method here
  }
}
