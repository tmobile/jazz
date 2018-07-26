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

/**
Nodejs Template Project
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js")();
const request = require("request");
const format = require("string-template");

function handler(event, context, cb) {

  //Initializations
  let errorHandler = errorHandlerModule(),
  config = configObj.getConfig(event, context);
  logger.init(event, context);
  let isServAccRequested = false;

  exportable.genericInputValidation(event, config)
    .then(() => exportable.createPublicSlackChannel(config, event.body))
    .then(res => exportable.addMemberToChannel(config, res.data, isServAccRequested, event.body))
    .then(res => {
      logger.info("successfully created public slack channel: " + JSON.stringify(res));
      let result = {
        "channel_id": res.data.channelInfo.id,
        "channel_name": res.data.channelInfo.name,
        "channel_link": res.data.channelInfo.link,
        "members": res.data.slackChannelMembers,
      };
      return cb(null, responseObj(result, event.body));
    })
    .catch(error => {
      logger.error(error);
      if (error.result === "inputError") {
        return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
      } else if (error.result === "unauthorized") {
        return cb(JSON.stringify(errorHandler.throwUnauthorizedError(error.message)));
      } else {
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Unhandled error.")));
      }
    });
};

function genericInputValidation(event, config) {
  logger.debug("Inside genericInputValidation");
  return new Promise((resolve, reject) => {
    if (!event || !event.method) {
			reject({
				result: "inputError",
				message: "Method cannot be empty/invalid."
			});
    }

    if (!event.body || Object.keys(event.body).length === 0) {
			reject({
				result: "inputError",
				message: "Slack details are required for creating new slack channel."
			});
		}

    if (!event.body.channel_name) {
      reject({
        result: "inputError",
        message: "Channel name is required."
      });
    } else {
      let name = event.body.channel_name;
      if (name.length > config.slack_channel_name_length) {
        reject({
          result: "inputError",
          message: "Channel name should not exceed more than 21 characters"
        });
      } else if (/[^a-zA-Z0-9\-\_]/.test(name)) {
        reject({
          result: "inputError",
          message: "Channel name can contain letters, numbers, hyphens, and underscores."
        });
      }
    }

    if (!event.body.users || event.body.users.length < 1) {
      reject({
        result: "inputError",
        message: "At least one user is required."
      });
    } else {
      let users = event.body.users;
      for (let i in users) {
        let emailAddress = users[i].email_id;
        if (!validateEmailId(emailAddress)) {
          let msg = 'Not a valid email id!';
          if (emailAddress) {
            msg = emailAddress + " is not a valid email address.";
          }
          reject({
            result: "inputError",
            message: msg
          });
        } else if (emailAddress.toLowerCase() === (config.service_account_emailId).toLowerCase()) {
          isServAccRequested = true;
        }
      }
    }

    if (event.method && event.method !== "POST") {
      reject({
        result: "inputError",
        message: "Unsupported method/request."
      });
    }

    if (!event.principalId) {
      reject({
        result: "unauthorized",
        message: "Unauthorized."
      });
    }

    resolve();
  });
}

function identifyMembers(members, type, value) {
  let info = null,
  out = members.find(each => {
    let memberEmailId = (each.profile.email) ? each.profile.email : null;
    if (memberEmailId && type === 'id' && each.id === value) {
      return each;
    } else if (memberEmailId && type === 'email' && memberEmailId.toLowerCase() === value.toLowerCase()) {
      return each;
    }
  });

  info = exportable.formatData(out);
  return info;
}

function formatData(memberInfo) {
  let member = {
    'id': (memberInfo.id) ? memberInfo.id : '',
    'name': (memberInfo.name) ? memberInfo.name : '',
    'team_id': (memberInfo.team_id) ? memberInfo.team_id : '',
    'first_name': (memberInfo.profile.first_name) ? memberInfo.profile.first_name : '',
    'last_name': (memberInfo.profile.last_name) ? memberInfo.profile.last_name : '',
    'email_id': (memberInfo.profile.email) ? memberInfo.profile.email : ''
  };
  return member;
}

function validateEmailId(email) {
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function defaultChannelMembersDetails(registeredSlackMembers, channelMembers) {
  let membersDetails = [];
  if (registeredSlackMembers.length > 0) {
    for (let i in channelMembers) {
      let memberDetails = exportable.identifyMembers(registeredSlackMembers, 'id', channelMembers[i]);
      if (memberDetails) {
        membersDetails.push(memberDetails);
      }
    }
  }
  return membersDetails;
}

function removeServAccFromMemberList(slackUrl, token, id) {
  return new Promise((resolve, reject) => {
    let req = {
      url: slackUrl + "channels.leave?token=" + token + "&channel=" + id,
      method: 'GET'
    };

    request(req, (error, response, body) => {
      if (error) {
        logger.error("Exception occured while creating slack channel!" + JSON.stringify(error));
        reject(error);
      } else {
        let resBody = JSON.parse(response.body);
        if (!resBody.ok) {
          logger.error('Error occured: ' + JSON.stringify(resBody.detail));
          reject({
            result: 'inputError',
            message: resBody.detail
          });
        } else {
          logger.info("successfully removed service account from memberlist");
          resolve({
            result: "success",
            message: "successfully removed service account from memberlist"
          });
        }
      }
    });
  });
}

function addMembersToSlackChannel(slackUrl, token, channelId, userId) {
  return new Promise((resolve, reject) => {
    let reqt = {
      url: slackUrl + "channels.invite?token=" + token + '&channel=' + channelId + '&user=' + userId,
      method: 'GET'
    };

    request(reqt, (error, response, body) => {
      if (error) {
        reject(false);
      } else {
        let rpData = JSON.parse(response.body);
        if (!rpData || !rpData.ok) {
          if (rpData.error && (rpData.error === 'cant_invite_self' || rpData.error === 'already_in_channel')) {
            resolve(true);
          } else {
            reject(false);
          }
        } else {
          resolve(true);
        }
      }
    });
  });
}

function getUsersInfo(config, eventBody) {
  return new Promise((resolve, reject) => {
    let unknowUsers = [],
    channelMembers = [],
    users = eventBody.users,
    reqPayload = {
      url: config.slack_channel_url + "users.list?token=" + config.slack_token,
      method: 'GET'
    };

    request(reqPayload, (error, response, body) => {
      if (error) {
        logger.error("Exception occured while fetching slack channel users!" + JSON.stringify(error));
        reject(error);
      } else {
        let respData = JSON.parse(response.body);

        if (!respData || !respData.ok) {
          logger.error('Error occured: ' + JSON.stringify(respData.detail));
          reject({
            result: "inputError",
            message: respData.detail
          });
        } else {
          let registeredSlackMembers = respData.members;

          users.forEach(user => {
            let usrEmail = user.email_id,
            usr = exportable.identifyMembers(registeredSlackMembers, 'email', usrEmail);

            if (usr) {
              channelMembers.push(usr);
            } else {
              unknowUsers.push(usrEmail);
            }
          });

          if (unknowUsers.length > 0) {
            let errMsg = "Cannot find user(s) in Slack with email ids: " + unknowUsers.join(", ");
            reject({
              result: "inputError",
              message: errMsg
            });
          } else {
            resolve({
              result: "success",
              data: {
                "registeredSlackMembers": registeredSlackMembers,
                "channelMembers": channelMembers
              }
            });
          }
        }
      }
    });
  });
}

function createPublicSlackChannel(config, eventBody) {
  logger.debug("Inside createPublicSlackChannel");
  return new Promise((resolve, reject) => {
    let channel_name = eventBody.channel_name,
    options = {
      url: config.slack_channel_url + "channels.create?token=" + config.slack_token + "&name=" + channel_name + "&validate=true",
      method: 'GET'
    };

    request(options, (error, response, body) => {
      if (error) {
        logger.error("Exception occured while creating slack channel!");
        reject(error);
      } else {
        let responseBody = JSON.parse(response.body);
        if (!responseBody || !responseBody.ok) {
          let detailedMsg = 'Exception occured while creating slack channel: ' + channel_name;
          logger.error('Error occured: ' + JSON.stringify(responseBody));
          if (responseBody.error && responseBody.error === 'name_taken') {
            detailedMsg = 'Slack channel with name: ' + channel_name + ' already exists.';
          }
          reject({
            result: "inputError",
            message: detailedMsg
          });
        } else {
          let slack_link = config.slack_url + "/" + responseBody.channel.id + "/details";
          channelInfo = {
            'id': responseBody.channel.id,
            'name': responseBody.channel.name,
            'link': slack_link,
            'members': responseBody.channel.members
          };

          resolve({
            result: "success",
            data: channelInfo
          });
        }
      }
    });
  });
}

function addMemberToChannel(config, channelInfo, isServAccRequested, eventBody) {
  logger.debug("Inside addMemberToChannel");
  return new Promise((resolve, reject) => {
    let slack_channel_url = config.slack_channel_url,
    token = config.slack_token,
    slackChannelMembers = [];

    exportable.getUsersInfo(config, eventBody)
      .then(res => {
        let channelMembers = res.data.channelMembers;
        let defaultMembersDetails = exportable.defaultChannelMembersDetails(res.data.registeredSlackMembers, channelInfo.members);
        if (defaultMembersDetails.length > 0) {
          for (let index in defaultMembersDetails) {
            let defmember = defaultMembersDetails[index];
            if (!channelMembers.find(each => each.id === defmember.id)) {
              channelMembers.push(defmember);
            }
          }
        }

        //Adding requested users to channel member list
        let count = 0;
        for (let itm in channelMembers) {

          exportable.addMembersToSlackChannel(slack_channel_url, token, channelInfo.id, channelMembers[itm].id)
            .then(() => {
              count++;
              if (count === channelMembers.length) {
                exportable.getSlackChannelMembers(config, channelMembers, isServAccRequested, slackChannelMembers)
                  .then(res => exportable.notifyUser(config, res, channelInfo))
                  .then(res => {
                    if (res.result === "success") {
                      resolve({
                        result: "success",
                        data: {
                          "slackChannelMembers": slackChannelMembers,
                          "channelInfo": channelInfo
                        }
                      });
                    } else {
                      reject(res);
                    }
                  })
                  .catch(error => {
                    reject(error);
                  });
              }
            })
            .catch(error => {
              reject({
                result: "internalError",
                message: "Slack channel creation is completed and got exception while adding members to the channel. Please try to add members manually."
              });
            })
        }
      })
      .catch(error => {
        reject(error);
      });;
  });
}

function getSlackChannelMembers(config, channelMembers, isServAccRequested, slackChannelMembers) {
  return new Promise((resolve, reject) => {
    let slack_channel_url = config.slack_channel_url,
    token = config.slack_token;

    if (!isServAccRequested) {
      let count = 0;
      for (let i in channelMembers) {
        let memberEmailAddr = channelMembers[i].email_id;
        if (memberEmailAddr.toLowerCase() === (config.service_account_emailId).toLowerCase()) {
          count++;
          exportable.removeServAccFromMemberList(slack_channel_url, token, channelInfo.id)
          .then(res => {
            if (res.result === 'success') {
              logger.debug("res.result success");
              if (count === channelMembers.length) {
                resolve(slackChannelMembers);
              }
            }
          })
          .catch(error => {
            reject(error);
          });
        } else {
          count++;
          slackChannelMembers.push(channelMembers[i]);
          if (count === channelMembers.length) {
            resolve(slackChannelMembers);
          }
        }
      }
    } else {
      slackChannelMembers = channelMembers;
      resolve(slackChannelMembers);
    }
  });
}

function notifyUser(config, slackChannelMembers, channelInfo) {
  return new Promise((resolve, reject) => {
    let txt = format(config.notification_txt, channelInfo);
    exportable.getToken(config)
    .then((authToken) => {
      let toAddress = slackChannelMembers.map(eachMember => eachMember.email_id);

      if (toAddress.length > 0) {
        let template = {
          "from" : config.service_user,
          "to" : toAddress,
          "subject" : config.email_subject,
          "text" : "",
          "cc" : "",
          "html" : txt
        },
        emailNotificationSvcPayload = {
          url: config.service_api_url + config.email_endpoint,
          method: "POST",
          json: true,
          body: template,
          rejectUnauthorized: false
        };

        emailNotificationSvcPayload.headers = {
          "Content-Type": "application/json",
          'Authorization': authToken
        };

        request(emailNotificationSvcPayload, (error, response, body) => {
          if (error) {
            logger.error("Exception occured while sending notification to user!" + JSON.stringify(error));
            reject(error);
          } else {
            if (response && response.statusCode === 200) {
              resolve({
                result: "success",
                data: "successfully created public slack channel and send email notification to members"
              });
            } else {
              reject(response);
            }
          }
        });
      }
    })
    .catch(error => {
      reject(error);
    })
  });
}

function getToken(configData) {
  logger.debug("Inside getToken");
  return new Promise((resolve, reject) => {
    let svcPayload = {
      uri: configData.service_api_url + configData.token_url,
      method: 'post',
      json: {
        "username": configData.service_user,
        "password": configData.token_creds
      },
      rejectUnauthorized: false
    };

    request(svcPayload, (error, response, body) => {
      if (response && response.statusCode === 200 && body && body.data) {
        let authToken = body.data.token;
        resolve(authToken);
      } else {
        let message = "";
        if (error) {
          message = error.message
        } else {
          message = response.body.message
        }
        reject({
          "error": "Could not get authentication token for updating service catalog.",
          "message": message
        });
      }
    });
  });
}

const exportable = {
  handler,
  genericInputValidation,
  identifyMembers,
  formatData,
  validateEmailId,
  defaultChannelMembersDetails,
  removeServAccFromMemberList,
  addMembersToSlackChannel,
  getUsersInfo,
  createPublicSlackChannel,
  addMemberToChannel,
  getSlackChannelMembers,
  notifyUser,
  getToken
};

module.exports = exportable;
