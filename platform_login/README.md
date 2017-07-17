## Cloud API Service for AD authentication. 
Provides an API for authenticating a user against AD service. 

#### Request format in JSON
A example request payload format is given below, where 'username' is the Corp AD username of the user, and 'password' is the correspiding passowrd.
For Example. If your corp user id is 'abc@corporate.t-mobile.com', then the username is 'abc'
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
API endpoint: https://dev-cloud-api.corporate.t-mobile.com/api/platform/login
```
###### Stage Environment
```
API endpoint: https://stg-cloud-api.corporate.t-mobile.com/api/platform/login
```
###### Production Environment
```
API endpoint: https://cloud-api.corporate.t-mobile.com/api/platform/login
```