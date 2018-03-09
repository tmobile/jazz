// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
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


var failureCodeENUM = {
  DB_ERROR_1 : {type: "DB_ERROR", code: "DB_WRITE", message: "Error storing data in database"},
	DB_ERROR_2 : {type: "DB_ERROR", code: "DB_LOOKUP", message: "Error reading database"},
	PR_ERROR_1 : {type: "PROCESSING_ERROR", code: "SCHEMA_VALIDATION", message: "Unable to process event data"},
	PR_ERROR_2 : {type: "PROCESSING_ERROR", code: "UNKNOWN", message: "Unknown error"},
	PR_ERROR_3 : {type: "PROCESSING_ERROR", code: "INTERNAL", message: "Internal Server error"},
	PR_ERROR_4 : {type: "PROCESSING_ERROR", code: "NOT_FOUND", message: "Not Found error"},
};

module.exports = () => {
    return  failureCodeENUM;
};
