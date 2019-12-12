package com.slf.exceptions;

import com.slf.model.ErrorInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;


public class BaseException extends RuntimeException {

	private final ErrorInfo errorInfo = new ErrorInfo();

	public BaseException(String errortype, String message) {
		errorInfo.setErrorType(errortype);
		errorInfo.setMessage(message);
	}

	@Override
    public String getMessage(){
		String jsonInString = null;

		try {
			ObjectMapper mapper = new ObjectMapper();
			jsonInString = mapper.writeValueAsString(errorInfo);

		} catch (JsonProcessingException ex) {
			throw new InternalServerErrorException("Parsor Error occured." + ex);
		}

		return jsonInString;
	}

}
