## Platform API Service authentication. 
Provides an API for authenticating a user against AD service. 

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
API endpoint: https://{Configured Domain}.com/api/platform/login
```
###### Stage Environment
```
API endpoint: https://{Configured Domain}.com/api/platform/login
```
###### Production Environment
```
API endpoint: https://{Configured Domain}.com/api/platform/login
```