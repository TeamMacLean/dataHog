"use strict";
var error = require('../lib/error');
var Project = require('../models/project.js');
var Group = require('../models/group');
var Upload = require('../models/upload');
var fs = require('fs-extra');
var path = require('path');
var util = require('../lib/util');
var config = require('../config.json');
var async = require('async');

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
      return error('group ' + groupSafeName + '  not found', req, res);
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
          return error(err, req, res);
        }

        var absTmpPath = path.resolve(config.tmpDir);
        var additionalFiles = [];


        async.eachSeries(Object.keys(req.body), function iterator(key, theNextOne) {

          var val = req.body[key];
          var filePath = path.join(absTmpPath, val);


          if (key.indexOf('additional') > -1) {
            Upload.filter({uuid: val}).run().then(function (foundAF) {
              var a = foundAF[0];
              additionalFiles.push({
                name: a.name,
                uuid: a.uuid,
                path: filePath,
                fieldname: key
              });
              //console.log('additional', additionalFiles);
              theNextOne();
            })
          } else {
            theNextOne();
          }

        }, function done(err) {

          if (err) {
            console.error(err);
          }

          util.addAdditional(result, additionalFiles, joinedPath, function (err) {
            if (err) {
              console.error(err);
            }
            var url = path.join('/', group.safeName, project.safeName);
            return res.redirect(url);
          });

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
      return error('could not find project ' + projectSN, req, res);
      //return next();
    }

    var project = projects[0];

    return res.render('projects/show', {project: project});
    //});
  }).error(function () {
    return error('could not find project ' + projectSN, req, res);
  });
};

module.exports = Projects;