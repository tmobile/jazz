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

module.exports.handler = (event, context, cb) => {

  //Initializations
  var errorHandler = errorHandlerModule(),
    config = configObj.getConfig(event, context);
  logger.init(event, context);
  var isServAccRequested = true;

  genericInputValidation(event, config)
    .then(() => createPublicSlackChannel(config, event.body))
    .then(res => addMemberToChannel(config, res.data, isServAccRequested, event.body))
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
        return cb(JSON.stringify(errorHandler.throwInternalServerError(error.message)));
      }
    });
};

function genericInputValidation(event, config) {
  logger.debug("Inside genericInputValidation");
  return new Promise((resolve, reject) => {
    if (!event || !event.body || !event.method) {
      reject({
        result: "inputError",
        message: "Service inputs not defined!"
      });
    }

    if (!event.body.channel_name) {
      reject({
        result: "inputError",
        message: "channel_name is required!."
      });
    } else {
      let name = event.body.channel_name;
      if (name.length > config.slack_channel_name_length) {
        reject({
          result: "inputError",
          message: "channel name should not exceed more than 21 characters"
        });
      } else if (/[^a-zA-Z0-9\-\_]/.test(name)) {
        reject({
          result: "inputError",
          message: "channel name should accept letters, numbers, hyphens, and underscores"
        });
      }
    }

    if (!event.body.users || event.body.users.length < 1) {
      reject({
        result: "inputError",
        message: "users.email_id is required!."
      });
    } else {
      let users = event.body.users;
      for (let i in users) {
        let emailAddress = users[i].email_id;
        if (!validateEmailId(emailAddress)) {
          let msg = 'Not a valid email id!';
          if (emailAddress) {
            msg = emailAddress + " not a valid email id!.";
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
  let info = null;

	var out = members.find(each => {
		var memberEmailId = (each.profile.email) ? each.profile.email : null;
		if (memberEmailId && type === 'id' && each.id === value) {
			return each;
		} else if (memberEmailId && type === 'email' && memberEmailId.toLowerCase() === value.toLowerCase()) {
			return each;
		}
	});
	info = formatData(out);
	return info;
}

function isMemberAlreadyExists(id, list) {
  if (list.length > 0) {
    for (var index in list) {
      if (list[index].id === id) {
        return true;
      }
    }
  }
  return false;
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
      let memberDetails = identifyMembers(registeredSlackMembers, 'id', channelMembers[i]);
      if (memberDetails) {
        membersDetails.push(memberDetails);
      }
    }
  }
  return membersDetails;
}

function removeServAccFromMemberList(slackUrl, token, id) {
  let op = {},
    req = {
      url: slackUrl + "channels.leave?token=" + token + "&channel=" + id,
      method: 'GET'
    };
  request(req, (error, response, body) => {
    if (error) {
      logger.error("Exception occured while creating slack channel!");
      op = requestResponse;
    } else {
      let resBody = JSON.parse(response.body);
      if (!resBody.ok) {
        logger.error('Error occured: ' + JSON.stringify(resBody.detail));
        op.result = "inputError";
        op.message = resBody.detail;
      } else {
        op.result = "success";
        op.message = "successfully removed service account from memberlist";
      }
    }
  });
  return op;
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
      },
      memDetails = {};
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
            message: respData.data.detail
          });
        } else {
          memDetails.result = "success";
          let registeredSlackMembers = respData.members;

          users.forEach(user => {
            let usrEmail = user.email_id,
              usr = identifyMembers(registeredSlackMembers, 'email', usrEmail);
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
    getUsersInfo(config, eventBody)
      .then(res => {
        let channelMembers = res.data.channelMembers;
        let defaultMembersDetails = defaultChannelMembersDetails(res.data.registeredSlackMembers, channelInfo.members);
        if (defaultMembersDetails.length > 0) {
          for (let index in defaultMembersDetails) {
            let defmember = defaultMembersDetails[index];
            if (!isMemberAlreadyExists(defmember.id, channelMembers)) {
              channelMembers.push(defmember);
            }
          }
        }

        //Adding requested users to channel member list
        let count = 0;
        for (let itm in channelMembers) {
          count++;
          addMembersToSlackChannel(slack_channel_url, token, channelInfo.id, channelMembers[itm].id)
            .then(() => {
              if (count === channelMembers.length) {
                getSlackChannelMembers(config, channelMembers, isServAccRequested, slackChannelMembers)
                  .then(res => notifyUser(config, eventBody, res, channelInfo))
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
      for (let i in channelMembers) {
        let memberEmailAddr = channelMembers[i].email_id;
        if (memberEmailAddr.toLowerCase() === (config.service_account_emailId).toLowerCase()) {
          let rt = removeServAccFromMemberList(slack_channel_url, token, channelInfo.id);
          if (rt.result === 'success') {
            break;
          }
        } else {
          slackChannelMembers.push(channelMembers[i]);
          if (slackChannelMembers.length === channelMembers.length) {
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

function notifyUser(config, eventBody, slackChannelMembers, channelInfo) {
  return new Promise((resolve, reject) => {
    let channelLink = config.slack_url + "/" + channelInfo.id + "/details";

    let toAddress = slackChannelMembers.map(eachMember => {
      let email_content = {
        "emailID": eachMember.email_id,
        "name": {
          "first": eachMember.first_name,
          "last": eachMember.last_name
        },
        "heading": "Slack Channel Notification",
        "message": "The new slack channel '" + eventBody.channel_name + "' has been created. Click on " + channelLink.link(channelLink) + " to access channel."
      };
      return email_content;
    });

    if (toAddress.length > 0) {
      let template = {
          "from": config.email_from,
          "to": toAddress,
          "subject": "Jazz Notification",
          "templateDirUrl": "<div>hello, slack notification</div>"
        },
        emailNotificationSvcPayload = {
          url: config.service_api_url + config.email_endpoint,
          method: "POST",
          json: true,
          body: template,
          rejectUnauthorized: false
        };

      emailNotificationSvcPayload.headers = {
        "Content-Type": "application/json"
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
  });
}
