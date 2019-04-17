package components

/**
Go Template Project
@module: configModule
@description: Defines functions for Loading the right Configuration files to get loaded.
@author:
@version: 1.0
**/

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	ctx   context.Context
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
		fnName := string(FunctionName[strings.LastIndex(FunctionName, "-")+1 : len(FunctionName)])
		if strings.HasPrefix(fnName, "dev") {
			stage = "dev"
		} else if strings.HasPrefix(fnName, "stg") {
			stage = "stg"
		} else if strings.HasPrefix(fnName, "prod") {
			stage = "prod"
		}
	}

	if len(stage) > 0 {
		dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
		if err != nil {
			panic("Error retrieving Caller Module")
		}
		viper.SetConfigFile(dir + "/config/" + stage + "-config.json")
		// Searches for config file in given paths and read it
		if err := viper.ReadInConfig(); err != nil {
			log.Fatal("Error reading config file ")
		}
	} else {
		log.Fatal("Error! No stage Defined")
	}
}
