#!/bin/bash
mgmt_host=$1
mgmt_org=$2
mgmt_env=$3
application=$4
apiversion=$5
username=$6
password=$7
credentials=$username:$password
version=$8

function importanddeploy()  {
        pwd
        cp ./Deployable/$application-$apiversion.zip ./
        chmod 755 $application-$apiversion.zip
        ls -l

        echo "=================================================="
        echo "Getting the current deployed version"

        echo curl -k -X GET -H "Accept: application/xml" -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/environments/$mgmt_env/deployments"
        apis=`curl -k -X GET -H "Accept: application/xml" -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/environments/$mgmt_env/deployments" 2>/dev/null`
        echo $apis > temp.xml

        deployedVersion=$(xpath -e "//APIProxy[@name='$application']/Revision/@name" temp.xml 2> /dev/null)
       	deployedVersion=${deployedVersion//name=/}
        deployedVersion=${deployedVersion//\"/}
        deployedVersion=${deployedVersion//\ /}

       	echo "Deployed version="$deployedVersion
       	echo "==================================================="

       	echo "***************************************************"
       	echo "Importing new revision"

       	echo curl -k -s -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis?action=import&name=$application" -F "file=@$application-$apiversion.zip" -H "Accept: application/xml" -H "Content-Type: multipart/form-data" -X POST
       	imprt=`curl -k -s -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis?action=import&name=$application" -F "file=@$application-$apiversion.zip" -H "Accept: application/xml" -H "Content-Type: multipart/form-data" -X POST 2>/dev/null`
       	echo $imprt > dep.xml

        revision=$(xpath -e '//APIProxy/@revision' dep.xml 2> /dev/null)
        revision=${revision/revision=/}
        revision=${revision//\"/}
        revision=${revision//\ /}

       	echo "New Revision imported= $revision"
        echo "***************************************************"

        echo "---------------------------------------------------"
		echo "Undeploy this $deployedVersion  revision"
		
        undeploy=`curl -k -s -X POST -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis/$application/deployments?action=undeploy&env=$mgmt_env&revision=$deployedVersion" 2>/dev/null`
        echo $undeploy

        echo "Waiting for undeploying"

        sleep 2

        echo "Undeploy Success"
        echo "---------------------------------------------------"

        echo "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"
		echo "Deploy new $revision revision"
		
        deploy=`curl -k -s -X POST -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis/$application/revisions/$revision/deployments?action=deploy&env=$mgmt_env&override=true" 2>/dev/null`
        echo $deploy

        rm -fr dep.xml
        rm -fr temp.xml
        rm -fr $application-$apiversion.zip
}

importanddeploy
        content=`curl -k -siI -X GET "$mgmt_host/v1/o/$mgmt_org/e/$mgmt_env/apis/$application/revisions/$revision/deployments" -H 'Content-type:application/xml' -u $credentials`
        httpStatus=$(echo "${content}" | grep '^HTTP/1' | awk {'print $2'} |tail -1)
        echo $httpStatus
        if [[ httpStatus -eq 200 ]]
        then
        echo --------------------------------------------------------
        echo $application deployed successfully
        echo --------------------------------------------------------
        exit 0
        else
        echo --------------------------------------------------------
        echo $application NOT deployed successfully
        echo --------------------------------------------------------
        exit 1
        fi
exit
