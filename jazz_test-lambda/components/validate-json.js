
  /** 
  @module: validate-JSON.js
  @description: Validates ARN value for a lambda function in this case Authorizer
  @author:
  @version: 1.0
**/
var validateJSON = (jsonString) =>  {
    try {
      var o = JSON.parse(jsonString);
      if (o && typeof o === "object") {
        return o;
      }
    } catch (e) {}
    return false;
  }
module.exports = (jsonString) => {
  var isarnvalid = validateJSON(jsonString);
  return isarnvalid;
};
