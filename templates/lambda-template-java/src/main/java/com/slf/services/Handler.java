package com.slf.services;

import java.util.HashMap;
import org.apache.log4j.Logger;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.exceptions.InternalServerErrorException;
import com.slf.model.Response;
import com.slf.model.Request;
import com.slf.util.EnvironmentConfig;


/**
	This is a java template for developing and deploying functions. The template is based on the
	predefined interfaces provided by the AWS Lambda Java core library to create your function handler.

	@Author:
	@version: 1.0
	@Date:

**/

public class Handler implements RequestHandler<Request, Response> {

	static final Logger logger = Logger.getLogger(RequestHandler.class);
	//@Override
	public Response handleRequest(Request input, Context context) {

	  // Initialize the environment specific variables. Each environment has different properties files to store env specific data.
		// For example, for development environment specific details, add configurations as key,value pairs in 'dev.properties'
		/* EnvironmentConfig configObject = null;
		try {
				configObject = new EnvironmentConfig(input);
		    String config_value = configObject.getConfig("config_key");
		    logger.info("You are using the env key: " + config_value);
		} catch (Exception ex) {
				throw new InternalServerErrorException("Could not load env properties file: "+ex.getMessage());
		}
		*/

		/*
		logger.trace("Finer-grained informational events than the DEBUG ");
		logger.info("Interesting runtime events (Eg. connection established, data fetched etc.)");
		logger.warn("Runtime situations that are undesirable or unexpected, but not necessarily \"wrong\".");
		logger.debug("Detailed information on the flow through the system.");
    logger.error("Runtime errors or unexpected conditions.");
    logger.fatal("Very severe error events that will presumably lead the application to abort");
		*/

		// return a key, value pair
		HashMap<String, String> data = new HashMap<String, String>();
		data.put("key", "value");

		return new Response(data, input);
	}

}
