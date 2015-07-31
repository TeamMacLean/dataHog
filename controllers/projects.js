var Project = require('../models/project.js');
var Run = require('../models/run.js');
var Read = require('../models/read.js');

var fs = require('fs');
var path = require('path');

var util = require('../lib/util');

var config = require('../config.json');

var Projects = {};

Projects.index = function (req, res) {
  Project.then(function (projects) {
    util.unknownFolders(config.dataDir, projects, function (unknownFolders) {
      return res.render('projects/index', {projects: projects, unknownFolders: unknownFolders});
    });
  });
};

Projects.lab = function (req, res) {
  var requestedLab = req.params.lab;
  Project.filter({lab: requestedLab}).run().then(function (projects) {
    res.render('lab/show', {lab: requestedLab, projects: projects});
  });
};

Projects.new = function (req, res) {
  return res.render('projects/new');
};

Projects.newPost = function (req, res) {
  var name = req.body.name;
  var lab = req.body.lab;
  var responsiblePerson = req.body.responsiblePerson;
  var description = req.body.description;


  var project = new Project({
    name: name,
    lab: lab,
    responsiblePerson: responsiblePerson,
    description: description
  });

  project.save().then(function (result) {

    var joinedPath = path.join(config.dataDir, result.safeName);
    util.createFolder(joinedPath, function (err) {
      if (err) {
        return res.render('error', {error: err});
      }
      return res.redirect('/' + project.id);
    });
  });
};

Projects.show = function (req, res) {
  var projectID = req.params.project;

  Project.get(projectID).getJoin({runs: true}).run().then(function (project) {

    var fullPath = path.join(config.dataDir, project.safeName);

    util.unknownFolders(fullPath, project.runs, function (unknownFolders) {
      return res.render('projects/show', {project: project, unknownFolders: unknownFolders});
    });
  }).error(function () {
    return res.render('error', {error: 'could not find project'});
  });
};

module.exports = Projects;