var Project = require('../models/project.js');
var Sample = require('../models/sample.js');
var Run = require('../models/run.js');
var Read = require('../models/read.js');

var async = require('async');
var fs = require('fs');
var path = require('path');
var fastqc = require('../lib/fastqc');
var md5Check = require('../lib/md5');

var util = require('../lib/util');

var config = require('../config.json');

var Runs = {};

Runs.new = function (req, res) {

  var sampleID = req.params.sample;
  Sample.filter({safeName: sampleID}).getJoin({project: true}).run().then(function (result) {
    return res.render('runs/new', {sample: result[0]});
  }).error(function () {
    return res.render('error', {error: 'could not create project'});
  });
};

Runs.newPost = function (req, res) {

  //var projectID = req.params.project;
  var sampleID = req.params.sample;
  var name = req.body.name;

  var sequencingProvider = req.body.sequencingProvider;
  var sequencingTechnology = req.body.sequencingTechnology;
  var insertSize = req.body.insertSize;
  var communicationExcerpts = req.body.communicationExcerpts;
  var sequencingProviderDataSheet = req.body.sequencingProviderDataSheet;
  var libraryInformation = req.body.libraryInformation;
  var libraryType = req.body.libraryType;
  var submissionToPublicPortal = req.body.submissionToPublicPortal;
  var submissionToGalaxy = req.body.submissionToGalaxy === 'on';

  Sample.filter({safeName: sampleID}).getJoin({project: true}).run().then(function (results) {

    if (results.length < 1) {
      return res.render('error', {error: 'sample does not exists'});
    }

    var sample = results[0];

    var run = new Run({
      name: name,
      sampleID: sample.id,
      sequencingProvider: sequencingProvider,
      sequencingTechnology: sequencingTechnology,
      insertSize: insertSize,
      communicationExcerpts: communicationExcerpts,
      sequencingProviderDataSheet: sequencingProviderDataSheet,
      libraryInformation: libraryInformation,
      submissionToGalaxy: submissionToGalaxy,
      libraryType: libraryType,
      submissionToPublicPortal: submissionToPublicPortal,
    });


    //get all file and md5 info from post
    var looking = true;
    var filesAndSums = [];
    var loop = 0;
    while (looking) {
      loop++;
      var file = req.files['file-' + loop];
      if (file) {
        filesAndSums.push({file: file, md5: req.body['MD5-' + loop]});
      } else {
        looking = false;
      }
    }

    //make array of md5 checks
    var para = [];
    filesAndSums.map(function (fileAndMD5) {
      para.push(function (cb) {
        md5Check.run(fileAndMD5.file.path, function (err, sum) {
          if (err) {
            cb(err);
          } else {
            if (sum == fileAndMD5.md5) {
              cb(null)
            } else {
              cb('md5sum for file ' + fileAndMD5.file.originalname + ' does not match');
            }
          }
        });
      });
    });

    console.log('1');
    async.parallel(para, function (err, out) {
      console.log('2');
      if (err) {
        console.log('3');
        return res.render('error', {error: err});
      } else {

        run.save().then(function (result) {
          //TODO create new read for each file,

          console.log('4');

          var joinedPath = path.join(config.dataDir, sample.project.safeName, sample.safeName, result.safeName);

          function postReturnStuff() {
            util.createFolder(joinedPath, function (err) {
              console.log('5');
              if (err) {
                return res.render('error', {error: err});
              }

              filesAndSums.map(function (fileAndMD5) {
                console.log('6');
                var file = fileAndMD5.file;

                var newPath = path.join(joinedPath, file.originalname);
                fs.renameSync(file.path, newPath);

                var fqcPath = path.join(joinedPath, '.fastqc');
                fs.mkdirSync(fqcPath);
                fastqc.run(newPath, fqcPath, function () {
                  console.log('7');
                })
              });
              console.log('8');
            });
          }

          postReturnStuff();
          return res.redirect('/' + sample.project.safeName + '/' + sample.safeName);


        }).error(function () {
          console.log('1');
          return res.render('error', {error: 'failed to save run!'});
        })
      }
    });
  });
};

Runs.show = function (req, res) {
  var runSN = req.params.run;

  Run.filter({safeName: runSN}).getJoin({sample: {project: true}, reads: true}).then(function (run) {
    return res.render('runs/show', {run: run[0]});
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  });
};

Runs.fastQC = function (req, res) {

  var RunSN = req.params.run;

  Run.filter({safeName: RunSN}).getJoin({sample: true}).run().then(function (run) {
    res.send('TODO');
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  });
};

module.exports = Runs;
