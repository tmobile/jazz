# Splunk logging for JavaScript

#### Version 0.9.3

This project provides a simple JavaScript interface for logging to HTTP Event Collector in Splunk Enterprise and Splunk Cloud.

## Requirements

* Node.js v0.10 or later.
* Splunk Enterprise 6.3.0 or later, or Splunk Cloud.
* An HTTP Event Collector token from your Splunk Enterprise server.

## Installation

First, update npm to the latest version by running:

    sudo npm install npm -g

Then run: 
 
    npm install --save splunk-logging

## Usage

See the `examples` folder for usage examples:

* `all_batching.js`: Shows how to configure a logger with the 3 batching settings: `batchInterval`, `maxBatchCount`, & `maxBatchSize`.
* `basic.js`: Shows how to configure a logger and send a log message to Splunk.
* `custom_format.js`: Shows how to configure a logger to log messages to Splunk using a custom format.
* `manual_batching.js`: Shows how to queue log messages, and send them in batches by manually calling `flush()`.
* `retry.js`: Shows how to configure retries on errors.

### SSL

Note: SSL certificate validation is diabled by default.
To enable it, set `requestOptions.strictSSL = true` on your `SplunkLogger` instance:

```javascript
var SplunkLogger = require("splunk-logging").Logger;

var config = {
    token: "your-token-here",
    url: "https://splunk.local:8088"
};

var Logger = new SplunkLogger(config);

// Enable SSL certificate validation
Logger.requestOptions.strictSSL = true;
```

### Basic example

```javascript
var SplunkLogger = require("splunk-logging").Logger;

var config = {
    token: "your-token-here",
    url: "https://splunk.local:8088"
};

var Logger = new SplunkLogger(config);

var payload = {
    // Message can be anything; doesn't have to be an object
    message: {
        temperature: "70F",
        chickenCount: 500
    }
};

console.log("Sending payload", payload);
Logger.send(payload, function(err, resp, body) {
    // If successful, body will be { text: 'Success', code: 0 }
    console.log("Response from Splunk", body);
});
```

## Community

Stay connected with other developers building on Splunk software.

<table>

<tr>
<td><b>Email</b></td>
<td>devinfo@splunk.com</td>
</tr>

<tr>
<td><b>Issues</b>
<td><span>https://github.com/splunk/splunk-javascript-logging/issues/</span></td>
</tr>

<tr>
<td><b>Answers</b>
<td><span>http://answers.splunk.com/</span></td>
</tr>

<tr>
<td><b>Blog</b>
<td><span>http://blogs.splunk.com/dev/</span></td>
</tr>

<tr>
<td><b>Twitter</b>
<td>@splunkdev</td>
</tr>

</table>

## Support

The Splunk logging library for .NET is community-supported.

1. You can find help through our community on [Splunk Answers](http://answers.splunk.com/) (use the `logging-library-javascript` tag to identify your questions).
2. File issues on [GitHub](https://github.com/splunk/splunk-javascript-logging/issues).

## Contact us

You can reach the Dev Platform team at [devinfo@splunk.com](mailto:devinfo@splunk.com).

## License

The Splunk Logging Library for JavaScript is licensed under the Apache
License 2.0. Details can be found in the LICENSE file.
