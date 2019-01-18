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
    Helper functions for Config-Catalog
    @module: utils.js
    @description:
    @author:
    @version: 1.0
**/


const AWS = require('aws-sdk');

// initialize document CLient for dynamodb
const initDocClient = () => {
  AWS.config.update({ region: global.config.region });
  let docClient = new AWS.DynamoDB.DocumentClient();
  return docClient;
};

const initDynamodb = () => {
  AWS.config.update({ region: global.config.region });
  let dynamodb = new AWS.DynamoDB();

  return dynamodb;
};

// convert object returned from the database, as per schema
const formatData = (data) => {
  if (data === undefined || data === null) {
    return {};
  }

  let config_obj = {};

  const parseValue = (value) => {
    let type = Object.keys(value)[0];
    let parsed_value = value[type];
    if (type === 'NULL') {
      return null;
    } else if (type === 'N') {
      return Number(value);
    } else if (type === 'NS') {
      return parsed_value.map(Number);
    } else if (type === 'S') {
      return parsed_value;
    } else if (type === 'SS') {
      return parsed_value;
    } else if (type === 'M') {
      let parsed_value_map = {};
      try {
        Object.keys(parsed_value).forEach((key) => {
          parsed_value_map[key] = parseValue(parsed_value[key]);
        });
      } catch (e) { }
      return parsed_value_map;
    } else if (type === 'L') {
      let parsed_value_list = [];
      try {
        for (let i = 0; i < parsed_value.length; i++) {
          parsed_value_list.push(parseValue(parsed_value[i]));
        }
      } catch (e) { }
      return parsed_value_list;
    } else {
      // probably should be error
      return (parsed_value);
    }
  };

  Object.keys(data).forEach((key) => {
    if (data[key]) {
      config_obj[key] = parseValue(data[key]);
    }
  });

  return config_obj;
};

const searchAndAdd = (configs, input) => {
  Object.keys(input).forEach((key) => {
    let key_list = key.split(".");
    let value = configs;
    let childNode = "configs";

    for (let ky in key_list) {
      value = travers(value, key_list[ky]);
      let node = key_list[ky];
      childNode = `${childNode}['${node}']`;
    }

    let parsed_value;
    if (value) {
      if (value.constructor === Array) {
        parsed_value = value.concat(input[key]);
      } else if (value.constructor === Object) {
        parsed_value = value;
        for (let k in input[key]) {
          parsed_value[k] = input[key][k];
        }
      } else {
        parsed_value = input[key]
      }
      eval(childNode + "= parsed_value");
    }
  });
  return configs;
}

const searchAndReplace = (configs, input) => {
  Object.keys(input).forEach((key) => {
    let key_list = key.split(".");
    let childNode = "configs";

    for (let k in key_list) {
      let node = key_list[k];
      childNode = `${childNode}['${node}']`;
    }
    let parsed_value = input[key];

    eval(childNode + "=parsed_value");
  });
  return configs;
}

const searchAndRemove = (configs, input) => {
  for (let k in input) {
    let node = input[k]
    let childNode = `configs.${node}`;
    eval("delete " + childNode);
  };
  return configs;
}

const travers = (data, key) => {
  let node;
  for (let d in data) {
    if (d === key) {
      node = data[key];
    }
  }
  return node;
}


module.exports = {
  initDynamodb: initDynamodb,
  initDocClient: initDocClient,
  formatData: formatData,
  searchAndAdd: searchAndAdd,
  searchAndReplace: searchAndReplace,
  searchAndRemove: searchAndRemove
};
