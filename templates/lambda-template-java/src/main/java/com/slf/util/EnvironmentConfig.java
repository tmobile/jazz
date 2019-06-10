package com.slf.util;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.exceptions.BadRequestException;

import java.util.Properties;

import org.apache.log4j.Logger;


/**
 * The environment configuration reader class. Environment configurations can be specified in a properties file. 
 * Each environment will be having a separate properties file. For ex. dev.properties for 'DEV' 
 * 
 * Usage:
 * EnvironmentConfig configObject = new EnvironmentConfig(context);
 * String config_value = configObject.getConfig("config_key");

 * @author 
 * @version 
 *
 */
public class EnvironmentConfig {
	
	private static final Logger LOGGER = Logger.getLogger(EnvironmentConfig.class);
	
	private static Properties props = new Properties();
	private static String stage = null; 

	public EnvironmentConfig (Context context) throws Exception {
		String fnName = context.getFunctionName();
		
		if(null != fnName) {
			int lastIndx = fnName.lastIndexOf('-');
			stage = fnName.substring(lastIndx+1);
		}
		
		if(stage.isEmpty()) {
			throw new BadRequestException("Invalid Stage. Can't load ENV configurations");
		}
		
		String configFile = "/"+stage+".properties";
		LOGGER.info("Loading configuration file for env..:"+configFile);
		props.load(this.getClass().getResourceAsStream(configFile));
	}
	
	public String getConfig(String key) {
		if(props != null) {
			return props.getProperty(key);
		}
		return null;
	}
	
	@Override
	public String toString() {
		return "Loaded config for "+stage;
	}
}


