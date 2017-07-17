## Cloud API Service for service management.
Provides an API for whether a service exists in the Cloud API Services project. The name of the service & domain are case-insensitive

Utilizes BitBucket Server REST API endpoints to retrieve the repositories within the project. To learn more about the endpoints, refer to this link:
```
https://developer.atlassian.com/static/rest/bitbucket-server/4.14.2/bitbucket-rest.html#idm45627977751472
```

#### Request format in JSON
A example request payload format is given below, where 'service-name' is the name of the service we are checking the availability for &
'domain-name' is the name of the domain for the service.

```
{
    "service": "service-name",
    "domain": "domain-name"
}
```

#### Response Format as a JSON structure
```
{
    "data": {
        "available": "true"
    },
    "input" : {
        "service": "service-name",
        "domain": "domain-name"
    }
}
```

#### Request Format as a Endpoint
Consider requesting the endpoint with service 'service-name'.
```
API endpoint: https://cloud-api.corporate.t-mobile.com/api/platform/is-service-available/?service=service-name&domain=domain-name
```

#### Service Details

###### Development Environment
```
API endpoint: https://dev-cloud-api.corporate.t-mobile.com/api/platform/is-service-available
```
###### Stage Environment
```
API endpoint: https://stg-cloud-api.corporate.t-mobile.com/api/platform/is-service-available
```
###### Production Environment
```
API endpoint: https://cloud-api.corporate.t-mobile.com/api/platform/is-service-available
```
