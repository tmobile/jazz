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
const logger = require("./components/logger.js")(); //Import the logging module.
const utils = require("./components/utils.js")(); //Import the utils module.
const validateUtils = require("./components/validation")(); //Import validation module
const crud = require("./components/crud")(); //Import the crud module.
const request = require('request');
const util = require('util');

module.exports.handler = (event, context, cb) => {

	//Initializations
	var errorHandler = errorHandlerModule(),
		config = configObj(event);
	global.config = config;
	logger.init(event, context);

	//validate inputs
	logger.info(event);
	genericInputValidation(event)
		.then(() => {
			var deploymentTableName = config.DEPLOYMENT_TABLE,
				method = event.method,
				query = event.query,
				path = event.path,
				body = event.body;

			if (method === "POST" && !Object.keys(path).length) {
				logger.info("creating new deployment details");
				processDeploymentCreation(config, body, deploymentTableName)
					.then((res) => {
						logger.info("Create deployment result:" + JSON.stringify(res));
						return cb(null, responseObj(res, body));
					})
					.catch((error) => {
						logger.error("Error while creating new deployment:" + JSON.stringify(error));
						if (error.result == "inputError") {
							return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
						} else {
							return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred")));
						}
					});
			}

			if (method === "POST" && Object.keys(path).length) {
				logger.info("GET Deployment details using deployment Id :" + path.id);
				processDeploymentRebuild(config, path.id, deploymentTableName)
					.then((res) => {
						logger.info("Re-build result:" + JSON.stringify(res));
						return cb(null, responseObj(res, path));
					})
					.catch((error) => {
						logger.error("Re-build error:" + JSON.stringify(error));
						if (error.result === "notFound" || error.result === "deployment_already_deleted_error") {
							return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
						} else {
							return cb(JSON.stringify(errorHandler.throwInternalServerError('unhandled error occurred')));
						}
					});
			}

			if (method === 'GET' && query && utils.isEmpty(path)) {
				logger.info("GET Deployment details using query params :" + JSON.stringify(query));
				processDeploymentsList(config, query, deploymentTableName)
					.then((res) => {
						logger.info("Get list of deployments:" + JSON.stringify(res));
						return cb(null, responseObj(res, query));
					})
					.catch((error) => {
						logger.error("Error while fetching deployments:" + JSON.stringify(error));
						if (error.result === "inputError") {
							return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
						} else {
							return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred")));
						}
					});
			}

			if (method === 'GET' && path && utils.isEmpty(query)) {
				logger.info("GET Deployment details using deployment Id :" + path.id);
				getDeploymentDetailsById(deploymentTableName, path.id)
					.then((res) => {
						logger.info("Get Success. " + JSON.stringify(res));
						return cb(null, responseObj(res, path));
					})
					.catch((error) => {
						logger.error("Error occurred. " + JSON.stringify(error));
						if ((error.result === "notFound") || (error.result === "deployment_already_deleted_error")) {
							return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
						} else {
							return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred")));
						}
					});
			}

			if (method === "PUT" && path) {
				processDeploymentsUpdate(config, body, deploymentTableName, path.id)
					.then((res) => {
						logger.info("Updated data:" + JSON.stringify(res));
						return cb(null, responseObj({
							message: "Successfully Updated deployment details with id: " + path.id
						}, body));
					})
					.catch((error) => {
						logger.error("Error occurred." + JSON.stringify(error));
						if (error.result === "inputError") {
							return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
						} else if (error.result === "notFound") {
							return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
						} else {
							return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred")));
						}
					});
			}

			if (method === "DELETE" && path) {
				logger.info("Deleting deployment details for id : " + path.id);
				processDeploymentsDeletion(deploymentTableName, path.id)
					.then((res) => {
						logger.info("DeleteItem succeeded");
						var msg = "Successfully Deleted deployment details of id :" + path.id;
						return cb(null, responseObj({
							message: msg
						}, path));
					})
					.catch((error) => {
						logger.error("Error in DeleteItem: " + JSON.stringify(error));
						if (error.result === "deployment_already_deleted_error" || error.result === "notFound") {
							return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
						} else {
							return cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occurred ")));
						}
					});
			}
		})
		.catch((error) => {
			if (error.result === "inputError") {
				return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
			} else if (error.result === "unauthorized") {
				return cb(JSON.stringify(errorHandler.throwUnauthorizedError(error.message)));
			} else {
				return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected error occurred.")))
			}
		});
};

