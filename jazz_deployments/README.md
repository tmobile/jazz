### Deployment API
The service provides a REST API interface to do the CRUD operation in Deployments.


#### Service Details

###### Development Environment
```
API endpoint
 - Create : https://dev-cloud-api.corporate.t-mobile.com/api/jazz/deployments
 - Get(using query param) : https://dev-cloud-api.corporate.t-mobile.com/api/jazz/deployments?service=&domain=&environment=
 - Get : https://dev-cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>
 - Update : https://dev-cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>
 - Delete : https://dev-cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>
 - Re-Build : https://dev-cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>/re-build
```
###### Stage Environment
```
API endpoint
 - Create : https://stg-cloud-api.corporate.t-mobile.com/api/jazz/deployments
 - Get(using query param) : https://stg-cloud-api.corporate.t-mobile.com/api/jazz/deployments?service=&domain=&environment=
 - Get : https://stg-cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>
 - Update : https://stg-cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId> 
 - Delete : https://stg-cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>
 - Build : https://stg-cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>/re-build
```
###### production Environment
```
API endpoint 
 - create : https://cloud-api.corporate.t-mobile.com/api/jazz/deployments
 - Get(using query param) : https://cloud-api.corporate.t-mobile.com/api/jazz/deployments?service=&domain=&environment=
 - Get : https://cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>
 - Update : https://cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>
 - Delete : https://cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>
 - Build : https://cloud-api.corporate.t-mobile.com/api/jazz/deployments/<DeploymentId>/re-build
```

#### Sample Input Payload for Create Deployments
````
{
	"service_id" : "<id>",
    "service" : "<servicename>",
    "domain" : "<domain>",
    "environment_logical_id" : "<env id>",
    "provider_build_id": "<build no>",
    "provider_build_url": "<build url>",
    "scm_commit_hash" : "<commit hash >",
    "scm_url" : "<scm url>",
    "scm_branch": "<branch name>",
    "status" :"<status>" //Possible values are "successful", "started", "failed", "archived", "aborted", "in_progress"
}

Note : All feilds are required.
````



