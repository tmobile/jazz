/**
Fetch metrics per service using CloudWatch APIs
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const aws = require("aws-sdk"); //Import the secret-handler module.
const async = require("async");
const request = require('request');
const utils = require("./components/utils.js")(); //Import the utils module.

module.exports.handler = (event, context, cb) => {

    var errorHandler = errorHandlerModule();
    var config = configObj(event);
    var cloudwatch = new aws.CloudWatch({ apiVersion: '2010-08-01' });
    if (!event && !event.body) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Invalid Input Error")));
    }

    try {
        /*
        * event input format :
        *   {
        *        "domain": "pacman",
        *        "service": "get-monitoring-data",
        *        "environment": "prod",
        *        "end_time": "2017-06-27T06:56:00.000Z",
        *        "start_time": "2017-06-27T05:55:00.000Z",
        *        "interval":"300",
        *        "statistics":"average"
        *    }
        */

        //Iteration & validation for parameters in array - "service","domain","environment","end_time","start_time","interval","statistics"
        var undefined_fields;
        undefined_fields = utils.validateGeneralFields(event.body)
        var assetsArray = [];
        if(undefined_fields.isError){
            logger.error("Missing required input: " + undefined_fields.message);
            return cb(JSON.stringify(errorHandler.throwInputValidationError("Missing required input: " + undefined_fields.message)));
        }
        else{
            // Validate values of input fields - "service","domain","environment","end_time","start_time","interval","statistics"
            var inputErrField = utils.validateMetricsInput(event.body);
            if(inputErrField.isError){
                logger.error("Unsupported asset " + inputErrField.message);
                return cb(JSON.stringify(errorHandler.throwInputValidationError("Unsupported asset " + inputErrField.message )));
            }
            else{
                // fetch data from assets
                var asset_api_payload = {
                    "service" : event.body.service,
                    "domain": event.body.domain,
                    "environment" : event.body.environment
                };
                var asset_api_options = {
                    url: config.SERVICE_API_URL + config.ASSETS_URL,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    method: "POST",
                    rejectUnauthorized: false,
                    requestCert: true,
                    async : true,
                    json: true,
                    body: asset_api_payload,
                };

                logger.info("asset_api_options :- " + JSON.stringify(asset_api_options));

                
                request(asset_api_options, function (error, response, body) {
                    // response data from assets
                    if(error){
                        // Error in fetching data from assets api
                        logger.error("Error in fetching data from assets api" + JSON.stringify(error));
                        return cb(JSON.stringify(errorHandler.throwInternalServerError("Error in fetching cloudwatch metrics" )));
                    }
                    else{
                        // Response from assets api
                        var apiAssetsArray = body.data;
                        if(apiAssetsArray && apiAssetsArray.length > 0){
                            var userStatistics = event.body.statistics.toLowerCase();

                            // Massaging data from assets api , to get required list of assets which contains type, asset_name and statistics.
                            assetsArray = utils.getAssetsObj(apiAssetsArray,userStatistics);

                            if(assetsArray.length > 0){
                                //Iteration & validation for parameters in asset array - "type","asset_name","statistics"
                                var newAssetArray = [];
                                var invalidTypeCount = 0;
                                assetsArray.forEach(function(assetItem){

                                    if(assetItem.isError){
                                        logger.error(assetItem.isError);
                                        invalidTypeCount++;
                                        if( invalidTypeCount === assetsArray.length ){
                                            return cb(JSON.stringify(errorHandler.throwInputValidationError("Unsupported metric type")));
                                        }
                                    }
                                    else{
                                        // Forming object with parameters required by cloudwatch getMetricStatistics api.
                                        var commonParam = {

                                            Namespace: assetItem.type,
                                            MetricName : "",
                                            Period: event.body.interval,
                                            EndTime: event.body.end_time,
                                            StartTime: event.body.start_time,
                                            Dimensions: [{
                                                Name: '',
                                                Value: assetItem.asset_name
                                            }, ],
                                            Statistics: [
                                                assetItem.statistics,
                                            ],
                                            Unit : ""
                                        };

                                        var actualParam = [];
                                        var paramMetrics = [];
                                        var missingAssetNameFields;
                                        var intervalPeriod = '';

                                        var assetNameObj = assetItem.asset_name;
                                            
                                        var getAssetNameDetails = utils.getNameSpaceAndMetriDimensons(assetItem.type);

                                        commonParam.Namespace = getAssetNameDetails.awsNameSpace;

                                        if(!getAssetNameDetails.isError){
                                            paramMetrics = getAssetNameDetails.paramMetrics;
                                        }
                                        else{
                                            logger.error("Unsupported metric type. ");
                                            return cb(JSON.stringify(errorHandler.throwInputValidationError("Unsupported metric type. " )));
                                        }

                                        // Forming the Dimension array from assetNameObj 
                                        paramMetrics.forEach(function(arrayItem) {
                                            var clonedObj = {};
                                            for(var key in commonParam){
                                                clonedObj[key] = commonParam[key];
                                            }
                                            clonedObj.MetricName = arrayItem.MetricName;
                                            clonedObj.Unit = arrayItem.Unit;
                                            var dimensionsArray = arrayItem.Dimensions;
                                            clonedObj.Dimensions = [];
                                            var minCount = 0;
                                            dimensionsArray.forEach(function(dimensionArr,i){
                                                var obj = {};
                                                if(assetNameObj[dimensionArr] !== undefined && assetNameObj[dimensionArr] !== null && assetNameObj[dimensionArr] !== ''){
                                                    obj = {"Name": dimensionArr, "Value": assetNameObj[dimensionArr]};
                                                    if(obj.Name === "StorageType"){
                                                       if(clonedObj.MetricName === "BucketSizeBytes"){
                                                            obj.Value = "StandardStorage";
                                                       }
                                                       else if(clonedObj.MetricName === "NumberOfObjects"){
                                                            obj.Value = "AllStorageTypes";
                                                       } 
                                                    }
                                                    
                                                    clonedObj.Dimensions.push(obj);
                                                    minCount++;
                                                }

                                            });
                                            if(minCount === 0){
                                                logger.error("Invalid asset_name inputs.");
                                                return cb(JSON.stringify(errorHandler.throwInputValidationError("Invalid asset_name inputs." )));
                                            }
                                            actualParam.push(clonedObj);
                                        });
                                        // Creation of Metric array input for a particular asset
                                        newAssetArray.push({"actualParam":actualParam,"userParam":assetItem});
                                    }
                                    
                                });

                                var count = 0;
                                // Iterating Asset array which has metrics for assets like Lambda or Gateway or S3 etc for 1 service
                                async.map(newAssetArray, function(assetParam, assetCallback) {

                                    // Iterating metric parameter array to fetch diiferent metrics like Throttles, Invocation etc for 1 service for 1 asset (eg lambda)
                                    async.map(assetParam.actualParam, function(param, callback) {
                                        try {
                                            if(param.Namespace === "AWS/CloudFront"){
                                                cloudwatch = new aws.CloudWatch({ apiVersion: '2010-08-01', region: 'us-east-1' });
                                            }

                                            cloudwatch.getMetricStatistics(param, function(err, data) {
                                                if (err) {
                                                    logger.error("error while getting metics from cloudwatch. " + JSON.stringify(err));
                                                    if(err.code === "InvalidParameterCombination"){
                                                        callback({
                                                            "result": "inputError",
                                                            "message": err.message});
                                                    }
                                                    else{
                                                        callback({
                                                            "result": "serverError",
                                                            "message": "Unknown internal error occurred"});
                                                    }
                                                    
                                                }
                                                else {

                                                    callback(null, data);
                                                }

                                            });

                                        } catch (e) {
                                            callback({
                                                "result": "serverError",
                                                "message": "Internal Server Error"});
                                        }
                                    }, function(err, results) {
                                        if(err){
                                            logger.error("error", err);
                                            assetCallback(err);

                                        }
                                        else{
                                            var assetObj = utils.assetData(results, assetParam.userParam);
                                            count++;
                                            assetCallback(null, assetObj);
                                        }
                                    });

                                }, function(assetErr, assetResults) {
                                  
                                    if(assetErr){
                                        logger.error("asset error", assetErr);
                                        if(assetErr.result == "serverError"){
                                            logger.error('Error occured. ' + assetErr.message);
                                            return cb(JSON.stringify(errorHandler.throwInternalServerError(assetErr.message)));
                                        }
                                        else if(assetErr.result == "inputError"){
                                            logger.error('Error occured. ' + assetErr.message);
                                            return cb(JSON.stringify(errorHandler.throwInputValidationError(assetErr.message)));
                                        }

                                        else if(assetErr.result == "notFoundError"){
                                            logger.error('Error occured. ' + assetErr.message);
                                            return cb(JSON.stringify(errorHandler.throwNotFoundError(assetErr.message)));
                                        }
                                        else{
                                            logger.error('unexpected error occured. ' + JSON.stringify(assetErr, null, 2));
                                            return cb(JSON.stringify(errorHandler.throwInternalServerError('Unexpected error occured')));
                                        }
                                    }
                                    else{
                                        logger.info("asset results"+ JSON.stringify(assetResults));
                                        var finalObj = utils.massageData(assetResults, event);
                                        return cb(null, responseObj(finalObj, event.body));
                                    }
                                });
                            }
                            else{
                                // unsupported asset type 
                                logger.error("Metric not found for requested asset ");
                                return cb(JSON.stringify(errorHandler.throwInputValidationError("Metric not found for requested asset ")));
                            }

                        }// end of if
                        else{
                            // assets for this service, domain, env not found
                            logger.error("Assets not found for this service, domain, environment. ", JSON.stringify(asset_api_options) );
                            var finalObj = utils.massageData([], event);
                            return cb(null, responseObj(finalObj, event.body));
                        }
                    }

                });// end of request
            }// end of else

        }

        
    } catch (e) {
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Error in fetching cloudwatch metrics")));
    }

};
