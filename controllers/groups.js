"use strict";

var error = require('../lib/error');
var Group = require('../models/group');

var Groups = {};

/**
 * render group list
 * @param req {request}
 * @param res {response}
 */
Groups.index = function (req, res) {
  Group.run().then(function (groups) {

    groups.sort(function (a, b) {
      return a.safeName.localeCompare(b.safeName);
    });

    return res.render('groups/index', {groups: groups});
  });
};

/**
 * render one group
 * @param req {request}
 * @param res {response}
 * @param next {callback}
 */
Groups.show = function (req, res, next) {
  var requestedGroup = req.params.group;
  Group.filter({safeName: requestedGroup}).getJoin({projects: true}).then(function (groups) {

    if (groups.length < 1) {
      return error('could not find group ' + requestedGroup, req, res);
    }

    var group = groups[0];
    var projects = group.projects;
    return res.render('groups/show', {group: group, projects: projects});
  });
};

module.exports = Groups;