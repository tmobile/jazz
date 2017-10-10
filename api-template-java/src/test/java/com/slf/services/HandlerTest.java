// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
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