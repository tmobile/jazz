/**
Go Template Project
@author:
@version: 1.0
 **/

package main

//Imports
import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-lambda-go/lambdacontext"
	"github.com/spf13/viper"
)

//Response Model
type Response struct {
	Data map[string]string `json:"data,omitempty"`
	Input map[string]interface{}   `json:"input,omitempty"`
}
// Declare logger variable
var logger *Logger
var AwsRequestID string


//Handler Function for Aws Lambda which accepts Requests and Produce the response in json.
func Handler(ctx context.Context, event map[string]interface{}) (Response, error) {
	// Initialize Logging Components
	logger = new(Logger)
	logger.init("Info")
	// Get Request Id
	lc, _ := lambdacontext.FromContext(ctx)
  AwsRequestID = lc.AwsRequestID

	//Following code snippet describes how to log messages within your code:
/*
	logger.ERROR("Runtime errors or unexpected conditions.");
	logger.WARN("Runtime situations that are undesirable or unexpected, but not necessarily wrong");
	logger.INFO("Interesting runtime events (Eg. connection established, data fetched etc.)");
	logger.VERBOSE("Generally speaking, most lines logged by your application should be written as verbose.");
	logger.DEBUG("Detailed information on the flow through the system.");
*/
	logger.INFO("Interesting runtime events (Eg. connection established, data fetched etc.)");
	// Initialize Config Components
	configModule := new(Config)
	configModule.LoadConfiguration(ctx , event )
	// Get Config values
	configValue := viper.Get("configKey").(string) // returns string

	sampleResponse :=map[string]string {
		"foo": "foo-value",
		"bar": "bar-value",
		"configKeys": configValue,
	};

	if len(event) == 0{
		// If payload is empty send the Inputvalidation Error resposne
		return Response{},NewInputValidationError("Sample Error Response")
	} else {
		var payLoad map[string]interface{}
		// Your GET method should be handled here
		if (event["method"].(string) == "GET"){
      logger.INFO("Sample log inside GET");
			payLoad = event["query"].(map[string]interface{})
		}
		//Your POST method should be handled here
		if (event["method"].(string) == "POST"){
      logger.INFO("Sample log inside POST");
			payLoad = event["body"].(map[string]interface{})
		}
		return Response{
			Data: sampleResponse,
			Input: payLoad,
		},nil

	}
}

//Main function Starts
func main() {
	//Start function to trigger Lambda
	lambda.Start(Handler)

}
