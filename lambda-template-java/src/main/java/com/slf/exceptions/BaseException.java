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

package com.slf.exceptions;

import com.slf.model.ErrorInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;


public class BaseException extends RuntimeException {

	private ErrorInfo err = new ErrorInfo();
	
	public BaseException(String errortype, String message) {
		err.setErrorType(errortype);
		err.setMessage(message);
	}
	
	@Override
    public String getMessage(){
		String jsonInString = null;
		
		try {
			ObjectMapper mapper = new ObjectMapper();
			jsonInString = mapper.writeValueAsString(err);

		} catch (JsonProcessingException ex) {
			throw new InternalServerErrorException("Parsor Error occured.");
		}
		
		return jsonInString; 
	}
	
}