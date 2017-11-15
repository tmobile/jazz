// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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

const assert = require('chai').assert;
const index = require('../index');
const awsContext = require("aws-lambda-mock-context");
const sinon = require("sinon");


var event, context, callback, spy, stub, checkCase;

//setup a spy to wrap around async logic/logic that need extraneous sources
spy = sinon.spy();

//setup a helper function to check for expected outputs given different input parameters
checkCase = (eventProp, eventProp2, propValue, errMessage, errType) => {
  //if there is a second prop defined, than the value to be changed is in a nested object
  if(eventProp2){
    event[eventProp][eventProp2] = propValue;
  }
  else if(eventProp){
    event[eventProp] = propValue;
  }
  //check if handler returns error notification with expected error type and message
  var bool = index.handler(event,context,callback).includes(errMessage) &&
              index.handler(event,context,callback).includes(errType);
  return bool;
};

describe('delete-serverless-service', function() {

    beforeEach(function(){
      context = awsContext();
      event = {
        "stage" : "test",
        "headers" : {
          "Authorization" : ""
        },
        "body" : {
          "service_name" : "",
          "domain" : "",
          "id" : "",
          "version" : ""
        }
      };
      callback = (err,responseObj) => {
        if(err){
          return err;
        }
        else{
          return JSON.stringify(responseObj);
        }
      }
    });

    it('should do something', function() {
        //some logic
        assert(true);
    });
});
