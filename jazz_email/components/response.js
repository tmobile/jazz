/**
	Nodejs Template Project
  @module: response.js
  @description: Defines reponse object
	@author:
	@version: 1.0
**/

module.exports = (response, input) => {
  var output = {
    "data": response,
    "input": input
  };
  return output;
};
