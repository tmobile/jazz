package com.slf.model;

import java.util.Map;

public class Request {

	private String stage;
	private String method;
	private Map<String, String> body;

	public Request() {
	}

	public String getStage() {
		return stage;
	}

	public void setStage(String stage) {
		this.stage = stage;
	}

	public String getMethod() {
		return method;
	}

	public void setMethod(String method) {
		this.method = method;
	}

	public Map<String, String> getBody() {
		return body;
	}

	public void setBody(Map<String, String> body) {
		this.body = body;
	}
	
	
	
}
