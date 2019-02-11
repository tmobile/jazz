
const assert = require('assert');

function mustHave(data) {

  notNull(data.resourceGroupName, 'resourceGroupName');
  notNull(data.appName, 'appName');
  notNull(data.stackName, 'stackName');
  notNull(data.eventSourceType, 'eventSourceType');
  notNull(data.resourceName, 'resourceName');
}

function notNull(property, propName) {
  try {
    assert(property);
  } catch (e) {
    let error = `${propName} is not defined`;
    throw error;
  }

}

module.exports = {
  mustHave
};
