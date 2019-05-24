## Delete Resources for Multi Account and Multi region!

* This repository contains a Jenkinsfile.
* Jenkinsfile contains definitions for deleting the aws resources for Multiple Accounts and Multiple Regions.
* This pipeline job is used during clean up during stack tear down or when we want to remove one provisioned account. 
* The Job takes input as 'all' ie all accounts provisioned in the stack or accountids.
* This job is triggered from a script in the jazz-installer code base

