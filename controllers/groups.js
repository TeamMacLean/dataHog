var Project = require('../models/project.js');

var Group = require('../models/group');

var config = require('../config');

var Groups = {};


Groups.index = function (req, res, next) {
  Group.run().then(function (groups) {
    res.render('groups/index', {groups: groups.sort()});
  })
};

Groups.show = function (req, res, next) {
  var requestedGroup = req.params.group;
  Group.filter({safeName: requestedGroup}).getJoin({projects: true}).then(function (groups) {

    if (groups.length < 1) {
      next();
    }

    var group = groups[0];
    var projects = group.projects;
    res.render('groups/show', {group: group, projects: projects});
  });
};

module.exports = Groups;