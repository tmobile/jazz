package com.slf.services;

import java.util.HashMap;
import java.util.Map;

import com.slf.util.ErrorUtil;
import org.apache.http.HttpStatus;
import org.apache.log4j.Logger;
import com.amazonaws.services.lambda.runtime.Context;
import com.slf.model.Response;
import com.slf.exceptions.BadRequestException;

/**
	This is a java template for developing and deploying functions. The template is based on the
	predefined interfaces provided by the AWS Lambda Java core library to create your function handler.

	@Author:
	@version: 1.0
	@Date:

**/

public class Handler extends BaseJazzRequestHandler {

	private static final Logger LOGGER = Logger.getLogger(Handler.class);

	/**
     * Override and implement this method from BaseJazzRequestHandler. This method would have the main
     * processing logic to serve the request from User
  	*/
	public Response execute(Map<String, Object> input, Context context) {

        /* Read environment specific configurations from properties file */
        String configStr = configObject.getConfig("config_key");
        LOGGER.info("You are using the env key: " + configStr);

		/* Logger supports the following levels of logs */
        /*
        LOGGER.trace("Fine-grained informational events than DEBUG");
        LOGGER.info("Interesting runtime events (Eg. connection established, data fetched etc.)");
        LOGGER.warn("Runtime situations that are undesirable or unexpected, but not necessarily \"wrong\".");
        LOGGER.debug("Detailed information on the flow through the system.");
        LOGGER.error("Runtime errors or unexpected conditions.");
        LOGGER.fatal("Very severe error events that will presumably lead the application to abort");*/


				/* Sample output data */
        Map<String, String> data = new HashMap();

        if ("GET".equalsIgnoreCase(this.method)) {
            LOGGER.info("Sample log inside GET");
            data.put("message", "GET executed successfully");
            return new Response(data, this.query);
        } else if ("POST".equalsIgnoreCase(this.method)) {
            LOGGER.info("Processing POST Request with input..." + this.body);
            data.put("message", "POST executed successfully");
            return new Response(data, this.body);
        } else {
            throw new BadRequestException(ErrorUtil.createError(context, "Invalid / Empty payload", HttpStatus.SC_BAD_REQUEST, "BAD_REQUEST"));
        }
	}

}
