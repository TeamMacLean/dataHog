"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var util = require('../lib/util');

var Group = thinky.createModel('Group', {
  id: type.string(),
  name: type.string().required(),
  safeName: type.string()
});

Group.pre('save', function (next) {
  var group = this;
  var unsafeName = group.name;
  if (!group.safeName) {
    Group.run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (name) {
        group.safeName = name;
        next();
      });
    });
  }
});

module.exports = Group;

var Project = require('./project.js');
Group.hasMany(Project, 'projects', 'id', 'groupID');