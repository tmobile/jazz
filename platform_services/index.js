// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
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

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");
const utils = require("./components/utils.js")();
const crud = require("./components/crud")();

const async = require('async');

module.exports.handler = (event, context, cb) => {

    //Initializations
    var errorHandler = errorHandlerModule();
    logger.init(event, context);
    var config = configObj(event);
    global.config = config;

    try {
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

        global.services_table = config.services_table;
        global.userId = event.principalId;
        var getAllRecords;
        /*if(event.query && event.query.limit && event.query.limit == 10){
          getAllRecords = false;
        }
        else{
          getAllRecords = true;
        }*/

        if(event.query && event.query.allServices){
          getAllRecords = true;
        }
        else{
          getAllRecords = false;
        } 

        // 1: GET service by id (/services/{service_id})
        if (event.method === 'GET' && service_id) {
            logger.info('GET service by ID : ' + service_id);

            async.series({
                // Get service by SERVICE_ID
                getServiceByID: function(onComplete) {
                    crud.get(service_id, onComplete);
                }
            }, function(error, data) {
                if (error) {
                    logger.error('Error occured. ' + JSON.stringify(error, null, 2));
                    return cb(JSON.stringify(errorHandler.throwInternalServerError('Unexpected Error occured.')));
                }
                var service_obj = data.getServiceByID;

                // throw error if no service exists with given service_id
                if (Object.keys(service_obj).length === 0 && service_obj.constructor === Object) {
                    logger.error('Cannot find service with id: ' + service_id);
                    return cb(JSON.stringify(errorHandler.throwNotFoundError('Cannot find service with id: ' + service_id)));
                }
                logger.verbose('Get Success. ' + JSON.stringify(service_obj, null, 2));
                return cb(null, responseObj(data.getServiceByID, event.path));
            });
        }


        // 2: GET all services (/services)
        // 3: GET Filtered services (/services?field1=value&field2=value2&...)
        if (event.method === 'GET' && !service_id) {
            logger.info('GET services');
            async.series({
                // fetch services list from dynamodb, filter if required
                fetchServices: function(onComplete) {
                    var query = event.query;
                    crud.getList(query, getAllRecords, onComplete);
                }
            }, function(error, result) {
                // Handle error
                if (error) {
                    logger.error('Error occured. ' + JSON.stringify(error, null, 2));
                    return cb(JSON.stringify(errorHandler.throwInternalServerError('unexpected error occured')));
                }

                return cb(null, responseObj(result.fetchServices, event.query));
            });
        }


        // Update Service
        // 4: PUT service by id (/services/{service_id})
        if (event.method === 'PUT' && service_id) {
            logger.info('Update service service_id ' + service_id);

            var update_data = event.body;

            async.series({
                // Check if service exists
                validateServiceExists: function(onComplete) {
                    crud.get(service_id, function onServiceGet(error, data) {
                        if (error) {
                            onComplete(error, null);
                        } else {
                            if (Object.keys(data).length === 0 && data.constructor === Object) {
                                logger.error('Cannot find service with id: ' + service_id);
                                return cb(JSON.stringify(errorHandler.throwNotFoundError('Cannot find service with id: ' + service_id)));
                            } else {
                                onComplete(null, {
                                    "result": "success",
                                    "input": "service exists"
                                });
                            }
                        }
                    });
                },
                validateInputData: function(onComplete) {

                    logger.info('validateInputData ');
                    logger.info(update_data);

                    // validate if input data is empty
                    if (!update_data) {
                        // return inputError
                        logger.error(' input data is empty ');
                        return cb(JSON.stringify(errorHandler.throwInputValidationError("Service Data cannot be empty")));
                    } else if (Object.keys(update_data).length === 0 && update_data.constructor === Object) {
                        // return inputError
                        logger.error('input data is empty ');
                        return cb(JSON.stringify(errorHandler.throwInputValidationError("Service Data cannot be empty")));
                    }

                    // list of fields that can be updated
                    var fields_list = config.service_update_fields;

                    // check if input contains fields other than allowed fields
                    for (var field in update_data) {
                        if (update_data.hasOwnProperty(field)) {
                            if (fields_list.indexOf(field) === -1) {
                                logger.error('input contains fields other than allowed fields');
                                return cb(JSON.stringify(errorHandler.throwInputValidationError("Invalid field " + field + ". Only following fields can be updated " + fields_list.join(", "))));
                                break;
                            }
                        }
                    }

                    // atleast one of the fields is required
                    var field_exists = false;
                    for (var i = fields_list.length - 1; i >= 0; i--) {
                        field = fields_list[i];
                        var value = update_data[field];
                        if (value) {
                            field_exists = true;
                            break;
                        }
                    }
                    if (field_exists === false) {
                        // return inputError
                        logger.error('No input data. Nothing to update service');
                        return cb(JSON.stringify(errorHandler.throwInputValidationError('No input data. Nothing to update service')));
                    }
                    onComplete(null, {
                        "result": "success",
                        "input": "Input Data is valid"
                    });
                },
                // Update service by SERVICE_ID
                updateServiceByID: function(onComplete) {
                    if (update_data !== undefined && update_data !== null && update_data !== {}) {
                        crud.update(service_id, update_data, onComplete);
                    } else {
                        onComplete(null, null);
                    }
                }
            }, function(error, data) {
                // Handle error
                logger.info('error');
                logger.info(error);
                logger.info(data);
                if (error) {
                    logger.error('error occured while updating service: ' + service_id);
                    logger.error(error);
                    return cb(JSON.stringify(errorHandler.throwInternalServerError('unexpected error occured ')));
                } else {

                    var updatedService = data.updateServiceByID;

                    logger.info('Updated service');
                    logger.info(updatedService);

                    return cb(null, responseObj({ 'message': 'Successfully Updated service with id: ' + service_id, 'updatedService': updatedService }, event.body));
                }

            });
        }


        // Delete Service
        // 5: DELETE service by id (/services/{service_id})
        if (event.method === 'DELETE' && service_id) {
            logger.info('Delete service service_id ' + service_id);

            async.series({
                // Check if service exists
                validateServiceExists: function(onComplete) {
                    crud.get(service_id, function onServiceGet(error, data) {
                        if (error) {
                            onComplete(error, null);
                        } else {
                            if (Object.keys(data).length === 0 && data.constructor === Object) {
                                logger.error('Cannot find service with id: ' + service_id);
                                return cb(JSON.stringify(errorHandler.throwNotFoundError('Cannot find service with id: ' + service_id)));
                            } else {
                                onComplete(null, {
                                    "result": "success",
                                    "input": "service exists"
                                });
                            }
                        }
                    });
                },
                // Delete service by SERVICE_ID
                deleteServiceByID: function(onComplete) {
                    crud.delete(service_id, onComplete);
                }
            }, function onComplete(error, data) {
                // Handle error
                if (error) {
                    logger.error('Error in DeleteItem: ' + JSON.stringify(error, null, 2));
                    return cb(JSON.stringify(errorHandler.throwInternalServerError('unexpected error occured ')));
                }

                var deletedService = data.updateServiceByID;
                logger.info('Deleted service Data');
                logger.info(deletedService);

                if (deletedService === null) {
                    return cb(JSON.stringify(errorHandler.throwNotFoundError('Cannot find service with id: ' + service_id)));
                }

                logger.info("DeleteItem succeeded");
                return cb(null, responseObj({ 'message': 'Service Successfully Deleted' }, event.path));
            });
        }


        // Create new service
        // 6: POST a service (/services)
        if (event.method === 'POST' && !service_id) {
            logger.info('Create new service');
            var service_data = event.body;

            async.series({
                // Validate service_data for adding new service
                validateServiceData: function(onComplete) {
                    // validate if input data is empty
                    if (!service_data || Object.keys(service_data) == 0) {
                        // return inputError
                        onComplete({
                            "result": "inputError",
                            "message": "Service Data cannot be empty"
                        });
                    }

                    // validate required fields
                    var required_fields = config.service_required_fields;
                    var field;

                    for (var i = required_fields.length - 1; i >= 0; i--) {
                        field = required_fields[i];
                        var value = service_data[field];
                        if (!value) {
                            // return inputError
                            onComplete({
                                "result": "inputError",
                                "message": (field + " cannot be empty")
                            });
                        }
                    }

                    var allowed_fields = required_fields.concat(config.service_optional_fields);

                    // check if input contains fields other than allowed fields
                    for (field in service_data) {
                        if (service_data.hasOwnProperty(field)) {
                            if (allowed_fields.indexOf(field) === -1) {
                                onComplete({
                                    "result": "inputError",
                                    "message": "Invalid field " + field + ". Only following fields can be updated " + allowed_fields.join(", ")
                                });
                            }
                        }
                    }

                    onComplete(null, {
                        "result": "success",
                        "input": service_data
                    });
                },
                // Check if a service with same domain and service_name combination exists
                validateServiceExists: function(onComplete) {
                    getAllRecords = "true";
                    crud.getList({ 'service': service_data.service, 'domain': service_data.domain }, getAllRecords, function onServiceGet(error, data) {
                        if (error) {
                            onComplete(error, null);
                        } else {
                            if (data.length > 0) {
                                logger.error('Service name in the specified domain already exists.');
                                return cb(JSON.stringify(errorHandler.throwInputValidationError('Service name in the specified domain already exists.')));
                            } else {
                                onComplete(null, {
                                    "result": "success",
                                    "input": "Valid service_name - domain_name combination"
                                });
                            }
                        }
                    });
                },
                // Add new service data to the dynamodb
                addNewService: function(onComplete) {
                    crud.create(service_data, onComplete);
                }
            }, function(error, data) {
                // Handle error
                if (error) {
                    logger.error('error occured while adding new service');
                    logger.error(error);
                    if (error.result === 'inputError') {
                        cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
                    } else {
                        cb(JSON.stringify(errorHandler.throwInternalServerError('unexpected error occured ')));
                    }
                }
                // data is now equal to: {validateServiceData: 1, addNewService: 2}
                var result = data.addNewService;

                // Add Item success
                cb(null, responseObj(result, event.body));
            });
        }

    } catch (e) {
        //Sample Error response for internal server error
        logger.error("Internal server error");
        logger.error(e);
        cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Error occured")));
    }
};
