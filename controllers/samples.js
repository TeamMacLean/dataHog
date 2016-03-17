"use strict";

var Samples = {};
var Project = require('../models/project');
var Sample = require('../models/sample');
var Upload = require('../models/upload');
var fs = require('fs-extra');
var util = require('../lib/util');
var path = require('path');
var config = require('../config.json');
var async = require('async');
var error = require('../lib/error');

/**
 * render new sample form
 * @param req {request}
 * @param res {response}
 */
Samples.new = function (req, res) {

  var projectSN = req.params.project;
  var groupSN = req.params.group;

  Project.filter({safeName: projectSN}).getJoin({group: true}).filter({group: {safeName: groupSN}}).run().then(function (results) {
    res.render('samples/new', {project: results[0]});
  }).error(function () {
    return error('could not find project', req, res);
  });

};

/**
 * post new sample
 * @param req {request}
 * @param res {response}
 */
Samples.newPost = function (req, res) {

  var projectSafeName = req.params.project;

  Project.filter({safeName: projectSafeName}).getJoin({group: true}).run().then(function (projects) {
      var project = projects[0];

      var name = req.body.name;
      var commonName = req.body.commonName;
      var scientificName = req.body.scientificName;
      var ncbi = req.body.ncbi;
      var conditions = req.body.conditions;

      var newSample = new Sample({
        name: name,
        projectID: project.id,
        commonName: commonName,
        scientificName: scientificName,
        ncbi: ncbi,
        conditions: conditions
      });

      newSample.save().then(function (result) {

        var joinedPath = path.join(config.dataDir, project.group.safeName, project.safeName, result.safeName);

        fs.ensureDir(joinedPath, function (err) {
          if (err) {
            return error(err, req, res);
          } else {

            var additionalFiles = [];

            var absTmpPath = path.resolve(config.tmpDir);


            //for (var p in req.files) {
            //  if (req.files.hasOwnProperty(p)) {
            //    if (p.indexOf('additional') > -1) {
            //      additionalFiles.push(req.files[p]);
            //    }
            //  }
            //}


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
                var url = path.join('/', project.group.safeName, project.safeName, result.safeName);
                return res.redirect(url);
              });
            });
          }
        });
      }).error(function (err) {
        console.error(err);
      });
    })
    .error(function () {
      return error('could not find project', req, res);
    });

};

/**
 * render one sample
 * @param req {request}
 * @param res {response}
 */
Samples.show = function (req, res) {
  var sampleSafeName = req.params.sample;
  var projectSN = req.params.project;
  var groupSN = req.params.group;

  Sample.filter({safeName: sampleSafeName}).getJoin({
    project: {group: true},
    runs: true,
    additionalFiles: true
  }).filter({project: {safeName: projectSN, group: {safeName: groupSN}}}).run().then(function (results) {

      if (results.length < 1) {
        return error('could not find sample ' + sampleSafeName, req, res);

      }
      var sample = results[0];

      res.render('samples/show', {sample: sample});
    })
    .error(function (err) {
      console.error(err);
      return error('could not find sample', req, res);
    });
};

module.exports = Samples;