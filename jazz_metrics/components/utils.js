/**
    massage functions for output data
    @module: utils.js
    @description: Defines functions like format the output as per metrics catalog.
    @author: Rashmi Chachan
    @version: 1.0
**/
const parser = require('aws-arn-parser');
const metricConfig = require("./metrics.json");


var massageData = function(assetResults, event) {

    var output_obj = {};
    output_obj = {
        "domain": event.body.domain,
        "service": event.body.service,
        "environment": event.body.environment,
        "end_time": event.body.end_time,
        "start_time": event.body.start_time,
        "interval": event.body.interval,
        "statistics": event.body.statistics,
        "assets": assetResults
    }

    return output_obj;
};

var assetData = function(results, assetItem) {
    var asset_obj = {};
   
    asset_obj = {
        "type": assetItem.type,
        "asset_name": assetItem.asset_name,
        "statistics": assetItem.statistics,
        "metrics": []
    };

    var metricsArr = [];

    results.forEach(function(key) {
        var metricsObj = {
            "metric_name": key.Label,
            "datapoints": key.Datapoints
        }
        metricsArr.push(metricsObj);
    });
    asset_obj.metrics = metricsArr;
    return asset_obj;
};

var validateMetricsInput = function(data){
    var inputErrField = '';
    var output_obj = {"isError":false,"message":""};
    data.statistics = data.statistics.toLowerCase();

    if(data.interval % 60 !== 0){
        inputErrField = inputErrField + 'interval' + ',';
    }

    var patternUTC = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(.[0-9]{0,3})?Z?$/;
    
    if(!(patternUTC.test(data.end_time))){
        inputErrField = inputErrField + 'end_time' + ',';
    }
    
    if(!(patternUTC.test(data.start_time))){
        inputErrField = inputErrField + 'start_time' + ',';
    }

    if( data.start_time > data.end_time ){
        inputErrField = inputErrField + 'start_time' + ',' + 'end_time' + ' (start_time should be less than end_time)' + ','; 
    }

    if(!(data.statistics === "sum" || data.statistics === "average" || data.statistics === "maximum"  || data.statistics === "minimum" || data.statistics === "samplecount")){
        inputErrField = inputErrField + 'statistics' + ',';
    }

    if(inputErrField.length > 0){
        inputErrField = inputErrField.substring(0, inputErrField.length-1); // removing last comma
        output_obj["isError"] = true;
        output_obj["message"] = inputErrField;
    }

    return output_obj;
};
var validateGeneralFields = function(input){
        var required_fields = ["service","domain","environment","end_time","start_time","interval","statistics"];
        var output_obj = validateRequiredFields(input,required_fields);
        return output_obj;
};

var validateAssetFields =function(input){
        var asset_required_fields = ["type","asset_name","statistics"];
        var output_obj = validateRequiredFields(input,asset_required_fields);
        return output_obj;
};

var validateRequiredFields = function(input,required_fields){
        var output_obj = {"isError":false,"message":""};
        var undefined_fields = '';
        required_fields.forEach(function(req_field) {
            
            var value = input[req_field];
            
            if( value === undefined || value === null || value === ''){
                undefined_fields = undefined_fields + req_field + ',';
            }
        });
        if(undefined_fields.length > 0){
            undefined_fields = undefined_fields.substring(0, undefined_fields.length-1); // removing last comma            
            output_obj["isError"] = true;
            output_obj["message"] = undefined_fields;
        }
        return output_obj;
}

var getNameSpaceAndMetriDimensons = function(nameSpaceFrmAsset){
    var missingAssetNameFields;
    var output_obj = {};
    output_obj["isError"] = false;
    var paramMetrics = [];
    var nameSpace = nameSpaceFrmAsset.toLowerCase();
    
    var namespacesList = metricConfig.namespaces;

    var supportedNamespace = namespacesList[nameSpace];

    paramMetrics = supportedNamespace["metrics"];

    var awsAddedNameSpace = nameSpace.indexOf('aws/') === -1 ? 'aws/' + nameSpace : nameSpace;
    awsAddedNameSpace = awsAddedNameSpace.replace(/ /g, "");
    var awsNameSpace;

    switch (awsAddedNameSpace) {
        case 'aws/apigateway':
            awsNameSpace = 'AWS/ApiGateway';
            break;
        case 'aws/lambda':
            awsNameSpace = 'AWS/Lambda';
            break;
        case 'aws/cloudfront':
            awsNameSpace = 'AWS/CloudFront';
            break;
        case 'aws/s3':
            awsNameSpace = 'AWS/S3';
            break;
        default: 
            output_obj["isError"] = true;
            output_obj["awsNameSpace"] = "Invalid";
    }
    output_obj["paramMetrics"] = paramMetrics;
    output_obj["awsNameSpace"] = awsNameSpace;
    return output_obj;
};

