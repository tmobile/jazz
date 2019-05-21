package com.slf.util;

import com.amazonaws.services.lambda.runtime.Context;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.apache.log4j.Logger;

import java.util.HashMap;
import java.util.Map;

public class ErrorUtil {

    private static final Logger LOGGER = Logger.getLogger(ErrorUtil.class);

    private ErrorUtil(){}

    public static String createError(Context context, String message, String errorType){
        String error = null;
        Map<String, Object> errorPayload = new HashMap();
        errorPayload.put("errorType", errorType);
        errorPayload.put("requestId", context.getAwsRequestId());
        errorPayload.put("message", message);
        try {
            error = JsonUtil.writeValueAsString(errorPayload);
        } catch (JsonProcessingException e) {
          LOGGER.error(e);
        }
    return error;
    }

}