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

const aws = require("aws-sdk");

function listUsers(config) {
  return new Promise((resolve, reject) => {
    const CognitoIdentityServiceProvider = aws.CognitoIdentityServiceProvider;
    const client = new CognitoIdentityServiceProvider({
      apiVersion: '2016-04-19',
      region: config.REGION
    });

    let params = {
      UserPoolId: config.USER_POOL_ID,
      AttributesToGet: [
        'email'
      ]
    };

    let users_list = [];

    sendReq(client, params, users_list)
    .then(res => resolve(res))
    .catch(err => reject(err));
  });
}

function sendReq(client, params, users_list) {
  return new Promise((resolve, reject) => {
    client.listUsers(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        data.Users.forEach(eachUser => {
          users_list.push(eachUser)
        });

        if (data.PaginationToken) {
          params.PaginationToken = data.PaginationToken
          sendReq(client, params, users_list)
          .then(res => resolve(res))
          .catch(err => reject(err));
        } else {
          let email_list = [];
          users_list.forEach(each => {
            if (each.UserStatus === "CONFIRMED" && each.Attributes[0].Name === "email") {
              email_list.push(each.Attributes[0].Value)
            }
          });
          resolve(email_list);
        }
      }
    });
  });
};

module.exports = {
  listUsers
}
