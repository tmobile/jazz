const format = require("string-template");

var getNotificationMessage = function(serviceDetails, payload, configData){
   
    var serviceContxt = JSON.parse(payload.Item.SERVICE_CONTEXT.S);
    var params = {
        'service_name' : serviceDetails.service,
        'domain_name' : serviceDetails.domain,
        'environment_name' : serviceContxt.environment,
        'event_type' : payload.EVENT_TYPE.S,
        'event_name' : (payload.EVENT_NAME.S).toLowerCase(),
        'build_status' : '',
        'event_status' : payload.EVENT_STATUS.S,
        'bitbucket_url' : serviceContxt.repository,
        'overview_url' : configData.SERVICE_LINK + serviceDetails.id,
        'jenkins_url' : serviceContxt.provider_build_url,
        'endpoint_url' : serviceContxt.endpoint_url,
        'notifications' : configData.NOTIFICATION_MESSAGE,
        'error' : serviceContxt.error
    };
	
	var slackNotification = {
        "pretext": "",
        "text": "",
        "color": "",
    };

    var pretext, text; 
    if(params.service_name && params.domain_name && params.event_type){
        if(!params.event_name){
            params.build_status = params.event_status;
        }
        if(params.event_name && params.event_status === 'STARTED'){
            slackNotification.color =  "#808080";
            text = params.notifications.EVENT_NAME.STARTED;
        } else if (params.event_status === 'COMPLETED'){ 
            slackNotification.color =  "#5cae01";
            text = params.notifications.EVENT_NAME.COMPLETED;
        } else if (params.event_status === 'FAILED'){
            text = params.notifications.EVENT_NAME.FAILED_REASON;
            slackNotification.color =  "#d0011b";
            if (params.error){
                text = params.notifications.EVENT_NAME.FAILED;
            }
        }
        
        switch(params.event_type){
            case 'SERVICE_CREATION':
                pretext = params.notifications.EVENT_TYPE.SERVICE_CREATION;   
				if(params.build_status === 'STARTED' && !params.event_name){
                    slackNotification.color =  "#4300ff";     
                    text = params.notifications.EVENT_STARTED.SERVICE_CREATION;
                } else if(params.build_status === 'COMPLETED' && !params.event_name){
                    slackNotification.color =  "#4300ff";
                    text = params.notifications.EVENT_COMPLETED.SERVICE_CREATION;
					if(params.bitbucket_url){
						text = text + params.notifications.BITBUCKET_URL;
					}
					if(params.overview_url){
						text = text + params.notifications.SERVICE_URL;
					}
                } 
            break;
            case 'SERVICE_DEPLOYMENT':
                pretext = params.notifications.EVENT_TYPE.SERVICE_DEPLOYMENT;
				if(params.environment_name){
					pretext = pretext + params.notifications.ENVIRONMENT;
				}
                if(params.build_status === 'STARTED' && !params.event_name){
                    slackNotification.color =  "#4300ff";
                    text = params.notifications.EVENT_STARTED.SERVICE_DEPLOYMENT;
                } else if(params.build_status === 'COMPLETED' && !params.event_name){
                    slackNotification.color =  "#4300ff";
                    text = params.notifications.EVENT_COMPLETED.SERVICE_DEPLOYMENT;
					if(params.endpoint_url){
						text = text + params.notifications.ENDPOINT_URL;
					}
					if(params.overview_url){
						text = text + params.notifications.SERVICE_URL;
					}
					if(params.bitbucket_url){
						text = text + params.notifications.BITBUCKET_URL;
					}
					if(params.jenkins_url){
						text = text + params.notifications.JENKINS_URL;
					}
                } 
            break;
            case 'SERVICE_DELETION':
                pretext = params.notifications.EVENT_TYPE.SERVICE_DELETION;
				if(params.environment_name){
					pretext = pretext + params.notifications.ENVIRONMENT;
				}
                if(params.build_status === 'STARTED' && !params.event_name){
                    slackNotification.color =  "#4300ff";
                    text = params.notifications.EVENT_STARTED.SERVICE_DELETION;
                } else if(params.build_status === 'COMPLETED' && !params.event_name){
                    slackNotification.color =  "#4300ff";
                    text = params.notifications.EVENT_COMPLETED.SERVICE_DELETION;
                } 
            break;
        }
    }
    pretext = format(pretext, params);
    text = format(text, params);
    slackNotification.pretext = "_"+pretext+"_";
    slackNotification.text = text;
    return slackNotification;    
};

var formatSlackTemplate = function(pretext, text, color){
    var attachment = {
        "fallback": "Required plain-text summary of the attachment.",
        "pretext": pretext,
        "text": text,
        "color": color,
        "mrkdwn_in": [
            "text",
            "pretext",
            "author_name"
        ]
    };
    return attachment;
};

module.exports = () => {
    return {
        getNotificationMessage: getNotificationMessage,
        formatSlackTemplate: formatSlackTemplate
    };
};
