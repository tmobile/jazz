package com.slf.services;

import java.util.HashMap;

import org.apache.log4j.Logger;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.components.SecretHandler;
import com.slf.exceptions.BadRequestException;
import com.slf.exceptions.InternalServerErrorException;
import com.slf.model.Request;
import com.slf.model.Response;
import com.slf.util.EnvironmentConfig;

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
		/*		
		// return a 400 bad request
		if(input == null) {
			throw new BadRequestException("Invalid Payload Format or wrong data");
		} 
		
	    // Initialize once all the environment specific variables. Each environment has different properties files to store env specific data.
		// For example, for Development specific details, add configurations as key,value pairs in 'dev.properties' 
		EnvironmentConfig configObject = null;
		try {
			configObject = new EnvironmentConfig(input);
		    String config_value = configObject.getConfig("config_key");
		    logger.info("You are using the env key..:"+config_value);
		} catch (Exception ex) {
			throw new InternalServerErrorException("Could not load env properties file "+ex.getMessage());
		}

        // //Following is an example for retrieving plaintext for your secret. Add the secrets to be decrypted to com.slf.components.SecretConfig
		String secret = ":";
		try {
			configObject = new EnvironmentConfig(input);
		    secret = configObject.getConfig("mysecret");
		    logger.info("You are using the env key..:"+secret);
		} catch (Exception ex) {
			throw new InternalServerErrorException("Could not load env properties file "+ex.getMessage());
		}
		SecretHandler secretHandler = new SecretHandler(input);
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
	*/    
		// return a key, value pair
		HashMap<String, String> data = new HashMap<String, String>();
		if ( (input == null) || (input.getMethod() == null) ) {
			data.put("key", "Default Value ");
		} else {
			if(input.getMethod().equalsIgnoreCase("POST")) {
				data.put("key", "POST value");
			}else if(input.getMethod().equalsIgnoreCase("GET")){
				data.put("key", "GET value");	
			}
		}
		return new Response(data, input.getBody());
	}

}
