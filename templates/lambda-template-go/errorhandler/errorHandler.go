package errorhandler

/**
Go Template Project
@module: errorhandler
@description: Defines functions raising API Errors in required format for API Gateway integration
@author:
@version: 1.0
**/

//ErrorObject struct
type ErrorObject struct {
	ErrorType string
	message   string
}

//InputValidationError function handles InputValidationError and sends ErrorObject as the Response
func InputValidationError(message string) (errorobject ErrorObject) {
	return ErrorObject{ErrorType: "InputValidationError", message: message}
}

//ForbiddenError function handles ForbiddenError and sends ErrorObject as the Response
func ForbiddenError(message string) (errorobject ErrorObject) {
	return ErrorObject{ErrorType: "ForbiddenError", message: message}
}

//UnauthorizedError function handles UnauthorizedError and sends ErrorObject as the Response
func UnauthorizedError(message string) (errorobject ErrorObject) {
	return ErrorObject{ErrorType: "UnauthorizedError", message: message}
}

//NotFoundError function handles NotFoundError and sends ErrorObject as the Response
func NotFoundError(message string) (errorobject ErrorObject) {
	return ErrorObject{ErrorType: "NotFoundError", message: message}
}

//InternalServerError function handles InternalServerError and sends ErrorObject as the Response
func InternalServerError(message string) (errorobject ErrorObject) {
	return ErrorObject{ErrorType: "InternalServerError", message: message}
}
