package models

/**
Go Template Project
@module: Models
@description: Defines Request object
@author:
@version: 1.0
**/

//Request Model struct
type Request struct {
	Stage  string  `json:"stage,omitempty"`
	Method string  `json:"method,omitempty"`
	ID     float64 `json:"id,omitempty"`
	Value  string  `json:"value,omitempty"`
}
