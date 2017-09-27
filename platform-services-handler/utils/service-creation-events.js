
var serviceCreationEventsENUM = {
    AUTHENTICATE_USER : {"event-status":"COMPLETED", "service-creation-status": "INITIATED"},
	CALL_ONBOARDING_WORKFLOW : {"event-status":"COMPLETED", "service-creation-status": "STARTED"},
	ONBOARDING: {"event-status":"COMPLETED", "service-creation-status": "IN-PROGRESS"},
	VALIDATE_INPUT : {"event-status":"COMPLETED", "service-creation-status": "IN-PROGRESS"},
	CLONE_TEMPLATE : {"event-status":"COMPLETED", "service-creation-status": "IN-PROGRESS"},
	MODIFY_TEMPLATE : {"event-status":"COMPLETED", "service-creation-status": "IN-PROGRESS"},
	CREATE_SERVICE_REPO : {"event-status":"COMPLETED", "service-creation-status": "IN-PROGRESS"},
	PUSH_TEMPLATE_TO_SERVICE_REPO : {"event-status":"COMPLETED", "service-creation-status": "IN-PROGRESS"},
	ADD_WRITE_PERMISSIONS_TO_SERVICE_REPO :{"event-status":"COMPLETED", "service-creation-status": "IN-PROGRESS"},
	LOCK_MASTER_BRANCH : {"event-status":"COMPLETED", "service-creation-status": "IN-PROGRESS"}
};

module.exports = () => {
    return  serviceCreationEventsENUM;
};