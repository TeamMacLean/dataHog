var Project = require('../models/project.js');
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


  var projectID = req.params.project;
  Project.get(projectID).getJoin({runs: true}).run().then(function (project) {
    return res.render('runs/new', {project: project});
  }).error(function () {
    return res.render('error', {error: 'could not create project'});
  });
};

Runs.newPost = function (req, res) {

  var projectID = req.params.project;
  var name = req.body.name;

  var sequencingProvider = req.body.sequencingProvider;
  var sequencingTechnology = req.body.sequencingTechnology;
  var communicationExcerpts = req.body.communicationExcerpts;
  var sequencingProviderDatasheets = req.body.sequencingProviderDatasheets;
  var libraryInformation = req.body.libraryInformation;
  var libraryType = req.body.libraryType;
  var submissionToPublicPortal = req.body.submissionToPublicPortal;
  var galaxyDataWanted = req.body.galaxyDataWanted === 'on';

  Project.filter({id: projectID}).run().then(function (projects) {

    if (projects.length < 1) {
      return res.render('error', {error: 'project does not exists'});
    }
    var project = projects[0];
    var run = new Run({
      name: name,
      projectID: projectID,
      sequencingProvider: sequencingProvider,
      sequencingTechnology: sequencingTechnology,
      communicationExcerpts: communicationExcerpts,
      sequencingProviderDatasheets: sequencingProviderDatasheets,
      libraryInformation: libraryInformation,
      libraryType: libraryType,
      submissionToPublicPortal: submissionToPublicPortal,
      galaxyDataWanted: galaxyDataWanted
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
            if (sum === fileAndMD5.md5) {
              cb(null)
            } else {
              cb('md5sum for file ' + fileAndMD5.file.originalname + ' does not match');
            }
          }
        });
      });
    });


    async.parallel(para, function (err, out) {


      if (err) {
        return res.render('error', {error: err});
      } else {

        run.save().then(function (result) {
          //TODO create new read for each file,

          var joinedPath = path.join(config.dataDir, project.safeName, result.safeName);

          util.createFolder(joinedPath, function (err) {
            if (err) {
              return res.render('error', {error: err});
            }

            filesAndSums.map(function (fileAndMD5) {
              var file = fileAndMD5.file;

              var newPath = path.join(joinedPath, file.originalname);
              fs.renameSync(file.path, newPath);

              var fqcPath = path.join(joinedPath, '.fastqc');
              fs.mkdirSync(fqcPath);
              fastqc.run(newPath, fqcPath, function () {
                //TODO callback
              })
            });

            return res.redirect('/' + project.id);
          });
        });
      }
    });
  });
};

Runs.show = function (req, res) {
  var runID = req.params.run;

  Run.get(runID).getJoin({project: true, reads: true}).then(function (run) {
    return res.render('runs/show', {run: run});
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  });
};

Runs.fastQC = function (req, res) {
  var runID = req.params.run;
  Run.get(runID).getJoin({project: true}).then(function (run) {
    res.send('TODO');
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  });
};

module.exports = Runs;
