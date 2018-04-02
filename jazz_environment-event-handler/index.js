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
const utils = require("./components/utils.js")(); //Import the utils module.
const errorHandlerModule = require("./components/error-handler.js");

const AWS = require("aws-sdk");
const _ = require("lodash");
const request = require("request");
const async = require("async");
const nanoid = require("nanoid/generate");

module.exports.handler = (event, context, cb) => {
    //Initializations
    var configData = config(context);
    var errorHandler = errorHandlerModule();
    var secretHandler = secretHandlerModule();
    var authToken;

    logger.init(event, context);
    //Parse the Event Name and Event Type configuration as a JSON from the config file.
    var event_config = configData.EVENTS;
    logger.debug("Event_configuration:" + event_config);

    async.series(
        {
            getToken: function(mainCallback) {
                var svcPayload = {
                    uri: configData.TOKEN_URL,
                    method: "POST",
                    json: {
                        username: configData.SERVICE_USER,
                        password: configData.TOKEN_CREDS
                    },
                    rejectUnauthorized: false
                };

                request(svcPayload, function(error, response, body) {
                    if (response.statusCode === 200 && typeof body !== undefined && typeof body.data !== undefined) {
                        authToken = body.data.token;
                        mainCallback(null, {
                            auth_token: authToken
                        });
                    } else {
                        mainCallback({
                            error: "Could not get authentication token for updating Environment catalog.",
                            details: response.body.message
                        });
                    }
                });
            },
            processEvents: function(mainCallback) {
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

                                if (_.includes(event_config.EVENT_NAME, EVT_NAME)) {
                                    var EVT_TYPE;
                                    var EVT_STATUS;

                                    var payload = JSON.parse(new Buffer(encodedPayload, "base64").toString("ascii"));
                                    if (payload.Item.EVENT_TYPE && payload.Item.EVENT_TYPE.S) {
                                        EVT_TYPE = payload.Item.EVENT_TYPE.S;
                                    }
                                    logger.info("Event Type :" + EVT_TYPE);

                                    if (EVT_TYPE === null || EVT_TYPE === undefined) {
                                        //Event Type is not present in the Event data.
                                        logger.info("EVT_TYPE is not defined");
                                        innerCallback(null, {
                                            interested_event: false
                                        });
                                    }

                                    //check if event-type is in the interested event-type list
                                    if (_.includes(event_config.EVENT_TYPE, EVT_TYPE)) {
                                        var service_name = payload.Item.SERVICE_NAME.S;
                                        if (service_name) {
                                            innerCallback(null, {
                                                interested_event: true,
                                                payload: payload,
                                                event_name: EVT_NAME,
                                                event_type: EVT_TYPE
                                            });
                                        } else {
                                            innerCallback({
                                                error: "Service Name not present in Event Payload"
                                            });
                                        }
                                    } else {
                                        //This is not an interesting event_type
                                        logger.debug("EVENT TYPE is not interesting.");
                                        innerCallback(null, {
                                            interested_event: false
                                        });
                                    }
                                } else {
                                    logger.debug("EVENT NAME is not interesting.");
                                    //This is not an interesting event_name
                                    innerCallback(null, {
                                        interested_event: false
                                    });
                                }
                            },

                            populateEnvironmentPayload: [
                                "checkInterest",
                                function(results, innerCallback) {
                                    logger.debug("Interested: " + results.checkInterest.interested_event);

                                    var environmentPayload = {};

                                    if (results.checkInterest.interested_event) {
                                        var payload = results.checkInterest.payload.Item;
                                        logger.info("payload.SERVICE_CONTEXT.S:" + payload.SERVICE_CONTEXT.S);
                                        var serviceContxt = JSON.parse(payload.SERVICE_CONTEXT.S);

                                        if (serviceContxt === undefined) {
                                            logger.debug("Service Context is not defined");

                                            innerCallback({
                                                error: "Service Context is not defined."
                                            });
                                        }

                                        var username = payload.USERNAME.S;
                                        if (username) {
                                            serviceContxt.created_by = username;
                                        }

                                        logger.info("Username:" + username);
                                        var service_name = payload.SERVICE_NAME.S;
                                        if (service_name) {
                                            serviceContxt.service_name = service_name;
                                        }

                                        var required_fields;
                                        var missing_required_fields;

                                        if (results.checkInterest.event_name === event_config.DELETE_ENVIRONMENT) {
                                            required_fields = configData.ENVIRONMENT_UPDATE_REQUIRED_FIELDS;
                                            // validate required fields
                                            missing_required_fields = _.difference(_.values(required_fields), _.keys(serviceContxt));
                                            if (missing_required_fields.length > 0) {
                                                // return inputError
                                                innerCallback({
                                                    error: "Following field(s) are required - " + missing_required_fields.join(", ")
                                                });
                                            } else {
                                                if (serviceContxt.endpoint !== undefined || serviceContxt.endpoint !== null || serviceContxt.endpoint !== "") {
                                                    environmentPayload.endpoint = serviceContxt.endpoint;
                                                }
												
												var event_status = payload.EVENT_STATUS.S;												
												if(event_status === 'STARTED'){
													environmentPayload.status = configData.ENVIRONMENT_DELETE_STARTED_STATUS;
												} else if(event_status === 'FAILED'){
													environmentPayload.status = configData.ENVIRONMENT_DELETE_FAILED_STATUS;
												} else if(event_status === 'COMPLETED'){
													environmentPayload.status = configData.ENVIRONMENT_DELETE_COMPLETED_STATUS;
												}
												logger.debug("Environment Payload for DELETE event:" + JSON.stringify(environmentPayload));

                                                innerCallback(null, {
                                                    environmentPayload: environmentPayload,
                                                    service_name: service_name,
                                                    service_domain: serviceContxt.domain,
                                                    environment_id: serviceContxt.logical_id
                                                });
                                            }
                                        } else if (results.checkInterest.event_name === event_config.UPDATE_ENVIRONMENT) {
                                            required_fields = configData.ENVIRONMENT_UPDATE_REQUIRED_FIELDS;
                                            // validate required fields
                                            missing_required_fields = _.difference(_.values(required_fields), _.keys(serviceContxt));
                                            if (missing_required_fields.length > 0) {
                                                // return inputError
                                                innerCallback({
                                                    error: "Following field(s) are required - " + missing_required_fields.join(", ")
                                                });
                                            } else {
                                                if (serviceContxt.status) {
                                                    environmentPayload.status = serviceContxt.status;
                                                }

                                                if (serviceContxt.endpoint) {
                                                    environmentPayload.endpoint = serviceContxt.endpoint;
                                                }

                                                if (serviceContxt.friendly_name) {
                                                    environmentPayload.friendly_name = serviceContxt.friendly_name;
                                                }

                                                logger.debug("Environment Payload for Update Event:" + JSON.stringify(environmentPayload));

                                                innerCallback(null, {
                                                    environmentPayload: environmentPayload,
                                                    service_name: service_name,
                                                    service_domain: serviceContxt.domain,
                                                    environment_id: serviceContxt.logical_id
                                                });
                                            }
                                        } else if (
                                            results.checkInterest.event_name === event_config.CREATE_BRANCH ||
                                            results.checkInterest.event_name === event_config.INITIAL_COMMIT
                                        ) {
                                            //Create Environment Event
                                            required_fields = configData.ENVIRONMENT_CREATE_REQUIRED_FIELDS;
                                            // validate required fields
                                            missing_required_fields = _.difference(_.values(required_fields), _.keys(serviceContxt));
                                            if (missing_required_fields.length > 0) {
                                                // return inputError
                                                innerCallback({
                                                    error: "Following field(s) are required - " + missing_required_fields.join(", ")
                                                });
                                            } else {
                                                environmentPayload.service = service_name;
												if(serviceContxt.branch === configData.ENVIRONMENT_INTEGRATION_BRANCH) {
													environmentPayload.logical_id = "integration";
												} else {
													var nano_id = nanoid(configData.RANDOM_CHARACTERS, configData.RANDOM_ID_CHARACTER_COUNT);
													//environmentPayload.logical_id = "dev-" + short_id; For backward compatibility
													environmentPayload.logical_id =  nano_id+"-dev";													
												}

                                                if (serviceContxt.domain) {
                                                    environmentPayload.domain = serviceContxt.domain;
                                                }

                                                if (username) {
                                                    environmentPayload.created_by = username;
                                                }

                                                if (serviceContxt.branch) {
                                                    environmentPayload.physical_id = serviceContxt.branch;
                                                }

                                                if (serviceContxt.friendly_name) {
                                                    environmentPayload.friendly_name = serviceContxt.friendly_name;
                                                }

                                                environmentPayload.status = configData.CREATE_ENVIRONMENT_STATUS;

                                                innerCallback(null, {
                                                    environmentPayload: environmentPayload
                                                });
                                            }
                                        } else if (results.checkInterest.event_name === event_config.DELETE_BRANCH) {
                                            required_fields = configData.ENVIRONMENT_UPDATE_REQUIRED_FIELDS;
											var domain_name = (serviceContxt.domain) ? serviceContxt.domain : null;
											logger.info("Delete branch for service: "+ service_name + ", domain:" + domain_name);
											innerCallback(null, {
												service_name: service_name,
                                                service_domain: domain_name
											});
										}
                                    }
                                }
                            ],

                            getEnvironmentId: [
                                "checkInterest",
                                "populateEnvironmentPayload",

                                function(results, innerCallback) {
                                    logger.debug("Payload: " + results.populateEnvironmentPayload.environmentPayload);
                                    var environment_id = results.populateEnvironmentPayload.environment_id;
									
                                    if (
                                        (results.checkInterest.event_name === event_config.UPDATE_ENVIRONMENT ||
											results.checkInterest.event_name === event_config.DELETE_ENVIRONMENT ||
                                            results.checkInterest.event_name === event_config.DELETE_BRANCH) &&
											!environment_id
                                    ) {
										var svcPayload = {
                                            uri:
                                                configData.BASE_API_URL +
                                                configData.ENVIRONMENT_API_RESOURCE +
                                                "?domain=" +
                                                results.populateEnvironmentPayload.service_domain +
                                                "&service=" +
                                                results.populateEnvironmentPayload.service_name,
                                            method: "GET",
                                            headers: { Authorization: authToken },
                                            rejectUnauthorized: false
                                        };

                                        requestAPI(svcPayload, function(err, get_results) {
                                            if (err) {
                                                logger.error("ERROR in updating Environment:" + JSON.stringify(err));
                                            }

                                            if (get_results) {
                                                logger.debug("GET Results:" + JSON.stringify(get_results));
                                                var env_logical_id;
                                                var serviceContxt = JSON.parse(results.checkInterest.payload.Item.SERVICE_CONTEXT.S);

                                                var env_data = JSON.parse(get_results.environment_output);
                                                if (env_data.data.environment) {
                                                    var env_list = env_data.data.environment;
                                                    for (var count = 0; count < env_list.length; count++) {
                                                        if (
                                                            env_list[count].physical_id === serviceContxt.branch &&
                                                            env_list[count].status !== configData.ENVIRONMENT_DELETE_COMPLETED_STATUS
                                                        ) {
                                                            env_logical_id = env_list[count].logical_id;
                                                        }
                                                    }
													logger.info("Environment id of branch: "+ serviceContxt.branch + " is "+ env_logical_id);
                                                    innerCallback(null, {
                                                        environment_id: env_logical_id
                                                    });
                                                }
                                            } else {
                                                innerCallback({
                                                    error: "Error invoking Environment GET API to get environment logical id."
                                                });
                                            }
                                        });
                                    } else if (
                                        (results.checkInterest.event_name === event_config.UPDATE_ENVIRONMENT ||
                                            results.checkInterest.event_name === event_config.DELETE_ENVIRONMENT) &&
                                        environment_id
                                    ) {
                                        innerCallback(null, {
                                            environment_id: environment_id
                                        });
                                    } else if (
                                        results.checkInterest.event_name === event_config.CREATE_BRANCH ||
                                        results.checkInterest.event_name === event_config.INITIAL_COMMIT
                                    ) {
                                        innerCallback(null, {});
                                    } else {
                                        innerCallback({
                                            error: "Error invoking Environment API to get environment logical id."
                                        });
                                    }
                                }
                            ],
                            callEnvironmentAPI: [
                                "checkInterest",
                                "populateEnvironmentPayload",
                                "getEnvironmentId",

                                function(results, innerCallback) {
                                    logger.debug("Payload: " + results.populateEnvironmentPayload.environmentPayload);
                                    var svcPayload;

                                    if (
                                        results.checkInterest.event_name === event_config.CREATE_BRANCH ||
                                        results.checkInterest.event_name === event_config.INITIAL_COMMIT
                                    ) {
                                        var environment_physical_id = results.populateEnvironmentPayload.environmentPayload.physical_id.toLowerCase();
                                        if (environment_physical_id === configData.ENVIRONMENT_PRODUCTION_PHYSICAL_ID) {
                                            svcPayload = {
                                                uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE,
                                                method: "POST",
                                                headers: { Authorization: authToken },
                                                json: results.populateEnvironmentPayload.environmentPayload,
                                                rejectUnauthorized: false
                                            };

                                            async.parallel(
                                                {
                                                    productionEnvironment: function(callback) {
                                                        var prodEnvPayload = results.populateEnvironmentPayload.environmentPayload;
                                                        prodEnvPayload.logical_id = "prod";
                                                        svcPayload.json = prodEnvPayload;

                                                        logger.debug("svcPayload PROD:" + JSON.stringify(svcPayload));
                                                        requestAPI(svcPayload, function(err, results) {
                                                            callback(err, results);
                                                        });
                                                    },
                                                    stageEnvironment: function(callback) {
                                                        var stgEnvPayload = results.populateEnvironmentPayload.environmentPayload;
                                                        stgEnvPayload.logical_id = "stg";
                                                        svcPayload.json = stgEnvPayload;
                                                        logger.debug("svcPayload STG:" + JSON.stringify(svcPayload));
                                                        requestAPI(svcPayload, function(err, results) {
                                                            callback(err, results);
                                                        });
                                                    }
                                                },
                                                function(err, results) {
                                                    if (err) {
                                                        logger.error("ERROR in creating Environment:" + JSON.stringify(err));
                                                        var error_message;

                                                        if (results.productionEnvironment !== undefined && results.stageEnvironment !== undefined) {
                                                            error_message = "Both prod and stg environment creation failed." + err.error;
                                                            err.error = error_message;
                                                        } else if (results.productionEnvironment !== undefined) {
                                                            error_message = "Production environment creation failed." + err.error;
                                                            err.error = error_message;
                                                        } else if (results.stageEnvironment !== undefined) {
                                                            error_message = "Staging environment creation failed." + err.error;
                                                            err.error = error_message;
                                                        }
                                                    }
                                                    logger.debug("Results:" + JSON.stringify(results));
                                                    innerCallback(err, results);
                                                }
                                            );
                                        } else {
                                            svcPayload = {
                                                uri: configData.BASE_API_URL + configData.ENVIRONMENT_API_RESOURCE,
                                                method: "POST",
                                                headers: { Authorization: authToken },
                                                json: results.populateEnvironmentPayload.environmentPayload,
                                                rejectUnauthorized: false
                                            };

                                            requestAPI(svcPayload, function(err, results) {
                                                if (err) {
                                                    logger.error("ERROR in creating Environment:" + JSON.stringify(err));
                                                }

                                                logger.debug("Results:" + JSON.stringify(results));
                                                innerCallback(err, results);
                                            });
                                        }
                                    } else if (
                                        results.checkInterest.event_name === event_config.UPDATE_ENVIRONMENT ||
                                        results.checkInterest.event_name === event_config.DELETE_ENVIRONMENT
                                    ) {
                                        var updatePayload = {};

                                        svcPayload = {
                                            uri:
                                                configData.BASE_API_URL +
                                                configData.ENVIRONMENT_API_RESOURCE +
                                                "/" +
                                                results.getEnvironmentId.environment_id +
                                                "?domain=" +
                                                results.populateEnvironmentPayload.service_domain +
                                                "&service=" +
                                                results.populateEnvironmentPayload.service_name,
                                            method: "PUT",
                                            headers: { Authorization: authToken },
                                            json: results.populateEnvironmentPayload.environmentPayload,
                                            rejectUnauthorized: false
                                        };

                                        logger.debug("Environment API payload for update:" + JSON.stringify(svcPayload));

                                        if (svcPayload !== undefined) {
                                            requestAPI(svcPayload, function(err, results) {
                                                if (err) {
                                                    logger.error("ERROR in updating Environment:" + JSON.stringify(err));
                                                }

                                                logger.debug("Results:" + JSON.stringify(results));
                                                innerCallback(err, results);
                                            });
                                        }
									} else if (	results.checkInterest.event_name === event_config.DELETE_BRANCH && 
												results.populateEnvironmentPayload && 
												results.getEnvironmentId.environment_id ) {
										var envPayload = {
											"service_name" : results.populateEnvironmentPayload.service_name,
											"domain": results.populateEnvironmentPayload.service_domain,
											"version": "LATEST",
											"environment_id" : results.getEnvironmentId.environment_id
										};
											
										var delSerPayload = {
											uri: configData.BASE_API_URL + configData.DELETE_ENVIRONMENT_API_RESOURCE,
											method: "POST",
											headers: { Authorization: authToken },
											json: envPayload,
											rejectUnauthorized: false
										};
										requestAPI(delSerPayload, function(err, results) {
											if (err) {
												logger.error("Error invoking delete api to clean up environment: "+ envPayload.environment_id +" exception: " + JSON.stringify(err));
											}
											logger.debug("Results:" + JSON.stringify(results));
											innerCallback(err, results);
										});
									} else {
                                        innerCallback({
                                            error: "Error invoking Environment API, payload is not defined."
                                        });
                                    }
                                }
                            ]
                        },
                        function(err, results) {
                            if (err) {
                                logger.error("Error in Inner Callback:" + JSON.stringify(err));
                            }
                            callback();
                        }
                    );
                });
            }
        },
        function(err, results) {
            if (err) {
                logger.error("Error occured: " + JSON.stringify(err));
                cb(err);
            } else {
                cb(null, results);
            }
        }
    );
};

var requestAPI = function(svcPayload, requestCallback) {
	request(svcPayload, function(error, response, body) {
        if (response.statusCode === 200) {
            var output = body;
            if (!output) {
                logger.error("Error returned from environment API: " + JSON.stringify(output));
                requestCallback({
                    error: "Error returned from environment API:" + JSON.stringify(output)
                });
            } else {
                requestCallback(null, {
                    result: "success",
                    environment_output: output
                });
            }
        } else if (response.statusCode === 400) {
            logger.error("Error returned from environment API (response.statusCode== 400):" + JSON.stringify(body));
            requestCallback({
                error: "Error returned from environment API:" + JSON.stringify(body)
            });
        } else {
            logger.error("Error returned from environment API ():" + JSON.stringify(error));
            requestCallback({
                error: "Error returned from environment API:" + JSON.stringify(error)
            });
        }
    });
};
