var thinky = require('../lib/thinky.js');
var type = thinky.type;
var r = thinky.r;

var util = require('../lib/util');

var Read = thinky.createModel('Read', {
  id: type.string(),
  name: type.string(),
  safeName: type.string(),
  runID: type.string(),
  createdAt: type.date().default(r.now()),
  md5: type.string(),
  //filePath: type.string(),//upload one (unpaired) or two (paired, mate) files
  insertSize: type.number(),// (IF PARED OR MATE)
  organisms: type.string(),// sequenced - as specific as possible
  conditions: type.string(),
  moreInfo: type.string()// (text box)
});
Read.pre('save', function (next) {
  var read = this;
  var unsafeName = read.name;
  Read.run().then(function (result) {
    util.generateSafeName(unsafeName, result, function (name) {
      read.safeName = name;
      next();
    });
  });
});

module.exports = Read;

var Run = require('./run.js');
Read.belongsTo(Run, 'run', 'runID', 'id');