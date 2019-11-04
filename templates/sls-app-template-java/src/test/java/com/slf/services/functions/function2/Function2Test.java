package com.slf.services;

import static org.hamcrest.CoreMatchers.containsString;
import static org.junit.Assert.*;
import org.junit.Test;
import com.amazonaws.services.lambda.runtime.Context;
import com.slf.model.Response;
import com.slf.stubs.ContextStub;
import java.util.HashMap;
import java.util.Map;

public class Function2Test {


	private Function2 f2 = new Function2();

	public  Context context = new ContextStub("jazztest_sls-app-python-FN_function2-stg");

	@Test
	public void shouldExecuteRequest() {
		Map<String, Object> input = new HashMap();
		input.put("key", "value_2");
		Response response = f2.handleRequest(input, context);
		Map<String, String> output = (Map) response.getData();

		assertTrue(output.get("name").equals("value_2"));
		// Should have read the value from the config
		assertTrue(output.get("config_key").equals("config_value_stg_2"));

	}
}