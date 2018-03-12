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

/* http request payload */
var request_payload = {
	url: "",
	headers: {
		"Authorization": "", 
		"Content-Type": "application/x-www-form-urlencoded"
	},
	method: "POST",
	verify: false,
	rejectUnauthorized: false,
	requestCert: true,
	async : true,
	json: false,
	qs: {}
};

var build_params = {
	service_name: "",
	domain: "",
	version: "",
	tracking_id: ""
};

var response_format = {
	"message":"Service cleanup workflow triggered successfully",
	"request_id": ""
};

//JSON.parse(JSON.stringify())
module.exports = (formats) => {
  return {
	  "requestLoad" : request_payload,
	  "responseLoad" : response_format,
	  "buildParams" : build_params
	  };
};