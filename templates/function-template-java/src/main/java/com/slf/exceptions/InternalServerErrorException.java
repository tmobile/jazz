package com.slf.exceptions;

public class InternalServerErrorException extends BaseException {

	public InternalServerErrorException(String message) {
		super("InternalServerError", message);
	}

}
