package com.slf.util;

import java.io.IOException;
import java.util.Properties;

import org.apache.log4j.Logger;

import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.exceptions.BadRequestException;
import com.slf.model.Request;

/**
 * The environment configuration reader class. Environment configurations can be specified in a properties file. 
 * Each environment will be having a separate properties file. For ex. dev.properties for 'DEV' 
 * 
 * Usage:
 * EnvironmentConfig configObject = new EnvironmentConfig(stage);
 * String restUri = configObject.getConfig("ES_URL");

 * @author 
 * @version 
 *
 */
public class EnvironmentConfig {
	
	static final Logger logger = Logger.getLogger(EnvironmentConfig.class);
	
	private static Properties props = new Properties();
	private static String stage = null; 

	public EnvironmentConfig(Request input) throws Exception {
		super();
		
		if(null != input.getStage()) {
			stage = input.getStage().toLowerCase();
		}

		if(stage.isEmpty()) {
			throw new BadRequestException("Invalid Stage. Can't load ENV configurations");
		}
		
		String configFile = "/"+stage+".properties";
		logger.info("Loading configuration file for env..:"+configFile);
		props.load(this.getClass().getResourceAsStream(configFile));
	}
	
	
	public String getConfig(String key) {
		if(props != null) {
			String value = props.getProperty(key);
			return value;
		}
		return null;
	}


	@Override
	public String toString() {
		return "Loaded config for "+stage;
	}
	
	
}


