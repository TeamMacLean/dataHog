var thinky = require('../lib/thinky.js');
var type = thinky.type;
var r = thinky.r;

var util = require('../lib/util');

var Read = thinky.createModel('Read', {
  runID: type.string().required(),
  MD5: type.string().required(),
  fastQCLocation: type.string().required(),
  moreInfo: type.string().required()
});

module.exports = Read;

var Run = require('./run.js');
Read.belongsTo(Run, 'run', 'runID', 'id');