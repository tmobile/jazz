package com.slf.util;


import com.slf.model.Request;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;


public class EnvironmentConfigTest {


    @Test
    public void getConfig() throws Exception{
        Request request = new Request();
        request.setStage("DEV");
        EnvironmentConfig config = new EnvironmentConfig(request);
        String key = config.getConfig("config_key");
        assertEquals("config_value_dev", key);

    }

    @Test
    public void getConfigThrowsExceptionWhenNUllStagePassed() {
        Request request = new Request();
        request.setStage(null);
        EnvironmentConfig config = null;

        try {
            config = new EnvironmentConfig(request);
            assertTrue("This method should have thrown BadRequestException",false);
        }
        catch (Exception e){
            assertTrue(true);
        }
    }
}