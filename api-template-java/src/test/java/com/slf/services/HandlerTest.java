package com.slf.services;

import java.util.HashMap;
import static org.junit.Assert.*;
import org.apache.log4j.Logger;
import org.junit.Test;
import com.amazonaws.services.lambda.runtime.Context;
import com.slf.model.Request;
import com.slf.services.Handler;

public class HandlerTest {

	static final Logger logger = Logger.getLogger(HandlerTest.class);
	private Handler handler = new Handler();

	public  Context context;

	@Test
	public void handler200Response() {
		Request input = new Request();
		//input.setKey("hello"); @TODO: Write assertions here
		assertTrue(true);
	}
	
	@Test
	public void handler400Response() {
		//Request input = null; @TODO: Write assertions here
		assertTrue(true);
	}

}