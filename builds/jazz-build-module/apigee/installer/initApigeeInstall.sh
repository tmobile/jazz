#!/bin/bash
set +v
set -e

# %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
# Following *nix utilities are required before executing this script
#     * jo - sudo apt-get install jo
#     * xpath - Install via perl's module XML::XPath, xpath1
#     * curl - sudo apt-get install curl
#     * sed - sudo apt-get install sed
# %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

autopath=`pwd`
basepathdir="${autopath%/*}"

build="Jazz-1.0.b-${BUILD_NUMBER}"
# Apigee Mgmt API Endpoint
mgmt_host=$1
# Apigee Organization
mgmt_org=$2
# Apigee Environment
mgmt_env=$3
# Apigee Org Admin Username
username=$4
# Apigee Org Admin Password
password=$5
credentials=$username:$password

# Common Lambda Access Key
accessKeyValue=$6
# Common Lambda Access Secret
secretKeyValue=$7
# Common Lambda AWS Region
regValue=$8
# Common Lambda AWS ARN
lambdaARNValue=$9

function createKVM() {
        echo "**************************************************"
        echo "Creating the KVM for Common-Jazz API Proxy ......."
        echo "**************************************************"
        kvmpayload=`jo -p encrypted=true entry=$(jo -a $(jo name=accessKey value=$accessKeyValue) $(jo name=secretKey value=$secretKeyValue) $(jo name=reg value=$regValue) $(jo name=lambdaARN value=$lambdaARNValue)) name=jzencryptedLambdaMaps`;
        kvmCall=`curl -k -si -X POST -u $credentials "$mgmt_host/v1/o/$mgmt_org/e/$mgmt_env/keyvaluemaps" -d "${kvmpayload}" -H 'Content-Type: application/json' 2>/dev/null`
        httpStatus=$(echo "${kvmCall}" | grep '^HTTP/1' | awk {'print $2'} |tail -1)
        if [[ httpStatus -eq 201 ]]
        then
        echo "==================================================="
        echo httpStatus = $httpStatus
        echo "KVM created suucessfully for the Common-Jazz API Proxy"
        echo "==================================================="
        else
        echo "==================================================="
        echo httpStatus = $httpStatus
        echo "KVM creation FAILED for the Common-Jazz API Proxy"
        echo "==================================================="
        exit 1
        fi
}

function deploySharedFlows() {
        echo "**************************************"
        echo "Deploying Sharedflows now ............"
        echo "**************************************"
        for i in ${autopath}/sharedflows/* ;
		do
        if [ -d "$i" ]; then
        shdflw=$(basename "$i")
        cd ${autopath}/sharedflows/"$shdflw"/sharedflowbundle
        sed "/Description/s/>[^<]*</>$build</" "$shdflw".xml > tempbuildnumber.xml
        rm "$shdflw".xml
        mv tempbuildnumber.xml "$shdflw".xml
        echo "build number stamped:" "$build"
        cd ..
        zip -r "$shdflw"-"$build".zip sharedflowbundle/
 		    #==========================================
        echo "Getting the current deployed version"
        apis=`curl -k -X GET -H "Accept: application/xml" -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/sharedflows/$shdflw/deployments" 2>/dev/null`
        echo $apis > temp.xml
        deployedVersion=$(xidel --xpath="//Environment[@name='$mgmt_env']/Revision/@name" temp.xml 2> /dev/null)
        #deployedVersion=$(xpath temp.xml "//Environment[@name='$mgmt_env']/Revision/@name" 2> /dev/null)
       	deployedVersion=${deployedVersion//name=/}
        deployedVersion=${deployedVersion//\"/}
        deployedVersion=${deployedVersion//\ /}
       	echo "dep version="$deployedVersion
        #=============================
        imprt=`curl -k -s -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/sharedflows?action=import&name=$shdflw" -F "file=@$shdflw-$build.zip" -H "Accept: application/xml" -H "Content-Type: multipart/form-data" -X POST 2>/dev/null`
        echo $imprt > dep.xml
        revision=$(xidel --xpath="//SharedFlowBundle/@revision" dep.xml 2>/dev/null)
      	#revision=$(xpath dep.xml "//SharedFlowBundle/@revision" 2>/dev/null)
        revision=${revision/revision=/}
        revision=${revision//\"/}
        revision=${revision//\ /}
       	echo "New Revision imported= $revision"
       	#=============================
       	echo "undeploy this $deployedVersion  revision"
        undeploy=`curl -k -s -X DELETE -u $credentials "$mgmt_host/v1/o/$mgmt_org/e/$mgmt_env/sharedflows/$shdflw/revisions/$deployedVersion/deployments" 2>/dev/null`
        echo $undeploy
		    echo "Waiting for undeploying"
       	#=============================
		    echo "deploy this $revision revision"
        deploy=`curl -k -s -X POST -u $credentials "$mgmt_host/v1/o/$mgmt_org/e/$mgmt_env/sharedflows/$shdflw/revisions/$revision/deployments?override=true" 2>/dev/null`
        echo $deploy
        rm -fr dep.xml
        rm -fr temp.xml
        rm -fr $shdflw-$build.zip
        fi
        done
        echo "==================================================="
        echo "Sharedflows deployment Complete"
        echo "==================================================="
		}
function deployCommon()  {
        cd ${autopath}
        chmod 755 ${autopath}/Common-Jazz.zip
        echo "***************************************************"
        echo "Importing the Common-Jazz API Proxy ......"
        echo "***************************************************"
        #echo curl -k -s -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis?action=import&name=Common-Jazz.zip" -F "file=@Common-Jazz.zip" -H "Accept: application/xml" -H "Content-Type: multipart/form-data" -X POST
        imprt=`curl -k -s -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis?action=import&name=Common-Jazz" -F "file=@Common-Jazz.zip" -H "Accept: application/xml" -H "Content-Type: multipart/form-data" -X POST 2>/dev/null`
        echo $imprt > commondep.xml

        #revision=$(xidel --xpath="//APIProxy/@revision" commondep.xml 2>/dev/null)
        revision=$(xpath -e '//APIProxy/@revision' commondep.xml 2> /dev/null)
        revision=${revision/revision=/}
        revision=${revision//\"/}
        revision=${revision//\ /}

        echo "Common-Jazz API Proxy Imported Revision = $revision"
        echo "***************************************************"

        echo "==================================================="
	    echo "Deploying the Common-Jazz API Proxy Revision = $revision"

        deploy=`curl -k -s -X POST -u $credentials "$mgmt_host/v1/organizations/$mgmt_org/apis/Common-Jazz/revisions/$revision/deployments?action=deploy&env=$mgmt_env&override=true" 2>/dev/null`
        echo $deploy

        rm -fr commondep.xml
        #rm -fr Common-Jazz.zip
        echo "==================================================="

        content=`curl -k -siI -X GET "$mgmt_host/v1/o/$mgmt_org/e/$mgmt_env/apis/Common-Jazz/revisions/$revision/deployments" -H 'Content-type:application/xml' -u $credentials`
        httpStatus=$(echo "${content}" | grep '^HTTP/1' | awk {'print $2'} |tail -1)
        echo $httpStatus
        if [[ httpStatus -eq 200 ]]
        then
        echo "***************************************************"
        echo "Common-Jazz deployed successfully"
        echo "***************************************************"
        exit 0
        else
        echo "***************************************************"
        echo "Common-Jazz NOT deployed successfully"
        echo "***************************************************"
        exit 1
        fi
        }

#Main Invocations Start Here
createKVM
deploySharedFlows
deployCommon
