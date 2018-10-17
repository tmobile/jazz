## JAZZ API to check if a slack channel exists in User's Slack.
Provides an API for determining if a Slack channel exists (available) or not in User's Slack.
It utilizes Slack REST API endpoints to communicate with Slack channels. To learn more about the endpoints, refer to this link:
```
https://api.slack.com/methods
```

<br />

#### Request Format as a JSON structure
'slack_channel' is case insensitive
```
{
  "input": {
    "slack_channel": "_",
  }
}
```

<br />

#### Response Format as a JSON structure
'is_available' will be true/false depending on whether 'slack_channel' is available/exists or not
```
{
  "input": {
    "slack_channel": "_",
  },
  "data": {
    "is_available": _
  }
}
```
