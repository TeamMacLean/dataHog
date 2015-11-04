var thinky = require('../lib/thinky.js');
var type = thinky.type;
//var r = thinky.r;
var util = require('../lib/util');

var Run = thinky.createModel('Run', {
  id: type.string(),
  sampleID: type.string().required(),

  name: type.string().required(),
  libraryType: type.string().required(),
  sequencingProvider: type.string().required(),
  sequencingTechnology: type.string().required(),
  librarySource: type.string().required(),
  librarySelection: type.string().required(),
  libraryStrategy: type.string().required(),
  insertSize: type.string().required(),
  additionalFiles: [type.string().required()],
  submissionToGalaxy: type.boolean().required(), //send email
  safeName: type.string()
});

Run.pre('save', function (next) {
  var run = this;
  var unsafeName = run.name;
  if (!run.safeName) {
    Run.run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (name) {
        run.safeName = name;
        next();
      });
    });
  }
});

module.exports = Run;

var Sample = require('./sample.js');
var Read = require('./read.js');
Run.hasMany(Read, 'reads', 'id', 'runID');
Run.belongsTo(Sample, 'sample', 'sampleID', 'id');