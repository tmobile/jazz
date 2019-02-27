
const assert = require('assert');

function mustHave(data) {

  notNull(data.resourceGroupName, 'resourceGroupName');
  notNull(data.stackName, 'stackName');
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
  mustHave,
  notNull
};
