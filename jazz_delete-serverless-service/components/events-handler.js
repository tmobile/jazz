const request = require('request');
const moment = require('moment');

module.exports = (request_id) => {
  var eventsObj = {
    sendEvent: function (inputs, callback) {
      if (inputs.service_context === undefined || inputs.service_context === "" || Object.keys(inputs.service_context).length === 0) {
        return {
          "error": true,
          "message": "EVENT HANDLER: Context is Empty"
        };
      }
      if (inputs.service_name === undefined || inputs.service_name === "") {
        return {
          "error": true,
          "message": "EVENT HANDLER: service_name not provided"
        };
      }
      if (inputs.event_status === undefined || inputs.event_status === "") {
        return {
          "error": true,
          "message": "EVENT HANDLER: event_status not provided"
        };
      }
      if (inputs.username === undefined || inputs.username === "") {
        return {
          "error": true,
          "message": "EVENT HANDLER: service_name not provided"
        };
      }
      var done = false;
      var data;
      var eventOptions = {
        uri: inputs.SERVICE_API_URL + inputs.EVENTS_API_RESOURCE,
        method: 'POST',
        json: {
          "service_context": inputs.service_context,
          "event_handler": inputs.event_handler,
          "event_name": inputs.event_name,
          "service_name": inputs.service_name,
          "event_status": inputs.event_status,
          "event_type": inputs.event_type,
          "username": inputs.username,
          "event_timestamp": moment().utc().format('YYYY-MM-DDTHH:mm:ss:SSS'),
          "request_id": request_id
        },
        rejectUnauthorized: false
      };

      request(eventOptions, function (error, response, body) {
        if (error) {
          data = {
            "error": true,
            "message": error.message
          };
          callback(data, null);
        } else if (response.statusCode !== 200) {
          data = {
            "error": true,
            "message": body.message
          };
          callback(data, null);
        } else {
          data = {
            "error": false,
            "message": "Event was recorded: " + body
          };
          callback(null, data);
        }
      });
    }
  };
  return eventsObj;

};
