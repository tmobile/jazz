/** This Java script sets the default traffic management fault handling framewrok **/

var faultName = context.getVariable ("fault.name");
var httpCode;
var reason;
var info;
var message;
var code;

if("SpikeArrestViolation".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1001";
    message = "The rate limit is exceeded";
    code = "Traffic-1001";
    
}else if("InvalidMessageWeight".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1002";
    message = "The message weight value must be an integer";
    code = "Traffic-1002";
    
}else if("FailedToResolveSpikeArrestRate".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1003";
    message = "The referenced variable used to specify the rate can't be resolved";
    code = "Traffic-1003";
    
}else if("QuotaViolation".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1004";
    message = "The quota limit is exceeded";
    code = "Traffic-1004";
    
}else if("InvalidQuotaInterval".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1005";
    message = "Company Status Not Active";
    code = "Traffic-1005";

}else if("FailedToResolveQuota".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1006";
    message = "Internal Server Error";
    code = "Traffic-1006";

}else if("FailedToResolveIntervalReference".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1007";
    message = "Internal Server Error";
    code = "Traffic-1007";
    
}else if("FailedToResolveIntervalTimeUnitReference".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1008";
    message = "Internal Server Error";
    code = "Traffic-1008";
    
}else if("InvalidQuotaTimeUnit".equalsIgnoreCase(faultName)){
    
    httpCode = '500';
    reason = "Internal Server Error";
    info = "https://developers.myapi.com/errors/#Traffic-1009";
    message = "Internal Server Error";
    code = "Traffic-1009";
    
}else{
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