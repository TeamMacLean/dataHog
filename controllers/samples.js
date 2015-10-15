var Samples = {};
var Project = require('../models/project');
var Sample = require('../models/sample');
var fs = require('fs-extra');
var path = require('path');
var config = require('../config.json');

Samples.new = function (req, res) {

  var projectSN = req.params.project;
  var groupSN = req.params.group;

  Project.filter({safeName: projectSN}).getJoin({group: true}).filter({group: {safeName: groupSN}}).run().then(function (results) {
    res.render('samples/new', {project: results[0]});
  }).error(function () {
    return res.render('error', {error: 'could not find project'});
  });


};
Samples.newPost = function (req, res) {

  var projectSafeName = req.params.project;

  Project.filter({safeName: projectSafeName}).getJoin({group: true}).run().then(function (projects) {
    var project = projects[0];

    var name = req.body.name;
    var organism = req.body.organism;
    var ncbi = req.body.ncbi;
    var conditions = req.body.conditions;

    var newSample = new Sample({
      name: name,
      projectID: project.id,
      organism: organism,
      ncbi: ncbi,
      conditions: conditions
    });

    newSample.save().then(function (result) {

      var joinedPath = path.join(config.dataDir, project.group.safeName, project.safeName, result.safeName);

      fs.ensureDir(joinedPath, function (err) {
        if (err) {
          return res.render('error', {error: err});
        } else {

          var url = path.join('/', project.group.safeName, project.safeName, result.safeName);
          return res.redirect(url);
        }
      });
    }).error(function (err) {
      console.error(err);
    });
  })
    .error(function (err) {
      return res.render('error', {error: 'could not find project'});
    });

};

Samples.show = function (req, res) {
  var sampleSafeName = req.params.sample;
  var projectSN = req.params.project;

  Sample.filter({safeName: sampleSafeName}).getJoin({
    project: {group: true},
    runs: true
  }).filter({project: {safeName: projectSN}}).run().then(function (results) {

    if (results.length > 1) {
      console.error('multiple samples', results);
    }
    var sample = results[0];

    res.render('samples/show', {sample: sample});
  })
    .error(function (err) {
      return res.render('error', {error: 'could not find sample'});
    })
};

module.exports = Samples;