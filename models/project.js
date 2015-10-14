var thinky = require('../lib/thinky.js');
var type = thinky.type;
var r = thinky.r;
var util = require('../lib/util');

var Project = thinky.createModel('Project', {
  id: type.string(),
  name: type.string().required(),
  responsiblePerson: type.string().required(),
  groupID: type.string().required(),
  shortDescription: type.string().required(),
  longDescription: type.string().required(),
  createdAt: type.date().default(r.now()),

  safeName: type.string()
});

Project.pre('save', function (next) {
  var project = this;
  var unsafeName = project.name;
  if (!project.safeName) {
    Project.run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (name) {
        project.safeName = name;
        next();
      });
    });
  }
});

module.exports = Project;

var Sample = require('./sample.js');
var Group = require('./group');
Project.belongsTo(Group,'group','id','groupID');
Project.hasMany(Sample, 'samples', 'id', 'projectID');