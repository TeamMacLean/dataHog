"use strict";

var thinky = require('../lib/thinky.js');
var r = thinky.r;
var type = thinky.type;
//var config = require('../config.json');
//var util = require('../lib/util');

var Submission = thinky.createModel('Submission', {
  id: type.string(),
  createdAt: type.date().default(r.now()),
  publishDate: type.date().required(),
  runID: type.string().required()
});

module.exports = Submission;