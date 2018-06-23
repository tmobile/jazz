### API specification to get the application logs. 

#### Input Parameters
````
{
	"service" : "service-name", //Required
	"domain" : "domain-name", //Required
	"environment" : "dev"/"stg"/"prod",	//Required
	"category" : "api"/"function", //Required
	"start_time" : "2017-08-23",
	"end_time" : "2017-08-24",
	"size" : 25,
	"offset" : 1,
	"type" : "WARN"/"ERROR"/"INFO"/"VERBOSE"/"DEBUG"	
}

````


#### Service Details

###### Development Environment
```
API endpoint: https://{svc_endpoint}/api/jazz/logs
```
###### Stage Environment
```
API endpoint: https://{svc_endpoint}/api/jazz/logs
```
###### production Environment
```
API endpoint: https://{svc_endpoint}/api/jazz/logs
```