var extractValueFromString = function(string, keyword){

    var value = "";
    var startIndex = string.indexOf(keyword +":") + (keyword +":").length;
    var extractedString = string.substring(startIndex, string.length);
    var extractedSplitString = extractedString.split(":");
    var value = extractedSplitString[0];
    return value;
};

var getApiName = function(string){

    var value;

    switch(string){
        case "6zfek2hkof":
          value = "dev-cloud-api";
          break;
        case "c64paxwj6f":
          value = "stg-cloud-api";
          break;
        case "dww0le4qre":
          value = "rest";
          break;
        default:
            value = "*"

    }
    return value;

};

var getAssetsObj = function(assetsArray,userStatistics){

    var newAssetArr  = [];
    var namespaces = metricConfig.namespaces;

    assetsArray.forEach(function(asset) {

        var arnString = asset.provider_id;
        var arnParsedObj = parser(arnString);
        var assetEnvironment = asset.environment;


        
        var assetType = asset.type; 
        // var assetType = getAssetType(asset.provider_id);

        var metricNamespace = namespaces[assetType];
        if(metricNamespace){
            var dimensions = metricNamespace.dimensions;
        

            var dimensionObj = {};
            dimensions.forEach(function(dimensionName) {
                dimensionObj[dimensionName] = "";
            });
            // dimensionObj - contains dimension names and values got by parsing provider_id.

            // Making value of statistics as title case.
            if(userStatistics === "samplecount"){
                userStatistics = "SampleCount";
            }
            else{
                userStatistics = (userStatistics).replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            }

            var newAssetObj = {"type": assetType, "asset_name": dimensionObj, "statistics":userStatistics};

            switch(assetType){
                case "lambda": // eg:- "arn:aws:lambda:us-west-2:302890901340:function:platform_services-dev"
                    var relativeId = arnParsedObj.relativeId;
                    if( relativeId === 'function' ){
                        var funcValue = extractValueFromString(arnString,relativeId);
                        newAssetObj.asset_name.FunctionName = funcValue;
                    }
                    break;
                case "apigateway": // "arn:aws:execute-api:us-west-2:302890901340:6zfek2hkof/*/GET/platform/assets";
                    var relativeId = arnParsedObj.relativeId; // 6zfek2hkof/*/GET/platform/assets
                    var parts = relativeId.split("/");

                    var apiId = parts[0];
                    newAssetObj.asset_name.ApiName = getApiName(apiId);

                    var stgValue = parts[1] === '*' ? assetEnvironment : parts[1];
                    newAssetObj.asset_name.Stage = stgValue || "*";

                    var methodValue =  parts[2];
                    newAssetObj.asset_name.Method = methodValue;

                    var resourceValue = "/" + parts[3];
                    if(parts[4]){
                        resourceValue += "/" + parts[4];
                    }
                    newAssetObj.asset_name.Resource = resourceValue;

                    break;
                case "s3": 
                    var relativeId = arnParsedObj.relativeId; 
                    var parts = relativeId.split("/");
                    var bucketValue = parts[0]; 
                    newAssetObj.asset_name.BucketName = bucketValue;
                    newAssetObj.asset_name.StorageType = "StandardStorage";
                    break;

                case "cloudfront": 
                    var relativeId = arnParsedObj.relativeId; 
                    var parts = relativeId.split("/");
                    var distIdVal = parts[1]; 
                    newAssetObj.asset_name.DistributionId = distIdVal;
                    newAssetObj.asset_name.Region = "Global";
                    break;

                default:
                   newAssetObj = {"isError": "Metric not supported for asset type " + assetType }
            }
            newAssetArr.push(newAssetObj);
        }
        else if(assetType){
            // type not supported
            newAssetArr.push({"isError": "Metric not supported for asset type " + assetType });
        }
        else{
            // type not found
            newAssetArr.push({"isError": "Asset type not found "});
        }
        
    });
    return newAssetArr;

};
module.exports = () => {
    return {
        massageData: massageData,
        assetData: assetData,
        validateMetricsInput: validateMetricsInput,
        validateGeneralFields: validateGeneralFields,
        validateAssetFields: validateAssetFields,
        validateRequiredFields: validateRequiredFields,
        getNameSpaceAndMetriDimensons: getNameSpaceAndMetriDimensons,
        getAssetsObj: getAssetsObj
    };
};
