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

  //Iterate and update the list of objects in the json with the given input
  editJsonList(input) {
    let jvalue = this.get(input.path);
    if (jvalue) {
      if (jvalue.constructor === Array) {
        let listObj = jvalue.find(obj => obj[input.id] === input.value);
        const foundIndex = jvalue.findIndex(obj => obj[input.id] === input.value);

        if (listObj) {
          const new_configs = input.body
          Object.keys(new_configs).forEach((key) => {
            let value = findValue(listObj, key);
            if (value) {
              if (value.constructor === Array) {
                value.push(new_configs[key]);
                new_configs[key] = value;
              }
            }
            const jeditor = new this.constructor(listObj);
            jeditor.set(key, new_configs[key]);
            listObj = jeditor.toObject();
          });
          jvalue[foundIndex] = listObj;
          this.set(input.path, jvalue);
        } else {
          return ({ isError: true, error: { errorType: "BadRequest", "message": "No Such object found." } });
        }

      } else {
        return ({ isError: true, error: { errorType: "BadRequest", "message": "Expecting Array but found Object/String." } });
      }
    }
    return ({ isError: false, data: this.toObject() });

  }



  //Iterate and remove the json keys with the given input
  removeKeys(keys) {
    for (let key in keys) {
      this.unset(keys[key]);
    }
    return this.toObject();
  }

  //Iterate and remove the list keys in the list of objects in the json with the given input
  removeJsonList(input) {
    let pathList = input.path.split("#")
    let idList = input.id.split("#")
    let valueList = input.value.split("#")
    let jvalue = this.get(pathList[0]);

    if (pathList.length == 2) {
      if (jvalue) {  //ACCOUNTS
        if (jvalue.constructor === Array) {
          let listObj = jvalue.find(obj => obj[idList[0]] === valueList[0]); // ONE ACNT OBJ
          const foundIndex = jvalue.findIndex(obj => obj[input.id] === input.value);

          if (listObj) {
            let rvalue = findValue(listObj, pathList[1]);
            if (rvalue.constructor === Array) {
              let filter = rvalue.filter(obj => obj[idList[1]] !== valueList[1]); // ONE ACNT OBJ
              const jeditor = new this.constructor(listObj);
              jeditor.set(pathList[1], filter);
              listObj = jeditor.toObject();
            } else {
              return ({ isError: true, error: { errorType: "BadRequest", "message": "Expecting Array but found Object/String." } });
            }
            jvalue[foundIndex] = listObj;
            this.set(pathList[0], jvalue);
          } else {
            return ({ isError: true, error: { errorType: "BadRequest", "message": "No Such object found." } });
          }

        } else {
          return ({ isError: true, error: { errorType: "BadRequest", "message": "Expecting Array but found Object/String." } });
        }
      }
    }else if (pathList.length == 1){
      if (jvalue) {  //ACCOUNTS
        if (jvalue.constructor === Array) {
          let filter = jvalue.filter(obj => obj[idList[0]] !== valueList[0]);
          this.set(pathList[0], filter);
        } else {
          return ({ isError: true, error: { errorType: "BadRequest", "message": "Expecting Array but found Object/String." } });
        }
      }
    }else {
      return ({ isError: true, error: { errorType: "BadRequest", "message": "Not handling more than two level list iteration." } });
    }

    return ({ isError: false, data: this.toObject() });
  }

};


