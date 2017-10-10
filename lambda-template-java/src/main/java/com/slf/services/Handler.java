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

package com.slf.services;

import java.util.HashMap;

import com.amazonaws.services.lambda.runtime.Context; 
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.exceptions.InternalServerErrorException;
import com.slf.model.Response;
import com.slf.model.Request;
import com.slf.util.EnvironmentConfig;
//Following line to be included if decrypting secrets in code
import com.slf.components.SecretHandler;

import org.apache.log4j.Logger;

/**
	This is a java template for developing and deploying Lambda functions. The template is based on the 
	predefined interfaces provided by the AWS Lambda Java core library to create your Lambda function handler. 
	The advantage is the library will take care of serializing and deserializing the input/output automatically. 
	
	@Author: T-Mobile
	@version: 1.0
	@Date: 

**/

public class Handler implements RequestHandler<Request, Response> {

	static final Logger logger = Logger.getLogger(RequestHandler.class);
	//@Override
	public Response handleRequest(Request input, Context context) {
		
	    // Initialize once all the environment specific variables. Each environment has different properties files to store env specific data.
		// For example, for Development specific details, add configurations as key,value pairs in 'dev.properties' 
		EnvironmentConfig configObject = null;
		try {
			configObject = new EnvironmentConfig(context);
		    String config_value = configObject.getConfig("config_key");
		    logger.info("You are using the env key..:"+config_value);
		} catch (Exception ex) {
			throw new InternalServerErrorException("Could not load env properties file "+ex.getMessage());
		}

        // //Following is an example for retrieving plaintext for your secret. Add the secrets to be decrypted to com.slf.components.SecretConfig
		String secret = ":";
		try {
			configObject = new EnvironmentConfig(context);
		    secret = configObject.getConfig("mysecret");
		    logger.info("You are using the env key..:"+secret);
		} catch (Exception ex) {
			throw new InternalServerErrorException("Could not load env properties file "+ex.getMessage());
		}
		SecretHandler secretHandler = new SecretHandler(context);
        HashMap<String, Object> secretObj = secretHandler.decryptSecret(secret);
        if ((Boolean)secretObj.get("error") != true) {
        	String plaintext = secretObj.get("message").toString();
        } else{
        	logger.error("encountered Error while tru=ying to decrypt secret : " + secretObj.get("message"));
        }
	    
		logger.trace("Finer-grained informational events than the DEBUG ");
		logger.info("Interesting runtime events (Eg. connection established, data fetched etc.)");
		logger.warn("Runtime situations that are undesirable or unexpected, but not necessarily \"wrong\".");
		logger.debug("Detailed information on the flow through the system.");
        logger.error("Runtime errors or unexpected conditions.");
        logger.fatal("Very severe error events that will presumably lead the application to abort");
	    
	    
		// return a key, value pair
		HashMap<String, String> data = new HashMap<String, String>();
		data.put("key", "value");
		
		return new Response(data, input);
	}

}
