var Project = require('../models/project.js');

var config = require('../config');

var Groups = {};

Groups.groups = config.groups.sort();

Groups.index = function (req, res, next) {
  res.render('groups/index', {groups: Groups.groups});
};

Groups.show = function (req, res) {
  var requestedGroup = req.params.group;

  if (requestedGroup === 'all') {
    Project.run().then(function (projects) {
      res.render('groups/show', {group: requestedGroup, projects: projects});
    });
  }

  Project.filter({group: requestedGroup}).run().then(function (projects) {
    res.render('groups/show', {group: requestedGroup, projects: projects});
  });
};

module.exports = Groups;