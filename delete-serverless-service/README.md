### Delete Serverless Service API
The service provides a REST API interface to delete a serverless service deployed in AWS.

#### Input Parameters
````
service_name: The name of the service to be cleaned up. This is a required field.
domain: The domain of the the service. The value can be empty if there is no domain applicable for the service.
version: The specific version to be deleted. This is an optional field and by default the latest deployed version will be applied if the value is empty.
````

#### Sample Input Payload
````
{
  "service_name": "my-service",
  "domain": "platform",
  "version": "LATEST"
}
````

#### Sample Success Output Payload
The  success reponse will have a tracking id field which can used for tracking the status of the delete service job.
````
{
  "data": {
    "message": "Service deletion job triggered successfully",
    "request_id": "2efc3e7e-5b11-d87f-d99f-37e1c48d11f5"
  },
  "input": {
    "service_name": "my-service",
    "domain": "platform",
    "version": "LATEST"
  }
}
````

#### Sample Failure Output Payload
````
{
  "errorType": "InternalServerError",
  "message": "Service Failed"
}
````
