var Reads = {};

var Project = require('../models/project.js');
var Sample = require('../models/sample.js');
var Run = require('../models/run.js');
var Read = require('../models/read.js');

var path = require('path');

Reads.show = function (req, res, next) {

  var projectSN = req.params.project;
  var sampleSN = req.params.sample;
  var runSN = req.params.run;
  var readSN = req.params.read;

  Read.filter({safeName: readSN}).getJoin({run: {sample: {project: true}}}).run().then(function (results) {
    var read = results[0];
    res.render('readData/show', {read: read});
  })

};

Reads.fastQC = function (req, res) {

  var readSN = req.params.read;

  Read.filter({safeName: readSN}).getJoin({run: {sample: {project: true}}}).run().then(function (results) {

    var read = results[0];

    var htmlPath = path.join(__dirname,'../',read.fastQCLocation, read.name + '_fastqc.html');

    res.sendFile(htmlPath);

  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  });
};

module.exports = Reads;