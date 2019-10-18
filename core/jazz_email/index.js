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
Jazz Email service
@author:
@version: 1.0
 **/

const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configModule = require("./components/config.js");
const logger = require("./components/logger.js");

function handler(event, context, cb) {

	var errorHandler = errorHandlerModule();
	logger.init(event, context);

	var config = configModule.getConfig(event, context);

	if (!config || config.length) {
		logger.error("Cannot load config object, will stop processing");
		return cb(JSON.stringify(errorHandler.throwInternalServerError("101", "Internal error, please reach out to admins")));
	}

	try {
		logger.info(JSON.stringify(event));

		exportable.validateInput(event)
			.then(() => exportable.sendEmail(config, event.body))
			.then((result) => { return cb(null, responseObj({ result: "success", message: result.messageId })); })
			.catch(function (err) {
				logger.error("Failed while sending email: " + JSON.stringify(err));

				if (err.errorType) {
					// error has already been handled and processed for API gateway
					return cb(JSON.stringify(err));
				} else {
					if (err.code) {
						return cb(JSON.stringify(errorHandler.throwInputValidationError(err.code, err.message)));
					}

					return cb(JSON.stringify(errorHandler.throwInternalServerError("106", "Failed while sending email to: " + event.body.to)));
				}
			});
	} catch (e) {
		logger.error('Error in sending email : ' + e.message);
		return cb(JSON.stringify(errorHandler.throwInternalServerError("105", e.message)));
	}
};

/**
 *
 * @param {object} userInput
 * @returns promise
 */
function validateInput(userInput) {
	var errorHandler = errorHandlerModule();

	return new Promise((resolve, reject) => {

		if (!userInput || !userInput.method) {
			return reject(errorHandler.throwInputValidationError("101", "invalid or missing arguments"));
		}

		if (!userInput.principalId) {
			return reject(errorHandler.throwForbiddenError("102", "You aren't authorized to access this resource"));
		}

		if (userInput.method !== 'POST') {
			return reject(errorHandler.throwInputValidationError("103", "Service operation not supported"));
		}

		if (!userInput.body || !userInput.body.from || !userInput.body.to || !userInput.body.subject) {
			return reject(errorHandler.throwInputValidationError("104", "Required params - from, to, subject missing"));
		}

		resolve(userInput);
	});
}

/**
 *
 * @param {*} config
 * @param {*} userInput
 */
function sendEmail(config, userInput) {
	return new Promise((resolve, reject) => {
		var transporter = nodemailer.createTransport({
			SES: new AWS.SES({
				apiVersion: '2010-12-01',
				region: config.REGION
			})
		});

		transporter.sendMail({
			from: userInput.from,
			to: userInput.to,
			cc: userInput.cc,
			bcc: userInput.bcc,
			subject: userInput.subject,
			text: userInput.text,
			html: userInput.html
		}, (err, info) => {
			if (err) {
				logger.error('Error in sending email ' + JSON.stringify(err));
				reject(err);
			} else {
				logger.info('Successfully sent email ' + JSON.stringify(info));
				resolve(info);
			}
		});
	});
}

const exportable = {
	handler,
	validateInput,
	sendEmail
  }

  module.exports = exportable;
