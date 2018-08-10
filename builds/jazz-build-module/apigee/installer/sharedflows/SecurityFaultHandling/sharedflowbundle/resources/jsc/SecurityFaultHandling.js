/** This Java script sets the default security fault handling framewrok **/

var faultName = context.getVariable("fault.name");
var authFlag = context.getVariable ("authFlag")
var idTokenFlag = context.getVariable("idTokenFlag");
var isValidToken = context.getVariable("isValidToken");
var jwt_isValid = context.getVariable("jwt_isValid");

var httpCode;
var reason;
var info;
var message;
var code;

if("invalid_access_token".equalsIgnoreCase(faultName)){

     httpCode = '400';
     reason = "Bad Request";
     info = "https://developers.myapi.com/errors/#Security-1001";
     message = "Invalid Access Token";
     code = "Security-1001";

}else if("InvalidAPICallAsNoApiProductMatchFound".equalsIgnoreCase(faultName)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#Security-1002";
     message = "The api is not in the product associated with the access token";
     code = "Security-1002";

}else if("InsufficientScope".equalsIgnoreCase(faultName)){

     httpCode = '403';
     reason = "Forbidden";
     info = "https://developers.myapi.com/errors/#Security-1003";
     message = "Insufficient Scope";
     code = "Security-1003";

}else if("access_token_expired".equalsIgnoreCase(faultName)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#Security-1004";
     message = "Access token expired";
     code = "Security-1004";

}else if("CompanyStatusNotActive".equalsIgnoreCase(faultName)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#Security-1005";
     message = "Company Status Not Active";
     code = "Security-1005";

}else if("DeveloperStatusNotActive".equalsIgnoreCase(faultName)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#Security-1006";
     message = "Developer Status Not Active";
     code = "Security-1006";

}else if("FailedToResolveAPIKey".equalsIgnoreCase(faultName)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#Security-1007";
     message = "Failed To Resolve API Key";
     code = "Security-1007";

}else if("InvalidApiKey".equalsIgnoreCase(faultName)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#Security-1008";
     message = "Invalid API Key";
     code = "Security-1008";

}else if("InvalidApiKeyForGivenResource".equalsIgnoreCase(faultName)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#Security-1009";
     message = "Invalid Api Key For Given Resource";
     code = "Security-1009";

}else if("Unresolvediable".equalsIgnoreCase(faultName)){

     httpCode = '500';
     reason = "Internal Server Error";
     info = "https://developers.myapi.com/errors/#Security-1010";
     message = "Internal Server Error";
     code = "Security-1010";

}else if("InvalidBasicAuthenticationSource".equalsIgnoreCase(faultName)){

     httpCode = '500';
     reason = "Internal Server Error";
     info = "https://developers.myapi.com/errors/#Security-1011";
     message = "Internal Server Error";
     code = "Security-1011";

}else if("ClientIpExtractionFailed".equalsIgnoreCase(faultName)){

     httpCode = '500';
     reason = "Internal Server Error";
     info = "https://developers.myapi.com/errors/#Security-1012";
     message = "Internal Server Error";
     code = "Security-1012";

}else if("IPDeniedAccess".equalsIgnoreCase(faultName)){

     httpCode = '403';
     reason = "Forbidden";
     info = "https://developers.myapi.com/errors/#Security-1013";
     message = "Access to API denied from the requested IP address";
     code = "Security-1013";

}else if("false".equalsIgnoreCase(authFlag)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#SECURITY-0029";
     message = "Invalid Auth Token.Please check the auth credentials passed in request.";
     code = "SECURITY-0029";

}else if("false".equalsIgnoreCase(idTokenFlag)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#SECURITY-0030";
     message = "Invalid IAM Token.Please check the auth credentials passed in request.";
     code = "SECURITY-0030";

}else if("false".equalsIgnoreCase(isValidToken)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#SECURITY-0031";
     message = "Invalid POP Token.Please check the auth credentials passed in request.";
     code = "SECURITY-0031";

}else if("false".equalsIgnoreCase(jwt_isValid)){

     httpCode = '401';
     reason = "Unauthorized";
     info = "https://developers.myapi.com/errors/#SECURITY-0035";
     message = "Invalid Access Token.Please check the auth credentials passed in request.";
     code = "SECURITY-0035";

}
else {
     httpCode = '500';
     reason = "Internal Server Error";
     info = "https://developers.myapi.com";
     message = "Internal Server Error";
     code = "General-1000";

}

    context.setVariable ("flow.api.error.code",code);
    context.setVariable ("flow.api.error.message",message);
    context.setVariable ("flow.api.error.info",info);
    context.setVariable ("flow.api.error.status",httpCode);
    context.setVariable ("flow.api.error.reason",reason);
