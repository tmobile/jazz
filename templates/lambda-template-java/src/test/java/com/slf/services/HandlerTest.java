package com.slf.services;

import static org.hamcrest.CoreMatchers.containsString;
import static org.junit.Assert.*;
import org.junit.Test;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.model.Response;
import com.slf.model.Request;

public class HandlerTest {

	private Handler handler = new Handler();

	// private input = Request;
	 public  Context context;
	 public  Request request;

	@Test
	public void handlerSaysHello() {
		assertTrue(true); //@TODO: Write assertions here
	}
}
