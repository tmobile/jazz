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

package com.slf.services;

import java.util.HashMap;
import org.apache.log4j.Logger;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.exceptions.InternalServerErrorException;
import com.slf.model.Request;
import com.slf.model.Response;
import com.slf.util.EnvironmentConfig;

/**
	This is a java template for developing and deploying functions. The template is based on the
	predefined interfaces provided by the AWS Lambda Java core library to create your function handler.

	@Author: T-Mobile
	@version: 1.0
	@Date:

**/

public class Handler implements RequestHandler<Request, Response> {

	static final Logger logger = Logger.getLogger(RequestHandler.class);

	// @Override
	public Response handleRequest(Request input, Context context) {

		// Initialize the environment specific variables. Each environment has different properties files to store env specific data.
		// For example, for development environment specific details, add configurations as key,value pairs in 'dev.properties'
		EnvironmentConfig configObject = null;
		try {
				configObject = new EnvironmentConfig(context);
		    String config_value = configObject.getConfig("config_key");
		    logger.info("You are using the env key: " + config_value);
		} catch (Exception ex) {
				throw new InternalServerErrorException("Could not load env properties file: "+ex.getMessage());
		}

		HashMap<String, String> data = new HashMap<String, String>();
		if ((input == null) || (input.getMethod() == null)) {
			data.put("key", "Default Value");
		} else {
			if (input.getMethod().equalsIgnoreCase("POST")) {
				data.put("key", "POST value");
			} else if (input.getMethod().equalsIgnoreCase("GET")) {
				data.put("key", "GET value");
			}
		}
		return new Response(data, input.getBody());

	}

}
