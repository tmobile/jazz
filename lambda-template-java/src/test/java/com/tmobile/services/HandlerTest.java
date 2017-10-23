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

package com.tmobile.services;

import static org.hamcrest.CoreMatchers.containsString;
import static org.junit.Assert.*;
import org.junit.Test;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.model.Response;
import com.slf.model.Request;
import com.slf.services.Handler;

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
