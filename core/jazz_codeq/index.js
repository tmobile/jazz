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

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const messages = require("./config/messages");
const validation = require('./validation');
const utils = require('./utils');

function handler(event, context, cb) {

  //Initializations
  let serviceContext = event;
  let errorHandler = errorHandlerModule();
  let config = configModule.getConfig(event, context);

  logger.init(serviceContext, context);

  try {
    logger.debug(serviceContext.resourcePath);
    utils.getAPIPath(serviceContext.resourcePath)
      .then(data => {
        const pathString = data.pathString;
        let serviceId
        logger.debug(pathString);
        if (serviceContext && serviceContext.method && serviceContext.method === 'GET' && pathString === "codeq") {
          logger.debug(`code quality service called with pathstring - ${pathString}`);
          let headers = exportable.changeToLowerCase(serviceContext.headers);
          let header_key = config.SERVICE_ID_HEADER_KEY.toLowerCase();
          if (!headers[header_key]) {
            logger.error('No service id provided in  headers');
            return cb(JSON.stringify(errorHandler.throwInputValidationError('No service id provided in  headers.')));
          }
          serviceId = headers[header_key];
          const result = getCodeqInputsUsingQuery(serviceContext, config);

          if (result.error) {
            const errorMessage = (typeof result.error === 'object') ? JSON.stringify(errorHandler.throwInputValidationError(result.error)) : result.error;
            logger.error(errorMessage);
            return cb(errorMessage);
          } else {
            const metrics = result.metrics;
            const toDate = result.toDate;
            const fromDate = result.fromDate;
            const query = result.query;

            return utils.getJazzToken(config)
              .then((data) => utils.getProjectBranch(data.auth_token, query, config, serviceId)
              ).then(data => utils.getCodeqReport(metrics, data.branch, toDate, fromDate, query, config, serviceContext)
              ).then(data => {
                const output = responseObj(data, serviceContext.query);
                return cb(null, output);
              }).catch(err => {
                const output = exportable.getReportOnError(err, metrics, config, serviceContext);
                if (output.error) {
                  logger.error(output.error);
                  return cb(JSON.stringify(errorHandler.throwInputValidationError(output.error)));
                } else {
                  return cb(null, output);
                }
              });
          }
          //pathstring == 'help'
        } else if (serviceContext && serviceContext.method && serviceContext.method === 'GET' && pathString === "help") {
          logger.debug(`code quality service called with path - ${pathString}`);
          const result = getResponseForHelpPathString(serviceContext, config);
          if (result.error) {
            logger.error(result.error);
            return cb(JSON.stringify(errorHandler.throwInputValidationError(result.error)));
          } else {
            return cb(null, result);
          }
        } else {
          return cb(JSON.stringify(errorHandler.throwInputValidationError(messages.SERVICE_INPUT_ERROR)));
        }
      }).catch(err => {
        logger.error(JSON.stringify(err));
        return cb(JSON.stringify(errorHandler.throwInputValidationError(err.errorMessage)));
      });
  } catch (e) {
    logger.error(e);
    return cb(JSON.stringify(errorHandler.throwInternalServerError(e)));
  }
}

function getResponseForHelpPathString(serviceContext, config) {
  const query = utils.getQuery(serviceContext);
  const result = utils.getMetrics(query, config, messages);

  if (result.error) {
    logger.error(result.error);
    return result;
  }

  const metrics = result.metrics;
  let output = { metrics: [] };

  for (let q = metrics.length - 1; q >= 0; q--) {
    const metricsHelp = config.METRICS_HELP[metrics[q]];

    output.metrics.push({
      "name": metrics[q],
      "description": metricsHelp.description,
      "unit": metricsHelp.unit,
      "minValue": metricsHelp.minValue,
      "maxValue": metricsHelp.maxValue
    });
  }

  return responseObj(output, serviceContext.query);
}

function getCodeqInputsUsingQuery(serviceContext, config) {
  let query = utils.getQuery(serviceContext);
  let result = {};
  // validate required fields
  const missingRequiredFields = validation.validateMissingFields(config.REQUIRED_PARAMS, query);
  if (missingRequiredFields) {
    let message = messages.MISSING_FIELDS + missingRequiredFields;
    result.error = message;
    return result;
  }

  //validate from
  const fromDate = validation.validateFromDate(query.from);
  if (!fromDate) {
    result.error = messages.INVALID_FROM_DATE;
    return result;
  }

  // validate to
  const toDate = validation.validateToDate(query.to);
  if (!toDate) {
    result.error = messages.INVALID_TO_DATE;
    return result;
  }

  //validate to is after from
  const toDateAfterFromDate = validation.validateFromAfterTo(fromDate, toDate);
  if (!toDateAfterFromDate) {
    result.error = messages.TO_EARLIER_THAN_FROM;
    return result;
  }

  const metricsResult = utils.getMetrics(query, config, messages);
  if (metricsResult.error) {
    logger.error(metricsResult.error);
    result.error = metricsResult.error;
    return result;
  }

  result = {
    query: query,
    metrics: metricsResult.metrics,
    toDate: toDate,
    fromDate: fromDate
  };

  logger.info(`Metrics: ${result.metrics}\n  FromDate: ${fromDate}\n ToDate: ${toDate}`);
  return result;
}

function getReportOnError(err, metrics, config, serviceContext) {
  let result = {};
  if (err && err.report_error) {
    if (err.code === 404) {
      return utils.getReport(metrics, null, config)
        .then(output => {
          result = responseObj(output, serviceContext.query);
          return result;
        }).catch(err => {
          result.error = err.report_error;
          return result;
        });
    } else {
      result.error = messages.REPORT_METRICS_ERROR;
      return result;
    }
  } else if (err && err.decrypt_error) {
    logger.info(err.decrypt_error);
    result.error = messages.QUALITY_REPORT_ERROR;
    return result;
  }
}

function changeToLowerCase(data) {
	let newArr = {};
	for (let key in data) {
		newArr[key.toLowerCase()] = data[key];
	}
	return newArr;
}

const exportable = {
  getReportOnError,
  handler,
  changeToLowerCase
};

module.exports = exportable;
