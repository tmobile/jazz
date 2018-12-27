package main 

/**
Go Template Project
@module: configModule
@description: Defines functions for Loading the right Configuration files to get loaded.
@author:
@version: 1.0
**/


import (
	"github.com/spf13/viper"
	"github.com/gologme/log"
	"context"
	"os"
	"strings"
)

type Config struct {
	ctx context.Context 
	event map[string]interface{}
}

// Load Configuration file 
func (c *Config) LoadConfiguration(ctx context.Context, event map[string]interface{}) {
  c.ctx = ctx
	c.event = event

	var stage string
	var FunctionName string

	if value, ok := event["stage"]; ok {
		//get stage value from payload
		stage = value.(string)
	} else {
		// get Function name from Environment Variables 
		FunctionName = os.Getenv("AWS_LAMBDA_FUNCTION_NAME")
		fnName := string(FunctionName [strings.LastIndex(FunctionName , "-") + 1 :len(FunctionName )])
		if (strings.HasPrefix(fnName, "dev")){
			stage = "dev"
		} else if (strings.HasPrefix(fnName, "stg")){
			stage = "stg"
		} else if (strings.HasPrefix(fnName, "prod")){
			stage = "prod"
		}
	}

	if len(stage) > 0 {
		viper.SetConfigFile("./configs/"+stage+"-config.json")
		// Searches for config file in given paths and read it
		if err := viper.ReadInConfig(); err != nil {
    	log.Fatalf("Error reading config file, %s", err)
		}
	} else {
		log.Fatalf("Error! No stage Defined")
	}
	
}


