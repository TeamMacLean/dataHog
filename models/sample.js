"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var util = require('../lib/util');

var Sample = thinky.createModel('Sample', {
  id: type.string(),
  projectID: type.string().required(),
  name: type.string().required(),
  organism: type.string().required(),
  ncbi: type.string().required(),
  conditions: type.string().required(),
  sampleGroup: type.string().required(),
  path: type.string().required(),
  safeName: type.string()
});


Sample.pre('save', function (next) {
  var sample = this;
  var unsafeName = sample.name;
  if (!sample.safeName) {
    Sample.run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (name) {
        sample.safeName = name;
        //now create sampleGroup
        Project.get(sample.projectID).getJoin({group: true}).run().then(function (project) {
          sample.path = '/' + project.group.safeName + '/' + project.safeName + '/' + sample.safeName;
          sample.sampleGroup = project.safeName + '_' + name;
          util.generateUniqueName(sample.name, result, function (newName) {
            sample.name = newName;
            next();
          });
        });
      });
    });
  }
});

module.exports = Sample;

var Run = require('./run');
var Project = require('./project');
Sample.belongsTo(Project, 'project', 'projectID', 'id');
Sample.hasMany(Run, 'runs', 'id', 'sampleID');

var AdditionalFile = require('./additionalFile');
Sample.hasMany(AdditionalFile, 'additionalFiles', 'id', 'parentID');