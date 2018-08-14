// 2. Extract Headers
var headerFieldsCollection = context.getVariable('request.headers.names') + '';

//Remove square brackets
headerFieldsCollection = headerFieldsCollection.substr(1, headerFieldsCollection.length - 2);

//Split string into an array
var headersArray = headerFieldsCollection.split(", ");
// get and create app attributes in case client uses basic auth
var authorization = context.getVariable("authorization");
var elfRequestHeaders = '{';
// Loop through Array and get value of header
for (var i = 0; i < headersArray.length; i++) {
	context.setVariable('headers.' + headersArray[i].toLowerCase(), context.getVariable('request.header.' + headersArray[i]));

	if(headersArray[i].toLowerCase()!=='authorization'){
		if (i!==0)
			elfRequestHeaders = elfRequestHeaders+',';
		elfRequestHeaders = elfRequestHeaders+'"request.header.' +headersArray[i]+'":"'+context.getVariable('request.header.' + headersArray[i])+'"';
	}

	// Below values assigned to have minimal impact to existing code
	context.setVariable(headersArray[i].toLowerCase(), context.getVariable('request.header.' + headersArray[i]));
}
elfRequestHeaders = elfRequestHeaders+"}";
context.setVariable("elfRequestHeaders",elfRequestHeaders);

// Store data required for logging
context.setVariable("elfLog.interactionId", context.getVariable("interactionid"));
context.setVariable("elfLog.workflowId", context.getVariable("workflowid"));
context.setVariable("elfLog.activityId", context.getVariable("activityid"));
context.setVariable("elfLog.requestVerb", context.getVariable("request.verb"));
context.setVariable("elfLog.proxyRequest", context.getVariable("request.content"));
context.setVariable("elfLog.contentType", context.getVariable("request.header.Content-Type"));
context.setVariable("elfLog.acceptType", context.getVariable("request.header.Accept"));
//context.setVariable("requestHeaderHost", context.getVariable("request.header.host"));
context.setVariable("requestHeaderHost", context.getVariable("hostName"));


context.setVariable("serviceTransactionId", context.getVariable("request.header.serviceTransactionId"));
context.setVariable("messageid", context.getVariable("request.header.messageid"));
context.setVariable("elfLog.logPayloadScope", context.getVariable("app.elfLog.logPayloadScope"));

// Variables to store all target requests and responses in a flow. These are stored in the order they are executed. Finally, these are used during ELF/Splunk logging
/*var targetRequestIndex = 0;
context.setVariable("targetRequestIndex", targetRequestIndex);*/
