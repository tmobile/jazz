## Purpose
Proxy function that is invoked from external API proxies (Apigee) to invoke the user's function that contains the business logic. This function acts as an interface between API proxies & underlying functions deployed in FaaS platforms (AWS). 

## Input
Function expects the following payload from the API proxy (example below will be specific to the integration: APIGEE -> AWS Lambda).  

```js
{
  "region": "us-east-1",
  "functionName": "functionName",
  "body": "{\"test\":\"body\"}",
  "httpMethod": "POST",
  "queryStringParameters": {
    "foo": "bar"
  },
  "headers": {
    "Accept-Language": "en-US,en;q=0.8",
    "X-Forwarded-For": "127.0.0.1, 127.0.0.2",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "X-Forwarded-Port": "443",
    "Host": "my.api.com",
    "X-Forwarded-Proto": "https",
    "Cache-Control": "max-age=0",
    "User-Agent": "Custom User Agent String",
    "Accept-Encoding": "gzip, deflate, sdch"
  },
  "pathParameters": {
    "proxy": "path/to/resource"
  },
  "method": "POST",
  "path": "/path/to/resource"
}
```

## Future work
Current implementation supports APIGEE + AWS Lambda integration. This can be easily be extended to support any API Gateway & FaaS platform integration usecases
