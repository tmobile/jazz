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
const chai = require('chai');
const assert = require('chai').assert;
const expect = require('chai').expect;
const should = require('chai').should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const awsContext = require('aws-lambda-mock-context');
const AWS = require("aws-sdk-mock");
const request = require('request');
const sinon = require('sinon');

const index = require('../index');
const logger = require("../components/logger.js");
const configObj = require('../components/config.js');
const errorHandler = require("../components/error-handler.js")();
const responseObj = require("../components/response.js")

describe('jazz_scm-webhook', function() {
  var event, context, callback, callbackObj, err, errMessage, errType, config, bitbucketEvent, gitlabEventPush, gitlabEventMerge, eventObj;
  beforeEach(function () {
    spy = sinon.spy();
    event = {
      stage: "test",
      body:{},
      headers:{}
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
    config = configObj(event);

    bitbucketEvent = {
      body :{
        actor: {
          username: "g10$saryck"
        },
        push:{
          changes:[{
            created:true,
            closed:false,
            new:{type:"tag", name:"/test", target:{hash:"123"}},
            old:{type:"branch", name:"/test"}
          }]
        },
        pullrequest:{
          link:"https://test-link.com",
          fromRef:{branch:{name:"/test"}},
          toRef:{branch:{name:"/test"}}
        },
        repository:{
          slug: "k!ngd0m_mag!c",
          links:{self:[{href:"https://test-link.com"}]}
        }
      },
      headers : {
        "X-Bitbucket-Type": "server",
        "X-Event-Key": "pullrequest:updated"
      }
    };

    gitlabEventPush = {
      body :{
        object_kind: "push",
        user_username: "g10$saryck",
        ref:"refs/heads/test",
        before:"123",
        after:"234",
        commits:[{
          id:"123",
          message:"test message",
          url:"https://test-link.com"
        }],
        total_commits_count:"2",
        repository:{
          name: "k!ngd0m_mag!c",
          homepage:"https://test-link.com"
        }
      },
      headers : {
        "X-Gitlab-Event": "Push Hook"
      }
    };

    gitlabEventMerge = {
      body : {
        object_kind: "merge_request",
        user: {
          username: "g10$saryck"
        },
        object_attributes: {
          source_branch:"refs/heads/test",
          target_branch:"refs/heads/master",
          url:"https://test-link.com/merge_requests/3",
          action:"open"
        },
        merge_request:{},
        ref:"refs/heads/test",
        before:"123",
        after:"234",
        total_commits_count:"2",
        repository:{
          name: "k!ngd0m_mag!c",
          homepage:"https://test-link.com"
        }
      },
      headers : {
        "X-Gitlab-Event": "Push Hook"
      }
    };

    eventObj = {
      servContext: { 
        event_type: '',
        branch: '',
        event_name: ''
      }, 
      service: "test_test-repo", 
      userName: "g10$saryck", 
      repositoryLink: "https://test-link.com"
    }
  });

  it("should get scm type using getScmType function", function(){
    event.headers = {
      "X-Bitbucket-Type": "server"
    }
    var scmMap = config.SCM_MAPPINGS, scmIdentifier = scmMap.identifier
    var getScmType = index.getScmType(scmIdentifier, event);
    expect(getScmType.then(function(res){
      return res;
    })).to.eventually.deep.equal('bitbucket');
  });

  it("should indicate Unsupported scmSource for undefined SCM Type", function(){
    var scmSource = "testScm";
    var getScmDetails = index.getScmDetails(scmSource, event, config);
    expect(getScmDetails.then(function(res){
     return res;
    })).to.be.rejectedWith('Unsupported scmSource');
  })

  it("should indicate error as Invalid event key for invalid scm details for bitbucet SCM Type", function(){
    var scmSource = "bitbucket";
    bitbucketEvent.headers["X-Event-Key"]="";
    event = bitbucketEvent;
    var getScmDetails = index.getScmDetails(scmSource, event, config);
    expect(getScmDetails.then(function(res){
     return res;
    })).to.be.rejectedWith('Invalid event key');
  });

  it("should indicate error as Invalid event key for invalid scm details for bitbucet SCM Type", function(){
    var scmSource = "gitlab";
    gitlabEventPush.body.before = "";
    event = gitlabEventPush;
    var getScmDetails = index.getScmDetails(scmSource, event, config);
    expect(getScmDetails.then(function(res){
     return res;
    })).to.be.rejectedWith('Invalid event key');
  });
  
  it("should provide bitbucket scm context for CREATE_TAG event when eventKey is repo:push and creating new tag", function(){
    bitbucketEvent.headers["X-Event-Key"] = "repo:push";
    var changes = bitbucketEvent.body.push.changes[0],
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      event_name: 'CREATE_TAG'
    };
    changes.new.type = "tag"; changes.created = true;changes.closed = false; changes.old = null;
    bitbucketEvent.body.pullrequest = null;
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for COMMIT_TEMPLATE event when eventKey is repo:push and first time templates are committing to master branch", function(){
    bitbucketEvent.headers["X-Event-Key"] = "repo:push";
    var changes = bitbucketEvent.body.push.changes[0],
    resObj = { event_type: 'SERVICE_ONBOARDING',
      branch: 'master',
      event_name: 'COMMIT_TEMPLATE'
    };
    changes.new.type = "branch"; changes.new.name = "master"; changes.created = true; 
    changes.closed = false; changes.old = null;
    bitbucketEvent.body.pullrequest = null;
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for CREATE_BRANCH event when eventKey is repo:push and new branch is created", function(){
    bitbucketEvent.headers["X-Event-Key"] = "repo:push";
    var changes = bitbucketEvent.body.push.changes[0],
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/new-branch',
      event_name: 'CREATE_BRANCH'
    };
    changes.new.type = "branch"; changes.new.name = "/new-branch"; changes.created = true; 
    changes.closed = false; changes.old = null;
    bitbucketEvent.body.pullrequest = null;
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for DELETE_TAG event when eventKey is repo:push and tag is been deleted", function(){
    bitbucketEvent.headers["X-Event-Key"] = "repo:push";
    var changes = bitbucketEvent.body.push.changes[0],
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      event_name: 'DELETE_TAG' 
    };
    changes.new = null; changes.created = false; 
    changes.closed = true; changes.old.type = "tag";
    bitbucketEvent.body.pullrequest = null;
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for DELETE_BRANCH event when eventKey is repo:push and branch is been deleted", function(){
    bitbucketEvent.headers["X-Event-Key"] = "repo:push";
    var eventBody = bitbucketEvent.body;
    var changes = eventBody.push.changes[0],
    resObj = { event_type: 'SERVICE_DELETION',
      branch: '/test',
      event_name: 'DELETE_BRANCH' 
    };
    changes.new = null; changes.created = false; 
    changes.closed = true; changes.old.type = "branch"; changes.old.name = "/test"
    bitbucketEvent.body.pullrequest = null;
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for COMMIT_CODE event when eventKey is repo:push and code is updated", function(){
    bitbucketEvent.headers["X-Event-Key"] = "repo:push";
    var changes = bitbucketEvent.body.push.changes[0],
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      hash: '123',
      event_name: 'COMMIT_CODE' 
    };
    changes.new.type = "branch"; changes.created = false; changes.new.name = "/test"; changes.new.target.hash = "123";
    changes.closed = false; changes.old.type = "branch"; changes.old.name = "/test";
    bitbucketEvent.body.pullrequest = null;
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for RAISE_PR event when eventKey is pullrequest:created", function(){
    bitbucketEvent.headers["X-Event-Key"] = "pullrequest:created";
    bitbucketEvent.body.push = null;
    var changes = bitbucketEvent.body.pullrequest,
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      prlink: 'https://test-link.com',
      target: '/test',
      event_name: 'RAISE_PR' 
    };
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for MERGE_PR event when eventKey is pullrequest:fulfilled", function(){
    bitbucketEvent.headers["X-Event-Key"] = "pullrequest:fulfilled";
    bitbucketEvent.body.push = null;
    var changes = bitbucketEvent.body.pullrequest,
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      prlink: 'https://test-link.com',
      target: '/test',
      event_name: 'MERGE_PR' 
    };
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for DECLINE_PR event when eventKey is pullrequest:rejected", function(){
    bitbucketEvent.headers["X-Event-Key"] = "pullrequest:rejected";
    bitbucketEvent.body.push = null;
    var changes = bitbucketEvent.body.pullrequest,
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      prlink: 'https://test-link.com',
      target: '/test',
      event_name: 'DECLINE_PR' 
    };
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for UPDATE_PR event when eventKey is pullrequest:updated", function(){
    bitbucketEvent.headers["X-Event-Key"] = "pullrequest:updated";
    bitbucketEvent.body.push = null;
    var changes = bitbucketEvent.body.pullrequest,
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      prlink: 'https://test-link.com',
      target: '/test',
      event_name: 'UPDATE_PR'
    };
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide bitbucket scm context for COMMENT_PR event when eventKey is pullrequest:comment", function(){
    bitbucketEvent.headers["X-Event-Key"] = "pullrequest:comment";
    bitbucketEvent.body.push = null;
    var changes = bitbucketEvent.body.pullrequest,
    resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      prlink: 'https://test-link.com',
      target: '/test',
      event_name: 'COMMENT_PR' 
    };
    event = bitbucketEvent;
    var bitbucketScmContextDetails = index.bitbucketScmContextDetails(bitbucketEvent.headers["X-Event-Key"], event.body, config);
    expect(bitbucketScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for CREATE_TAG event when eventKey is tag_push and new tag is created", function(){
    var eventBody = gitlabEventPush.body;
    eventBody.object_kind = "tag_push";
    eventBody.before="000";
    event = gitlabEventPush;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventBody.ref,
      event_name: 'CREATE_TAG' 
    };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for COMMIT_TEMPLATE event when eventKey is push and new template is committed", function(){
    var eventBody = gitlabEventPush.body;
    eventBody.ref = "refs/heads/master"
    eventBody.before="000";
    event = gitlabEventPush;
    var resObj = { event_type: 'SERVICE_ONBOARDING',
      branch: eventBody.ref,
      event_name: 'COMMIT_TEMPLATE' };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for CREATE_BRANCH event when eventKey is push and new branch is created", function(){
    var eventBody = gitlabEventPush.body;
    eventBody.total_commits_count = "";
    eventBody.before="000";
    event = gitlabEventPush;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventBody.ref,
      event_name: 'CREATE_BRANCH' };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for DELETE_TAG event when eventKey is tag_push and tag is been deleted", function(){
    var eventBody = gitlabEventPush.body;
    eventBody.object_kind = "tag_push";
    eventBody.after="000";
    event = gitlabEventPush;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventBody.ref,
      event_name: 'DELETE_TAG' };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for DELETE_BRANCH event when eventKey is push and branch is been deleted", function(){
    var eventBody = gitlabEventPush.body;
    eventBody.after="000";
    event = gitlabEventPush;
    var resObj = { event_type: 'SERVICE_DELETION',
      branch: eventBody.ref,
      event_name: 'DELETE_BRANCH' };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for COMMIT_CODE event when eventKey is push and code is updated/committed", function(){
    var eventBody = gitlabEventPush.body;
    event = gitlabEventPush;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventBody.ref,
      hash: eventBody.after,
      event_name: 'COMMIT_CODE' };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });
  
  it("should provide gitlab scm context for RAISE_PR event when eventKey is merge_request and new PR is created/opened", function(){
    var eventPullReq = gitlabEventMerge.body.object_attributes;
    event = gitlabEventMerge;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventPullReq.source_branch,
      prlink: eventPullReq.url,
      target: eventPullReq.target_branch,
      event_name: 'RAISE_PR' 
    };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for MERGE_PR event when eventKey is merge_request and PR is merged", function(){
    var eventPullReq = gitlabEventMerge.body.object_attributes;
    eventPullReq.action = "merge";
    event = gitlabEventMerge;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventPullReq.source_branch,
      prlink: eventPullReq.url,
      target: eventPullReq.target_branch,
      event_name: 'MERGE_PR' 
    };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for UPDATE_PR event when eventKey is merge_request and PR is updated", function(){
    var eventPullReq = gitlabEventMerge.body.object_attributes;
    eventPullReq.action = "update";
    event = gitlabEventMerge;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventPullReq.source_branch,
      prlink: eventPullReq.url,
      target: eventPullReq.target_branch,
      event_name: 'UPDATE_PR' 
    };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for DECLINE_PR event when eventKey is merge_request and PR is declined/closed", function(){
    var eventPullReq = gitlabEventMerge.body.object_attributes;
    eventPullReq.action = "close";
    event = gitlabEventMerge;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventPullReq.source_branch,
      prlink: eventPullReq.url,
      target: eventPullReq.target_branch,
      event_name: 'DECLINE_PR' 
    };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should provide gitlab scm context for COMMENT_PR event when eventKey is note and comment is included in the PR", function(){
    gitlabEventMerge.body.object_kind = "note";
    gitlabEventMerge.body.merge_request = {
      source_branch:"refs/heads/test",
      target_branch:"refs/heads/master",
      url:"https://test-link.com/merge_requests/3"
    };
    var eventPullReq = gitlabEventMerge.body.merge_request;
    event = gitlabEventMerge;
    var resObj = { event_type: 'SERVICE_DEPLOYMENT',
      branch: eventPullReq.source_branch,
      prlink: eventPullReq.url,
      target: eventPullReq.target_branch,
      event_name: 'COMMENT_PR' 
    };
    var gitlabScmContextDetails = index.gitlabScmContextDetails(event.body.object_kind, event.body, config);
    expect(gitlabScmContextDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(resObj);
  });

  it("should indicate error if event_name is invalid", function(){
    var message = "Unable to send envents! Only specified event name can be allowed :"
    var updateEventsWithScmDetails = index.updateEventsWithScmDetails(eventObj,config);
    expect(updateEventsWithScmDetails.then(function(res){
      return res;
    })).to.be.rejectedWith(message);
  });

  it("should indicate error if events API fails", function(){
    eventObj.servContext= { 
      event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      event_name: 'COMMIT_TEMPLATE'
    }
    var message = 'Error invoking service:{"errorType":"svtfoe","message":"starco"}\' but got \'starco'
    var reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(err, null, null);
    })
    var updateEventsWithScmDetails = index.updateEventsWithScmDetails(eventObj,config);
    expect(updateEventsWithScmDetails.then(function(res){
      return res;
    })).to.be.rejectedWith(err);
    reqStub.restore();
  });

  it("should indicate error if events API return with invalid statis code", function(){
    eventObj.servContext= { 
      event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      event_name: 'COMMIT_TEMPLATE'
    }
    var responseObj = {
      statusCode:"400",
      body:{
        message: err.message
      }
    }
    var reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, responseObj, responseObj.body);
    })
    var updateEventsWithScmDetails = index.updateEventsWithScmDetails(eventObj,config);
    expect(updateEventsWithScmDetails.then(function(res){
      return res;
    })).to.be.rejectedWith(responseObj.body.message);
    reqStub.restore();
  });

  it("should indicate success for updating SCM events using events API", function(){
    eventObj.servContext= { 
      event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      event_name: 'COMMIT_TEMPLATE'
    }
    var respObj = {
      statusCode:200,
      body:{
        data:{
          event_id:"123"
        },
        input:eventObj
      }
    }, result = {
      message: 'successfully recorded git activity to jazz_events.',
      event_id : respObj.body.data.event_id
    }
    var reqStub = sinon.stub(request, "Request", (obj)=>{
      return obj.callback(null, respObj, respObj.body);
    })
    var updateEventsWithScmDetails = index.updateEventsWithScmDetails(eventObj,config);
    expect(updateEventsWithScmDetails.then(function(res){
      return res;
    })).to.eventually.deep.equal(responseObj(result,eventObj));
    reqStub.restore();
  });

  it("should indicate badRequest error if event is undefined", function(){
    event.body = "";
    var message = '{"errorType":"BadRequest","message":"Unable to find the SCM activity!"}'
    index.handler(event, context, (err, res) => {
      if(err){
        err.should.be.equal(message)
        return err;
      } else{
        return res;
      }
    });
  });

  it("should indicate error if update SCM event fails in handler function", function(){
    event = bitbucketEvent;
    event.stage = "test";
    var message = '{"errorType":"InternalServerError","message":"Eventkey is null or undefined! so unable to find event name."}'
    var reqStub = sinon.stub(request, "Request", (obj) => {
      return obj.callback(err, null, null);
    })
    index.handler(event, context, (err, res) => {
      if(err){
        err.should.be.equal(message);
        reqStub.restore();
        return err
      } else {
        return res
      }
    });
  })

  it("should successfully update SCM event in handler function", function(){
    event = bitbucketEvent;
    event.stage = "test";
    eventObj.servContext= { 
      event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      event_name: 'COMMIT_TEMPLATE'
    }
    var respObj = {
      statusCode:200,
      body:{
        data:{
          event_id:"123"
        },
        input:eventObj
      }
    }, result = {
      message: 'successfully recorded git activity to jazz_events.',
      event_id : respObj.body.data.event_id
    }
    var reqStub = sinon.stub(request, "Request", (obj) =>{
      return obj.callback(null,respObj, respObj.body);
    })
    index.handler(event, context, (err, res) => {
      if(err){
        return err
      } else {
        res.should.have.deep.property('data.event_id');
        reqStub.restore();
        return res
      }
    });
    
  });

  it("should successfully update SCM event in handler function", function(){
    event = gitlabEventMerge;
    event.stage = "test";
    eventObj.servContext= { 
      event_type: 'SERVICE_DEPLOYMENT',
      branch: '/test',
      event_name: 'COMMIT_TEMPLATE'
    }
    var respObj = {
      statusCode:200,
      body:{
        data:{
          event_id:"123"
        },
        input:eventObj
      }
    }, result = {
      message: 'successfully recorded git activity to jazz_events.',
      event_id : respObj.body.data.event_id
    }
    index.handler(event, context, (err, res) => {
      if(err){
        return err
      } else {
        res.should.have.deep.property('data.event_id');
        return res
      }
    });
    
  });
});
