const express = require('express');
const app = express();

app.get('/', function (req, res) {
  console.log('Hello world received a request.');

  var target = process.env.TARGET || 'NOT SPECIFIED';
  res.send('Hello world: ' + target);
});

var port = 8080;
app.listen(port, function () {
  console.log('Hello world listening on port',  port);
});
