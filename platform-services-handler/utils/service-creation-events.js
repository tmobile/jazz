// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================


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
