## API for Testing Lambda Functions.
Provides an API for Testing a lambda function and returns the Execution Status
#### Request format in JSON
```
{
	"functionARN": "arn:aws:lambda:us-east-1:192006145812:function:jazz20180604-test-lambda-4-test-j4-prod:1",
	"inputJSON" : "{
		\"name\":\"apple\"
	}"
}
```

#### Response Format as a JSON structure
```
{
    "data": {
        "StatusCode": 200,
        "execStatus": 1
    },
    "input": {
        "functionARN": "arn:aws:lambda:us-east-1:192006145812:function:jazz20180604-test-lambda-4-test-j4-prod:1",
        "inputJSON": "{\"name\":\"apple\"}"
    }
}
```


