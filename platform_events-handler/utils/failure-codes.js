
var failureCodeENUM = {
    DB_ERROR_1 : {type: "DB_ERROR", code: "DB_WRITE", message: "Error storing data in database"},
	DB_ERROR_2 : {type: "DB_ERROR", code: "DB_LOOKUP", message: "Error reading database"},
	PR_ERROR_1 : {type: "PROCESSING_ERROR", code: "SCHEMA_VALIDATION", message: "Unable to process event data"},
	PR_ERROR_2 : {type: "PROCESSING_ERROR", code: "UNKNOWN", message: "Unknown error"}   
};

module.exports = () => {
    return  failureCodeENUM;
};