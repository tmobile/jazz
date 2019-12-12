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
API to get the application logs
@author:
@version: 1.0
**/

'use strict';
const _ = require("lodash");
const request = require('request');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const formats = require('./utils.js');
var utils = formats('apis');

module.exports.handler = (event, context, cb) => {

  //Initializations
  var errorHandler = errorHandlerModule();
  var config = configModule.getConfig(event, context);
  logger.init(event, context);

  try {

    if (event && event.method && event.method === 'POST') {

      if (!event.body) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Service inputs not defined!")));
      }

      if (!event.body.service) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter service name.")));
      }
      if (!event.body.domain) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter domain.")));
      }
      if (!event.body.environment) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter environment.")));
      }
      if (!event.body.category) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("missing required input parameter category.")));
      }

      if (!event.body.type || !_.includes(config.VALID_LOGTYPES, event.body.type.toLowerCase())) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Only following values are allowed for logger type - " + config.VALID_LOGTYPES.join(", "))));
      }

      if (!_.includes(config.VALID_CATEGORIES, event.body.category.toLowerCase())) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Only following values are allowed for category - " + config.VALID_CATEGORIES.join(", "))));
      }

      if (event.body.asset_type && config.VALID_ASSET_TYPES.indexOf(event.body.asset_type) === -1) {
        return cb(JSON.stringify(errorHandler.throwInputValidationError("Only following values are allowed for asset type - " + config.VALID_ASSET_TYPES.join(", "))));
      }

      var service = event.body.service,
        domain = event.body.domain,
        env = event.body.environment.toLowerCase(),
        categoryType = event.body.category.toLowerCase(),
        assetType = event.body.asset_type ? event.body.asset_type.toLowerCase() : "",
        logType = event.body.type.toUpperCase(),
        page = event.body.offset ? event.body.offset : 0,
        startTime = event.body.start_time ? event.body.start_time : utils.setStartDate(config.DEFAULT_TIME_IN_DAYS),
        endTime = event.body.end_time ? event.body.end_time : new Date(),
        size = event.body.size ? event.body.size : config.DEFAULT_SIZE,
        querys = [];

      if (event.body.asset_identifier) {
        querys.push(utils.setQuery("asset_identifier", event.body.asset_identifier));
      }

      if (event.body.asset_type) {
        querys.push(utils.setQuery("asset_type", event.body.asset_type));
      }

      logger.info("Service:Domain to fetch logs: " + service + ":" + domain);

      querys.push(utils.setQuery("servicename", service));
      querys.push(utils.setQuery("domain", domain));
      querys.push(utils.setQuery("environment", env));

      //Query to filter Control messages
      querys.push(utils.setQuery("!message", "START*"));
      querys.push(utils.setQuery("!message", "END*"));
      querys.push(utils.setQuery("!message", "REPORT*"));

      if (logType) {
        var log_type_config = [];

        log_type_config = config.LOG_LEVELS.map(logLevel => logLevel.Type);

        if (_.includes(log_type_config, logType.toLowerCase())) {
          querys.push(utils.setLogLevelQuery(config.LOG_LEVELS, "log_level", logType.toLowerCase()));
        } else {
          logger.error("Only following values are allowed for logger type - " + log_type_config.join(", "));
          return cb(JSON.stringify(errorHandler.throwInputValidationError("Only following values are allowed for logger type - " + log_type_config.join(", "))));
        }
      }

      logger.info("QueryObj: " + JSON.stringify(querys));
      var servCategory = [];
      if (assetType) {
        let indexMap = config.ASSET_INDEX_MAP.filter(assetObj => (assetObj.asset_type === assetType));
        if (indexMap.length) {
          servCategory = indexMap[0].es_index;
        } else {
          let response = {
            count: 0,
            logs: []
          };
          return cb(null, responseObj(response, event.body));
        }
      }

      var req = utils.requestLoad;
      req.url = config.KIBANA_URL + "/elasticsearch/_msearch";
      req.body = setRequestBody(servCategory, querys, startTime, endTime, size, page);

      request(req, function (err, res, body) {
        logger.debug("Response from ES : " + JSON.stringify(res));
        if (err) {
          logger.error("Error occured : " + JSON.stringify(err));
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Internal Error")));
        } else {
          // Success response
          if (res.statusCode == 200) {
            var responsebody = res.body,
              responsebodyToJSON = JSON.parse(responsebody),
              count = responsebodyToJSON.responses[0].hits.total,
              hits = responsebodyToJSON.responses[0].hits.hits,
              logs = [];

            for (var idx in hits) {
              var log = {};
              log.request_id = hits[idx]._source.request_id;
              log.source = hits[idx]._index;
              log.timestamp = hits[idx]._source.timestamp;
              log.message = hits[idx]._source.message;
              log.type = hits[idx]._source.log_level;
              logs.push(log);
            }

            utils.responseModel.count = count;
            utils.responseModel.logs = logs;

            logger.debug('Output :' + JSON.stringify(utils.responseModel));
            return cb(null, responseObj(utils.responseModel, event.body));

          } else {
            var error_message = 'Unknown error occured';
            var bodyToJSON = JSON.parse(res.body);
            if (typeof bodyToJSON.errors !== 'undefined') {
              error_message = bodyToJSON.errors[0].message;
            }
            logger.error("Exception occured :" + error_message);
            return cb(JSON.stringify(errorHandler.throwInternalServerError("Error while processing the request :" + error_message)));
          }
        }
      });
    } else {
      return cb(JSON.stringify(errorHandler.throwInputValidationError("Invalid request to process for logs API")));
    }
  } catch (e) {
    //Sample Error response for internal server error
    return cb(JSON.stringify(errorHandler.throwInternalServerError("Exception occured while processing the request : " + JSON.stringify(e))));
  }

  function setRequestBody(category, querys, startTime, endTime, size, page) {
    var index = {
      "index": category,
      "ignore_unavailable": true
    };


    var params = {
      "size": size,
      "from": page,
      "sort": [{
        "timestamp": {
          "order": "desc",
          "unmapped_type": "date"
        }
      }],
      "query": {
        "bool": {
          "must": [querys,
            {
              "range": {
                "timestamp": {
                  "gte": utils.toTimestamp(startTime),
                  "lte": utils.toTimestamp(endTime),
                  "format": "epoch_millis"
                }
              }
            }],
          "must_not": [{
            "match": {
              "application_logs_id": {
                "query": "_incomplete_req"
              }
            }
          }]
        }
      },
      "_source": {
        "excludes": []
      },
      "stored_fields": ["*"],
      "script_fields": {}
    };
    var reqBody = JSON.stringify(index) + "\n" + JSON.stringify(params) + "\n";
    logger.info("Request Payload : " + JSON.stringify(reqBody));
    return reqBody;
  }
};
