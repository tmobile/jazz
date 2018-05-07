// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

/**
  Nodejs Template Project
  @author: 
  @version: 1.0
**/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const utils = require("./components/utils.js")(); //Import the utils module.
const validateUtils = require("./components/validation")();//Import validation module
const crud = require("./components/crud")(); //Import the crud module.
const async = require('async');
const request = require('request');
const util = require('util');

module.exports.handler = (event, context, cb) => {

	//Initializations
	var errorHandler = errorHandlerModule(),
		config = configObj(event);
		global.config = config;
	logger.init(event, context);

	//validate inputs
	if(!event || !event.method) {
		return cb(JSON.stringify(errorHandler.throwInternalServerError("Service inputs not defined!")));
	}
	logger.info(event);
	var deploymentTableName = config.DEPLOYMENT_TABLE,
		queryParams = null,
		deploymentId = null,
		method = event.method,
		query = event.query,
		path = event.path,
		body = event.body;
	logger.info("Path from event:"+ Object.keys(event.query).length);
	logger.info("Path variable:"+JSON.stringify(query));

	if (method === "POST" && !Object.keys(event.path).length) {
		var deployment_details = body;
		logger.info("creating new deployment details");
		validateDeploymentDetails(config, deployment_details)
		.then(() => addNewDeploymentDetails(deployment_details, deploymentTableName))
		.then((res) => {
			logger.info("Create deployment result:"+JSON.stringify(res));
			return cb(null, responseObj(res, deployment_details));
		})
		.catch((error) => {
			logger.error("Error while creating new deployment:"+JSON.stringify(error));
			if(error.result == "inputError"){
				return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
			} else{
				return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred")));
			}
		});
	}

	if (method === "POST" && Object.keys(event.path).length) {

		deploymentId = path.id;
		logger.info("GET Deployment details using deployment Id :" + deploymentId);
		if(!deploymentId){
			return cb(JSON.stringify(errorHandler.throwInternalServerError("Missing input parameter deployment id")));
		}

		// write reuest to get authtoken using login api and config provided user details and provide "baseAuthToken" value to rebuild request
		var base_auth_token = "Basic " + new Buffer(util.format("%s:%s", config.SVC_USER, config.SVC_PASWD)).toString("base64");

		async.auto({
			// Get deployment details by id
			getDeploymentDetailsById: function(onComplete) {
				logger.info("getDeploymentDetailsById crud.get")
				crud.get(deploymentTableName, deploymentId, onComplete);
			},
			retryDeployment : ['getDeploymentDetailsById', function (result, onComplete){
				logger.info("Inside retryDeployment")
				if(!utils.isEmpty(result.getDeploymentDetailsById)){
					var deployment_data = result.getDeploymentDetailsById,
						build_url = deployment_data.provider_build_url,
						service_name = deployment_data.domain_name + '_' + deployment_data.service_name;
					logger.info("deployment_data: "+ JSON.stringify(deployment_data));
					logger.info("build_url: "+ build_url);
					if(build_url){
						var url_tokens = build_url.split('/');
						// trim the build number at the end of the url: /job/branch/1 -> /job/branch
						while (url_tokens.pop()===""){}
						var rebuild_url = url_tokens.join('/') + '/build?delay=0sec';
						logger.info("rebuild_url: "+ rebuild_url);
						var options = {
							url: rebuild_url,
							method: 'POST',
							rejectUnauthorized: false,
							headers: {
								'Accept': 'application/json',
								'Authorization' : base_auth_token
							}
						};
						request(options, function(error, res, body) {
							logger.info("rebuild error:"+JSON.stringify(error));
							logger.info("rebuild res:"+JSON.stringify(res));
							if (error) {
								logger.error("Unable to rebuild deployment :" + error);
								onComplete({ result: "Internal Error", message: JSON.stringify(error)});
							} else {
								// Success response
								if(res.statusCode == 200 || res.statusCode == 201 ){
									logger.info("successfully deployment started.");
									onComplete(null, {result : 'success', message: "deployment started."});
								} else if(res.statusCode == 404 ){
									logger.info("Service not available.");
									var msg = 'Unable to re-build '+ service_name + ' because requested service is unavailable.';
									onComplete({ result: "error", message: msg});
								} else {
									//validating response errors
									var error_message = 'Unknown error occurred';
									var bodyToJSON = JSON.stringify(res.body);
									if(typeof bodyToJSON.errors !== 'undefined'){
										error_message = bodyToJSON.errors[0].message;
									}
									onComplete({ result: "error", message: error_message });
								}
							}
						});
					} else {
						onComplete({ result: "Internal Error", message: "unable to find deployment details"});
					}
				} else {
					onComplete({ result: "deployment_not_found", message: "unable to find deployment details"});
				}
			}]
		},
		function(error, data) {
			if (error) {
				if((error.result === "deployment_not_found") || (error.result === "deployment_already_deleted_error")){
					logger.error("Error occurred. " + JSON.stringify(error, null, 2));
					return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
				}else{
					logger.error("Error occurred. " + JSON.stringify(error, null, 2));
					return cb(JSON.stringify(errorHandler.throwInternalServerError(error.message)));
				}
			}
			logger.info("Result: " + JSON.stringify(data));
			var deployment_obj = data.retryDeployment;
			logger.verbose("Get Success. " + JSON.stringify(deployment_obj, null, 2));
			return cb(null, responseObj(deployment_obj, path));
		});
	}

	if( method === 'GET' && query !== undefined && utils.isEmpty(path)){
		queryParams = {
			'service' : query.service,
			'domain' : query.domain,
			'environment' : query.environment,
			'status' : query.status,
			'offset' : query.offset,
			'limit' : query.limit
		};


		logger.info("GET Deployment details using query params :" + JSON.stringify(queryParams));
		validateQueryParams(config, queryParams)
		.then(() => getDeploymentDetailsByQueryParam(deploymentTableName, queryParams))
		.then((res) => {
			logger.info("Get list of deployments:"+JSON.stringify(res));
			return cb(null, responseObj(res, query));
		})
		.catch((error) => {
			logger.error("Error while fetching deployments:"+JSON.stringify(error));
			if (error.result === "inputError") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));

			} else{
				return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred")));
			}
		});
	}

	if( method === 'GET' && path !== undefined && utils.isEmpty(query)){
		deploymentId = path.id;
		if(!deploymentId){
			return cb(JSON.stringify(errorHandler.throwInternalServerError("Missing input parameter deployment id")));
		}
		logger.info("GET Deployment details using deployment Id :" + deploymentId);
		getDeploymentDetailsById(deploymentTableName, deploymentId)
		.then((res) => {
			logger.info("Get Success. " + JSON.stringify(res));
			return cb(null, responseObj(res, path));
		})
		.catch((error) => {
			if((error.result === "notFound") || (error.result === "deployment_already_deleted_error")){
				logger.error("Error occurred. " + JSON.stringify(error, null, 2));
				return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
			}else{
				logger.error("Error occurred. " + JSON.stringify(error, null, 2));
				return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred")));
			}
		});
	}

	if( method === "PUT" && path !== undefined ){
		var update_deployment_data = {},
			unchangeable_fields = config.REQUIRED_PARAMS, // list of fields that cannot be updated
			invalid_environment_fields = [];
		deploymentId = path.id;

		if(!deploymentId){
			return cb(JSON.stringify(errorHandler.throwInternalServerError("Missing input parameter deployment id")));
		}

		validateUpdateInput(config, body, deploymentTableName, deploymentId)
		.then((data) => updateDeploymentDetails(deploymentTableName, data, deploymentId))
		.then((res) => {
			logger.info("Updated data:"+ JSON.stringify(res));
			return cb(null, responseObj({ message: "Successfully Updated deployment details with id: " + deploymentId }, body));
		})
		.catch((error) => {
			if (error.result === "inputError") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
			} else if(error.result === "notFound"){
				return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
			}else {
				return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred")));
			}			
		});
	}

	if (method === "DELETE" && path !== undefined ){
		deploymentId = path.id;
		if(!deploymentId){
			return cb(JSON.stringify(errorHandler.throwInternalServerError("Missing input parameter deployment id")));
		}
		logger.info("Deleting deployment details for id : "+ deploymentId);
		getDeploymentDetailsById(deploymentTableName, deploymentId)
		.then((res) => deleteServiceByID(res, deploymentTableName, deploymentId))
		.then((res) => {
			logger.info("DeleteItem succeeded");
			var msg = "Successfully Deleted deployment details of id :"+ deploymentId;
			return cb(null, responseObj({ message: msg }, path));
		})
		.catch((error) => {
			logger.error("Error in DeleteItem: " + JSON.stringify(error));
			if(error.result === "deployment_already_deleted_error" || error.result === "notFound"){
				return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
			} else{
				return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred ")));
			}
		});
	}

};

