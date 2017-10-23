// =========================================================================
// Copyright 2017 T-Mobile USA, Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

package com.slf.services;

import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.*;
import org.apache.log4j.Logger;
import org.junit.Before;
import org.junit.Test;
import com.amazonaws.services.lambda.runtime.Context;
import com.slf.model.Request;
import com.slf.model.Response;
import com.slf.services.Handler;

public class HandlerTest {

	static final Logger logger = Logger.getLogger(HandlerTest.class);
	private Handler handler = new Handler();

	public Context context;
	Request input;
	
	@Before
	public void setup(){
		input = new Request();
	}
	
	/*
	 * The handleRequest() method should return a response object regardless of the request
	 * method input - default request and context objects
	 * method output - response object with two hashmap fields, "data," and "input"
	 */
	@Test
	public void handleRequestReturnsResponse(){
		boolean bool = handler.handleRequest(input, context) instanceof Response; 
		assertTrue(bool);
	}
	
	/*
	 * The response from handleRequest() should have "Default Value" within its data field map
	 * method input - default request and context objects (no values set for input)
	 * method output - response object with a map containing the value "Default Value"
	 */
	@Test
	public void handleRequestReturnsDefaultValue(){
		Response handlerResponse = handler.handleRequest(input, context);
		HashMap<String,String> responseData = (HashMap) handlerResponse.getData();
		String value = responseData.get("key");
		boolean bool = value.equals("Default Value");
		assertTrue(bool);
	}
	
	/*
	 * The response from handleRequest() should have "POST value" within its data field map
	 * method input - request object containing post method field and not null body field; context
	 * method output - response object with a map containing the value "POST value" 
	 */
	@Test
	public void handleRequestReturnsPostValue(){
		//must populate the input request to have a not null "body" and "method" field;
		Map<String,String> body = new HashMap<String, String>();
		body.put("k", "v");
		input.setBody(body);
		//simulated method will be a POST
		input.setMethod("POST");
		Response handlerResponse = handler.handleRequest(input, context);
		HashMap<String,String> responseData = (HashMap) handlerResponse.getData();
		String value = responseData.get("key");
		boolean bool = value.equals("POST value");
		assertTrue(bool);
	}
	
	/*
	 * The response from handleRequest() should have "GET value" within its data field map
	 * method input - request object containing post method field and not null body field; context
	 * method output - response object with a map containing the value "GET value" 
	 */
	@Test
	public void handleRequestReturnsGetValue(){
		//must populate the input request to have a not null "body" and "method" field;
		Map<String,String> body = new HashMap<String, String>();
		body.put("k", "v");
		input.setBody(body);
		//simulated method will be a GET
		input.setMethod("GET");
		Response handlerResponse = handler.handleRequest(input, context);
		HashMap<String,String> responseData = (HashMap) handlerResponse.getData();
		String value = responseData.get("key");
		boolean bool = value.equals("GET value");
		assertTrue(bool);
	}
	
	@Test
	public void handler200Response() {
		//Request input = new Request();
		//input.setKey("hello"); @TODO: Write assertions here
		assertTrue(true);
	}
	
	@Test
	public void handler400Response() {
		//Request input = null; @TODO: Write assertions here
		assertTrue(true);
	}

}