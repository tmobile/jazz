## Jazz API Service for service management.
Provides an API that checks if a service exists or not. The name of the service & namespace are case-insensitive.

#### Request format in JSON
A example request payload format is given below, where 'service-name' is the name of the service we are checking the availability for &
'domain-name' is the name of the namespace for the service.

```
{
    "service": "service-name",
    "domain": "domain-name"
}
```

#### Response format as a JSON structure
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