function validateDeploymentDetails(config, deployment_details) {
	logger.info("validateDeploymentDetails for creating new deployment");
	return new Promise((resolve, reject) => {
		validateUtils.validateCreatePayload(config, deployment_details, (error, data) => {
			if(error){
				logger.error("validateDeploymentDetails error:"+JSON.stringify(error));
				reject(error);
			} else {
				logger.info("validateDeploymentDetails data:"+JSON.stringify(data));
				resolve(data);
			}
		});
	});
}

function addNewDeploymentDetails(deployment_details, deploymentTableName) {
	logger.info("addNewDeploymentDetails");
	return new Promise((resolve, reject) => {
		crud.create(deployment_details, deploymentTableName, (error, data) => {
			if(error){
				logger.error("addNewDeploymentDetails error:"+JSON.stringify(error));
				reject(error);
			} else {
				logger.info("addNewDeploymentDetails data:"+JSON.stringify(data));
				resolve(data);
			}
		});
	});
}

function validateQueryParams(config, params) {
	logger.info("validateQueryParams for deployments");
	return new Promise((resolve, reject) => {
		validateUtils.validateDeployment(config, params, (error, data) => {
			if(error){
				logger.error("validateQueryParams error:"+JSON.stringify(error));
				reject(error);
			} else {
				logger.info("validateQueryParams data:"+JSON.stringify(data));
				resolve(data);
			}
		});
	});
}

