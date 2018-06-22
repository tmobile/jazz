package com.slf.exceptions;

public class UnauthorizedException extends BaseException {

	public UnauthorizedException(String message) {
		super("Unauthorized", message);
	}
}
