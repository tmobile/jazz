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
'use strict';

const AWS = require('aws-sdk');

const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const fcodes = require('./utils/failure-codes.js');

var failureCodes = fcodes();

function handler(event, context, cb) {
  //Initializations
  let config = configModule.getConfig(event, context);

  exportable.getEvents(config)
    .then(res => exportable.processRecords(config, event, res))
    .then(result => {
      return cb(null, { "processed_events": result.processedEvents.length, "failed_events": result.failedEvents.length });
    })
    .catch(err => {
      return logger.error('Error inside events handler ' + JSON.stringify(err));
    });
};

function getEvents(config) {
  return new Promise((resolve, reject) => {
    const docClient = new AWS.DynamoDB.DocumentClient();
    let interestedEvents = [];
    let params = {
      TableName: config.EVENT_NAME_TABLE,
      ProjectionExpression: "EVENT_NAME",
      Limit: 1000,
      ReturnConsumedCapacity: "TOTAL"
    };

    let scanExecute = function () {
      docClient.scan(params, function (err, result) {
        if (err) {
          return reject({ "db_error": "Unable to scan Event Names table to fetch interested events" });
        } else {
          for (let i = 0; i < result.Items.length; i++) {
            interestedEvents.push(result.Items[i].EVENT_NAME);
          }
          if (result.LastEvaluatedKey) {
            params.ExclusiveStartKey = result.LastEvaluatedKey;
            scanExecute();
          } else {
            return resolve(interestedEvents);
          }
        }
      });
    };
    scanExecute();
  })
}

function processRecords(config, event, res) {
  return new Promise((resolve, reject) => {
    let processedEvents = [];
    let failedEvents = [];
    let processEachEventPromises = [];
    for (let i = 0; i < event.Records.length; i++) {
      processEachEventPromises.push(exportable.processEachEvent(event.Records[i], config, res));
    }
    Promise.all(processEachEventPromises)
      .then((result) => {
        for (let i = 0; i < result.length; i++) {
          if (result[i].status == "success") {
            processedEvents.push({
              "sequence_id": result[i].sequence_id,
              "event": result[i].event,
              "failure_code": null,
              "failure_message": null
            });
          }
          else {
            failedEvents.push({
              "sequence_id": result[i].sequence_id,
              "event": result[i].event,
              "failure_code": failureCodes.DB_ERROR_1.code,
              "failure_message": failureCodes.DB_ERROR_1.message
            });
          }
        }
        return resolve({"processedEvents": processedEvents, "failedEvents": failedEvents});
      })
      .catch((error) => {
        return resolve();
      });
  });
}

function processEachEvent(record, config, interestedEvents) {
  const docClient = new AWS.DynamoDB.DocumentClient();
  return new Promise((resolve, reject) => {
    let sequenceNumber = record.kinesis.sequenceNumber;
    let encodedPayload = record.kinesis.data;
    let payload = new Buffer(encodedPayload, 'base64').toString('ascii');

    if (interestedEvents.indexOf(record.kinesis.partitionKey) !== -1) {
      let data = JSON.parse(payload);
      data.Item = AWS.DynamoDB.Converter.unmarshall(data.Item);
      let params = data;
      params.ReturnConsumedCapacity = "TOTAL";
      params.TableName = config.EVENT_TABLE;

      docClient.put(params, function (err, data) {
        if (err) {
          logger.error('Unable to store event in events table, message: ' + JSON.stringify(err));
          reject({
            "status": "failed",
            "sequence_id": sequenceNumber,
            "event": payload
          });
        } else {
          logger.info('Stored interested event in table');
          resolve({
            "status": "success",
            "sequence_id": sequenceNumber,
            "event": payload
          });
        }
      });
    } else {
      logger.info('Skipping storage of un-interested event');
      resolve({
        "status": "success",
        "sequence_id": sequenceNumber,
        "event": payload
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
