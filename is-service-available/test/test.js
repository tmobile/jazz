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

const assert = require('chai').assert;
const index = require('../index');

describe('Sample', function() {
	// this.timeout(60000);
    it('test case : service not available', function(done) {

        index.handler({
            method: 'GET',
            stage: "dev",
            query: {
            	service: "is-service-available"
            }
        }, {}, function(error, result) {
        	if (error) {
        		console.log("ERROR : ",error);
        	} else{
              console.log("SUCCESS!! : ",result);
          }

        	assert.equal(result.data.available, false);
            done();
        });
    });

    it('test case : service is available', function(done) {

        index.handler({
            method: 'GET',
            stage: "dev",
            query: {
                domain: "blah",
                service: "is-service-available"
            }
        }, {}, function(error, result) {
            if (error) {
              console.log("ERROR : ",error);
            } else{
                console.log("SUCCESS!! : ",result);
            }
            assert.equal(result.data.available, true);
            done();
        });
    });
});
