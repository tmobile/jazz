package com.slf.stubs;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.CognitoIdentity;
import com.amazonaws.services.lambda.runtime.ClientContext;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.slf.model.Response;

public class ContextStub implements Context {
  private String functionName;

  public ContextStub(String aFunctionName) {
    this.functionName = aFunctionName;
  }

  public String getAwsRequestId() {
    return "123";
  }

  public String getLogGroupName() {
    return "LogGroupName";
  }

  public String getLogStreamName() {
    return "LogStreamName";
  }

  public String getFunctionName() {
    return functionName;
  }

  public String getFunctionVersion() {
    return "1.1.1";
  }

  public String getInvokedFunctionArn() {
    return "arn:aws:lambda:us-east-1:123456789012:function:jazzolg19-javadomain-javaname-prod-function1";
  }

  public CognitoIdentity getIdentity() {
    return null;
  }

  public ClientContext getClientContext() {
    return null;
  }

  public int getRemainingTimeInMillis() {
    return 150;
  }

  public int getMemoryLimitInMB() {
    return 16;
  }

  public LambdaLogger getLogger() {
    return null;
  }
}
