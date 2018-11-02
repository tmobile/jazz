package components

/**
Go Template Project
@module: components
@description: Loads config File to get variables/functions to retrieve environment related data
@author:
@version: 1.0
**/

import (
	"context"
	"encoding/json"
	"lambda-template-go/models"
	"log"
	"os"
)

//LoadConfiguration function is to
func LoadConfiguration(cx context.Context, event models.Request) (map[string]string, error) {
	var config map[string]string
	var filename string

	//Checks the stage and loads the Configuration file
	if len(event.Stage) > 0 {
		filename = "configs/" + event.Stage + "-config.json"
	}

	configFile, err := os.Open(filename)
	defer configFile.Close()
	if err != nil {
		log.Printf(err.Error())
		return config, err
	}
	jsonParser := json.NewDecoder(configFile)
	err = jsonParser.Decode(&config)
	return config, err
}
