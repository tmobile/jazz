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

const expect = require('chai').expect;
const awsContext = require('aws-lambda-mock-context');
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const request = require('request');
const format = require("string-template");

const index = require('../index');
const configObj = require('../components/config.js');

describe('jazz_slack-channel', function () {
  var err, event, context, callback, callbackObj, reqStub;
  beforeEach(function () {
    event = {
      "stage": "test",
      "method": "POST",
      "body": {
        "channel_name" : "abc-channel",
        "users" : [{"email_id" :"xyz@abc.com"}]
      },
      "principalId": "xswdxwscvff@test.com"
    };
    context = awsContext();
    callback = (err, responseObj) => {
      if (err) {
        return err;
      } else {
        return JSON.stringify(responseObj);
      }
    };
    err = {
      "errorType": "svtfoe",
      "message": "starco"
    };
    callbackObj = {
      "callback": callback
    };
    config = configObj.getConfig(event, context);
  });

  describe('genericInputValidation', () => {
    it("should indicate input error if service event is not defined/invalid", () => {
      let invalidArray = ["", null, undefined];
      invalidArray.forEach(each => {
        event = each;
        index.genericInputValidation(event, config)
        .catch(error => {
          expect(error).to.include({ result: 'inputError', message: 'Service inputs not defined!' })
        });
      });
    });

    it("should indicate input error if service event.body is not defined/invalid", () => {
      let invalidArray = ["", null, undefined];
      invalidArray.forEach(each => {
        event.body = each;
        index.genericInputValidation(event, config)
        .catch(error => {
          expect(error).to.include({ result: 'inputError', message: 'Service inputs not defined!' })
        });
      });
    });

    it("should indicate input error if service event.method is not defined/invalid", () => {
      let invalidArray = ["", null, undefined];
      invalidArray.forEach(each => {
        event.method = each;
        index.genericInputValidation(event, config)
        .catch(error => {
          expect(error).to.include({ result: 'inputError', message: 'Service inputs not defined!' })
        });
      });
    });

    it("should indicate input error if channel_name is missing/undefined", () => {
      let invalidArray = ["", null, undefined];
      invalidArray.forEach(each => {
        event.body.channel_name = each;
        index.genericInputValidation(event, config)
        .catch(error => {
          expect(error).to.include({result: 'inputError', message: 'Channel name is required.'})
        });
      });
    });

    it("should indicate input error if channel name includes more than 21 characters", () => {
      event.body.channel_name = "ssxsxswxsw_xwxswxsw_xwxswxsw-xswxws";
      index.genericInputValidation(event, config)
      .catch(error => {
        expect(error).to.include({result: 'inputError', message: 'Channel name should not exceed more than 21 characters'})
      });
    });

    it("should indicate input error if channel name contain invalid characters in channel name", () => {
      event.body.channel_name = "$ssxsxswxsw/@s";
      index.genericInputValidation(event, config)
      .catch(error => {
        expect(error).to.include({result: 'inputError', message: 'Channel name can contain letters, numbers, hyphens, and underscores.'})
      });
    });

    it("should indicate input error if users key is not available/defined", () => {
      delete event.body.users;
      index.genericInputValidation(event, config)
      .catch(error => {
        expect(error).to.include({result: 'inputError', message: 'At least one user is required.'});
      });
    });

    it("should indicate input error if users is not defined/invalid", () => {
      let invalidArray = ["", null, undefined, []];
      invalidArray.forEach(each => {
        event.body.users = each;
        index.genericInputValidation(event, config)
        .catch(error => {
          expect(error).to.include({result: 'inputError', message: 'At least one user is required.'});
        });
      });
    });

    it("should indicate input error if email id is invalid", () => {
      event.body.users = [{
        "email_id": "xyz-abc-com"
      }];
      index.genericInputValidation(event, config)
      .catch(error => {
        expect(error).to.include({result: 'inputError', message: event.body.users[0].email_id + ' is not a valid email address.'});
      });
    });

    it("should indicate isServAccRequested is true if users emailId match with provided service account emailId", () => {
      event.body.users = [{
        "email_id": "svcid@abc.com"
      }];
      index.genericInputValidation(event, config)
      .then(res => {
        expect(isServAccRequested).to.be.true;
      });
    });

    it("should indicate unsupported mathod if method is other that POST", () => {
      let invalidMethodArray = ['GET', 'DELETE', 'PUT'];
      invalidMethodArray.forEach(each => {
        event.method = each;
        index.genericInputValidation(event, config)
        .catch(error => {
          expect(error).to.include({result: 'inputError', message: 'Unsupported method/request.'});
        });
      });
    });

    it("should indicate unauthorized", () => {
      let invalidArray = ["", null, undefined];
      invalidArray.forEach(each => {
        event.principalId = each;
        index.genericInputValidation(event, config)
        .catch(error => {
          expect(error).to.include({result: 'unauthorized', message: 'Unauthorized.'});
        })
      });
    });

    it("should successfully validate input", () => {
      index.genericInputValidation(event, config)
      .then(res => {
        expect(res).to.be.undefined;
      })
    });

  });

  describe('identifyMembers', () => {
    it("should successfully return member deatails", () => {
      let members = [{
        profile: {
          email: "xyz@bac.com"
        },
        id: "xyz@bac.com"
      }];
      let typesArray = ['id', 'email'];
      let res = {id: "xyz"};
      typesArray.forEach(eachType => {
        let formatData = sinon.stub(index, 'formatData').returns(res);
        let memberDetail = index.identifyMembers(members, eachType, 'xyz@bac.com');
        expect(memberDetail).to.include(res);
        sinon.assert.calledOnce(formatData);
        formatData.restore();
      });
    });

    it("should return empty data if email id is unavailable", () => {
      let members = [{
        profile: {
          email: ""
        }
      }];
      let res = {id: "xyz"};
      let formatData = sinon.stub(index, 'formatData').returns(res);
      let memberDetail = index.identifyMembers(members, 'id', 'xyz@bac.com');
      expect(memberDetail).to.include(res);
      sinon.assert.calledOnce(formatData);
      formatData.restore();
    });
  });

  describe('formatData', () => {
    it("should successfully format the provided data/input", () => {
      let inputObj = {
        id: "123456",
        name: "xyz",
        team_id: "987654",
        profile: {
          first_name: "xyz",
          last_name: "poi",
          email: "xyz@abc.com"
        }
      };
      let responseObj = index.formatData(inputObj);
      expect(responseObj).to.have.all.keys('id', 'name', 'team_id', 'first_name', 'last_name', 'email_id');
      expect(responseObj.id).to.eq(inputObj.id);
      expect(responseObj.name).to.eq(inputObj.name);
      expect(responseObj.team_id).to.eq(inputObj.team_id);
      expect(responseObj.first_name).to.eq(inputObj.profile.first_name);
      expect(responseObj.last_name).to.eq(inputObj.profile.last_name);
      expect(responseObj.email_id).to.eq(inputObj.profile.email);
    });

    it("should returm object with empty vales if input object values are empty", () => {
      let inputObj = {
        id: "",
        name: "",
        team_id: "",
        profile: {
          first_name: "",
          last_name: "",
          email: ""
        }
      };
      let responseObj = index.formatData(inputObj);
      expect(responseObj).to.have.all.keys('id', 'name', 'team_id', 'first_name', 'last_name', 'email_id');
      expect(responseObj.id).to.be.empty;
      expect(responseObj.name).to.be.empty;
      expect(responseObj.team_id).to.be.empty;
      expect(responseObj.first_name).to.be.empty;
      expect(responseObj.last_name).to.be.empty;
      expect(responseObj.email_id).to.be.empty;
    })
  });

  describe('validateEmailId', () => {
    it("should return true if valid emailid id provided", () => {
      let input = "xyz@abc.com";
      let output = index.validateEmailId(input);
      expect(output).to.be.true;
    });

    it("should return false if invalid emailid id provided", () => {
      let input = "xyz-abc-com";
      let output = index.validateEmailId(input);
      expect(output).to.be.false;
    });
  });

  describe('defaultChannelMembersDetails', () => {
    it("should include provided member details in an array", () => {
      let registeredSlackMembers = [{
        id:"123456",
        profile: {}
      }];
      let resObj = {id: '123456'};
      let identifyMembers = sinon.stub(index, 'identifyMembers').returns(resObj);
      let output = index.defaultChannelMembersDetails(registeredSlackMembers, event.body.users);
      expect(output[0]).to.include(resObj);
      sinon.assert.calledOnce(identifyMembers);
      identifyMembers.restore();
    });

    it("should empty array if registeredSlackMembers is empty", () => {
      let resObj = {id: '123456'};
      let identifyMembers = sinon.stub(index, 'identifyMembers').returns(resObj);
      let output = index.defaultChannelMembersDetails([], event.body.users);
      expect(output).to.be.empty;
      sinon.assert.notCalled(identifyMembers);
      identifyMembers.restore();
    });

  });

  describe('removeServAccFromMemberList', () => {
    let slackurl, token, id;
    beforeEach(function(){
      slackurl = config.slack_channel_url,
      token = config.slack_token,
      id = '123456';
    });

    it("should successfully remove service account form members list", () => {
      let resObj = {
        body: "{ \"ok\" : true}"
      };
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.removeServAccFromMemberList(slackurl, token, id)
      .then(res => {
        expect(res).to.include({
          result: 'success',
          message: 'successfully removed service account from memberlist'
        });
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate inputError while removing service account form members list", () => {
      let resBody = {
        ok : false,
        detail: "Error occured while removing member."
      },
      resObj = {
        body: JSON.stringify(resBody)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.removeServAccFromMemberList(slackurl, token, id)
      .catch(error => {
        expect(error).to.include({
          result: 'inputError',
          message: resBody.detail
        });
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate error if GET request to slack endpoint fails", () => {
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(err, null, null);
      });
      index.removeServAccFromMemberList(slackurl, token, id)
      .catch(error => {
        expect(error).to.include(err);
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

  });

  describe('addMembersToSlackChannel', () => {
    let slackurl, token, channelId, userId;
    beforeEach(function(){
      slackurl = config.slack_channel_url,
      token = config.slack_token,
      channelId = 'CX123456',
      userId = 'US987654';
    });

    it("should successfully add member to slack channel", () => {
      let resObj = {
        body: "{ \"ok\" : true}"
      };
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.addMembersToSlackChannel(slackurl, token, channelId, userId)
      .then(res => {
        expect(res).to.be.true;
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate false if any error occurred while addning member to slack channel", () => {
      let resBody = {
        ok : false,
        detail: "Error occured while removing member."
      },
      resObj = {
        body: JSON.stringify(resBody)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.addMembersToSlackChannel(slackurl, token, channelId, userId)
      .catch(error => {
        expect(error).to.be.false;
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate true if member already in the slack channel", () => {
      let resBody = {
        ok : false,
        error: "already_in_channel"
      },
      resObj = {
        body: JSON.stringify(resBody)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.addMembersToSlackChannel(slackurl, token, channelId, userId)
      .then(res => {
        expect(res).to.be.true;
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate true if self invitation is sent", () => {
      let resBody = {
        ok : false,
        error: "cant_invite_self"
      },
      resObj = {
        body: JSON.stringify(resBody)
      }
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.addMembersToSlackChannel(slackurl, token, channelId, userId)
      .then(res => {
        expect(res).to.be.true;
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate error if GET request to slack endpoint fails", () => {
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(err, null, null);
      });
      index.addMembersToSlackChannel(slackurl, token, channelId, userId)
      .catch(error => {
        expect(error).to.be.false;
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

  });

  describe('getUsersInfo', () => {
    it("should successfully get users info from slack channel", () => {
      let identifyMemberRes = {
        id: 'US123456',
        name: 'xyz'
      },
      eventBody = {
        ok: true,
        members: [identifyMemberRes]
      },
      resObj = {
        body: JSON.stringify(eventBody)
      };
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      let identifyMembers = sinon.stub(index, 'identifyMembers').returns(identifyMemberRes)
      index.getUsersInfo(config, event.body)
      .then(res => {
        expect(res).to.have.all.keys('result', 'data');
        expect(res.data).to.have.all.keys('registeredSlackMembers', 'channelMembers');
        sinon.assert.calledOnce(reqStub);
        sinon.assert.calledOnce(identifyMembers);
        reqStub.restore();
        identifyMembers.restore();
      });
    });

    it("should indicate input error if user is not found/identified in the slack channel", () => {
      let identifyMemberRes = {
        id: 'US123456',
        name: 'xyz'
      },
      eventBody = {
        ok: true,
        members: [identifyMemberRes]
      },
      resObj = {
        body: JSON.stringify(eventBody)
      };
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      let identifyMembers = sinon.stub(index, 'identifyMembers').returns("")
      index.getUsersInfo(config, event.body)
      .catch(error => {
        expect(error).to.include({
          result: 'inputError',
          message: 'Cannot find user(s) in Slack with email ids: '+event.body.users[0].email_id });
        sinon.assert.calledOnce(reqStub);
        sinon.assert.calledOnce(identifyMembers);
        reqStub.restore();
        identifyMembers.restore();
      });
    });

    it("should indicate input error if error occurred while accessing user info", () => {
      let eventBody = {
        ok: false,
        detail: "Error occurred while accessing users list."
      },
      resObj = {
        body: JSON.stringify(eventBody)
      };
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      });
      index.getUsersInfo(config, event.body)
      .catch(error => {
        expect(error).to.include({
          result: 'inputError',
          message: eventBody.detail});
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate error if GET request to slack endpoint fails", () => {
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(err, null, null);
      });
      index.getUsersInfo(config, event.body)
      .catch(error => {
        expect(error).to.include(err);
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });
  });

  describe('createPublicSlackChannel', () => {
    it("should successfully create public slack channel", () => {
      let resBody = {
        ok: true,
        channel: {
          id: 'CX123456',
          name: 'abc-channel',
          members: [ 'xyz@abc.com', 'qwe@abc.com' ]
        }
      },
      resObj = {
        body: JSON.stringify(resBody)
      }
      reqStub = sinon.stub(request, 'Request').callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      })
      index.createPublicSlackChannel(config, event.body)
      .then(res => {
        expect(res).to.have.all.keys('result', 'data');
        expect(res.data).to.have.all.keys('id', 'name', 'link', 'members');
        expect(res.data.id).to.eq(resBody.channel.id);
        expect(res.data.name).to.eq(resBody.channel.name);
        expect(res.data.members).to.deep.equal(resBody.channel.members);
        expect(res.data.link).to.include(resBody.channel.id);
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate input error if provided slack channel exist", () => {
      let resBody = {
        ok: false,
        error: "name_taken"
      },
      resObj = {
        body: JSON.stringify(resBody)
      }
      reqStub = sinon.stub(request, 'Request').callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      })
      index.createPublicSlackChannel(config, event.body)
      .catch(error => {
        expect(error).to.include({
          result: "inputError",
          message: 'Slack channel with name: ' + event.body.channel_name + ' already exists.'
        });
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate input error if any exception occurred while creating slack channel", () => {
      let resBody = {
        ok: false
      },
      resObj = {
        body: JSON.stringify(resBody)
      }
      reqStub = sinon.stub(request, 'Request').callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      })
      index.createPublicSlackChannel(config, event.body)
      .catch(error => {
        expect(error).to.include({
          result: "inputError",
          message: 'Exception occured while creating slack channel: ' + event.body.channel_name
        });
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });

    it("should indicate error if GET request to slack endpoint fails", () => {
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(err, null, null);
      });
      index.createPublicSlackChannel(config, event.body)
      .catch(error => {
        expect(error).to.include(err);
        sinon.assert.calledOnce(reqStub);
        reqStub.restore();
      });
    });
  });

  describe('getToken', () => {
    it("should successfully get token on making login request", () => {
      var responseObj = {
        statusCode: 200,
        body: {
          data: {
            token: "zaqwsxcderfv.qawsedrftg.qxderfvbhy"
          }
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      index.getToken(config)
        .then(res => {
          expect(res).to.eq(responseObj.body.data.token);
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should indicate error while making request to login api", () => {
      var responseObj = {
        statusCode: 400,
        body: {
          data: {},
          message: "Could not get authentication token"
        }
      };
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(null, responseObj, responseObj.body)
      });
      index.getToken(config)
        .catch(error => {
          expect(error).to.include({
            message: 'Could not get authentication token'
          });
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });

    it("should indicate error while making request to login api", () => {
      reqStub = sinon.stub(request, "Request").callsFake((obj) => {
        return obj.callback(err, null, null)
      });
      index.getToken(config)
        .catch(error => {
          expect(error).to.include({
            error: 'Could not get authentication token for updating service catalog.'
          });
        });
      sinon.assert.calledOnce(reqStub);
      reqStub.restore();
    });
  });

  describe('addMemberToChannel', () => {
    let channelInfo, isServAccRequested;
    this.beforeEach(function() {
      channelInfo = {
        id: "CX123456",
        members: ["qwe@AbortController.com"]
      },
      isServAccRequested = false;
    });

    it("should successfully add member to provided slack channel", () => {
      let getUsersInfo = sinon.stub(index, 'getUsersInfo').resolves({data:{channelMembers:[{ id: 'US987654' }]}});
      let defaultChannelMembersDetails = sinon.stub(index, 'defaultChannelMembersDetails').returns([{id:'US987654'}]);
      let addMembersToSlackChannel = sinon.stub(index, 'addMembersToSlackChannel').resolves(true);
      let getSlackChannelMembers = sinon.stub(index, 'getSlackChannelMembers').resolves("slackChannelMembersList");
      let notifyUser = sinon.stub(index, 'notifyUser').resolves({result: "success"});

      index.addMemberToChannel(config, channelInfo, isServAccRequested, event.body)
      .then(res => {
        expect(res).to.have.all.keys('result', 'data');
        expect(res.result).to.eq('success');
        expect(res.data).to.have.all.keys('slackChannelMembers', 'channelInfo');

        sinon.assert.calledOnce(getUsersInfo);
        sinon.assert.calledOnce(defaultChannelMembersDetails);
        sinon.assert.calledOnce(addMembersToSlackChannel);
        sinon.assert.calledOnce(getSlackChannelMembers);
        sinon.assert.calledOnce(notifyUser);

        getUsersInfo.restore();
        defaultChannelMembersDetails.restore();
        addMembersToSlackChannel.restore();
        getSlackChannelMembers.restore();
        notifyUser.restore();
      });
    });

    it("should indicate error while adding member to provided slack channel", () => {
      let unhandlerError = {result: "unhandled"};
      let getUsersInfo = sinon.stub(index, 'getUsersInfo').resolves({data:{channelMembers:[]}});
      let defaultChannelMembersDetails = sinon.stub(index, 'defaultChannelMembersDetails').returns([{id:'US987654'}]);
      let addMembersToSlackChannel = sinon.stub(index, 'addMembersToSlackChannel').resolves(true);
      let getSlackChannelMembers = sinon.stub(index, 'getSlackChannelMembers').resolves("slackChannelMembersList");
      let notifyUser = sinon.stub(index, 'notifyUser').resolves(unhandlerError);

      index.addMemberToChannel(config, channelInfo, isServAccRequested, event.body)
      .catch(error => {
        expect(error).to.include(unhandlerError);

        sinon.assert.calledOnce(getUsersInfo);
        sinon.assert.calledOnce(defaultChannelMembersDetails);
        sinon.assert.calledOnce(addMembersToSlackChannel);
        sinon.assert.calledOnce(getSlackChannelMembers);
        sinon.assert.calledOnce(notifyUser);

        getUsersInfo.restore();
        defaultChannelMembersDetails.restore();
        addMembersToSlackChannel.restore();
        getSlackChannelMembers.restore();
        notifyUser.restore();
      });
    });

    it("should indicate error if notify function fails", () => {
      let getUsersInfo = sinon.stub(index, 'getUsersInfo').resolves({data:{channelMembers:[]}});
      let defaultChannelMembersDetails = sinon.stub(index, 'defaultChannelMembersDetails').returns([{id:'US987654'}]);
      let addMembersToSlackChannel = sinon.stub(index, 'addMembersToSlackChannel').resolves(true);
      let getSlackChannelMembers = sinon.stub(index, 'getSlackChannelMembers').resolves("slackChannelMembersList");
      let notifyUser = sinon.stub(index, 'notifyUser').rejects(err);

      index.addMemberToChannel(config, channelInfo, isServAccRequested, event.body)
      .catch(error => {
        expect(error).to.include(err);

        sinon.assert.calledOnce(getUsersInfo);
        sinon.assert.calledOnce(defaultChannelMembersDetails);
        sinon.assert.calledOnce(addMembersToSlackChannel);
        sinon.assert.calledOnce(getSlackChannelMembers);
        sinon.assert.calledOnce(notifyUser);

        getUsersInfo.restore();
        defaultChannelMembersDetails.restore();
        addMembersToSlackChannel.restore();
        getSlackChannelMembers.restore();
        notifyUser.restore();
      });
    });

    it("should indicate internal error if error occurred while adding member to slack channel", () => {
      let getUsersInfo = sinon.stub(index, 'getUsersInfo').resolves({data:{channelMembers:[]}});
      let defaultChannelMembersDetails = sinon.stub(index, 'defaultChannelMembersDetails').returns([{id:'US987654'}]);
      let addMembersToSlackChannel = sinon.stub(index, 'addMembersToSlackChannel').rejects(false);

      index.addMemberToChannel(config, channelInfo, isServAccRequested, event.body)
      .catch(error => {
        expect(error).to.include({
          result: 'internalError',
          message: 'Slack channel creation is completed and got exception while adding members to the channel. Please try to add members manually.'
        });

        sinon.assert.calledOnce(getUsersInfo);
        sinon.assert.calledOnce(defaultChannelMembersDetails);
        sinon.assert.calledOnce(addMembersToSlackChannel);

        getUsersInfo.restore();
        defaultChannelMembersDetails.restore();
        addMembersToSlackChannel.restore();
      });
    });

    it("should indicate error if error occurred while getting user info from slack endpoint", () => {
      let getUsersInfo = sinon.stub(index, 'getUsersInfo').rejects(err);

      index.addMemberToChannel(config, channelInfo, isServAccRequested, event.body)
      .catch(error => {
        expect(error).to.include(err);

        sinon.assert.calledOnce(getUsersInfo);

        getUsersInfo.restore();
      });
    });

  });

  describe('getSlackChannelMembers', () => {
    it("should get list of slack channel members when isServAccRequested value is true", () => {
      let channelMembers = [{email_id: "xyz@gmail.com"}],
      isServAccRequested = true;
      index.getSlackChannelMembers(config, channelMembers, isServAccRequested, [])
      .then(res => {
        expect(res).to.eq(channelMembers);
      });
    });

    it("should get list of slack channel members when isServAccRequested value is false", () => {
      let channelMembers = [{email_id: "xyz@gmail.com"}],
      isServAccRequested = false;

      index.getSlackChannelMembers(config, channelMembers, isServAccRequested, [])
      .then(res => {
        expect(res).to.deep.eq(channelMembers);
      });
    });

    it("should get list of slack channel members after removing service account email id", () => {
      let channelMembers = [{email_id: config.service_account_emailId}],
      isServAccRequested = false;
      let removeServAccFromMemberList = sinon.stub(index, 'removeServAccFromMemberList').resolves({result: 'success'});

      index.getSlackChannelMembers(config, channelMembers, isServAccRequested, [])
      .then(res => {
        expect(res).to.be.empty;
        sinon.assert.calledOnce(removeServAccFromMemberList);
        removeServAccFromMemberList.restore();
      });
    });

    it("should indicate error while getting list of slack channel members if error occurred while removing service account email id", () => {
      let channelMembers = [{email_id: config.service_account_emailId}],
      isServAccRequested = false;
      let removeServAccFromMemberList = sinon.stub(index, 'removeServAccFromMemberList').rejects(err);

      index.getSlackChannelMembers(config, channelMembers, isServAccRequested, [])
      .catch(error => {
        expect(error).to.eq(err);
        sinon.assert.calledOnce(removeServAccFromMemberList);
        removeServAccFromMemberList.restore();
      });
    })

  });

  describe('notifyUser', () => {
    let slackChannelMembers;
    beforeEach(function() {
      slackChannelMembers = [{email_id: "xyz@abc.com"}];
    })
    it("should successfully send mail to slack channel members", () => {
      let resObj = {
        statusCode: 200,
        body: {}
      };
      let getToken = sinon.stub(index, 'getToken').resolves("authToken");
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      })

      index.notifyUser(config, slackChannelMembers, channelInfo)
      .then(res => {
        expect(res).to.include({
          result: 'success',
          data: 'successfully created public slack channel and send email notification to members'
        });

        sinon.assert.calledOnce(getToken);
        sinon.assert.calledOnce(reqStub);

        getToken.restore();
        reqStub.restore();
      });
    });

    it("should indicate error if send email fails with statusCode other than 200", () => {
      let resObj = {
        statusCode: 400,
        body: {}
      };
      let getToken = sinon.stub(index, 'getToken').resolves("authToken");
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(null, resObj, resObj.body);
      })

      index.notifyUser(config, slackChannelMembers, channelInfo)
      .catch(error => {
        expect(error).to.include(resObj);

        sinon.assert.calledOnce(getToken);
        sinon.assert.calledOnce(reqStub);

        getToken.restore();
        reqStub.restore();
      });
    });

    it("should indicate error if send email API request fails", () => {
      let getToken = sinon.stub(index, 'getToken').resolves("authToken");
      reqStub = sinon.stub(request, "Request").callsFake(obj => {
        return obj.callback(err, null, null);
      })

      index.notifyUser(config, slackChannelMembers, channelInfo)
      .catch(error => {
        expect(error).to.include(err);

        sinon.assert.calledOnce(getToken);
        sinon.assert.calledOnce(reqStub);

        getToken.restore();
        reqStub.restore();
      });
    });

    it("should indicate error if getToken fails", () => {
      let getToken = sinon.stub(index, 'getToken').rejects(err);

      index.notifyUser(config, slackChannelMembers, channelInfo)
      .catch(error => {
        expect(error).to.include(err);
        sinon.assert.calledOnce(getToken);
        getToken.restore();
      });
    });

  });

  describe('handler', () => {
    it("should successufully execute handler function", () => {
      let resObj = {
        data: {
          channelInfo: {
            id: "CX123456",
            name: event.body.channel_name,
            link: config.slack_url
          },
          slackChannelMembers: event.body.users
        }
      }
      let genericInputValidation = sinon.stub(index, 'genericInputValidation').resolves();
      let createPublicSlackChannel = sinon.stub(index, 'createPublicSlackChannel').resolves("channelInfo");
      let addMemberToChannel = sinon.stub(index, 'addMemberToChannel').resolves(resObj);

      index.handler(event, context, (err, res) => {
        expect(res).to.have.all.keys('data', 'input');
        expect(res.data).to.have.all.keys('channel_id', 'channel_name', 'channel_link', 'members');
        expect(res.data.channel_id).to.eq(resObj.data.channelInfo.id);
        expect(res.data.channel_name).to.eq(resObj.data.channelInfo.name);
        expect(res.data.channel_link).to.eq(resObj.data.channelInfo.link);
        expect(res.data.members).to.eq(resObj.data.slackChannelMembers);

        sinon.assert.calledOnce(genericInputValidation);
        sinon.assert.calledOnce(createPublicSlackChannel);
        sinon.assert.calledOnce(addMemberToChannel);

        genericInputValidation.restore();
        createPublicSlackChannel.restore();
        addMemberToChannel.restore();
      });
    });

    it("should indicate input validation error/ BadRequest", () => {
      let inputError = {
        result: "inputError",
        message: "Provided invalid input"
      };
      let genericInputValidation = sinon.stub(index, 'genericInputValidation').rejects(inputError);

      index.handler(event, context, (err, res) => {
        expect(err).to.include('{"errorType":"BadRequest","message":"'+inputError.message+'"}');
        sinon.assert.calledOnce(genericInputValidation);
        genericInputValidation.restore();
      });
    });

    it("Should indicate unauthorized error", () => {
      let unauthorizedError = {
        result: "unauthorized",
        message: "Unauthorized error."
      };
      let genericInputValidation = sinon.stub(index, 'genericInputValidation').rejects(unauthorizedError);

      index.handler(event, context, (err, res) => {
        expect(err).to.include('{"errorType":"Unauthorized","message":"'+unauthorizedError.message+'"}');
        sinon.assert.calledOnce(genericInputValidation);
        genericInputValidation.restore();
      });
    });

    it("Should indicate internal server error", () => {
      let internalError = err;
      let genericInputValidation = sinon.stub(index, 'genericInputValidation').rejects(internalError);

      index.handler(event, context, (err, res) => {
        expect(err).to.include('{"errorType":"InternalServerError","message":"Unhandled error."}');
        sinon.assert.calledOnce(genericInputValidation);
        genericInputValidation.restore();
      });
    });

  });

});
