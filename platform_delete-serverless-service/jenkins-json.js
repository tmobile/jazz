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