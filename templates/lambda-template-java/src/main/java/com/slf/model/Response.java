package com.slf.model;

import java.util.Map;

public class Response {

	private Object data;
	private Request input;

	public Response(Object data, Request input) {
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

	public Request getInput() {
		return input;
	}

	public void setInput(Request input) {
		this.input = input;
	}

}
