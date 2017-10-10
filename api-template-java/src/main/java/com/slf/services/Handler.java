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

import org.apache.log4j.Logger;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.slf.components.SecretHandler;
import com.slf.exceptions.BadRequestException;
import com.slf.exceptions.InternalServerErrorException;
import com.slf.model.Request;
import com.slf.model.Response;
import com.slf.util.EnvironmentConfig;

/**
 * This is a java template for developing and deploying Lambda functions. The
 * template is based on the predefined interfaces provided by the AWS Lambda
 * Java core library to create your Lambda function handler. The advantage is
 * the library will take care of serializing and deserializing the input/output
 * automatically.
 * 
 * @Author:
 * @version: 1.0
 * @Date:
 * 
 **/

public class Handler implements RequestHandler<Request, Response> {

	static final Logger logger = Logger.getLogger(RequestHandler.class);

	// @Override
	public Response handleRequest(Request input, Context context) {

		HashMap<String, String> data = new HashMap<String, String>();
		if ((input == null) || (input.getMethod() == null)) {
			data.put("key", "Default Value ");
		} else {
			if (input.getMethod().equalsIgnoreCase("POST")) {
				data.put("key", "POST value");
			} else if (input.getMethod().equalsIgnoreCase("GET")) {
				data.put("key", "GET value");
			}
		}
		return new Response(data, input.getBody());

	}

}
