package com.slf.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Map;

public class JsonUtil {

    private static final ObjectMapper mapper = new ObjectMapper();

    private JsonUtil(){}

    public static Object convertJsonStrToObj(String jsonInString, Class type) throws IOException {
        mapper.writerWithDefaultPrettyPrinter();
        return mapper.readValue(jsonInString, type);
    }

    public static String writeValueAsString(Map<String, Object> map) throws JsonProcessingException {
        return mapper.writeValueAsString(map);
    }
}