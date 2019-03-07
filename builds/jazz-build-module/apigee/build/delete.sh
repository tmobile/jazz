#!/bin/bash
mgmt_host=$1
mgmt_org=$2
mgmt_env=$3
application=$4
username=$5
password=$6
credentials=$username:$password

function delete()  {
    echo "=================================================="
    echo "Getting the current deployed version"

    echo curl -k -X GET -H "Accept: application/xml" -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/environments/$mgmt_env/deployments"
    apis=`curl -k -X GET -H "Accept: application/xml" -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/environments/$mgmt_env/deployments" 2>/dev/null`
    echo $apis > temp.xml

    deployedVersion=$(grep -oPm1 "(?<=name=\"$application\"> <Revision xsi:type=\"revisionStatusInEnvironment\" name=\")[^\">]+" temp.xml)

    echo "Deployed version="$deployedVersion
    echo "==================================================="

    echo "---------------------------------------------------"
    echo "Undeploy this $deployedVersion  revision"

    undeploy=`curl -k -s -X POST -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis/$application/deployments?action=undeploy&env=$mgmt_env&revision=$deployedVersion" 2>/dev/null`
    echo $undeploy

    echo "Waiting for undeploying"

    sleep 2

    echo "Undeploy Success"
    echo "---------------------------------------------------"

    echo "==================================================="
    echo "Delete the $application APIProxy"

    deleteProxy=`curl -k -s -X DELETE -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis/$application" 2>/dev/null`
    echo $deleteProxy

    echo "==================================================="
}
delete
content=`curl -k -siI -X GET "$mgmt_host/v1/o/$mgmt_org/apis/$application" -H 'Content-type:application/xml' -u $credentials`
httpStatus=$(echo "${content}" | grep '^HTTP/1' | awk {'print $2'} |tail -1)
echo $httpStatus
if [[ httpStatus -eq 404 ]]
    then
    echo --------------------------------------------------------
    echo $application deleted successfully
    echo --------------------------------------------------------
    exit 0
else
    echo --------------------------------------------------------
    echo $application NOT deleted successfully
    echo --------------------------------------------------------
    exit 1
fi
exit
