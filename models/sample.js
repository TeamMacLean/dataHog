var thinky = require('../lib/thinky.js');
var type = thinky.type;
var r = thinky.r;
var util = require('../lib/util');

var Sample = thinky.createModel('Sample', {
  id: type.string(),
  projectID: type.string().required(),
  name: type.string().required(),
  organism: type.string().required(),
  ncbi: type.string().required(),
  conditions: type.string().required(),
  uniqueName: type.string().required(),
  sampleGroup: type.string().required(),


  safeName: type.string()
});


Sample.pre('save', function (next) {
  var sample = this;
  var unsafeName = sample.name;
  Project.run().then(function (result) {
    util.generateSafeName(unsafeName, result, function (name) {
      sample.safeName = name;
      next();
    });
  });
});

module.exports = Sample;

var Run = require('./run');
var Project = require('./project');
Sample.belongsTo(Project, 'project', 'projectID', 'id');
Sample.hasMany(Run, 'runs', 'id', 'sampleID');