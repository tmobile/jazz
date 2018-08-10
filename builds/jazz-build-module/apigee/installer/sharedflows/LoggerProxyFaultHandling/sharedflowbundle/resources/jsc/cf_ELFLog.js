 var elfRequest = context.getVariable("elfLog.proxyRequest");
var elfContentType = context.getVariable("elfLog.contentType");
/*if(typeof elfContentType !== 'undefined' && elfContentType !== null && !(elfContentType.indexOf("urlencoded") > 0)) {
	if(typeof elfRequest !== 'undefined' && elfRequest !== null && elfRequest.length > 0)
	{
	  if (IsJsonString(elfRequest)){
	        var proxyRequest=JSON.parse(elfRequest);
	        elfRequest = JSON.stringify(proxyRequest);
	    }
	}
}*/
if(context.getVariable("elfLog.logPayloadScope"))
var logMessage = '{ "logPayloadScope":"'+ context.getVariable("elfLog.logPayloadScope")+'",';
else
var logMessage = '{ "logPayloadScope": null,';
if(context.getVariable("elfLog.acceptType")&& context.getVariable("elfLog.acceptType")!=="")
logMessage+='"acceptType":"'+ context.getVariable("elfLog.acceptType")+'",';
if(context.getVariable("elfLog.contentType")&& context.getVariable("elfLog.contentType")!=="")
logMessage+='"contentType":"'+ context.getVariable("elfLog.contentType")+'",';
if(context.getVariable("senderid")&& context.getVariable("senderid")!=="")
logMessage+='"senderId":"'+ context.getVariable("senderid")+'",';
if(context.getVariable("channelid")&& context.getVariable("channelid")!=="")
logMessage+='"channelId":"'+ context.getVariable("channelid")+'",';
if(context.getVariable("applicationId")&& context.getVariable("applicationId")!=="")
logMessage+='"applicationId":"'+ context.getVariable("applicationId")+'",';
if(context.getVariable("applicationUserId")&& context.getVariable("applicationUserId")!=="")
logMessage+='"applicationUserId":"'+ context.getVariable("applicationUserId")+'",';
if(context.getVariable("sessionid")&& context.getVariable("sessionid")!=="")
logMessage+='"sessionId":"'+ context.getVariable("sessionid")+'",';
if(context.getVariable("elfLog.interactionId")&& context.getVariable("elfLog.interactionId")!=="")
logMessage+='"interactionId":"'+ context.getVariable("elfLog.interactionId")+'",';
if(context.getVariable("elfLog.workflowId")&& context.getVariable("elfLog.workflowId")!=="")
logMessage+='"workflowId":"'+ context.getVariable("elfLog.workflowId")+'",';
if(context.getVariable("elfLog.activityId")&& context.getVariable("elfLog.activityId")!=="")
logMessage+='"activityId":"'+ context.getVariable("elfLog.activityId")+'",';
if(context.getVariable("dealerCode")&& context.getVariable("dealerCode")!=="")
logMessage+='"dealerCode":"'+ context.getVariable("dealerCode")+'",';
if(context.getVariable("masterDealerCode")&& context.getVariable("masterDealerCode")!=="")
logMessage+='"masterDealerCode":"'+ context.getVariable("masterDealerCode")+'",';
if(context.getVariable("storeid")&& context.getVariable("storeid")!=="")
logMessage+='"storeId":"'+ context.getVariable("storeid")+'",';
if(context.getVariable("salesChannelCode")&& context.getVariable("salesChannelCode")!=="")
logMessage+='"salesChannelCode":"'+ context.getVariable("salesChannelCode")+'",';
if(context.getVariable("salesSubChannelCode")&& context.getVariable("salesSubChannelCode")!=="")
logMessage+='"salesSubChannelCode":"'+ context.getVariable("salesSubChannelCode")+'",';
if(context.getVariable("subChannelCategory")&& context.getVariable("subChannelCategory")!=="")
logMessage+='"subChannelCategory":"'+ context.getVariable("subChannelCategory")+'",';
if(context.getVariable("inventoryChannelCode")&& context.getVariable("inventoryChannelCode")!=="")
logMessage+='"inventoryChannelCode":"'+ context.getVariable("inventoryChannelCode")+'",';
logMessage+='"proxyName":"'+ context.getVariable("apiproxy.name")+'",';
logMessage+='"apiName":"'+ context.getVariable("elfLog.proxyFlowName")+'",';
logMessage+='"isError":"'+ context.getVariable("is.error")+'",';
logMessage+='"responseStatusCode":"'+ context.getVariable("error.status.code")+'",';
logMessage+='"reasonPharse":"'+ context.getVariable("error.reason.phrase")+'",';
logMessage+='"systemTimestamp":"'+ context.getVariable("system.timestamp")+'",';
logMessage+='"organization":"'+ context.getVariable("organization.name")+'",';
logMessage+='"environment":"'+ context.getVariable("environment.name")+'",';
logMessage+='"serviceTransactionId":"'+ context.getVariable("serviceTransactionId")+'",';
logMessage+='"messageId":"'+ context.getVariable("messageid")+'",';
logMessage+='"requestVerb":"'+ context.getVariable("elfLog.requestVerb")+'",';
logMessage+='"requestPathDefinition":"'+ context.getVariable("requestpath.definition")+'",';
logMessage+='"proxyUrl":"'+ context.getVariable("proxy.url")+'",';
logMessage+='"clientReceivedStartTmestamp":"'+ context.getVariable("client.received.start.timestamp")+'",';
logMessage+='"clientReceivedEndTimestamp":"'+ context.getVariable("client.received.end.timestamp")+'",';
logMessage+='"targetRouteService":"'+ context.getVariable("capi.target.route.service")+'",';
logMessage+='"targetRouteOperation":"'+ context.getVariable("capi.target.route.operation")+'",';
logMessage+='"proxyClientIp":"'+ context.getVariable("proxy.client.ip")+'",';
logMessage+='"requestHeaders":'+  context.getVariable("elfRequestHeaders")+',';
logMessage+='"proxyRequest":'+ JSON.stringify(elfRequest)+',';
logMessage+='"targetRequest":'+ JSON.stringify(context.getVariable("elfLog.targetRequest"))+',';
logMessage+='"targetResponse":'+ JSON.stringify(context.getVariable("elfLog.targetResponse"))+',';
logMessage+='"proxyResponse":'+ JSON.stringify(context.getVariable("elfLog.proxyResponse"))+',';
logMessage+='"proxyFaultRequest":'+ JSON.stringify(context.getVariable("elfLog.proxyFaultRequest"))+',';
logMessage+='"targetRequestIndex":"'+ context.getVariable("targetRequestIndex")+'",';
	logMessage+='"target":'+ '[';
	for (var i = 1; i <= context.getVariable("targetRequestIndex"); i++) {
		logMessage+='{';
		logMessage+='"targetIndex":"'+ i+'",';
		logMessage+='"targetCallType":"'+ context.getVariable("targetCallType" + i)+'",';
		logMessage+='"targetName":"'+ context.getVariable("targetNameVar" + i)+'",';
		logMessage+='"targetServer":"'+ context.getVariable("targetServerVar" + i)+'",';
		logMessage+='"targetOperation":"'+ context.getVariable("targetOperationVar" + i)+'",';
		logMessage+='"targetReqStart":"'+ context.getVariable("targetReqStartVar" + i)+'",';
		logMessage+='"targetReqEnd":"'+ context.getVariable("targetReqEndVar" + i)+'",';
		logMessage+='"targetRespStart":"'+ context.getVariable("targetRespStartVar" + i)+'",';
		logMessage+='"targetRespEnd":"'+ context.getVariable("targetRespEndVar" + i)+'",';
		logMessage+='"targetRequest":'+  JSON.stringify(context.getVariable("targetRequestVar" + i))+',';
		logMessage+='"targetResponse":'+  JSON.stringify(context.getVariable("targetResponseVar" + i));
		logMessage+='}';
		if((i+1) <= context.getVariable("targetRequestIndex"))
		logMessage+=',';
	}
	logMessage+=']';
logMessage+='}';

var clientScheme = context.getVariable("client.scheme");

if(context.getVariable("LoggerEndpoint"))
    var endpoint = context.getVariable("LoggerEndpoint");
else
    var endpoint = clientScheme + "://" +  context.getVariable("requestHeaderHost") + "/v1/logger";

var headers = {'Content-Type' : 'application/json' };

var logRequest=new Request(endpoint,"POST",headers,logMessage);

context.setVariable("logMessage",logMessage);

var exchange = httpClient.send(logRequest);

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}