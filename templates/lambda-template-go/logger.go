package main

/**
Go Template Project
@module: configModule
@description: Defines Logger Module for logging with the custom formatter.
@author:
@version: 1.0
**/

import (
	"log"
	"os"
	"fmt"
	"time"
)

var loglevels = map[string]int{
	"Error": 4,
  "Warn": 3,
  "Info": 2,
  "Verbose": 1,
  "Debug": 0,
}

var config = map[string]string {
	"curLogLevel" : "Info",
	"requestDetails" : " ",
}

// For Custom Formatter of Log Messages
type logWriter struct {
	levelName string
}

func (lw *logWriter) init (levelName string){
	lw.levelName = levelName
}

func (writer *logWriter) Write(bytes []byte) (int, error) {
  return fmt.Print(time.Now().UTC().Format("2006-01-02T15:04:05.999Z") + ""+writer.levelName+" \t " + AwsRequestID +""+  string(bytes))
}

// Logger Implementation
type Logger struct{}

func(l *Logger) init(level string){
	setLevel(level)
}

func(l *Logger) WARN(message string){
	logthis("Warn", message)
}

func(l *Logger) INFO(message string){
	logthis("Info", message)
}

func(l *Logger) ERROR(message string){
	logthis("Error", message)
}

func(l *Logger) VERBOSE(message string){
	logthis("Verbose", message)
}

func(l *Logger) DEBUG(message string){
	logthis("Debug", message)
}

// Set Logger Level which is called from init Method
func setLevel(level string)(string){
	// Default Log Level is INFO
	var log_level string
	_, isLevelPresent := loglevels[level]

	if isLevelPresent {
		// Log Level is available
		log_level = level
	}else {
		log_level = os.Getenv("LOG_LEVEL")
	}

	// set the dynamic Log level on config object
	config["curLogLevel"] = log_level

	return log_level
}


func logthis(level string , message string){
	if(loglevels[level] >= loglevels[config["curLogLevel"]] ){

		if( level == "Verbose") {
			logWithFormater("VERBOSE", message)
		}

		if( level == "Info") {
			logWithFormater("INFO", message)
		}

		if( level == "Warn") {
			logWithFormater("WARN", message)
		}

		if( level == "Debug") {
			logWithFormater("DEBUG", message)
		}

		if( level == "Error") {
			logWithFormater("ERROR", message)
		}

	}
}

// This function uses the Custom Formatter to log the Messages
func logWithFormater(logLevel string , message string){
	log.SetFlags(0)
	// New Instance of Writer Method
	logger := new(logWriter)
	// set the Loglevel to be append dynamically
	logger.init(logLevel)
	// Set the Ouptut Formatter
	log.SetOutput(logger)
	log.Println(message)
}