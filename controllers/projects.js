"use strict";

var Project = require('../models/project.js');
var Group = require('../models/group');
var fs = require('fs-extra');
var path = require('path');
var util = require('../lib/util');
var config = require('../config.json');

var Projects = {};

/**
 * render new project page
 * @param req {request}
 * @param res {response}
 */
Projects.new = function (req, res) {
  var group = req.params.group;
  Group.filter({safeName: group}).run().then(function (groups) {
    return res.render('projects/new', {selectedGroup: groups[0]});
  });
};

/**
 * post new project
 * @param req {request}
 * @param res {response}
 */
Projects.newPost = function (req, res) {
  var name = req.body.name;
  //var groupID = req.body.group;
  var responsiblePerson = req.body.responsiblePerson;
  var shortDescription = req.body.shortDescription;
  var longDescription = req.body.longDescription;
  var secondaryContact = req.body.secondaryContact;

  var groupSafeName = req.params.group;


  Group.filter({safeName: groupSafeName}).run().then(function (groups) {

    if (!groups) {
      return res.render('error', {error: 'group ' + groupSafeName + '  not found'});
    }

    var group = groups[0];


    var project = new Project({
      name: name,
      groupID: group.id,
      responsiblePerson: responsiblePerson,
      secondaryContact: secondaryContact,
      shortDescription: shortDescription,
      longDescription: longDescription
    });

    project.save().then(function (result) {


      var joinedPath = path.join(config.dataDir, group.safeName, result.safeName);
      fs.ensureDir(joinedPath, function (err) {
        if (err) {
          console.error(err);
          return res.render('error', {error: err});
        }

        var additionalFiles = [];
        for (var p in req.files) {
          if (req.files.hasOwnProperty(p)) {
            if (p.indexOf('additional') > -1) {
              additionalFiles.push(req.files[p]);
            }
          }
        }
        util.addAdditional(result, additionalFiles, joinedPath, function (err) {
          if (err) {
            console.error(err);
          }
          var url = path.join('/', group.safeName, project.safeName);
          return res.redirect(url);
        });


      });
    }).error(function (err) {
      console.error(err);
    });
  });
};

/**
 * render one project
 * @param req {request}
 * @param res {response}
 * @param next {callback}
 */
Projects.show = function (req, res, next) {

  var projectSN = req.params.project;
  var groupSN = req.params.group;


  Project.filter({safeName: projectSN}).getJoin({
    samples: true,
    group: true,
    additionalFiles: true
  }).filter({group: {safeName: groupSN}}).run().then(function (projects) {

    if (projects.length < 1) {
      return res.render('error', {error: 'could not find project ' + projectSN});
      //return next();
    }

    var project = projects[0];

    return res.render('projects/show', {project: project});
    //});
  }).error(function () {
    return res.render('error', {error: 'could not find project'});
  });
};

module.exports = Projects;