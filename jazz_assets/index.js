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
const logger = require("./components/logger.js")(); //Import the logging module.
const crud = require("./components/crud")(); //Import the CRUD module.
const global_config = require("./config/global-config.json"); //Import the logging module.
const validateutils = require("./components/validation");
global.global_config = global_config;

function handler(event, context, cb) {
    //Initializations
    var errorHandler = errorHandlerModule();
    logger.init(event, context);
    logger.info(event);
    var config = configObj(event);
    global.config = config;
    var assets_id;
    var assets_data;
    var asset_table = global.config.ASSETS_TABLE;

    if (event.path && event.path.id) {
        assets_id = event.path.id;
    }

    function handleResponse(error, data, input) {
        if (error) {
            logger.error(JSON.stringify(error));
            if (error.result === 'inputError') {
                return cb(JSON.stringify(errorHandler.throwInputValidationError(error.message)));
            } else if (error.result === 'notFoundError') {
                return cb(JSON.stringify(errorHandler.throwNotFoundError(error.message)));
            } else if (error.result === 'databaseError') {
                return cb(JSON.stringify(errorHandler.throwInternalServerError(error.message)));
            } else if (error.result === 'unauthorized') {
                return cb(JSON.stringify(errorHandler.throwUnauthorizedError(error.message)));
            } else {
                return cb(JSON.stringify(errorHandler.throwInternalServerError('unexpected error occured')));
            }
        } else {
            logger.debug("response data " + JSON.stringify(data));
            return cb(null, responseObj(data, input));
        }
    };

    try {

        exportable.genericInputValidation(event)
            .then(() => {

                if (event.method === 'GET' && assets_id) {
                    logger.info('GET assets by ID : ' + assets_id);
                    exportable.processAssetData(assets_id, asset_table)
                        .then(res => {
                            logger.info("get asset by Id result:" + JSON.stringify(res));
                            handleResponse(null, res, event.path);
                        })
                        .catch(error => {
                            logger.error("update error:" + JSON.stringify(error));
                            handleResponse(error, null, event.path);
                        });
                }

                // Update assets
                // 2: PUT assets by id (/assets/{assets_id})
                else if (event.method === 'PUT' && assets_id) {
                    logger.info('Update asset assets_id ' + assets_id);
                    var update_data = event.body;
                    exportable.processAssetsUpdate(assets_id, update_data, asset_table)
                        .then(res => {
                            logger.info("update result:" + JSON.stringify(res));
                            handleResponse(null, res.data, res.input);
                        })
                        .catch(error => {
                            logger.error("update error:" + JSON.stringify(error));
                            handleResponse(error, null, update_data);
                        });
                }
                // Create new assets
                // 3: POST a assets (/assets)
                else if (event.method === 'POST' && !assets_id) {
                    logger.debug('Create new asset');
                    assets_data = event.body;
                    exportable.processAssetCreation(assets_data, asset_table)
                        .then(res => {
                            logger.info("create asset result:" + JSON.stringify(res));
                            handleResponse(null, res, assets_data);
                        })
                        .catch(error => {
                            logger.error("create asset error:" + JSON.stringify(error));
                            handleResponse(error, null, assets_data);
                        });
                }
                // 4: POST search assets attributes
                else if (event.method === 'POST' && assets_id === 'search') {
                    assets_data = event.body;
                    logger.info('POST search assets' + JSON.stringify(assets_data));
                    exportable.processAssetSearch(assets_data, asset_table)
                        .then(res => {
                            logger.info("search asset result:" + JSON.stringify(res));
                            handleResponse(null, res, assets_data);
                        })
                        .catch(error => {
                            logger.error("create asset error:" + JSON.stringify(error));
                            handleResponse(error, null, assets_data);
                        });
                } else {
                    logger.error(JSON.stringify(event));
                    return cb(JSON.stringify(errorHandler.throwNotFoundError("Requested Asset not found")));
                }
            })
            .catch(error => {
                handleResponse(error, null, null);
            });
    } catch (e) {
        logger.error(JSON.stringify(e));
        return cb(JSON.stringify(errorHandler.throwInternalServerError("Unexpected Server Error")));
    }

};

function genericInputValidation(event) {
    logger.debug("Inside genericInputValidation");
    return new Promise((resolve, reject) => {
        if (!event || !event.method) {
            reject({
                result: "inputError",
                message: "method cannot be empty"
            })
        }

        if ((event.method === "GET" || event.method === "PUT") && (Object.keys(event.path).length > 0 && !event.path.id)) {
            reject({
                result: "inputError",
                message: "Missing input parameter asset id"
            });
        }

        if (event.method === "PUT" && Object.keys(event.body).length === 0) {
            reject({
                result: "inputError",
                message: "Asset data is required for updating an asset"
            });
        }

        if (event.method === "POST" && Object.keys(event.body).length === 0 && Object.keys(event.path).length === 0) {
            reject({
                result: "inputError",
                message: "Asset details are required for creating an asset"
            });
        }

        if (event.method === "POST" && Object.keys(event.path).length > 0 && event.path.id !== "search") {
            reject({
                result: "inputError",
                message: "Parameters are not supported for asset search"
            });
        }

        if(!event.principalId) {
            reject({
                result: "unauthorized",
                message: "Unauthorized"
            })
        }
        resolve();
    });
};

function processAssetData(assets_id, asset_table) {
    return new Promise((resolve, reject) => {
        crud.get(assets_id, asset_table, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    })
}

function processAssetsUpdate(assets_id, update_data, asset_table) {
    return new Promise((resolve, reject) => {
        validateutils.validateUpdatePayload(assets_id, update_data, asset_table)
            .then(res => exportable.updateAssetsData(assets_id, res.input, asset_table))
            .then(res => {
                resolve(res);
            })
            .catch(error => {
                reject(error)
            });
    });
};

function processAssetCreation(assets_data, asset_table) {
    return new Promise((resolve, reject) => {
        validateutils.validateCreatePayload(assets_data, asset_table)
            .then(() => exportable.createNewAsset(assets_data, asset_table))
            .then(res => {
                resolve(res);
            })
            .catch(error => {
                reject(error)
            });
    });
};

function processAssetSearch(assets_data, asset_table) {
    return new Promise((resolve, reject) => {
        validateutils.validateSearchPayload(assets_data)
            .then(() => exportable.postSearch(assets_data, asset_table))
            .then(res => {
                resolve(res);
            })
            .catch(error => {
                reject(error)
            });
    });
};

function updateAssetsData(assets_id, update_data, asset_table) {
    logger.debug("Inside updateAssetsData");
    return new Promise((resolve, reject) => {
        if (Object.keys(update_data).length !== 0) {
            crud.update(assets_id, update_data, asset_table, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        } else {
            reject({
                result: "inputError",
                message: "Provided Asset data can not be updated."
            });
        }
    });
};

function createNewAsset(assets_data, asset_table) {
    logger.debug("Inside createNewAsset");
    return new Promise((resolve, reject) => {
        crud.create(assets_data, asset_table, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

function postSearch(assets_data, asset_table) {
    logger.debug("Inside postSearch");
    return new Promise((resolve, reject) => {
        crud.postSearch(assets_data, asset_table, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

const exportable = {
    handler,
    genericInputValidation,
    processAssetData,
    processAssetsUpdate,
    processAssetCreation,
    processAssetSearch,
    updateAssetsData,
    createNewAsset,
    postSearch
}

module.exports = exportable;