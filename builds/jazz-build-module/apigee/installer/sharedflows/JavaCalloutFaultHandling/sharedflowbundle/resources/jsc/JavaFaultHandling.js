/** This Java script sets the default java fault handling framewrok **/

var faultName = context.getVariable("fault.name");

var httpCode;
var reason;
var info;
var message;
var code;

if("ExecutionError".equalsIgnoreCase(faultName)){

     httpCode = '500';
     reason = "Internal Server Error";
     info = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500";
     message = "Invalid Access Token";
     code = "General-1011";

}else {
     httpCode = '500';
     reason = "Internal Server Error";
     info = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500";
     message = "Invalid Access Token";
     code = "General-1011";

}

    context.setVariable ("flow.api.error.code",code);
    context.setVariable ("flow.api.error.message",message);
    context.setVariable ("flow.api.error.info",info);
    context.setVariable ("flow.api.error.status",httpCode);
    context.setVariable ("flow.api.error.reason",reason);
