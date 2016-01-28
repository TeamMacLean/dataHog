"use strict";

var app = require('./app');
var airdale = require('airdale');
var config = require('./config.json');

/**
 * Start the server
 */
app.listen(config.port, '0.0.0.0', function () {
  console.log('Listening on port', config.port);

  //airdale.post('wookoouk', airdale.types.success, 'data hog started ok')
  //.then(function (body) {
  //  console.log('notified airdale', body);
  //})
  //.error(function (err) {
  //  console.error('failed to post to airdale', err);
  //});
});