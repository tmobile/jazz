## Build pack for Cloud API services!

* This repository should contain Jenkinsfile - one file per branch.
* Jenkinsfile contains definitions for CI/CD workflow per each Cloud API service.
* Each Jenkins build will pull the Jenkinsfile from corresponding branch and will execute the stages defined in this file
* Purpose of different branches in this repository:
  * master branch - Jenkinsfile for deploying service to staging & production environments.
  * development branch - Jenkinsfile for deploying service to development environment.

#### Define the workflow for production environment here:
| Step     | Stage Name    | Purpose |
| --------|---------|-------|
| 1  | foo stage  | foo purpose   |
| 2 | bar stage | bar purpose    |


#### Define the workflow for non-production environment here:
| Step     | Stage Name    | Purpose |
| --------|---------|-------|
| 1  | foo stage  | foo purpose   |
| 2 | bar stage | bar purpose    |
