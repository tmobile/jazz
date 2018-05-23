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
  CRUD APIs for Assets Catalog
  @author:
  @version: 1.0
**/

const errorHandlerModule = require("./components/error-handler.js"); //Import the error codes module.
const responseObj = require("./components/response.js"); //Import the response module.
const configObj = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const crud = require("./components/crud")(); //Import the CRUD module.
const global_config = require("./config/global-config.json"); //Import the logging module.

module.exports.handler = (event, context, cb) => {
    //Initializations
    var errorHandler = errorHandlerModule();
    logger.init(event, context);
     var config = configObj(event);
    global.config = config;
	global.global_config = global_config;

    var handleResponse = function(error,data,input){
        if(error){
            logger.error(JSON.stringify(error));
            if (error.result === 'inputError') {
                cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
            } 
            else if (error.result === 'notFoundError') {
                cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
            } 
            else if (error.result === 'databaseError') {
                cb(JSON.stringify(errorHandler.throwInternalServerError(error.message)));
            } 
            else{
                cb(JSON.stringify(errorHandler.throwInternalServerError('unexpected error occured')));
            }   
        }
        else{
            logger.debug("response data "+JSON.stringify(data));
            cb(null, responseObj(data, input));
        }
    };

    try {
        
        global.assets_table = config.assets_table;
        // event.method cannot be empty, throw error
        if (event === undefined || event.method === undefined) {
            cb(JSON.stringify(errorHandler.throwInputValidationError("Bad input error")));
        }
        else if(event.query !== undefined && Object.keys(event.query).length > 0 && event.path.id === undefined){
            cb(JSON.stringify(errorHandler.throwInputValidationError("Parameters are not supported")));
        }
        else{
			// get assets_id from the path
			var assets_id;
			var assets_data;

			if(event.path !== undefined && event.path.id !== undefined && event.path.id !== ""){
				assets_id = event.path.id;
			} 
			
			// 1: GET assets by id (/assets/{assets_id})
			if (event.method === 'GET') {
				logger.debug('GET assets by ID : ' + assets_id);
				crud.get(assets_id, function onGet(error,data){
					handleResponse(error,data,event.path);
				});
				
			}
			
			// Update assets
			// 2: PUT assets by id (/assets/{assets_id})
			else if (event.method === 'PUT' && assets_id !== undefined) {
				logger.debug('Update asset assets_id ' + assets_id);
				var update_data = event.body;
				crud.update().validateAndUpdate(assets_id, update_data, function onUpdate(error,data){
					handleResponse(error,data,update_data);
				});
			}
			// Create new assets
			// 3: POST a assets (/assets)
			else if (event.method === 'POST' && assets_id === undefined) {
				logger.debug('Create new asset');
				assets_data = event.body;
				crud.create().validateAndCreate(assets_data, function onCreate(error,data){
					handleResponse(error,data,assets_data);
				});
			}
			// 4: POST search assets attributes
			else if (event.method === 'POST' && assets_id === 'search') {           
				assets_data = event.body;
				logger.debug('POST search assets' + JSON.stringify(assets_data));
				crud.postSearch().validateAndSearch(assets_data, function onSearch(error,data){
					handleResponse(error,data,assets_data);
				});
			}
			else{
				logger.error(JSON.stringify(event));
				cb(JSON.stringify(errorHandler.throwNotFoundError("Requested Asset not found")));
			}
        }
    } catch (e) {
        logger.error(JSON.stringify(e));
        cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Server Error")));
    }
    
};
