### Slack Channel
The service provides a REST API interface to create a new public slack channel.

#### Sample Input Payload to create slack channel
````
{
	"channel_name" : "<channel name>", //Required
	"users" : [{"email_id" :"<email address>"}] //Required
}
````
