"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;

var Schedule = thinky.createModel('Schedule', {
  id: type.string(),
  runDate: type.date().required(),
  code: type.object()
});

module.exports = Schedule;