function genericInputValidation(event) {
	logger.info("Inside genericInputValidation");
	return new Promise((resolve, reject) => {
		// event.method cannot be empty, throw error
		if (!event || !event.method) {
			reject({
				result: "inputError",
				message: "method cannot be empty"
			})
		}

		if (event.method === "GET" && Object.keys(event.query).length === 0 && Object.keys(event.path).length === 0) {
			reject({
				result: "inputError",
				message: "GET API can be called only with following query params: domain, service and environment OR GET API can be called only with deployment_id as path param."
			});
		}

		if ((event.method === "GET" || event.method === "PUT" || event.method === "DELETE") && (Object.keys(event.path).length > 0 && !event.path.id)) {
			reject({
				result: "inputError",
				message: "Missing input parameter deployment id"
			});
		}

		if (event.method === "PUT" && Object.keys(event.body).length === 0) {
			reject({
				result: "inputError",
				message: "Deployment data is required for updating a deployment"
			});
		}

		if (event.method === "POST" && Object.keys(event.body).length === 0 && Object.keys(event.path).length === 0) {
			reject({
				result: "inputError",
				message: "Deployment details are required for creating a deployment"
			});
		}

		if (event.method === "POST" && Object.keys(event.path).length > 0 && !event.path.id) {
			reject({
				result: "inputError",
				message: "Re-build API can be called with deployment_id as path param"
			});
		}

		resolve();
	});
};

function processDeploymentCreation(config, deployment_details, deploymentTableName) {
	return new Promise((resolve, reject) => {
		validateDeploymentDetails(config, deployment_details)
			.then(() => addNewDeploymentDetails(deployment_details, deploymentTableName))
			.then((res) => {
				resolve(res);
			})
			.catch((error) => {
				reject(error)
			});
	});
}

function processDeploymentRebuild(config, deploymentId, deploymentTableName) {
	return new Promise((resolve, reject) => {
		getDeploymentDetailsById(deploymentTableName, deploymentId)
			.then((res) => reBuildDeployment(res, config))
			.then((res) => {
				resolve(res);
			})
			.catch((error) => {
				reject(error)
			});
	});
}

function processDeploymentsList(config, query, deploymentTableName) {
	return new Promise((resolve, reject) => {
		var queryParams = {
			'service': query.service,
			'domain': query.domain,
			'environment': query.environment,
			'status': query.status,
			'offset': query.offset,
			'limit': query.limit
		};
		validateQueryParams(config, queryParams)
			.then(() => getDeploymentDetailsByQueryParam(deploymentTableName, queryParams))
			.then((res) => {
				resolve(res);
			})
			.catch((error) => {
				reject(error)
			});
	});
}

function processDeploymentsUpdate(config, body, deploymentTableName, deploymentId) {
	return new Promise((resolve, reject) => {
		validateUpdateInput(config, body, deploymentTableName, deploymentId)
			.then((data) => updateDeploymentDetails(deploymentTableName, data, deploymentId))
			.then((res) => {
				resolve(res);
			})
			.catch((error) => {
				reject(error)
			});
	});
}

function processDeploymentsDeletion(deploymentTableName, deploymentId) {
	return new Promise((resolve, reject) => {
		getDeploymentDetailsById(deploymentTableName, deploymentId)
			.then((res) => deleteServiceByID(res, deploymentTableName, deploymentId))
			.then((res) => {
				resolve(res);
			})
			.catch((error) => {
				reject(error)
			});
	});
}

