// Mask sensitive data

var targetRequest = context.getVariable("elfLog.targetRequest");
var targetResponse = context.getVariable("elfLog.targetResponse");
var contentType = context.getVariable("elfLog.contentType");
var acceptType = context.getVariable("elfLog.acceptType");
var proxyRequest = context.getVariable("elfLog.proxyRequest");
var proxyResponse = context.getVariable("elfLog.proxyResponse");

if(acceptType !== null && acceptType.indexOf("xml")> -1)
{
	proxyResponse = maskXMLData(proxyResponse,maskConfigData);
}
else
{
	proxyResponse = maskJSONData(proxyResponse,maskConfigData);
}
if(proxyRequest !== null && proxyRequest !== '') {
	if(contentType !== null && contentType.indexOf("xml")> -1) {
		proxyRequest = maskXMLData(proxyRequest,maskConfigData);
	} else {		
		proxyRequest =  proxyRequest.replace(/[\r\n]/g, "");
		proxyRequest =  proxyRequest.replace(/ /g, ""); 
		proxyRequest = maskJSONData(proxyRequest,maskConfigData);
	}
}
context.setVariable("elfLog.targetRequest",targetRequest);
context.setVariable("elfLog.targetResponse",targetResponse);
context.setVariable("elfLog.proxyRequest",proxyRequest);
context.setVariable("elfLog.proxyResponse",proxyResponse);

// Remove line breaks


var isError = context.getVariable("is.error");
var responseCode = ''; 
if(context.getVariable("response.status.code"))
responseCode = context.getVariable("response.status.code").toString();

var logType="SUCCESS";

if ((isError === true) || responseCode.startsWith("4") || responseCode.startsWith("5")) { logType="ERROR";}


var elfLog = "eventDate=" + context.getVariable("system.timestamp");
elfLog = elfLog + "||component=coreapi";
elfLog = elfLog + "||organization=" + context.getVariable("organization.name");
elfLog = elfLog + "||environment=" + context.getVariable("environment.name");
elfLog = elfLog + "||apiproxy=" +  context.getVariable("apiproxy.name");
elfLog = elfLog + "||serviceTransId=" + context.getVariable("serviceTransactionId");
elfLog = elfLog + "||interactionId=" + context.getVariable("elfLog.interactionId");
elfLog = elfLog + "||logType=" + logType + "||httpMethod=" + context.getVariable("elfLog.requestVerb");
elfLog = elfLog + "||partnerId=" + context.getVariable("senderid");
elfLog = elfLog + "||operationName=" + context.getVariable("requestpath.definition") + "-" + context.getVariable("elfLog.requestVerb");
elfLog = elfLog + "||proxyURL=" + context.getVariable("proxy.url");
//elfLog = elfLog + "||targetServer=" + context.getVariable("target.scheme") + "://" + context.getVariable("target.host") + ":" + context.getVariable("target.port") + context.getVariable("elfLog.targetURI");
elfLog = elfLog + "||proxyFlowName=" + context.getVariable("elfLog.proxyFlowName");
elfLog = elfLog + "||proxyReqStart=" + context.getVariable("client.received.start.timestamp");
elfLog = elfLog + "||proxyReqEnd=" + context.getVariable("client.received.end.timestamp");
elfLog = elfLog + "||CallerIP=" + context.getVariable("proxy.client.ip");

