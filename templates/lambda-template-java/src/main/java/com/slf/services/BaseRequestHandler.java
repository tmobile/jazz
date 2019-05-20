package com.slf.services;

import java.util.HashMap;
import java.util.Map;
import org.apache.log4j.Logger;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.exceptions.InternalServerErrorException;
import com.slf.model.Response;
import com.slf.util.EnvironmentConfig;

/**
 * Abstract BaseJazzHandler for all handlers.
 * Provides a template for authoring AWS lambda functions. This implementation is based on the interface
 * 'RequestHandler' with custom POJO Input/Output
 *
 * @author
 * @version 1.2
 * @date
 *
 */

public abstract class BaseRequestHandler implements RequestHandler<Map<String, Object>, Response> {

	private static final Logger LOGGER = Logger.getLogger(BaseRequestHandler.class);

	protected Map<String, Object> body = null;
	protected EnvironmentConfig configObject = null;

	public Response handleRequest(Map<String, Object> input, Context context) {

        if(input instanceof Map) {
        	body = input;
        }

		/*
		 * Initialize environment specific variables. Each environment has a properties file to store data.
		 * For example, for configurations that you need for development environment, add configurations as <key,value> in 'dev.properties' file.
		 */
		try {
          configObject = new EnvironmentConfig(context);
        } catch (Exception ex) {
            throw new InternalServerErrorException("Could not load env properties file: " + ex);
        }

		 return execute(input, context);
	}

	/**
	 * Implement this method in the sub class to handle business logic
	 *
	 * @param input
	 * @param context
	 * @return Response
	 */
	abstract Response execute(Map<String, Object> input, Context context);

}
