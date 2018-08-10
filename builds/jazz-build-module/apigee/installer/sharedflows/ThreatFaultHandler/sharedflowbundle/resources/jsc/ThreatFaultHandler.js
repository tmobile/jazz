/** This Java script sets the default threat fault handling framewrok **/

var faultName = context.getVariable("fault.name");

var httpCode;
var reason;
var info;
var message;
var code;

if(("ExceededContainerDepth".equalsIgnoreCase(faultName)) || ("ExceededObjectEntryCount".equalsIgnoreCase(faultName)) || ("ExceededArrayElementCount".equalsIgnoreCase(faultName)) || ("ExceededObjectEntryNameLength".equalsIgnoreCase(faultName)) || ("ExceededObjectEntryNameLength".equalsIgnoreCase(faultName)) || ("ExceededStringValueLength".equalsIgnoreCase(faultName)) || (threatProtectionEvaluationStatus == "failed")){
    
     httpCode = '400';
     reason = "Bad Request";
     info = "https://developers.myapi.com/errors/#ThreatFault-1001";
     message = "Threat detected. Please check the request payload.";
     code = "ThreatFault-1001";
    
}else if(("SourceUnavailable".equalsIgnoreCase(faultName)) || ("NonMessageVariable".equalsIgnoreCase(faultName)) || ("ExecutionFailed".equalsIgnoreCase(faultName))){
    
     httpCode = '500';
     reason = "Internal Server Error";
     info = "https://developers.myapi.com/errors/#ThreatFault-1002";
     message = "Internal Server Error";
     code = "ThreatFault-1002";

}else {
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