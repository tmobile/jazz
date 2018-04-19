/**
Nodejs Template Project
@author:
@version: 1.0
 **/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const secretHandlerModule = require("./components/secret-handler.js"); //Import the secret-handler module.
const utils = require("./components/utils.js")(); //Import the utils module.
const crud = require("./components/crud")(); //Import the utils module.
const _ = require("lodash");
const Uuid = require("uuid/v4");
const async = require('async');
const request = require('request');

module.exports.handler = (event, context, cb) => {




	//Initializations
	var errorHandler = errorHandlerModule(),
		config = configObj(event),
		secretHandler = secretHandlerModule();
	global.config = config;
	logger.init(event, context);

	//validate inputs
	if(!utils.validateInputParams(event) || !utils.validateInputParams(event.method)) {
		return cb(JSON.stringify(errorHandler.throwInternalServerError("Service inputs not defined!")));
	}

	var deploymentTableName = config.deployment_table,
		queryParams = null,
		deploymentId = null,
		method = event.method,
		query = event.query,
		path = event.path,
		body = event.body;

	if (method === "POST" && utils.isEmpty(path)) {
		var deployment_details = body,
			deployment_id = Uuid();
		logger.info("creating new deployment details");
		async.series({
			// Validate deployment details for adding new record
			validateDeploymentDetails: function(onComplete) {

				var required_fields = config.deployment_creation_required_fields;
				// validate required fields
				var missing_required_fields = _.difference(_.values(required_fields), _.keys(deployment_details));

				if (missing_required_fields.length > 0) {
					// return inputError
					onComplete({
						result: "inputError",
						message: "Following field(s) are required - " + missing_required_fields.join(", ")
					});
				} else {
					var status_values = config.deployment_status,
					has_invalid_status_values = true,
					statusFieldKey = "status";

					// check if input contains fields other than allowed fields
					if (_.includes(required_fields, statusFieldKey)) {
						//checking "status" field contains the allowed values
						var statusValue = deployment_details[statusFieldKey];
						has_invalid_status_values = !_.includes(status_values, statusValue);
					}
					if (has_invalid_status_values) {
						// return inputError
						onComplete({
							result: "inputError",
							message: "Only following values can be allowed for status field - " + status_values.join(", ")
						});
					} else {
						var invalid_fields = _.difference(_.keys(deployment_details), _.values(required_fields));
						if (invalid_fields.length > 0) {
							onComplete({
								result: "inputError",
								message:
									"Invalid field(s) - " + invalid_fields.join(", ") + ". Only following fields are allowed - " + required_fields.join(", ")
							});
						} else {
							// return on successfull validation
							onComplete(null, {
								result: "success",
								message: deployment_details


							});
						}
					}
				}
			},

			// Add new service data to the dynamodb
			addNewDeploymentDetails: function(onComplete) {
				crud.create(deployment_details, deploymentTableName, deployment_id, onComplete);
			}
		},function (error, data) {
            // Handle error
			if (error) {
				if (error.result !== "inputError") {
					error.message = "unexpected error occured";
				}
				logger.error("Error occured while adding new record:" + JSON.stringify(error));
				return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
			}

			// Add Item success
			return cb(null, responseObj(data.addNewDeploymentDetails, event.body));
		});
	}

	if (method === "POST" && path !== undefined ) {

		deploymentId = path.id;
		logger.info("GET Deployment details using deployment Id :" + deploymentId);
		if(!utils.validateInputParams(deploymentId)){
			return cb(JSON.stringify(errorHandler.throwInternalServerError("Missing input parameter deployment id")));
		}

		var buildSts = "", baseAuthToken = "", decryptionError = "";

		var decryptObj = secretHandler.decryptSecret(config.build_token);

		if (decryptObj.error !== undefined && decryptObj.error === true) {
			decryptionError = decryptObj.message;
			logger.error("decryptionError :"+ JSON.stringify(decryptionError));
			return cb(JSON.stringify(errorHandler.throwInternalServerError(decryptionError)));
		} else {
			baseAuthToken = decryptObj.message;
		}


		async.auto({
			// Get deployment details by id
			getDeploymentDetailsById: function(onComplete) {
				crud.get(deploymentTableName, deploymentId, onComplete);
			},
			retryDeployment : ['getDeploymentDetailsById', function (result, onComplete){
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
								'Authorization' : 'Basic '+   new Buffer(config.service_user + ":" + baseAuthToken).toString("base64")
							}
						};
						request(options, function(err, res, body) {

							if (err) {
								logger.error("Unable to rebuild deployment :" + err);
								onComplete({ result: "Internal Error", message: JSON.stringify(err)});
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
									var error_message = 'Unknown error occured';
									var bodyToJSON = JSON.parse(res.body);
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
					logger.error("Error occured. " + JSON.stringify(error, null, 2));
					cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
				}else{
					logger.error("Error occured. " + JSON.stringify(error, null, 2));
					cb(JSON.stringify(errorHandler.throwInternalServerError(error.message)));
				}
			}
			logger.info("Result: " + JSON.stringify(data));
			var deployment_obj = data.retryDeployment;
			// throw error if no service exists with given service_id
			logger.verbose("Get Success. " + JSON.stringify(deployment_obj, null, 2));
			cb(null, responseObj(deployment_obj, path));
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
		async.series({
			// Validate query params to fetch deployment details.
			validateQueryParams: function(onComplete) {

				var required_fields = config.required_params;
				var optional_fields = config.optional_params;

				// validate required fields
				var missing_required_fields = _.difference(_.values(required_fields), _.keys(queryParams));
				logger.info("missing_required_fields :" + missing_required_fields);
				if (missing_required_fields.length > 0) {
					// return inputError
					onComplete({
						result: "inputError",
						message: "Following field(s) are required - " + missing_required_fields.join(", ")
					});
				}


				var invalid_fields = _.difference(_.keys(queryParams), _.values(required_fields));

				//Check for optional fields
				invalid_fields = _.difference(invalid_fields, _.values(optional_fields));
				
				if (invalid_fields.length > 0) {
					onComplete({
						result: "inputError",
						message:
							"Invalid field(s) - " + invalid_fields.join(", ") + ". Only following fields are allowed - " + required_fields.join(", ")
					});
				} else
				{
					var invalid_status = false;
					if(queryParams.status !== undefined){
						var valid_deployment_status = config.deployment_status;

						// invalid_status = valid_deployment_status.includes(queryParams.status);
						for(var i = 0 ; i < valid_deployment_status.length ; i++ ){
							if(queryParams.status == config.deployment_status[i]){
								invalid_status=false;
								break;
							}
							else{
								invalid_status=true;
							}
						}

						if(invalid_status){
							onComplete({
								result: "inputError",
								message:
									"Invalid field - " + queryParams.status + ". Only following fields are allowed for status- " + config.deployment_status.join(", ")
							});
						}

					}
					if(invalid_status === false){
						onComplete(null, {
							result: "success",
							message: queryParams
						});
					}

				}

				//validating values provided for status parameter


			},

			getDeploymentDetailsByQueryParam: function(onComplete) {
				logger.info("getDeploymentDetailsByQueryParam" + JSON.stringify(queryParams));
				crud.getList(deploymentTableName, queryParams, onComplete);
			}
		},
		function(error, data) {
			if (error) {
				if (error.result !== "inputError") {
					error.message = "unexpected error occured";
				}
				logger.error("Error occured while fetching record :" + JSON.stringify(error, null, 2));
				cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
			}
			var deployment_obj = data.getDeploymentDetailsByQueryParam;

			// throw error if no service exists with given service_id
			if( deployment_obj !== undefined ){
				if ( deployment_obj.length === 0 || (Object.keys(deployment_obj).length === 0 && deployment_obj.constructor === Object)) {
					logger.error('Cannot find service with service : "' + JSON.stringify(queryParams));
					cb(JSON.stringify( errorHandler.throwNotFoundError('Cannot find service with service : "' + JSON.stringify(queryParams))));
				}
			}


			logger.verbose("Get Success. " + JSON.stringify(deployment_obj, null, 2));
			cb(null, responseObj(deployment_obj, query));
		});
	}

	if( method === 'GET' && path !== undefined && utils.isEmpty(query)){
		deploymentId = path.id;

		if(!utils.validateInputParams(deploymentId)){
			return cb(JSON.stringify(errorHandler.throwInternalServerError("Missing input parameter deployment id")));
		}
		logger.info("GET Deployment details using deployment Id :" + deploymentId);
		async.series({
			// Get deployment details by id
			getDeploymentDetailsById: function(onComplete) {
				crud.get(deploymentTableName, deploymentId, onComplete);
			}
		},
		function(error, data) {
			if (error) {
				if((error.result === "deployment_not_found") || (error.result === "deployment_already_deleted_error")){
					logger.error("Error occured. " + JSON.stringify(error, null, 2));
					cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
				}else{
					logger.error("Error occured. " + JSON.stringify(error, null, 2));
					cb(JSON.stringify(errorHandler.throwInternalServerError("Internal error while retrying the build.")));
				}
			} else {
				var deployment_obj = data.getDeploymentDetailsById;

				// throw error if no service exists with given service_id

				if (deployment_obj.length === 0 || (Object.keys(deployment_obj).length === 0 && deployment_obj.constructor === Object)) {
					logger.error('Cannot find deployment details with id : ' + deploymentId);
					cb(JSON.stringify(errorHandler.throwNotFoundError('Cannot find deployment details with id :' +deploymentId)));
				}
				logger.verbose("Get Success. " + JSON.stringify(deployment_obj, null, 2));
				cb(null, responseObj(deployment_obj, path));
			}
		});
	}

	if( method === "PUT" && path !== undefined ){
		var update_deployment_data = {},
			unchangeable_fields = config.required_params, // list of fields that cannot be updated
			invalid_environment_fields = [];
		deploymentId = path.id;

		if(!utils.validateInputParams(deploymentId)){
			return cb(JSON.stringify(errorHandler.throwInternalServerError("Missing input parameter deployment id")));
		}

		// check if input contains fields that are not allowed to be updated
		Object.keys(body).forEach(function(key) {
			if (unchangeable_fields.indexOf(key) >= 0) {
				invalid_environment_fields.push(key);
			} else {
				update_deployment_data[key] = body[key];
			}
		});

		async.series({
			validateInputData: function(onComplete) {
				logger.info("validateInputData ");
				logger.info(update_deployment_data);

				var message = "";

				// validate if input data is empty
				if (update_deployment_data === undefined || update_deployment_data === null) {
					// return inputError
					onComplete({
						result: "inputError",
						message: "Deployment Data cannot be empty"
					});
				} else if (Object.keys(update_deployment_data).length === 0 && update_deployment_data.constructor === Object) {
					// return inputError
					message = "Deployment Data cannot be empty.";
					if (invalid_environment_fields.length > 0) {
						message = "No valid fields provided. Following fields cannot be updated - " + invalid_environment_fields.join(", ");
					}
					onComplete({
						result: "inputError",
						message: message
					});
				} else {
					if (Object.keys(update_deployment_data).length > 0) {
						var status_values = config.deployment_status,
							has_invalid_status_values = false,
							statusFieldKey = "status",
							required_fields = config.deployment_creation_required_fields,
							statusValue = update_deployment_data[statusFieldKey];

						// check if input contains fields other than allowed fields
						//and checking "status" field contains the allowed values
						if (_.includes(required_fields, statusFieldKey) && !_.includes(status_values, statusValue)) {
							has_invalid_status_values = true;
						}

						if (has_invalid_status_values) {
							// returning inputError
							onComplete({
								result: "inputError",
								message: "Only following values can be allowed for status field - " + status_values.join(", ")
							});
						} else {
							onComplete(null, {
								result: "success",
								message: "Input Data is valid"
							});
						}
					}
				}
			},

			// Update service by SERVICE_ID
			updateDeploymentDetails: function(onComplete) {
				if (update_deployment_data !== undefined && update_deployment_data !== null && update_deployment_data !== {}) {
					crud.update(update_deployment_data, deploymentTableName, deploymentId, onComplete);
				} else {
					onComplete(null, null);
				}
			}
		},
		function(error, data) {
			// Handle error
			if (error) {

				if (error.result !== "inputError") {
					error.message = "unexpected error occured";
				}
				logger.error("Error occured while  updating deployment details:" + JSON.stringify(error));
				cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));

			}
			logger.info("Updated service :" + JSON.stringify(data.updateDeploymentDetails));
			cb(null, responseObj({ message: "Successfully Updated deployment details with id: " + deploymentId }, body));

		});
	}

	if (method === "DELETE" && path !== undefined ){
		deploymentId = path.id;
		if(!utils.validateInputParams(deploymentId)){
			return cb(JSON.stringify(errorHandler.throwInternalServerError("Missing input parameter deployment id")));
		}
		logger.info("Deleting deployment details for id : "+ deploymentId);
		async.series({
			// Check if record exists
			validateDeploymentDetailsExists: function(onComplete) {
				crud.get(deploymentTableName, deploymentId, function onServiceGet(error, data) {
					if (error) {
						onComplete(error, null);
					} else {
						if (Object.keys(data).length === 0 && data.constructor === Object) {
							logger.error("Cannot find deployment details with id: " + deploymentId);
							cb(JSON.stringify(errorHandler.throwNotFoundError("Cannot find deployment details with id: " + deploymentId)));
						} else {
							onComplete(null, {
								result: "success",
								message: "service exists"
							});
						}
					}
				});
			},
			// Delete deployment details by DEPLOYMENT_ID
			deleteServiceByID: function(onComplete) {
				crud.delete(deploymentTableName, deploymentId, onComplete);
			}
		},
		function onComplete(error, data) {
			// Handle error
			if (error) {
				logger.error("Error in DeleteItem: " + JSON.stringify(error, null, 2));
				cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occured ")));
			}
			var deletedData = data.deleteServiceByID;
			logger.info("Deleted service Data :" + deletedData);

			if (deletedData === null) {
				cb(JSON.stringify(errorHandler.throwNotFoundError("Cannot find deployment details with id: " + deploymentId)));
			}

			logger.info("DeleteItem succeeded");
			var msg = "Successfully Deleted deployment details of id :"+ deploymentId;
			cb(null, responseObj({ message: msg }, path));
		});
	}

};
