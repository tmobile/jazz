/**
    Helper Validation functions for Service-Catalog
    @module: validate.js
    @description: Defines validate functions.
    @author: 
    @version: 1.0
**/

const logger = require("../logger"); //Import the logging module.
const utils = require("../utils.js")(); //Import the utils module.
const _ = require("lodash");
var validateUtils = require("./common.js")();
const async = require("async");
const crud = require("../crud")(); //Import the utils module.

module.exports = (service_id, update_data, onComplete) => {
    // logger.info("Inside Validate Update Payload: " + JSON.stringify(update_data));

    var service_field_list = [];
    var non_editable_fields_for_update = [];
    var empty_allowed_fields_for_update = [];
    _.forEach(global.global_config.SERVICE_FIELDS_METADATA, function(value, key) {
        service_field_list.push(value.key);
        if (!value.editable) {
            non_editable_fields_for_update.push(value.key);
        }

        if (!value.isEmptyAllowed) {
            empty_allowed_fields_for_update.push(value.key);
        }
    });

    async.series({
        validateServiceExists: function(onComplete) {
            // logger.info('crud.get ')
            crud.get(service_id, function onServiceGet(error, data) {
                if (error) {
                    logger.info('crud.get error')
                    onComplete(error, null);
                } else {
                    // logger.info(data)
                    if (Object.keys(data).length === 0 && data.constructor === Object) {
                        logger.error('Cannot find service with id: ' + service_id);
                        onComplete({
                            result:"notFoundError",
                            message:"Cannot find service with id: " + service_id
                        });
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
        }
    },
    function(error, data) {
        if (error) {
            logger.info('#validate error')
            logger.error("# Validate Update Payload Error:" + JSON.stringify(error));
            onComplete(error);
        } else {
            logger.info("# Validate Update Payload Data:" + JSON.stringify(data));
            onComplete(null);
        }
    });
    
}