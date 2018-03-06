const request = require('request');

module.exports = (inputs, callback) => {
    
	var jsonBody = {};
	
	if(inputs.SERVICE_NAME){jsonBody.service = inputs.SERVICE_NAME}
	if(inputs.DOMAIN){jsonBody.domain = inputs.DOMAIN}
	if(inputs.DESCRIPTION){jsonBody.description = inputs.DESCRIPTION}
	if(inputs.TYPE){jsonBody.type = inputs.TYPE}
	if(inputs.RUNTIME){jsonBody.runtime = inputs.RUNTIME}
	if(inputs.REGION){
		
		if(typeof inputs.REGION === 'array' || inputs.REGION instanceof Array){
			jsonBody.region = inputs.REGION;
		} else if (typeof inputs.REGION === 'string' || inputs.REGION instanceof String){
			var region = [];
			if(inputs.REGION.indexOf(',') !== -1){
				region = inputs.REGION.split(',');
			}else{
				region.push(inputs.REGION);
			}
			jsonBody.region = region;
		}
		
	}
	if(inputs.REPOSITORY){jsonBody.repository = inputs.REPOSITORY}
	if(inputs.USERNAME){jsonBody.created_by = inputs.USERNAME}
	if(inputs.EMAIL){jsonBody.email = inputs.EMAIL}
	if(inputs.SLACKCHANNEL){jsonBody.slack_channel = inputs.SLACKCHANNEL}
	if(inputs.TAGS){jsonBody.tags = inputs.TAGS}
	if(inputs.ENDPOINTS){jsonBody.endpoints = inputs.ENDPOINTS}
	if(inputs.METADATA){jsonBody.metadata = inputs.METADATA}
	if(inputs.STATUS){jsonBody.status = inputs.STATUS}
	
	
	var svcPayload = {
		uri: inputs.SERVICE_API_URL + inputs.SERVICE_API_RESOURCE,
		method: 'POST',
		headers: {'Authorization': inputs.TOKEN },
		json: jsonBody,
		rejectUnauthorized: false
	};
	
	
	request(svcPayload, function (error, response, body) {
		if (response.statusCode === 200 && typeof body !== undefined && typeof body.data !== undefined) {
			return callback(null, body);			
		}else{
			return callback({
				"error" : "Error creating service " + inputs.DOMAIN + "." + inputs.SERVICE_NAME + " in service catalog",
				"details" : response.body.message
			});
		}
	});
};
