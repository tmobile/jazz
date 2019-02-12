/**
	Nodejs Template Project
  @module: response.js
  @description: Defines response object
	@author:
	@version: 1.0
**/

module.exports = (response, input) => {
  const output = {
    "data": response,
    "input": input
  };

  return output;
};