var logScope = context.getVariable("elfLog.logPayloadScope");
if (logScope && logScope.toLowerCase() == "target"){  // log proxy and target including service call out
	var enabledOESCallout = context.getVariable("elfLog.OES.ServiceCalloutEnabled");
	if (enabledOESCallout) {
		elfLog = elfLog + "||OESTargetURI" + context.getVariable("elfLog.OES.targetURI");
		elfLog = elfLog + "||atttargetRequest=" + context.getVariable("elfLog.OES.targetRequest");
		elfLog = elfLog + "||atttargetResponse=" + context.getVariable("elfLog.OES.targetResponse");
	}
}	
if (typeof logScope === 'undefined' || logScope === null || 
	logScope.trim() === '' || logScope.toLowerCase() == "proxy" || logScope.toLowerCase() == "target"){  // log  proxy
	elfLog = elfLog + "||proxyRequestPayloadType=" + context.getVariable("elfLog.contentType") + "||attproxyRequest=" + context.getVariable("elfLog.proxyRequest");
	elfLog = elfLog + "||proxyResponsePayloadType=" + context.getVariable("elfLog.acceptType") + "||attproxyResponse=" + context.getVariable("elfLog.proxyResponse");
}
var targetRequestIndex = context.getVariable("targetRequestIndex");	
var targetReq = "";
var targetRes = "";
var targetLogAttrsJson = {};
var targetLogReqResAttrsJson = {};
var targetLogAttrsXmlArr= [];
var targetLogReqResAttrsXmlArr= [];
var targetTotalDuration = 0;
var indA = 0;
var indB = 0;
targetLogAttrsXmlArr[indA++] = "<targetLogAttrsXml>";
targetLogReqResAttrsXmlArr[indB++] = "<targetLogReqResAttrsXml>";
for (var i = 1; i <= targetRequestIndex; i++) {
targetLogAttrsXmlArr[indA++] = "<target>";
targetLogAttrsXmlArr[indA++] = "<index>" + i + "</index>";
targetLogAttrsXmlArr[indA++] = "<targetName>" + context.getVariable("targetNameVar"+i) + "</targetName>";
	if (context.getVariable("targetServerVar"+i) !== undefined) {
		targetLogAttrsXmlArr[indA++] = "<targetServer>" + context.getVariable("targetServerVar"+i) + "</targetServer>";
	}
	targetLogAttrsXmlArr[indA++] = "<targetOperation>" + context.getVariable("targetOperationVar"+i) + "</targetOperation>";
	targetLogAttrsXmlArr[indA++] = "<targetReqStart>" + context.getVariable("targetReqStartVar"+i) + "</targetReqStart>";
	targetLogAttrsXmlArr[indA++] = "<targetReqEnd>" + context.getVariable("targetReqEndVar"+i) + "</targetReqEnd>";
	if (logScope && logScope.toLowerCase() == "target"){  // log proxy and target including service call out
		targetReq = context.getVariable("targetRequestVar"+i);
		if(targetReq && targetReq.trim().startsWith("{")) {
			targetReq = maskJSONData(targetReq,maskConfigData);
		}
		else {
			targetReq = maskXMLData(targetReq,maskConfigData);
		}
		targetLogReqResAttrsXmlArr[indB++] = "<target>";
		targetLogReqResAttrsXmlArr[indB++] = "<index>" + i + "</index>";
		targetLogReqResAttrsXmlArr[indB++] = "<targetRequest>" + "<![CDATA[" + targetReq + "]]>" + "</targetRequest>";
	}		
	if (context.getVariable("targetRespStartVar"+i) !== undefined) {
		targetLogAttrsXmlArr[indA++] = "<targetRespStart>" + context.getVariable("targetRespStartVar"+i) + "</targetRespStart>";
	}
	else {
		targetLogAttrsXmlArr[indA++] = "<targetRespStart>" + "" + "</targetRespStart>";
	}
	if (context.getVariable("targetRespEndVar"+i) !== undefined) {
		targetLogAttrsXmlArr[indA++] = "<targetRespEnd>" + context.getVariable("targetRespEndVar"+i) + "</targetRespEnd>";
	}
	else {
		targetLogAttrsXmlArr[indA++] = "<targetRespEnd>" + "" + "</targetRespEnd>";
	}	
	if (context.getVariable("targetReqStartVar"+i) !== undefined && context.getVariable("targetRespEndVar"+i) !== undefined) {
		targetTotalDuration = targetTotalDuration + (context.getVariable("targetRespEndVar"+i) - context.getVariable("targetReqStartVar"+i));
	}	
	if (logScope && logScope.toLowerCase() == "target"){  // log proxy and target including service call out
		if (context.getVariable("targetResponseVar"+i) !== undefined) {
			targetRes = context.getVariable("targetResponseVar"+i);
			if(targetRes && targetRes.trim().startsWith("{")) {
				targetRes = maskJSONData(targetRes,maskConfigData);
			}
			else {
				targetRes = maskXMLData(targetRes,maskConfigData);
			}
			targetLogReqResAttrsXmlArr[indB++] = "<targetResponse>" + "<![CDATA[" + targetRes + "]]>" + "</targetResponse>";
		}
		else {
			targetLogReqResAttrsXmlArr[indB++] = "<targetResponse>" + "" + "</targetResponse>";
		}
		targetLogReqResAttrsXmlArr[indB++] = "</target>";
	}	
	targetLogAttrsXmlArr[indA++] = "</target>";
}	
targetLogAttrsXmlArr[indA++] = "</targetLogAttrsXml>";
targetLogReqResAttrsXmlArr[indB++] = "</targetLogReqResAttrsXml>";
elfLog = elfLog + "||targetTotalDuration"+"="+ targetTotalDuration;
elfLog = elfLog + "||targetLogAttrsXml"+"="+  targetLogAttrsXmlArr.join("");
elfLog = elfLog + "||targetLogReqResAttrsXml"+"="+  targetLogReqResAttrsXmlArr.join("");
elfLog = elfLog.replace(/(\r\n|\n|\r)/gm,"");
context.setVariable("elf.logMsg", elfLog);
