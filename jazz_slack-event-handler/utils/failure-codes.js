var failureCodeENUM = {
	PR_ERROR_1 : {type: "PROCESSING_ERROR", code: "SERVICE_CATALOG", message: "Service metadata not available in Service Catalog"},
	PR_ERROR_2 : {type: "PROCESSING_ERROR", code: "UNKNOWN", message: "Unknown error"},
	PR_ERROR_3 : {type: "PROCESSING_ERROR", code: "INTERNAL", message: "Internal Server error"},
    PR_ERROR_4 : {type: "PROCESSING_ERROR", code: "SLACK_CHANNEL", message: "Error while sending notification in Slack Channel"},
    PR_ERROR_5 : {type: "PROCESSING_ERROR", code: "SLACK_CHANNEL_INFO", message: "Service Slack Channel info not available in Service Catalog"},
};

module.exports = () => {
    return  failureCodeENUM;
};