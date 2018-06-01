/** 
  @module: validate-arn.js
  @description: Validates ARN value for a lambda function in this case Authorizer
  @author:
  @version: 1.0
**/
const logger = require("./logger.js");

var validateARN = (arn) => {
  if (arn) {
    var arnvalues = arn.split(":");
    var isarnvalid = true;
    //validate if arn is a valid Lambda
    if (arn.indexOf("arn:aws:lambda") !== 0 || arnvalues[5] !== "function" || arnvalues.length > 8)
      isarnvalid = false;
    return isarnvalid;
  } else {
    return false;
  }

};

module.exports = (arn) => {
  var isarnvalid = validateARN(arn);
  logger.info("inside validate function")
  return isarnvalid;
};
