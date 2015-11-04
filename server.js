"use strict";

var app = require('./app');
var config = require('./config.json');


/**
 * Start the server
 */
app.listen(config.port, '0.0.0.0', function () {
  console.log('Listening on port', config.port);
});