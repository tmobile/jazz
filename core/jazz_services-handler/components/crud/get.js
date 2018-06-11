const request = require('request');

module.exports = (inputs, callback) => {

	var svcPayload = {
		uri: inputs.SERVICE_API_URL + inputs.SERVICE_API_RESOURCE + "?domain=" + inputs.DOMAIN + "&service=" + inputs.SERVICE_NAME,
		method: 'GET',
		headers: {
			'Authorization': inputs.TOKEN
		},
		rejectUnauthorized: false
	};

	request(svcPayload, function (error, response, body) {
		if (response.statusCode === 200 && body) {
			var results = JSON.parse(body);
			if (results.data && results.data.services && results.data.services.length > 0) {
				return callback(null, results.data.services[0]);
			} else {
				return callback({
					"error": "Error finding service " + inputs.DOMAIN + "." + inputs.SERVICE_NAME + " in service catalog",
					"details": "Could not find service " + inputs.DOMAIN + "." + inputs.SERVICE_NAME + " in service catalog"
				});
			}

		} else {
			return callback({
				"error": "Error finding service " + inputs.DOMAIN + "." + inputs.SERVICE_NAME + " in service catalog",
				"details": response.body.message
			});
		}
	});

};
