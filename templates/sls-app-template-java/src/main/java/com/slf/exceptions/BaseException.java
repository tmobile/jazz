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
