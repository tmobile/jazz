/**
Go Template Project
@author:
@version: 1.0
 **/

package main

//Imports
import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
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
	ID    float64 `json:"id,omitempty"`
	Value string  `json:"value,omitempty"`
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
func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	//Loading the Configuration Files
	var response Response
	// stdout and stderr are sent to AWS CloudWatch Logs
	log.Info("Processing API Request for runtime Go")

	if len(request.HTTPMethod) == 0 {
		response = Response{
			Message: "Sample Request",
			Ok:      true,
		}
	} else {

		if request.HTTPMethod == "GET" {
			response = Response{
				Message: request.HTTPMethod + " Request",
				Ok:      true,
			}
		} else if request.HTTPMethod == "POST" {
			response = Response{
				Message: request.HTTPMethod + " Request ",
				Ok:      true,
			}
		}
	}

	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{Body: string(body), StatusCode: 200}, nil

}

//Main function Starts
func main() {
	//Start function to trigger Lambda
	lambda.Start(Handler)
}
