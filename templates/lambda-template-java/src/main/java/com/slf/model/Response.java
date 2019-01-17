package com.slf.model;


public class Response {

	private Object data;
	private Object input;

	public Response(Object data, Object input) {
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

	public Object getInput() {
		return input;
	}

	public void setInput(Object input) {
		this.input = input;
	}

}
