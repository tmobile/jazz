package main

// /**
// Go Template Project
// @module: errorhandler
// @description: Defines functions raising API Errors in required format for API Gateway integration
// @author:
// @version: 1.0
// **/

// Handle Input Validation error
type InputValidationError struct {
    message string
}

func NewInputValidationError(message string) *InputValidationError {
  return &InputValidationError{
    message: message,
  }
}

func (e *InputValidationError) Error() string {
  return e.message
}

// Handle ForbiddenError 
type ForbiddenError struct {
    message string
}

func NewForbiddenError(message string) *ForbiddenError {
  return &ForbiddenError{
    message: message,
  }
}

func (e *ForbiddenError) Error() string {
  return e.message
}

// Unauthorized Error
type UnauthorizedError struct {
	message string
}

func NewUnauthorizedError(message string) *UnauthorizedError {
  return &UnauthorizedError{
    message: message,
  }
}

func (e *UnauthorizedError) Error() string {
  return e.message
}
// NotFound Error
type NotFoundError struct {
	message string
}

func NewNotFoundError(message string) *NotFoundError {
  return &NotFoundError{
    message: message,
 }
}

func (e *NotFoundError) Error() string {
  return e.message
}

// InternalServerError Error
type InternalServerError struct {
	message string
}

func NewInternalServerError(message string) *InternalServerError {
    return &InternalServerError{
      message: message,
    }
}

func (e *InternalServerError) Error() string {
    return e.message
}