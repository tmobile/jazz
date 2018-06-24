## API to invoke functions (aws lambda).
API to invoke functions (aws lambda). Takes in ARN of the function & input as JSON. Returns executionStatus & payload from aws lambda service. 'executionStatus' can take one of these values - Success, HandlerError, UnhandledError or FunctionInvocationError. See swagger specification for more details.

#### sample request to the API
```
{
  "functionARN": "arn:aws:lambda:us-east-1:123456789:function:hello-function",
  "inputJSON": {
    "foo": "bar"
  }
}
```

#### sample response
```
{
  "data": {
    "payload": {
      "StatusCode": 200,
      "data": {
        "key": "value"
      }
    },
    "execStatus": "Success"
  },
  "input": {
    "functionARN": "arn:aws:lambda:us-east-1:123456789:function:hello-function",
    "inputJSON": {
      "foo": "bar"
    }
  }
}
```


