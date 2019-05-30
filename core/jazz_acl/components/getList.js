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

const AWS = require("aws-sdk");
const logger = require('./logger.js');

/* fetch list of serviceIds from dynamodb */
var scanResult;
async function scanExecute(dynamodb, scanparams, items_formatted) {
    let dataDb = await dynamodb.scan(scanparams).promise();

  	logger.debug("dataDb : " + JSON.stringify(dataDb));

    if ((dataDb && dataDb.Items && dataDb.Items.length) || (dataDb.LastEvaluatedKey && Object.keys(dataDb.LastEvaluatedKey).length > 0)) {
        dataDb.Items.forEach(function (item) {
            items_formatted.push(item.SERVICE_ID.S);
        });
        if (dataDb.LastEvaluatedKey) {
            scanparams.ExclusiveStartKey = dataDb.LastEvaluatedKey;
            await scanExecute(dynamodb, scanparams, items_formatted);
        } else {
            scanResult = {
                data: items_formatted
            };
        }
    } else {
        if (items_formatted.length) {
            scanResult = {
                data: items_formatted
            };
        } else {
            scanResult = {
                error: "No data available"
            };
        }
    }
    logger.debug("scanResult: " + JSON.stringify(scanResult));
    return scanResult
}

async function getSeviceIdList(config, serviceId) {
    let items_formatted = [];
    AWS.config.update({
        region: config.REGION
    });

    let dynamodb = new AWS.DynamoDB({
        apiVersion: '2012-08-10'
    });

    let scanparams = {
        "TableName": config.SERVICES_TABLE_NAME,
        "ProjectionExpression": "SERVICE_ID",
        "ReturnConsumedCapacity": "TOTAL",
        "Limit": "500"
    };
    if (serviceId) {
        scanparams.FilterExpression = "SERVICE_ID = :service_id";
        scanparams.ExpressionAttributeValues = {
            ":service_id": {
                "S": serviceId
            }
        }
    }

    logger.debug("scanparams : " + JSON.stringify(scanparams));
    const dbResult = await scanExecute(dynamodb, scanparams, items_formatted);
    return dbResult;

}

module.exports = {
    getSeviceIdList
};
