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

"use strict";

const config = require("./components/config.js"); //Import the environment data.
const logger = require("./components/logger.js"); //Import the logging module.
const errorHandlerModule = require("./components/error-handler.js");

const _ = require("lodash");
const request = require("request");
const async = require("async");

module.exports.handler = (event, context, cb) => {
    //Initializations
    var configData = config(context);
    var errorHandler = errorHandlerModule();

    var assetCreateEventName = configData.ASSET_CREATE_EVENT_NAME;
    var assetUpdateEventName = configData.ASSET_UPDATE_EVENT_NAME;

    logger.init(event, context);

    //Parse the Event Name and Event Type configuration as a JSON from the config file.
    var event_config = configData.INTERESTED_EVENT_CONFIGURATION;
    logger.debug("Event_configuration:" + event_config);

    var serviceContxt;

    async.each(event.Records, function(record, callback) {
        var encodedPayload = record.kinesis.data;
        var sequenceNumber = record.kinesis.sequenceNumber;

        async.auto(
            {
                checkInterest: function(innerCallback) {
                    logger.debug("event.Records:" + event.Records);
                    var EVT_NAME = record.kinesis.partitionKey;
                    logger.info("EVT_NAME:" + EVT_NAME);

                    //check if event-name is in the interested event-name list
                    if (_.includes(event_config.EVENT_NAMES, EVT_NAME)) {
                        var EVT_TYPE;
                        var EVT_STATUS;
                        var AssetType;

                        /**
                         *********************************************
                         ************SAMPLE  CREATE PAYLOAD **********
                         *********************************************
                         
                         {
                            "service_context": {
                                "branch": "test",
                                "runtime": "nodejs4.3",
                                "domain": "jazz",
                                "type": "S3",
                                "provider": "aws",
                                "provider_id": "arn:876868686999:iam::0005:role/jazz_platform_services",
                                "environment": "DEVELOPMENT"
                            
                            },
                            "username": "SDutta7",
                            "event_timestamp": "2017-07-18T13:18:32:600",
                            "event_status": "ACTIVE",
                            "event_name": "CREATE_ASSET",
                            "event_type": "SERVICE_DEPLOYMENT",
                            "service_name": "test-asset-sidd-71",
                            "timestamp": "2017-07-13T01:18:35:556",
                            "event_handler": "JENKINS"
                        }
                         */

                        /**
                         *********************************************
                         ************SAMPLE  UPDATE PAYLOAD **********
                         *********************************************
                         
                         {
                            "service_context": {
                                "status": "DELETED",
                                "provider_id": "arn::iam::876868686999:role/jazz_platform_services",
                                "type": "LAMBDA"
                        },
                            "username": "SDutta7",
                            "event_timestamp": "2017-07-18T13:18:32:600",
                            "event_status": "DELETED",
                            "event_name": "UPDATE_ASSET",
                            "event_type": "SERVICE_DELETION",
                            "service_name": "test-slack",
                            "timestamp": "2017-07-13T01:18:35:556",
                            "event_handler": "JENKINS"
                        }
                         */

                        var payload = JSON.parse(new Buffer(encodedPayload, "base64").toString("ascii"));
                        logger.info("payload:" + JSON.stringify(payload));
                        if (payload.Item.EVENT_TYPE && payload.Item.EVENT_TYPE.S) {
                            EVT_TYPE = payload.Item.EVENT_TYPE.S;
                        }

                        serviceContxt = JSON.parse(payload.Item.SERVICE_CONTEXT.S);

                        if (serviceContxt.type) {
                            AssetType = serviceContxt.type;
                        }

                        if (payload.Item.EVENT_STATUS && payload.Item.EVENT_STATUS.S) {
                            EVT_STATUS = payload.Item.EVENT_STATUS.S;
                        }

                        if (AssetType === null || AssetType === undefined) {
                            //Asset Type is not present in the Event data.
                            logger.error("Asset Type is not defined");
                        }
                        if (_.includes(event_config.EVENT_STATUS, EVT_STATUS)) {
                            logger.info("EVENT TYPE: " + EVT_TYPE + ",EVENT STATUS: " + EVT_STATUS + ", ASSET TYPE: " + AssetType);
                            innerCallback(null, {
                                interested_event: true,
                                payload: payload,
                                event_name: EVT_NAME,
                                event_type: EVT_TYPE,
                                event_status: EVT_STATUS,
                                asset_type: AssetType
                            });
                        } else {
                            logger.info("EVENT STATUS is not interesting.");
                            logger.info("EVENT TYPE: " + EVT_TYPE + ",EVENT STATUS: " + EVT_STATUS + ", ASSET TYPE: " + AssetType);
                            //This is not an interesting event_status
                            innerCallback(null, {
                                interested_event: false
                            });
                        }
                    } else {
                        logger.info("EVENT NAME is not interesting.");
                        logger.info("EVENT NAME: " + EVT_NAME);
                        //This is not an interesting event_name
                        innerCallback(null, {
                            interested_event: false
                        });
                    }
                },

                callAssetsSearchService: [
                    "checkInterest",
                    function(results, innerCallback) {
                        logger.info("Interested: " + results.checkInterest.interested_event);

                        if (results.checkInterest.interested_event) {
                            if (
                                results.checkInterest.event_name &&
                                results.checkInterest.event_name === configData.INTERESTED_EVENT_CONFIGURATION.EVENT_CREATE_ASSET
                            ) {
                                var service_name = results.checkInterest.payload.Item.SERVICE_NAME.S;
                                logger.info("Service Name:" + service_name);
                                if (
                                    serviceContxt.provider !== undefined ||
                                    serviceContxt.provider !== null ||
                                    serviceContxt.provider_id !== undefined ||
                                    serviceContxt.provider_id !== null ||
                                    serviceContxt.domain !== undefined ||
                                    serviceContxt.domain !== null ||
                                    service_name !== undefined ||
                                    service_name !== null
                                ) {
                                    var createAssetPayload = {
                                        environment: serviceContxt.environment,
                                        service: service_name,
                                        status: "ACTIVE",
                                        provider: serviceContxt.provider,
                                        provider_id: serviceContxt.provider_id,
                                        domain: serviceContxt.domain,
                                        type: serviceContxt.type,
                                        created_by: serviceContxt.created_by,
                                        tags: serviceContxt.tags
                                    };

                                    var svcPostPayload;
                                    //call asset services POST
                                    svcPostPayload = {
                                        uri: configData.ASSETS_API_URL + configData.ASSETS_API_RESOURCE,
                                        method: "POST",
                                        json: createAssetPayload,
                                        rejectUnauthorized: false
                                    };
                                    logger.info("Service URI:" + svcPostPayload.uri);

                                    request(svcPostPayload, function(error, response, body) {
                                        if (response.statusCode === 200) {
                                            logger.info("Asset Created Successfully: " + JSON.stringify(response.body));
                                            innerCallback(null, response.body);
                                        } else {
                                            logger.error("Processing error while creating a new asset with payload: " + JSON.stringify(createAssetPayload));
                                            logger.error(response.body.message);
                                            innerCallback({
                                                error: "Error creating a new asset in asset service."
                                            });
                                        }
                                    });
                                } else {
                                    logger.error("Asset Metadata to create an asset is not present in event payload. Hence error in creating asset. ");
                                    innerCallback({
                                        error: "Error creating an asset from  asset event, as asset metadata is not present in event payload"
                                    });
                                }
                            } else if (
                                results.checkInterest.event_name &&
                                results.checkInterest.event_name === configData.INTERESTED_EVENT_CONFIGURATION.EVENT_UPDATE_ASSET
                            ) {
                                var updateAssetPayload = {};

                                var service = results.checkInterest.payload.Item.SERVICE_NAME.S;
                                //Verify the asset update values so that the existing values of an asset is not corrupted
                                if (serviceContxt.status !== undefined || serviceContxt.status !== null) {
                                    updateAssetPayload.status = serviceContxt.status;
                                }

                                if (serviceContxt.provider !== undefined || serviceContxt.provider !== null) {
                                    updateAssetPayload.provider = serviceContxt.provider;
                                }
                                if (serviceContxt.provider_id !== undefined || serviceContxt.provider_id !== null) {
                                    updateAssetPayload.provider_id = serviceContxt.provider_id;
                                }
                                if (serviceContxt.service !== undefined || serviceContxt.service !== null) {
                                    updateAssetPayload.service = service;
                                }
                                if (serviceContxt.domain !== undefined || serviceContxt.domain !== null) {
                                    updateAssetPayload.domain = serviceContxt.domain;
                                }
                                if (serviceContxt.environment !== undefined || serviceContxt.environment !== null) {
                                    updateAssetPayload.environment = serviceContxt.environment;
                                }
                                if (serviceContxt.created_by !== undefined || serviceContxt.created_by !== null) {
                                    updateAssetPayload.created_by = serviceContxt.created_by;
                                }
                                if (serviceContxt.tags !== undefined || serviceContxt.tags !== null) {
                                    updateAssetPayload.tags = serviceContxt.tags;
                                }

                                logger.info("Asset Update payload:" + JSON.stringify(updateAssetPayload));

                                var searchAssetPayload = {
                                    provider_id: serviceContxt.provider_id,
                                    service: service,
                                    domain: serviceContxt.domain
                                };
                                logger.info("Asset Search payload:" + JSON.stringify(searchAssetPayload));

                                var svcPostSearchPayload;
                                //call search asset services POST
                                svcPostSearchPayload = {
                                    uri: configData.ASSETS_API_URL + configData.ASSETS_API_SEARCH_RESOURCE,
                                    method: "POST",
                                    json: searchAssetPayload,
                                    rejectUnauthorized: false
                                };
                                logger.info("Service URI:" + svcPostSearchPayload.uri);

                                var assetId;
                                request(svcPostSearchPayload, function(error, response, body) {
                                    if (response.statusCode === 200) {
                                        logger.info("Asset information obtained: " + JSON.stringify(response.body));
                                        if (response.body.data && response.body.data.length > 0) {
                                            assetId = response.body.data[0].id;
                                            if (assetId !== undefined || assetId !== null || assetId !== "") {
                                                logger.info("Asset Id: " + assetId);
                                                var svcPutPayload;
                                                //call asset services put for deleting the object
                                                svcPutPayload = {
                                                    uri: configData.ASSETS_API_URL + configData.ASSETS_API_RESOURCE + "/" + assetId,
                                                    method: "PUT",
                                                    json: updateAssetPayload,
                                                    rejectUnauthorized: false
                                                };
                                                logger.info("Service URI:" + svcPutPayload.uri);

                                                request(svcPutPayload, function(error, response, body) {
                                                    if (response.statusCode === 200) {
                                                        logger.info("Asset updated Successfully: " + JSON.stringify(response.body));
                                                        innerCallback(null, response.body);
                                                    } else {
                                                        logger.error("Processing error while updating an asset. ");
                                                        logger.error(response.body.message);
                                                        innerCallback({
                                                            error: "Error updating an asset in asset service."
                                                        });
                                                    }
                                                });
                                            }
                                        } else {
                                            //If Asset ID is not found, i.e., Asset is not present then Asset should be created
                                            //This is done to support backfilling asset information for existing services
                                            var service_name = results.checkInterest.payload.Item.SERVICE_NAME.S;
                                            if (
                                                serviceContxt.provider !== undefined ||
                                                serviceContxt.provider !== null ||
                                                serviceContxt.provider_id !== undefined ||
                                                serviceContxt.provider_id !== null ||
                                                serviceContxt.domain !== undefined ||
                                                serviceContxt.domain !== null ||
                                                service_name !== undefined ||
                                                service_name !== null
                                            ) {
                                                var createAssetPayload = {
                                                    environment: serviceContxt.environment,
                                                    service: service_name,
                                                    status: "ACTIVE",
                                                    provider: serviceContxt.provider,
                                                    provider_id: serviceContxt.provider_id,
                                                    domain: serviceContxt.domain,
                                                    type: serviceContxt.type,
                                                    created_by: serviceContxt.created_by,
                                                    tags: serviceContxt.tags
                                                };

                                                var svcPostPayload;
                                                //call asset services POST
                                                svcPostPayload = {
                                                    uri: configData.ASSETS_API_URL + configData.ASSETS_API_RESOURCE,
                                                    method: "POST",
                                                    json: createAssetPayload,
                                                    rejectUnauthorized: false
                                                };
                                                logger.info("Service URI:" + svcPostPayload.uri);

                                                request(svcPostPayload, function(error, response, body) {
                                                    if (response.statusCode === 200) {
                                                        logger.info("Asset Created Successfully: " + JSON.stringify(response.body));
                                                        innerCallback(null, response.body);
                                                    } else {
                                                        logger.error(
                                                            "Processing error while creating a new asset with payload: " + JSON.stringify(createAssetPayload)
                                                        );
                                                        logger.error(response.body.message);
                                                        innerCallback({
                                                            error: "Error creating a new asset in asset service."
                                                        });
                                                    }
                                                });
                                            } else {
                                                logger.error("Asset Id is not present in event payload. Hence error in updating asset. ");
                                                innerCallback({
                                                    error: "Error updating an asset in asset service, as asset id is not present in event payload"
                                                });
                                            }
                                        }
                                    } else {
                                        logger.error("Processing error while searching for an asset with payload: " + JSON.stringify(searchAssetPayload));
                                        logger.error(response.body.message);
                                        innerCallback({
                                            error: "Error searching an asset in asset service."
                                        });
                                    }
                                });
                            }
                        }
                    }
                ]
            },
            function(err, results) {
                callback();
            }
        );
    });
};