function validateDeploymentDetails(config, deployment_details) {
	logger.debug("validateDeploymentDetails for creating new deployment");
	return new Promise((resolve, reject) => {
		validateUtils.validateCreatePayload(config, deployment_details, (error, data) => {
			if (error) {
				logger.error("validateDeploymentDetails error:" + JSON.stringify(error));
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}

function addNewDeploymentDetails(deployment_details, deploymentTableName) {
	logger.debug("Inside addNewDeploymentDetails");
	return new Promise((resolve, reject) => {
		crud.create(deployment_details, deploymentTableName, (error, data) => {
			if (error) {
				logger.error("addNewDeploymentDetails error:" + JSON.stringify(error));
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}

function validateQueryParams(config, params) {
	logger.debug("validateQueryParams for deployments");
	return new Promise((resolve, reject) => {
		validateUtils.validateDeployment(config, params, (error, data) => {
			if (error) {
				logger.error("validateQueryParams error:" + JSON.stringify(error));
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}

function getDeploymentDetailsByQueryParam(deploymentTableName, queryParams) {
	logger.debug("Inside getDeploymentDetailsByQueryParam" + JSON.stringify(queryParams));
	return new Promise((resolve, reject) => {
		crud.getList(deploymentTableName, queryParams, (error, data) => {
			if (error) {
				logger.error("getDeploymentDetailsByQueryParam error:" + JSON.stringify(error));
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}

function getDeploymentDetailsById(deploymentTableName, deploymentId) {
	logger.debug("Inside getDeploymentDetailsById" + JSON.stringify(deploymentId));
	return new Promise((resolve, reject) => {
		crud.get(deploymentTableName, deploymentId, (error, data) => {
			if (error) {
				logger.error("getDeploymentDetailsById error:" + JSON.stringify(error));
				reject(error);
			} else {
				if (data && !(Object.keys(data).length && data.constructor === Object)) {
					logger.error('Cannot find deployment details with id : ' + deploymentId);
					reject({
						result: "notFound",
						message: 'Cannot find deployment details with id :' + deploymentId
					});
				} else {
					resolve(data);
				}
			}
		});
	});
}

function validateUpdateInput(config, update_data, deploymentTableName, deploymentId) {
	logger.debug("Inside validateUpdateInput");
	return new Promise((resolve, reject) => {
		validateUtils.validateUpdatePayload(config, update_data, deploymentTableName, deploymentId, (error, data) => {
			if (error) {
				logger.error("validateUpdateInput error:" + JSON.stringify(error));
				reject(error);
			} else {
				resolve(data);
			}
		})
	})
}

function updateDeploymentDetails(deploymentTableName, update_deployment_data, deploymentId) {
	logger.debug("Inside updateDeploymentDetails");
	return new Promise((resolve, reject) => {
		crud.update(update_deployment_data, deploymentTableName, deploymentId, (error, data) => {
			if (error) {
				logger.error("updateDeploymentDetails error:" + JSON.stringify(error));
				reject(error);
			} else {
				resolve(data);
			}
		});
	})
}

function deleteServiceByID(getDeploymentDetails, deploymentTableName, deploymentId) {
	logger.debug("Inside deleteServiceByID" + JSON.stringify(getDeploymentDetails));
	return new Promise((resolve, reject) => {
		if (!utils.isEmpty(getDeploymentDetails)) {
			crud.delete(deploymentTableName, deploymentId, (error, data) => {
				if (error) {
					logger.error("deleteServiceByID error:" + JSON.stringify(error));
					reject(error);
				} else {
					resolve(data);
				}
			});
		} else {
			reject({
				result: "notFound",
				message: "Deployment with provided Id is not available"
			})
		}
	})
}

function reBuildDeployment(refDeployment, config) {
	logger.debug("Inside reBuildDeployment" + JSON.stringify(refDeployment));
	return new Promise((resolve, reject) => {
		getToken(config)
			.then((authToken) => getServiceDetails(config, refDeployment.service_id, authToken))
			.then((res) => buildNowRequest(res, config, refDeployment))
			.then((res) => {
				resolve(res);
			})
			.catch((error) => {
				reject(error);
			})

	});
}

function getToken(configData) {
	logger.debug("Inside getToken");
	return new Promise((resolve, reject) => {
		var svcPayload = {
			uri: configData.SERVICE_API_URL + configData.TOKEN_URL,
			method: 'post',
			json: {
				"username": configData.SERVICE_USER,
				"password": configData.TOKEN_CREDS
			},
			rejectUnauthorized: false
		};
		request(svcPayload, (error, response, body) => {
			if (response && response.statusCode === 200 && body && body.data) {
				var authToken = body.data.token;
				resolve(authToken);
			} else {
				reject({
					"error": "Could not get authentication token for updating service catalog.",
					"message": response.body.message
				});
			}
		});
	});
}

function getServiceDetails(configData, serviceId, authToken) {
	logger.debug("Inside getServiceDetails:" + serviceId)
	return new Promise((resolve, reject) => {
		var params = {
			uri: configData.SERVICE_API_URL + configData.SERVICE_API_RESOURCE + "/" + serviceId,
			method: 'get',
			headers: {
				'Authorization': authToken
			},
			rejectUnauthorized: false
		};
		request(params, (error, response, body) => {
			if (error) {
				reject(error);
			} else {
				var data = JSON.parse(response.body)
				if (data.errorType && data.errorType === "NotFound") {
					reject({
						result: "notFound",
						message: data.message
					});
				} else {
					resolve(data);
				}
			}
		});
	});
}

function buildNowRequest(serviceDetails, config, refDeployment) {
	logger.debug("Inside buildNowRequest:")
	return new Promise((resolve, reject) => {
		var data = serviceDetails.data,
			service_name = data.service,
			domain = data.domain,
			scm_branch = encodeURI(refDeployment.scm_branch),
			build_url = config.JOB_BUILD_URL,
			buildQuery = "/buildWithParameters?service_name=" + service_name + "&domain=" + domain + "&scm_branch=" + scm_branch,
			base_auth_token = "Basic " + new Buffer(util.format("%s:%s", config.SVC_USER, config.SVC_PASWD)).toString("base64"),
			rebuild_url = "";
		var buildPackMap = {
			"api": "build_pack_api",
			"lambda": "build_pack_lambda",
			"website": "build_pack_website"
		}
		rebuild_url = build_url + buildPackMap[data.type.toLowerCase()] + buildQuery;

		if (build_url) {
			var options = {
				url: rebuild_url,
				method: 'POST',
				rejectUnauthorized: false,
				headers: {
					'Accept': 'application/json',
					'Authorization': base_auth_token
				}
			};
			request(options, (error, res, body) => {
				if (error) {
					logger.error("Unable to rebuild deployment :" + error);
					reject(error);
				} else {
					// Success response
					if (res.statusCode === 200 || res.statusCode === 201) {
						logger.info("successfully deployment started.");
						resolve({
							result: 'success',
							message: "deployment started."
						});
					} else if (res.statusCode === 404) {
						logger.info("Service not available.");
						var msg = 'Unable to re-build ' + service_name + ' as requested service is unavailable.';
						reject({
							result: "notFound",
							message: msg
						});
					} else {
						reject("unknown error occurred");
					}
				}
			});
		} else {
			reject("unable to find deployment details");
		}
	});
}