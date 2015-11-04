var Reads = {};

//var Project = require('../models/project.js');
//var Sample = require('../models/sample.js');
var Run = require('../models/run.js');
var Read = require('../models/read.js');
var fs = require('fs');
var path = require('path');


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
      return next();
    }

    var read = results[0];
    return res.render('readData/show', {read: read});
  }).error(function (err) {
    return res.render('error', {error: err});
  })

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

      var strippedReadName = read.name.replace('.gz', '').replace('.bz2', '');

      var htmlPath = path.join(__dirname, '../', read.fastQCLocation, strippedReadName + '_fastqc.html');

      fs.stat(htmlPath, function (err, stat) {
        if (!err) {
          res.sendFile(htmlPath);
        } else {
          res.send('could not find fast qc report');
        }
      });


    }).error(function () {
      return res.render('error', {error: 'could not find run'});
    });
};

module.exports = Reads;