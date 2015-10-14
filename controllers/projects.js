var Project = require('../models/project.js');
var Group = require('../models/group');
var Run = require('../models/run.js');
var Read = require('../models/read.js');
var Groups = require('./groups');
var fs = require('fs-extra');
var path = require('path');
var util = require('../lib/util');
var config = require('../config.json');

var Projects = {};

Projects.new = function (req, res) {

  var group = req.params.group;

Group.filter({safeName:group}).run().then(function(groups){
  return res.render('projects/new', {selectedGroup: groups[0]});

})

};

Projects.newPost = function (req, res) {
  var name = req.body.name;
  var group = req.body.group;
  var responsiblePerson = req.body.responsiblePerson;
  var shortDescription = req.body.shortDescription;
  var longDescription = req.body.longDescription;

  Group.filter({safeName:group}).run().then(function(groups){
    var project = new Project({
      name: name,
      group: group,
      responsiblePerson: responsiblePerson,
      shortDescription: shortDescription,
      longDescription: longDescription
    });

    project.save().then(function (result) {

      var joinedPath = path.join(config.dataDir, result.safeName);
      fs.ensureDir(joinedPath, function (err) {
        if (err) {
          return res.render('error', {error: err});
        }
        return res.redirect('/' + project.safeName);
      });
    }).error(function (err) {
      console.error(err);
    })
  });
};

Projects.show = function (req, res, next) {
  var project = req.params.project;
  var group = req.params.group;


  Project.filter({safeName: project}).getJoin({samples: true, group:true}).filter({group:{safeName:group}}).run().then(function (projects) {

    if (projects.length < 1) {
      return next();
    }

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