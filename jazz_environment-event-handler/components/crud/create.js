const request = require('request');

module.exports = (inputs, callback) => {
    
	var jsonBody = {};
	
	if(inputs.SERVICE_NAME !== undefined && inputs.SERVICE_NAME !== null && inputs.SERVICE_NAME !== ""){jsonBody.service = inputs.SERVICE_NAME}
	if(inputs.DOMAIN !== undefined && inputs.DOMAIN !== null && inputs.DOMAIN !==  ""){jsonBody.domain = inputs.DOMAIN}
	if(inputs.DESCRIPTION !== undefined && inputs.DESCRIPTION !== null  ){jsonBody.description = inputs.DESCRIPTION}
	if(inputs.TYPE !== undefined && inputs.TYPE !== null && inputs.TYPE !== "" ){jsonBody.type = inputs.TYPE}
	if(inputs.RUNTIME!== undefined && inputs.RUNTIME !== null && inputs.RUNTIME !== ""){jsonBody.runtime = inputs.RUNTIME}
	if(inputs.REGION!== undefined && inputs.REGION !== null && inputs.REGION !== ""){
		
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
	if(inputs.REPOSITORY!== undefined && inputs.REPOSITORY !== null && inputs.REPOSITORY !== ""){jsonBody.repository = inputs.REPOSITORY}
	if(inputs.USERNAME!== undefined && inputs.USERNAME !== null && inputs.USERNAME !== ""){jsonBody.created_by = inputs.USERNAME}
	if(inputs.EMAIL!== undefined && inputs.EMAIL !== null ){jsonBody.email = inputs.EMAIL}
	if(inputs.SLACKCHANNEL!== undefined && inputs.SLACKCHANNEL !== null ){jsonBody.slack_channel = inputs.SLACKCHANNEL}
	if(inputs.TAGS!== undefined && inputs.TAGS !== null ){jsonBody.tags = inputs.TAGS}
	if(inputs.IS_PUBLIC_ENDPOINT){jsonBody.is_public_endpoint = inputs.IS_PUBLIC_ENDPOINT}
	if(inputs.STATUS!== undefined && inputs.STATUS !== null && inputs.STATUS !== ""){jsonBody.status = inputs.STATUS}
	if(inputs.METADATA!== undefined && inputs.METADATA !== null && inputs.METADATA !== ""){jsonBody.metadata = inputs.METADATA}
	
	
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