"use strict";

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
  path: type.string().required(),
  safeName: type.string().required()
});

Project.pre('save', function (next) {
  var project = this;
  var unsafeName = project.name;
  if (!project.safeName) {
    Project.run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (newSafeName) {
        project.safeName = newSafeName;
        util.generateUniqueName(project.name, result, function (newName) {
          project.name = newName;
          Group.get(project.groupID).run().then(function (group) {
            project.path = group.path + '/' + project.safeName;
            next();
          });
        });
      });
    });
  }
});

module.exports = Project;

var Sample = require('./sample.js');
var Group = require('./group');
var AdditionalFile = require('./additionalFile');
Project.belongsTo(Group, 'group', 'groupID', 'id');
Project.hasMany(Sample, 'samples', 'id', 'projectID');
Project.hasMany(AdditionalFile, 'additionalFiles', 'id', 'parentID');