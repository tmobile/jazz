package com.slf.model;

public class ErrorInfo {

	private String errorType;
	private String message;

	public ErrorInfo(String errorType, String message) {
		this.errorType = errorType;
		this.message = message;
	}

	public ErrorInfo(String message) {
		this.message = message;
	}

	public ErrorInfo() {
	}

	public String getErrorType() {
		return errorType;
	}

	public void setErrorType(String errorType) {
		this.errorType = errorType;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

}
