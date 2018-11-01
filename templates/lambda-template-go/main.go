/**
Go Template Project
@author:
@version: 1.0
 **/

package main

//Imports
import (
	"context"
	"fmt"
	"lambda-template-go/components"
	"lambda-template-go/models"

	"github.com/aws/aws-lambda-go/lambda"
	logging "github.com/op/go-logging"
)

//Logging Configuration
var log = logging.MustGetLogger("example")
var format = logging.MustStringFormatter(
	`%{color}%{time:15:04:05.000} %{shortfunc} ▶ %{level:.4s} %{id:03x}%{color:reset} %{message}`,
)

//Following code snippet describes how to log messages within your code:
/*
   log.error('Runtime errors or unexpected conditions.');
   log.warn('Runtime situations that are undesirable or unexpected, but not necessarily "wrong".');
   log.info('Interesting runtime events (Eg. connection established, data fetched etc.)');
   log.verbose('Generally speaking, most lines logged by your application should be written as verbose.');
   log.debug('Detailed information on the flow through the system.');
*/

//Handler Function for Aws Lambda which accepts Requests and Produce the response in json.
func Handler(ctx context.Context, event models.Request) (models.Response, error) {
	//Loading the Configuration Files
	var config map[string]string
	config, _ = components.LoadConfiguration(ctx, event)

	//Logging Config files for Testing
	log.Info("Value From Config file is %s", config["configKey"])
	// stdout and stderr are sent to AWS CloudWatch Logs
	log.Info("Processing Lambda request %f\n", event.ID)

	return models.Response{
		Message: fmt.Sprintf("Process Request Id is %f", event.ID),
		Ok:      true,
	}, nil
}

//Main function Starts
func main() {
	//Start function to trigger Lambda
	lambda.Start(Handler)

}
