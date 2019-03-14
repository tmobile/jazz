The Core API service for ACL.
API will allow access to Jazz services like managment, code and deploy.
User creating the service will have admin level access and can add other users with read, write or admin level access for different categories like managment, code and deployment.
The API will use casbin (https://github.com/casbin/casbin) for enforcing the policies which will persist in a database.
