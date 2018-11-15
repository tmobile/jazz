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

	"github.com/aws/aws-lambda-go/lambda"
	logging "github.com/op/go-logging"
)

//Logging Configuration
var log = logging.MustGetLogger("example")
var format = logging.MustStringFormatter(
	`%{color}%{time:15:04:05.000} %{shortfunc} ▶ %{level:.4s} %{id:03x}%{color:reset} %{message}`,
)

//Request Model struct
type Request struct {
	Stage  string  `json:"stage,omitempty"`
	Method string  `json:"method,omitempty"`
	ID     float64 `json:"id,omitempty"`
	Value  string  `json:"value,omitempty"`
}

//Response Model
type Response struct {
	Message string `json:"message,omitempty"`
	Ok      bool   `json:"ok,omitempty"`
}

//Following code snippet describes how to log messages within your code:
/*
	log.error('Runtime errors or unexpected conditions.');
	log.warn('Runtime situations that are undesirable or unexpected, but not necessarily "wrong".');
	log.info('Interesting runtime events (Eg. connection established, data fetched etc.)');
	log.verbose('Generally speaking, most lines logged by your application should be written as verbose.');
	log.debug('Detailed information on the flow through the system.');
*/

//Handler Function for Aws Lambda which accepts Requests and Produce the response in json.
func Handler(ctx context.Context, event Request) (Response, error) {
	// stdout and stderr are sent to AWS CloudWatch Logs
	log.Info("Processing Lambda request %f\n", event.ID)

	return Response{
		Message: fmt.Sprintf("Process Request Id is %f", event.ID),
		Ok:      true,
	}, nil
}

//Main function Starts
func main() {
	//Start function to trigger Lambda
	lambda.Start(Handler)

}
