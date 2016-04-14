"use strict";

var Reads = {};

var Read = require('../models/read.js');
var fs = require('fs');
var path = require('path');
var config = require('../config.json');
var renderError = require('../lib/error');


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
      return renderError('could not find read ' + readSN, req, res);
    }

    var read = results[0];
    return res.render('readData/show', {read: read});
  }).error(function (err) {
    return renderError(err, req, res);
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
        return renderError('could not find fast qc report', req, res);
      }
    });


  }).error(function () {
    return renderError('could not find run', req, res);
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

    fs.access(absPath, fs.F_OK, function (err) {
      if (!err) {
        // Do something
        return res.download(absPath, read.fileName, function (err) {
          if (err) {
            console.error(err);
          }
        });
      } else {
        // It isn't accessible
        //TODO check for legacy path

        if (read.legacyPath) {
          fs.access(read.legacyPath, fs.F_OK, function (err) {
            if (!err) {
              // Do something
              return res.download(read.legacyPath, read.fileName, function (err) {
                if (err) {
                  console.error(err);
                }
              });

            } else {
              // It isn't accessible
              return renderError('Could not find file ' + read.path, req, res);
            }
          });
        } else {
          return renderError('Could not find file ' + read.path, req, res);
        }
      }
    });


  });
};

module.exports = Reads;




