var thinky = require('../lib/thinky.js');
var type = thinky.type;
var r = thinky.r;
var util = require('../lib/util');

var Run = thinky.createModel('Run', {
  id: type.string(),
  name: type.string(),
  safeName: type.string(),
  projectID: type.string(),
  createdAt: type.date().default(r.now()),
  sequencingProvider: type.string(),
  sequencingTechnology: type.string(),
  communicationExcerpts: type.string(),//TODO string or file
  sequencingProviderDatasheets: type.string(), //TODO files
  libraryInformation: type.string(), //text area
  libraryType: type.string(),//paired, mate, unpaired
  submissionToPublicPortal: type.string(),
  galaxyDataWanted: type.boolean()
});
Run.pre('save', function (next) {
  var run = this;
  var unsafeName = run.name;
  Run.run().then(function (result) {
    util.generateSafeName(unsafeName, result, function (name) {
      run.safeName = name;
      next();
    });
  });
});

module.exports = Run;

var Project = require('./project.js');
var Read = require('./read.js');

Run.hasMany(Read, 'reads', 'id', 'runID');
Run.belongsTo(Project, 'project', 'projectID', 'id');