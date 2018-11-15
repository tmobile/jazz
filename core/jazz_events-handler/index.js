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

const async = require("async");
const AWS = require('aws-sdk');

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const fcodes = require('./utils/failure-codes.js');

const dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

function handler(event, context, cb) {

  //Initializations
  let config = configModule.getConfig(event, context);

  let processedEvents = [];
  let failedEvents = [];

  let interestedEvents = [];
  let failureCodes = fcodes();

  exportable.getEvents(config)
    .then(() => exportable.processRecords(config))
    .then((result) => { return cb(null, { "processed_events": processedEvents.length, "failed_events": failedEvents.length }); })
    .catch(err => {
      return logger.error('Error inside events handler ' + JSON.stringify(err));
    });
};

function getEvents(config) {
  return new Promise((resolve, reject) => {
    let params = {
      TableName: config.EVENT_NAME_TABLE,
      ProjectionExpression: "EVENT_NAME",
      Limit: 1000,
      ReturnConsumedCapacity: "TOTAL"
    };

    let scanExecute = function (callback) {
      docClient.scan(params, function (err, result) {
        if (err) {
          return reject({ "db_error": "Unable to scan Event Names table to fetch interested events" });
        } else {
          //interestedEvents = interestedEvents.concat(result.Items);
          for (i = 0; i < result.Items.length; i++) {
            interestedEvents.push(result.Items[i].EVENT_NAME);
          }

          if (result.LastEvaluatedKey) {
            params.ExclusiveStartKey = result.LastEvaluatedKey;
            scanExecute(callback);
          } else {
            return resolve(interestedEvents);
          }
        }
      });
    };
    scanExecute(callback);
  })
}

function processRecords(config) {
  return new Promise((resolve, reject) => {
    let processEachEventPromises = [];
    for (let i = 0; i < event.Records.length; i++) {
      processEachEventPromises.push(exportable.processEachEvent(event.Records[i], config));
    }

    Promise.all(processEachEventPromises)
    .then((result) => {
      return resolve(result);
    })
    .catch((error) => {
      return resolve();
    });
  });

}

function processEachEvent(record, config) {
  return new Promise((resolve, reject) => {
    let sequenceNumber = record.kinesis.sequenceNumber;
    let encodedPayload = record.kinesis.data;
    let payload = new Buffer(encodedPayload, 'base64').toString('ascii');

    if (interestedEvents.indexOf(record.kinesis.partitionKey) !== -1) {
      let params = JSON.parse(payload);
      params.ReturnConsumedCapacity = "TOTAL";
      params.TableName = config.EVENT_TABLE;

      dynamodb.putItem(params, function (err, data) {
        if (err) {
          logger.error('Unable to store event in events table, message: ' + JSON.stringify(err));
          failedEvents.push({
            "sequence_id": sequenceNumber,
            "event": payload,
            "failure_code": failureCodes.DB_ERROR_1.code,
            "failure_message": failureCodes.DB_ERROR_1.message
          });
          return reject(err);
        } else {
          logger.info('Stored interested event in table');
          processedEvents.push({
            "sequence_id": sequenceNumber,
            "event": payload,
            "failure_code": null,
            "failure_message": null
          });
          return resolve({
            "message": "successfully processed interested event"
          });
        }
      });
    } else {
      processedEvents.push({
        "sequence_id": sequenceNumber,
        "event": payload,
        "failure_code": null,
        "failure_message": null
      });
      logger.info('Skipping storage of un-interested event');
      return resolve({
        "message": "successfully processed un-interested event"
      });
    }
  })
}

const exportable = {
  handler,
  getEvents,
  processRecords,
  processEachEvent
}

module.exports = exportable;
