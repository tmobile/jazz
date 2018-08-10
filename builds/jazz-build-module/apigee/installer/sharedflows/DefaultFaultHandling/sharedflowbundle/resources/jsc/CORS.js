var corsDomainCheck = context.getVariable("corsDomain");
var origin = context.getVariable("request.header.origin");
var host = context.getVariable("request.header.host");
var verb = context.getVariable("request.verb");
var corsMaxAge = context.getVariable("corsMaxAge");
var corsAllowMethods = context.getVariable("corsAllowMethods");
var corsAllowHeaders = context.getVariable("corsAllowHeaders");
/** Check if the request.header.origin matches the allowed CORS domain list.
If true allow or else set to access denied list **/
if(verb == "OPTIONS" && corsDomainCheck == "true"){
context.setVariable("response.header.Access-Control-Allow-Origin", origin);
context.setVariable("response.header.Access-Control-Allow-Headers", corsAllowHeaders);
context.setVariable("response.header.Access-Control-Max-Age", corsMaxAge);
context.setVariable("response.header.Access-Control-Allow-Methods", corsAllowMethods);
}else{
/**Set some default values**/
context.setVariable("response.header.Access-Control-Allow-Origin", "*");
context.setVariable("response.header.Access-Control-Allow-Headers", corsAllowHeaders);
context.setVariable("response.header.Access-Control-Max-Age", corsMaxAge);
context.setVariable("response.header.Access-Control-Allow-Methods", corsAllowMethods);
var AccessControlAllowOrigin = context.getVariable("response.header.Access-Control-Allow-Origin");
context.setVariable("AccessControlAllowOrigin",AccessControlAllowOrigin);
}