function getDeploymentDetailsByQueryParam(deploymentTableName, queryParams) {
	logger.info("getDeploymentDetailsByQueryParam" + JSON.stringify(queryParams));
	return new Promise((resolve, reject) => {
		crud.getList(deploymentTableName, queryParams, (error, data) => {
			if(error){
				logger.error("getDeploymentDetailsByQueryParam error:"+JSON.stringify(error));
				reject(error);
			} else {
				logger.info("getDeploymentDetailsByQueryParam data:"+JSON.stringify(data));
				resolve(data);
			}
		});
	});
}

function getDeploymentDetailsById(deploymentTableName, deploymentId) {
	logger.info("getDeploymentDetailsById" + JSON.stringify(deploymentId));
	return new Promise((resolve, reject) => {
		crud.get(deploymentTableName, deploymentId, (error, data) => {
			if(error){
				logger.error("getDeploymentDetailsById error:"+JSON.stringify(error));
				reject(error);
			} else {
				if (data.length === 0 || (Object.keys(data).length === 0 && data.constructor === Object)) {
					logger.error('Cannot find deployment details with id : ' + deploymentId);
					reject({result:"notFound",message:'Cannot find deployment details with id :' + deploymentId});
				} else{
					logger.info("getDeploymentDetailsById data:"+JSON.stringify(data));
					resolve(data);
				}
			}
		});
	});
}

function validateUpdateInput(config, update_data, deploymentTableName, deploymentId) {
	logger.info("validateUpdateInput");
	return new Promise((resolve, reject) => {
		validateUtils.validateUpdatePayload(config, update_data, deploymentTableName, deploymentId, (error, data) => {
			if(error){
				logger.error("validateUpdateInput error:"+JSON.stringify(error));
				reject(error);
			} else {
				logger.info("validateUpdateInput data:"+JSON.stringify(data));
				resolve(data);
			}
		})
	})
}

function updateDeploymentDetails(deploymentTableName, update_deployment_data, deploymentId) {
	logger.info("updateDeploymentDetails");
	return new Promise((resolve, reject) => {
		crud.update(update_deployment_data, deploymentTableName, deploymentId, (error, data) => {
			if(error){
				logger.error("updateDeploymentDetails error:"+JSON.stringify(error));
				reject(error);
			} else {
				logger.info("updateDeploymentDetails data:"+JSON.stringify(data));
				resolve(data);
			}
		});
	})
}

function deleteServiceByID(getDeploymentDetails, deploymentTableName, deploymentId){
	logger.info("deleteServiceByID"+JSON.stringify(getDeploymentDetails));
	return new Promise((resolve, reject) => {
		if(!utils.isEmpty(getDeploymentDetails)){
			crud.delete(deploymentTableName, deploymentId, (error, data) => {
				if(error){
					logger.error("deleteServiceByID error:"+JSON.stringify(error));
					reject(error);
				} else {
					logger.info("deleteServiceByID data:"+JSON.stringify(data));
					resolve(data);
				}
			});
		} else {
			reject({result:"notFound",message:"Deployment with provided Id is not available"})
		}
	})
}