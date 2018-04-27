/** 
  @module: validate-arn.js
  @description: Validates ARN value for a lambda function in this case Authorizer
  @author:
  @version: 1.0
**/

var validateARN = (arn) => {

  var arnvalues = arn.split(":");
  var isarnvalid = true;
  //validate if arn is a valid Lambda
  if(arn.indexOf("arn:aws:lambda") !== 0)
    isarnvalid = false;
  if(arnvalues[5] !== "function")
    isarnvalid = false;
  if(arnvalues.length > 7)
    isarnvalid = false;
  return isarnvalid;

};

module.exports = (arn) => {
    var isarnvalid = validateARN(arn);
    return isarnvalid;
};
