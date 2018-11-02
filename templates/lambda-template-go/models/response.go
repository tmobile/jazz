package models

/**
Go Template Project
@module: Models
@description: Defines Response object
@author:
@version: 1.0
**/

//Response Model
type Response struct {
	Message string `json:"message,omitempty"`
	Ok      bool   `json:"ok,omitempty"`
}
