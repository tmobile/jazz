#!/bin/bash
set +v
set -e

autopath=`pwd`
basepathdir="${autopath%/*}"
#setlocal enableextensions EnableDelayedExpansion
export "proxyName="
export "targetsName="

proxyName=$1
version=$2
#AWS Lambda Function Name
functionName=$3
#apiversion is the concatenation of version + Jenkins buildnumber
apiversion=$4
#Developer or Team's email address
teamEmail=$5


Build(){
    echo "Stamping the Jenkins build number to:" $proxyName'Proxy.xml'
    cd $basepathdir/$proxyName/$version
    export "newValue=Jenkins:$apiversion-$teamEmail"
    sed "/Description/s/>[^<]*</>$newValue</" $proxyName'Proxy.xml' > tempbuildnumber.xml
    rm $proxyName'Proxy.xml'
    mv tempbuildnumber.xml $proxyName'Proxy.xml'
    cd $autopath
    echo "Build number stamped:" $newValue
    sleep 5
    
    echo "start - delete temp folder"
    if [[ -d $autopath/temp ]]; then
        echo "deleted temp folder"
        rm -rf $autopath/temp
    fi
    
    sleep 2
    cd $autopath
    echo "Bundling Proxy:" $proxyName 
    mvn -e install -f prepareProxyPom.xml -DproxyName=$proxyName -DPartnerName=$partnerName -Dversion=$version
    
    export count=0
    
    cd $basepathdir/$proxyName/$version
    export targetserver=($(grep -oP '(?<=TargetEndpoint>)[^<]+' $proxyName'Proxy.xml'))
    
    for i in ${!targetserver[*]}
    do
        #echo "$i" "${targetserver[$i]}"
        echo "${targetserver[$i]}"
        count=$((count + 1))
        cd $autopath
        mvn -e install -f prepareTargetPom.xml -DtargetService=${targetserver[$i]} -Dversion=$version
    done

    mvn -e install -f resolveDependency.xml -DproxyName=$proxyName 

    cd $basepathdir/Deployable/apiproxy/policies
    sed "/Header/s/>[^<]*</>$functionName</" cf_AWSLambdaFunctionName.xml > tempFunctionName.xml
    rm cf_AWSLambdaFunctionName.xml
    mv tempFunctionName.xml cf_AWSLambdaFunctionName.xml

    cd $basepathdir/Deployable
    zip -r -m -q $proxyName-$apiversion.zip apiproxy
    echo $proxyName-$apiversion bundled in Deployable folder
    exit
}

Usage(){
    echo "============================================================================"
    echo "Please check the parameters passed, seems like some param(s) are missing --"
    echo "============================================================================"
    echo "Below is the usage and the params are required by the script"
    echo "                                           "
    echo "./bundle.sh proxyName version functionName apiversion teamEmail"
    echo "==============================================================="
    exit 1
}

if [[ $proxyName == "" ]]
    then
    echo "**************************************************"
    echo "proxyName, version & functionName param not passed"
    echo "**************************************************"
    Usage
elif [[ $version == "" ]]
    then
    echo "***************************************"
    echo "version & functionName params not passed"
    echo "***************************************"
    Usage
elif [[ $functionName == "" ]]
    then
    echo "*****************************"
    echo "functionName param not passed"
    echo "*****************************"
    Usage
else
    Build
fi


