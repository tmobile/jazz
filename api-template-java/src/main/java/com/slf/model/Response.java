package com.slf.model;

import java.util.Map;

public class Response {

	private Object data;
	private Map<String, String> input;

	public Response(Object data, Map input) {
		this.data = data;
		this.input = input;
	}

	public Response() {
	}

	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}

	public Map<String, String> getInput() {
		return input;
	}

	public void setInput(Map<String, String> input) {
		this.input = input;
	}
	
}
