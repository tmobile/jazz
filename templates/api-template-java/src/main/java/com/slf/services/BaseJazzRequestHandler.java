package com.slf.services;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.exceptions.BadRequestException;
import com.slf.exceptions.InternalServerErrorException;
import com.slf.model.Response;
import com.slf.util.EnvironmentConfig;
import org.apache.log4j.Logger;

import java.util.Map;

/**
 * Abstract BaseJazzHandler for all handlers.
 * Provides a template for authoring AWS lambda functions. This implementation is based on the interface
 * 'RequestHandler' with custom POJO Input/Output
 *
 * @author Deepu Sundaresan
 * @version 1.2
 * @date
 */

public abstract class BaseJazzRequestHandler implements RequestHandler<Map<String, Object>, Response> {

    private static final Logger LOGGER = Logger.getLogger(BaseJazzRequestHandler.class);

    /* Fields which to map values from aws-integration body template */
    protected String stage = null;
    protected String method = null;
    protected String resourcePath = null;
    protected Map<String, Object> body = null;
    protected Map<String, Object> query = null;
    protected Map<String, Object> headers = null;
    protected EnvironmentConfig configObject = null;

    public Response handleRequest(Map<String, Object> input, Context context) {

        /* Load environment, params, headers, payload etc. from API payload */
        if (input == null || input.isEmpty()) {
            throw new BadRequestException("Invalid or empty API payload");

        }
        if (input.get(MapType.STAGE.getValue()) != null) {
            stage = ((String) input.get(MapType.STAGE.getValue())).toLowerCase();
        }
        if (input.get(MapType.METHOD.getValue()) != null) {
            method = ((String) input.get(MapType.METHOD.getValue())).toUpperCase();
        }
        if (input.get(MapType.BODY.getValue()) instanceof Map) {
            Map<String, Object> payload = (Map<String, Object>) input.get(MapType.BODY.getValue());
            LOGGER.debug("payload..:" + payload);
            body = payload;
        }
        if (input.get(MapType.QUERY.getValue()) instanceof Map) {
            Map<String, Object> inpQuery = (Map<String, Object>) input.get(MapType.QUERY.getValue());
            LOGGER.debug("query..:" + query);
            query = inpQuery;
        }
        if (input.get(MapType.HEADERS.getValue()) instanceof Map) {
            Map<String, Object> inpHeaders = (Map<String, Object>) input.get(MapType.HEADERS.getValue());
            LOGGER.debug("headers..:" + headers);
            headers = inpHeaders;
        }
        if (input.get(MapType.RESOURCE_PATH.getValue()) != null) {
            resourcePath = ((String) input.get(MapType.RESOURCE_PATH.getValue())).toLowerCase();
        }


        /*
         * Initialize environment specific variables. Each environment has a properties file to store data.
         * For example, for configurations that you need for development environment, add configurations as <key,value> in 'dev.properties' file.
         */
        try {
            configObject = new EnvironmentConfig(input, context);
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

    enum MapType {
        STAGE("stage"),
        METHOD("method"),
        BODY("body"),
        QUERY("query"),
        HEADERS("headers"),
        RESOURCE_PATH("resourcePath");

        private String value;

        MapType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }
}
