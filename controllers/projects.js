var Project = require('../models/project.js');
var Run = require('../models/run.js');
var Read = require('../models/read.js');

var fs = require('fs');
var path = require('path');

var util = require('../lib/util');

var config = require('../config.json');

var Projects = {};

Projects.groups = [
  'Jonathan Jones Group',
  'Sophien Kamoun Group',
  'Ksenia Krasileva Group',
  'Matthew Moscou Group',
  'Silke Robatzek Group',
  'Cyril Zipfel Group',
  'The 2Blades Group',
  'Bioinformatics',
  'Proteomics',
  'Synthetic Biology',
  'Tissue Culture & Transformation'
].sort();

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
  return res.render('projects/new', {groups: Projects.groups});
};

Projects.newPost = function (req, res) {
  var name = req.body.name;
  var lab = req.body.lab;
  var responsiblePerson = req.body.responsiblePerson;
  var shortDescription = req.body.shortDescription;
  var longDescription = req.body.longDescription;

  var project = new Project({
    name: name,
    lab: lab,
    responsiblePerson: responsiblePerson,
    shortDescription: shortDescription,
    longDescription: longDescription
  });

  project.save().then(function (result) {

    var joinedPath = path.join(config.dataDir, result.safeName);
    util.createFolder(joinedPath, function (err) {
      if (err) {
        return res.render('error', {error: err});
      }
      return res.redirect('/' + project.safeName);
    });
  }).error(function (err) {
    console.error(err);
  })
};

Projects.show = function (req, res) {
  var project = req.params.project;

  Project.filter({safeName: project}).getJoin({samples: true}).run().then(function (projects) {

    var project = projects[0];

    var fullPath = path.join(config.dataDir, project.safeName);

    util.unknownFolders(fullPath, project.samples, function (unknownFolders) {
      return res.render('projects/show', {project: projects[0], unknownFolders: unknownFolders});
    });
  }).error(function () {
    return res.render('error', {error: 'could not find project'});
  });
};

module.exports = Projects;