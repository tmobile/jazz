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
  CRUD APIs for Service Catalog
  @author:
  @version: 1.0
**/

const async = require('async');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const utils = require("./components/utils.js")();
const crud = require("./components/crud")();
const global_config = require("./config/global-config.json");
const validateUtils = require("./components/validation")();

module.exports.handler = (event, context, cb) => {

    //Initializations
    var errorHandler = errorHandlerModule();
    logger.init(event, context);
    var config = configModule.getConfig(event, context);
    global.config = config;
    global.global_config = global_config;

    var handleResponse = function (error, data, input) {
        if (error) {
            logger.error(JSON.stringify(error));
            if (error.result === "inputError") {
                cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
            } else if (error.result === "notFoundError") {
                cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
            } else if (error.result === "databaseError") {
                cb(JSON.stringify(errorHandler.throwInternalServerError(error.message)));
            } else {
                cb(JSON.stringify(errorHandler.throwInternalServerError("unexpected error occured")));
            }
        } else {
            logger.debug("response data " + JSON.stringify(data));
            cb(null, responseObj(data, input));
        }
    };

    try {
        global.services_table = config.services_table;

        if (!event.method) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("method cannot be empty")));
        }

        if (!event.principalId) {
            return cb(JSON.stringify(errorHandler.throwUnauthorizedError("You aren't authorized to access this service. Please login with your credentials.")));
        }

        // get service_id from the path
        var service_id;
        if (event && event.path && event.path.id) {
            service_id = event.path.id;
        }

        // throw bad request error if id not specified for PUT/DELETE
        if ((event.method === 'PUT' || event.method === 'DELETE') && !service_id) {
            return cb(JSON.stringify(errorHandler.throwInputValidationError("service id is required")));
        }

        global.userId = event.principalId;
        var getAllRecords;
        if (event.query && event.query.isAdmin) {
            getAllRecords = true;
        }
        else {
            getAllRecords = false;
        }

        // 1: GET service by id (/services/{service_id})
        if (event.method === 'GET' && service_id) {
            logger.info('GET service by ID : ' + service_id);

            async.series({
                // Get service by SERVICE_ID
                getServiceByServiceId: function (onComplete) {
                    validateUtils.validateServiceWithServiceId(service_id, function onValidate(error, data) {
                        onComplete(error, data);
                    });
                }
            }, function (error, data) {
                if (error) {
                    logger.error('Error occured. ' + JSON.stringify(error, null, 2));

                }
                if (data.getServiceByServiceId) {
                    var service_obj = data.getServiceByServiceId;
                    logger.verbose('Get Success. ' + JSON.stringify(service_obj, null, 2));
                    return handleResponse(error, data.getServiceByServiceId.data, event.path);
                } else {
                    return handleResponse(error, data, event.path);
                }
            });
        }


        // 2: GET all services (/services)
        // 3: GET Filtered services (/services?field1=value&field2=value2&...)
        if (event.method === 'GET' && !service_id) {
            // logger.info('GET services');
            async.series({
                // fetch services list from dynamodb, filter if required
                fetchServices: function (onComplete) {
                    var query = event.query;
                    crud.getList(query, getAllRecords, onComplete);
                }
            }, function (error, result) {
                // Handle error
                if (error) {
                    logger.error('Error occured. ' + JSON.stringify(error, null, 2));
                    return handleResponse(error, result.fetchServices, event.query);
                } else {
                    var data = result.fetchServices;
                    return handleResponse(error, data, event.query);
                }
            });
        }


        // Update Service
        // 4: PUT service by id (/services/{service_id})
        if (event.method === 'PUT' && service_id) {
            logger.info('Update service service_id ' + service_id);

            var update_data = event.body;

            async.series({
                validate: function (callback) {
                    validateUtils.validateUpdatePayload(service_id, update_data, function onValidate(error, data) {
                        callback(error, data);
                    });
                },
                // Update service by SERVICE_ID
                updateServiceDataByServiceId: function (onComplete) {
                    var new_update_data = utils.getUpdateData(update_data);
                    if (new_update_data) {
                        crud.update(service_id, new_update_data, function onUpdate(error, data) {
                            onComplete(error, data);
                        });
                    } else {
                        var message = "Service data is empty";
                        onComplete({
                            result: "inputError",
                            message: message
                        });
                    }
                }
            }, function (error, data) {
                // Handle error
                if (error) {
                    logger.error('Error while updating service ' + JSON.stringify(error));
                    return handleResponse(error, data.updateServiceDataByServiceId, event.body);
                } else {
                    var updatedService = data.updateServiceDataByServiceId;
                    logger.info('Updated service');
                    return handleResponse(error, { 'message': 'Successfully updated service with id: ' + service_id, 'updatedService': updatedService }, event.body);
                }

            });
        }


        // Delete Service
        // 5: DELETE service by id (/services/{service_id})
        if (event.method === 'DELETE' && service_id) {
            logger.info('Delete service service_id ' + service_id);

            async.series({
                // Check if service exists
                validateServiceExists: function (onComplete) {
                    validateUtils.validateServiceWithServiceId(service_id, function onValidate(error, data) {
                        onComplete(error, data);
                    });
                },
                // Delete service by SERVICE_ID
                deleteServiceByID: function (onComplete) {
                    crud.delete(service_id, onComplete);
                }
            }, function onComplete(error, data) {
                // Handle error
                if (error) {
                    logger.error('Error in DeleteItem: ' + JSON.stringify(error, null, 2));
                    return handleResponse(error, data, event.path);
                } else {
                    logger.info("DeleteItem succeeded");
                    return handleResponse(error, { 'message': 'Service deleted successfully.' }, event.path);
                }
            });
        }


        // Create new service
        // 6: POST a service (/services)
        if (event.method === 'POST' && !service_id) {
            var service_data = Object.assign({}, event.body);
            logger.info("Create a new service with the following payload data : " + JSON.stringify(service_data));

            async.series({
                // Validate service_data for adding new service

                validate: function (callback) {
                    validateUtils.validateCreatePayload(service_data, function onValidate(error, data) {
                        callback(error, data);
                    });
                },

                // Add new service data to the dynamodb
                addNewService: function (onComplete) {
                    crud.create(service_data, onComplete);
                }
            }, function (error, data) {
                // Handle error
                if (error) {
                    logger.error('error occured while adding new service');
                    logger.error(error.result);
                    return handleResponse(error, data, service_data);
                } else {
                    // data is now equal to: {validateServiceData: 1, addNewService: 2}
                    var result = data.addNewService;
                    // Add Item success
                    return handleResponse(error, data.addNewService, service_data);
                }
            });
        }

    } catch (e) {
        //Sample Error response for internal server error
        logger.error("Internal server error");
        logger.error(e);
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected error occured")));
    }
};
