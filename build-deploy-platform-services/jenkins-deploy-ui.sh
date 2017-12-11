#Generate build file from jazz-ui
npm update
ls .
cd jazz-ui
ls .
rm -rf node_modules
npm install
ng set --global warnings.versionMismatch=false
ng build --prod --aot=false
ls .
cd ..


service=jazz-web
echo $scm_branch

if [ $scm_branch == master ]
then
	current_branch=prod
    echo $current_branch
else
	current_branch=dev
fi

#env variables
bucket_name=`grep -i "jazz_bucket_web" /tmp/jenkins-conf.properties | cut -d '=' -f2`
env_prefix=`grep -i "env_name_prefix" /tmp/jenkins-conf.properties | cut -d '=' -f2`
buildid=`grep -i "BUILD_ID" /tmp/jenkins-conf.properties | cut -d '=' -f2`
PROD_S3BUCKET=`grep -i "WEBSITE_PROD_S3BUCKET" /tmp/jenkins-conf.properties | cut -d '=' -f2`
#fetching 1st CLOUDFRONT_ORIGIN_ID from the list
CLOUDFRONT_ORIGIN_ID=`grep -i "CLOUDFRONT_ORIGIN_ID" /tmp/jenkins-conf.properties | head -1 | cut -d '=' -f2`

#copy generated build file to s3 bucket
aws s3 ls $bucket_name
aws s3 cp jazz-ui/dist s3://$bucket_name --recursive --include "*"
aws s3 ls $bucket_name

#capture cloudfront distribution for jazz-web
distid=`aws  cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?Id=='$env_prefix-$current_branch-static-website-origin-$service']].{j: Id, k: DomainName}"`
temp=`echo $distid | sed -e 's/^.*"j"[ ]*:[ ]*"//' -e 's/".*//'`
cfid=${temp##*|}
echo $cfid

#if CF is available do cache invalidation else create CF for jazz-web
if [ $cfid != [] ];
then
	echo "CF available"
	callerReference=$service+"_"+$buildid
	echo $cfid
	config={\"Paths\":{\"Quantity\":1,\"Items\":[\"/*\"]},\"CallerReference\":\"$callerReference\"}
	invalidateStatus=`aws cloudfront create-invalidation --distribution-id $cfid --invalidation-batch $config --output json`

	echo $invalidateStatus
else
	echo "CF not available"
    ls .
    cd website-distribution-pack
	ls .
	cat distribution_config_with_tags.json

	sed -i -- "s/{service_name}/$service/g" distribution_config_with_tags.json
	sed -i -- "s/{env}/${current_branch}/g" distribution_config_with_tags.json
	sed -i -- "s/{conf_s3bucketname}/$PROD_S3BUCKET/g" distribution_config_with_tags.json
	sed -i -- "s/{conf_stack_prefix}/$env_prefix/g" distribution_config_with_tags.json
	sed -i -- "s:{conf_origin_id}:$CLOUDFRONT_ORIGIN_ID:g" distribution_config_with_tags.json
	sed -i -- 's/{owner}/suprita/g' distribution_config_with_tags.json
	sed -i -- 's/{domain_name}/jazz/g' distribution_config_with_tags.json
	#creating CF
    creation=`aws cloudfront create-distribution-with-tags --distribution-config-with-tags --output json file://distribution_config_with_tags.json`
    echo $creation
    #fetching CF dist_id 
    distid=`aws  cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?Id=='$env_prefix-$current_branch-static-website-origin-$service']].{j: Id, k: DomainName}"`
	temp=`echo $distid | sed -e 's/^.*"j"[ ]*:[ ]*"//' -e 's/".*//'`
	cfid=${temp##*|}
	echo $cfid
fi
