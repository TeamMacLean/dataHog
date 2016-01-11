"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var util = require('../lib/util');
var config = require('../config.json');

var Group = thinky.createModel('Group', {
  id: type.string(),
  name: type.string().required(),
  safeName: type.string().required(),
  path: type.string().required()
});

Group.define("hpcPath", function () {
  if (config.hpcRoot) {
    return config.hpcRoot + this.path;
  } else {
    return this.path;
  }
});

Group.pre('save', function (next) {
  var group = this;

  console.log(group.name);

  var unsafeName = group.name.name ? group.name.name : group.name;
  if (!group.safeName) {
    Group.run().then(function (result) {

      console.log('creating safeName for', unsafeName);

      util.generateSafeName(unsafeName, result, function (name) {
        group.safeName = name;

        group.path = '/' + group.safeName;

        util.generateUniqueName(group.name, result, function (newName) {
          group.name = newName;
          next();
        });
      });
    });
  }
});

module.exports = Group;

var Project = require('./project.js');
Group.hasMany(Project, 'projects', 'id', 'groupID');