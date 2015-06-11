var thinky = require('../lib/thinky.js');
var type = thinky.type;
var r = thinky.r;
var util = require('../lib/util');

var Project = thinky.createModel('Project', {
  id: type.string(),
  name: type.string(),
  safeName: type.string(),
  responsiblePerson: type.string(),
  lab: type.string(),
  createdAt: type.date().default(r.now()),
  description: type.string()
});
Project.pre('save', function (next) {
  var project = this;
  var unsafeName = project.name;
  Project.run().then(function (result) {
    util.generateSafeName(unsafeName, result, function (name) {
      project.safeName = name;
      next();
    });
  });
});

module.exports = Project;

var Run = require('./run.js');

Project.hasMany(Run, 'runs', 'id', 'projectID');