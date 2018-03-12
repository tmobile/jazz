## Platform API for Service authentication.
Provides an API for authenticating a user against authentication backend.

#### Request format in JSON
```
{
    "username":"aabbcc",
    "password":"xxxxyyyyyzz"
}
```

#### Response Format as a JSON structure
```
{
    "data": {
        "token":<token>
    },
    "input" : {
		"username":"aabbcc"
	}
}
```

#### Service Details

###### Development Environment
```
API endpoint: https://{Configured Domain}.com/api/jazz/login
```
###### Stage Environment
```
API endpoint: https://{Configured Domain}.com/api/jazz/login
```
###### Production Environment
```
API endpoint: https://{Configured Domain}.com/api/jazz/login
```
