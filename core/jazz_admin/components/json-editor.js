"use strict";

const findValue = require("find-value");
const setValue = require("set-value");
const iterateObject = require("iterate-object");

module.exports = class JsonEditor {

  constructor(data) {
    this.data = data;
  }

  //Set a value in a specific path.
  set(path, value) {
    if (typeof path === "object") {
      iterateObject(path, (val, n) => {
        setValue(this.data, n, val)
      });
    } else {
      setValue(this.data, path, value);
    }
    return this;
  }

  //Get a value in a specific path.
  get(path) {
    if (path) {
      return findValue(this.data, path)
    }
    return this.toObject();
  }

  //Remove a path from a JSON object.
  unset(path) {
    return this.set(path, undefined);
  }

  //Returning the data object
  toObject() {
    return this.data;
  }

  //Iterate and update the json with the given input
  editJson(new_configs) {
    Object.keys(new_configs).forEach((key) => {
      let value = this.get(key);
      if (value) {
        if (value.constructor === Array) {
          value.push(new_configs[key]);
          new_configs[key] = value;
        }
      }
      this.set(key, new_configs[key]);
    });
    return this.toObject();
  }

  //Iterate and remove the json keys with the given input
  removeKeys(keys) {
    for (let key in keys) {
      this.unset(keys[key]);
    }
    return this.toObject();
  }

};


