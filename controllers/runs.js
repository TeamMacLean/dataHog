var Project = require('../models/project.js');
var Sample = require('../models/sample.js');
var Run = require('../models/run.js');
var Read = require('../models/read.js');

var async = require('async');
var fs = require('fs-extra');
var path = require('path');
var fastqc = require('../lib/fastqc');
var md5 = require('md5');
var gzip = zlib.createGzip();

var isGzip = require('is-gzip');
var isBzip2 = require('is-bzip2');
var read = require('fs').readFileSync;


var config = require('../config.json');

var Runs = {};

Runs.new = function (req, res) {

  var sampleSN = req.params.sample;
  var projectSN = req.params.project;

  Sample.filter({safeName: sampleSN}).getJoin({project: true}).filter({project: {safeName: projectSN}}).run().then(function (results) {

    if (results.length > 1) {
      console.error('too many samples', results);
    }

    return res.render('runs/new', {sample: results[0]});
  }).error(function () {
    return res.render('error', {error: 'could not create project'});
  });
};

Runs.newPost = function (req, res) {

  var projectSN = req.params.project;
  var sampleSN = req.params.sample;
  var name = req.body.name;

  var sequencingProvider = req.body.sequencingProvider;
  var sequencingTechnology = req.body.sequencingTechnology;
  var insertSize = req.body.insertSize;
  var libraryInformation = req.body.libraryInformation;
  var libraryType = req.body.libraryType;
  var submissionToGalaxy = req.body.submissionToGalaxy === 'on';

  Sample.filter({safeName: sampleSN}).getJoin({project: true}).filter({project: {safeName: projectSN}}).run().then(function (results) {


    if (results.length > 1) {
      console.error('too many samples', results);
    }
    var sample = results[0];

    var run = new Run({
      name: name,
      sampleID: sample.id,
      sequencingProvider: sequencingProvider,
      sequencingTechnology: sequencingTechnology,
      insertSize: insertSize,
      libraryInformation: libraryInformation,
      submissionToGalaxy: submissionToGalaxy,
      libraryType: libraryType
    });

    var filesAndSums = [];
    var additionalFiles = [];

    function processAllFiles() {

      for (var p in req.files) {
        if (req.files.hasOwnProperty(p)) {
          if (p.indexOf('file') > -1) {
            var file = req.files[p];
            var num = p.split('-')[1];
            filesAndSums.push({file: file, md5: req.body['MD5-' + num]});
          } else if (p.indexOf('additional') > -1) {
            additionalFiles.push(req.files[p]);
          }
        }
      }
    }

    run.save().then(function (savedRun) {
        processAllFiles();
        var pathToNewRunFolder = path.join(config.dataDir, sample.project.safeName, sample.safeName, savedRun.safeName);

        fs.ensureDir(pathToNewRunFolder, function (err) {
          if (err) {
            return res.render('error', {error: err});
          }
          runInOrder();
        });

        function runInOrder() {
          async.series([addReads, addAdditional], renderOK);
        }

        function renderOK() {
          Run.get(savedRun.id).getJoin({sample: {project: true}, reads: true}).then(function (result) {
            var url = path.join('/', result.sample.project.safeName, result.sample.safeName, result.safeName);
            return res.redirect(url);
          })
        }

        function addReads(cb) {

          var happyFiles = [];
          var sadFiles = [];
          filesAndSums.map(function (fsum) {
            var buf = fs.readFileSync(fsum.file.path);
            var sum = md5(buf);
            if (sum == fsum.md5) {
              happyFiles.push(fsum)
            } else {
              sadFiles.push(fsum);
            }
          });
          if (sadFiles.length > 0) {
            console.warn('some bad md5 sums');
            return res.render('error', {
              error: 'md5 sums do not match for ' + sadFiles
            })
          }

          //TODO process gzip bzip2 stuff here!

          var allCompressedReads = [];

          happyFiles.map(function (hf) {

            var file = hf.file;
            var md5 = hf.md5;

            var fileBuff = read(file.path);

            var compressed = isBzip2(fileBuff) || isGzip(fileBuff);

            if (!compressed) { //not compressed

              var fileExtention = path.extname(file.originalname);

              var oldPath = 'TODO';
              var newPath = oldPath + '.gz';

              var inp = fs.createReadStream(oldPath);
              var out = fs.createWriteStream(newPath);
              inp.pipe(gzip).pipe(out); //TODO is this SYNC? (hope so)
            }
            allCompressedReads.push({file: file, md5: md5});
          });


          var usedFileNames = [];
          allCompressedReads.map(function (fileAndMD5) {
            var file = fileAndMD5.file;
            var fileName = file.originalname;
            if (usedFileNames.indexOf(fileName) > -1) {
              var i = 0;
              while (usedFileNames.indexOf(fileName) > -1) {
                i++;
                var extension = path.extname(file.originalname);
                var withoutExtention = path.basename(fileName, extension);
                fileName = withoutExtention + i + extension;
              }
            }
            usedFileNames.push(fileName);
            var newPath = path.join(pathToNewRunFolder, fileName);
            fs.renameSync(file.path, newPath);
            var fqcPath = path.join(pathToNewRunFolder, '.fastqc');
            console.log('new path', fqcPath);

            fs.ensureDir(pathToNewRunFolder, function (err) {
              if (err) {
                return res.render('error', {error: err});
              }
              fqcStuff();
            });
            function fqcStuff() {
              console.log('adding read', fileName);
              var read = new Read({
                name: fileName,
                runID: savedRun.id,
                MD5: fileAndMD5.md5,
                fastQCLocation: fqcPath,
                moreInfo: '',
                path: newPath
              });
              read.save().then(function (savedRead) {
                fastqc.run(newPath, fqcPath, function () {
                  console.log('created fastqc report');
                })
              }).error(function (err) {
                return res.render('error', {error: err});
              });
            }
          });
          cb();
        }

        function addAdditional(cb) {
          var joinedPathWithAddition = path.join(pathToNewRunFolder, 'additional');
          fs.ensureDir(pathToNewRunFolder, function (err) {
            if (err) {
              return res.render('error', {error: err});
            }
            moveAdditional();
          });
          function moveAdditional() {
            var usedNames = [];
            var justPaths = [];
            additionalFiles.map(function (f) {
              var fileName = f.originalname;
              if (usedNames.indexOf(fileName) > -1) {
                var i = 0;
                while (usedNames.indexOf(fileName) > -1) {
                  i++;
                  var extension = path.extname(f.originalname);
                  var withoutExtention = path.basename(fileName, extension);
                  fileName = withoutExtention + i + extension;
                }
              }
              usedNames.push(fileName);
              var newPath = path.join(joinedPathWithAddition, fileName);
              justPaths.push(newPath);
              fs.rename(f.path, newPath, function (err) {
                if (err) {
                  console.error('error!', err);
                }
              });
            });
            Run.get(savedRun.id).update({additionalData: justPaths}).run().then(function (savedRun) {
              cb();
            })
              .error(function (err) {
                console.error(err);
              })
          }

        }
      }
    )
  })
};


Runs.show = function (req, res) {
  var runSN = req.params.run;
  var sampleSN = req.params.sample;
  var projectSN = req.params.project;

  Run.filter({safeName: runSN}).getJoin({sample: {project: true}, reads: true}).filter({
    sample: {
      safeName: sampleSN,
      project: {safeName: projectSN}
    }
  }).then(function (results) {

    //var filtered = results.filter(function (r) {
    //  return r.sample.safeName === sampleSN && r.sample.project.safeName === projectSN;
    //});

    if (results.length > 1) {
      console.error('too many runs', results);
    }

    var run = results[0];

    return res.render('runs/show', {run: run});
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  });
};


module.exports = Runs;
