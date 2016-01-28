"use strict";

var Reads = {};

var Read = require('../models/read.js');
var fs = require('fs');
var path = require('path');
var config = require('../config.json');


/**
 * render one read
 * @param req {request}
 * @param res {response}
 * @param next {callback}
 */
Reads.show = function (req, res, next) {

  var projectSN = req.params.project;
  var sampleSN = req.params.sample;
  var runSN = req.params.run;
  var readSN = req.params.read;

  Read.filter({safeName: readSN}).getJoin({run: {sample: {project: {group: true}}}}).filter({
    run: {
      safeName: runSN,
      sample: {safeName: sampleSN, project: {safeName: projectSN}}
    }
  }).run().then(function (results) {

    if (results.length < 1) {
      return error('could not find read ' + readSN, req, res);
    }

    var read = results[0];
    return res.render('readData/show', {read: read});
  }).error(function (err) {
    return error(err, req, res);
  });

};

/**
 * render fastq report
 * @param req {request}
 * @param res {response}
 */
Reads.fastQC = function (req, res) {

  var projectSN = req.params.project;
  var sampleSN = req.params.sample;
  var runSN = req.params.run;
  var readSN = req.params.read;


  Read.filter({safeName: readSN}).getJoin({run: {sample: {project: {group: true}}}})
    .filter({
      run: {
        safeName: runSN,
        sample: {safeName: sampleSN, project: {safeName: projectSN}}
      }
    })
    .run().then(function (results) {

    var read = results[0];

    var strippedReadName = read.fileName.replace('.gz', '').replace('.bz2', '');

    var htmlPath = path.resolve(path.join(config.dataDir, read.fastQCLocation, strippedReadName + '_fastqc.html'));

    fs.stat(htmlPath, function (err) {
      if (!err) {


        return res.sendFile(htmlPath);
      } else {
        return error('could not find fast qc report', req, res);
      }
    });


  }).error(function () {
    return error('could not find run', req, res);
  });
};

Reads.download = function (req, res) {
  var projectSN = req.params.project;
  var sampleSN = req.params.sample;
  var runSN = req.params.run;
  var readSN = req.params.read;

  Read.filter({safeName: readSN}).getJoin({run: {sample: {project: {group: true}}}})
    .filter({
      run: {
        safeName: runSN,
        sample: {safeName: sampleSN, project: {safeName: projectSN}}
      }
    })
    .run().then(function (results) {

    var read = results[0];
    var absPath = path.resolve(path.join(config.dataDir, read.path));

    return res.download(absPath, read.fileName, function (err) {
      if (err) {
        console.error(err);
      }
    });
  });
};

module.exports = Reads;