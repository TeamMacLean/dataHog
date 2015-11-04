"use strict";

var Sample = require('../models/sample.js');
var Run = require('../models/run.js');
var Read = require('../models/read.js');
var fs = require('fs-extra');
var path = require('path');
var fastqc = require('../lib/fastqc');
var md5 = require('md5');
var zlib = require('zlib');
var isGzip = require('is-gzip');
var isBzip2 = require('is-bzip2');
var read = require('fs').readFileSync;
//var rimraf = require('rimraf');
var config = require('../config.json');

var Runs = {};


/**
 * render the new run form
 * @param req {request}
 * @param res {response}
 */
Runs.new = function (req, res) {

  var groupSN = req.params.group;
  var sampleSN = req.params.sample;
  var projectSN = req.params.project;

  Sample.filter({safeName: sampleSN}).getJoin({project: {group: true}}).filter({
    project: {
      safeName: projectSN,
      group: {safeName: groupSN}
    }
  }).run().then(function (results) {

    if (results.length > 1) {
      console.error('too many samples', results);
    }


    return res.render('runs/new', {sample: results[0]});
  }).error(function (err) {
    return res.render('error', {error: err});
  });
};

/**
 * compress a file
 * @param filename {filename}
 * @param callback {function}
 */
function compressFile(filename, callback) {

  var compressedPath = filename + '.gz';

  var compress = zlib.createGzip(),
    input = fs.createReadStream(filename),
    output = fs.createWriteStream(compressedPath);

  input.pipe(compress).pipe(output);

  if (callback) {


    output.on('finish', function () {
      callback(compressedPath);
    });
  }
}

/**
 *
 * @param fileAndMD5
 * @param cb
 * @returns {*}
 */
function ensureCompressed(fileAndMD5, cb) {

  var file = fileAndMD5.file;
  var md5er = fileAndMD5.md5;

  var fileBuff = read(file.path);

  var compressed = isBzip2(fileBuff) || isGzip(fileBuff);
  var fileExtention = path.extname(file.originalname);

  var originalName = file.originalname;

  if (!compressed && ['.fq', '.fasq'].indexOf(fileExtention) < 0) {
    var err = new Error('not compressed and not a fastq/fq file extention');

    return cb(err);


  } else if (!compressed) { //not compressed
    compressFile(file.path, function (compressedPath) {

      var cFile = fs.readFileSync(compressedPath);
      var cMD5 = md5(cFile);

      return cb(null, {md5: cMD5, path: path.resolve(compressedPath), originalName: originalName + '.gz'});
    });
  } else { //is compressed already
    return cb(null, {md5: md5er, path: path.resolve(file.path), originalName: originalName});
  }

}


/**
 *
 * @param savedRun
 * @param additionalFiles
 * @param pathToNewRunFolder
 * @param cb
 */
function addAdditional(savedRun, additionalFiles, pathToNewRunFolder, cb) {
  var joinedPathWithAddition = path.join(pathToNewRunFolder, 'additional');

  function moveAdditional(additionalFiles) {
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
    Run.get(savedRun.id).update({additionalData: justPaths}).run().then(function () {
        cb();
      })
      .error(function (err) {
        if (err) {
          return cb(err);
          //return fail(err);
        }
      });
  }

  fs.ensureDir(joinedPathWithAddition, function (err) {
    if (err) {
      return cb(err);
      //return fail(err);
    } else {
      moveAdditional(additionalFiles);
    }
  });

}


/**
 *
 * @param req {request} request
 * @param cb {function} callback
 */
function processAllFiles(req, cb) {

  var filesAndSums = [];
  var additionalFiles = [];

  console.log(req.files);
  for (var p in req.files) {


    if (req.files.hasOwnProperty(p)) {
      if (p.indexOf('file') > -1) {

        var file = req.files[p];
        console.log('file', file);
        var split = p.split('-');
        if (split.length === 3) {
          console.log('its paired');
        } else {
          console.log('its not paired');
        }

        var num = p.split('-')[1];
        filesAndSums.push({file: file, md5: req.body['md5-' + num]});
      } else if (p.indexOf('additional') > -1) {
        additionalFiles.push(req.files[p]);
      }
    }
  }
  cb(filesAndSums, additionalFiles);
}

/**
 *
 * @param req {request}
 * @param savedRun {run}
 * @param pathToNewRunFolder {path}
 * @param cb {function}
 */
function addReadToRun(req, savedRun, pathToNewRunFolder, cb) {

  var savedReads = [];

  processAllFiles(req, function (filesAndSums, additionalFiles) {

    if (additionalFiles.length > 0) {
      addAdditional(savedRun, additionalFiles, pathToNewRunFolder, function () {

      });
    }


    var happyFiles = [];
    var sadFiles = [];
    filesAndSums.map(function (fsum) {
      var buf = fs.readFileSync(fsum.file.path);
      var sum = md5(buf);
      if (sum === fsum.md5) {
        happyFiles.push(fsum);
      } else {
        sadFiles.push(fsum);
      }
    });
    if (sadFiles.length > 0) {
      console.warn('some bad md5 sums');
      return cb(new Error('md5 sums do not match'));
    }

    if (happyFiles.length < 1) {
      return cb(new Error('no read files attached'));
    }


    var usedFileNames = [];
    happyFiles.map(function (fileAndMD5) {
      var file = fileAndMD5.file;

      var fileName = file.originalname;
      var testName = file.originalname;

      var exts = '';

      if (testName.indexOf('.') > -1) {

        var preSplit = testName;

        testName = preSplit.substr(0, preSplit.indexOf('.'));
        exts = preSplit.substr(preSplit.indexOf('.'));
      }

      if (usedFileNames.indexOf(testName) > -1) {
        var i = 0;
        while (usedFileNames.indexOf(testName) > -1) {
          i++;
          testName = testName + i;
        }
        fileName = testName + exts;
      }
      usedFileNames.push(testName);
      fileAndMD5.file.originalname = fileName;

      ensureCompressed(fileAndMD5, function (err, md5AndPath) {

        var newFullPath = path.join(pathToNewRunFolder, md5AndPath.originalName);

        fs.renameSync(md5AndPath.path, newFullPath);
        var fqcPath = path.join(pathToNewRunFolder, '.fastqc');


        function fqcStuff() {
          var read = new Read({
            name: md5AndPath.originalName,
            runID: savedRun.id,
            MD5: md5AndPath.md5,
            fastQCLocation: fqcPath,
            moreInfo: '',
            path: newFullPath,
            processed: true
          });
          read.save().then(function (savedRead) {

            savedReads.push(savedRead);

            fastqc.run(newFullPath, fqcPath, function () {
              console.log('created fastqc report');
            });
          }).error(function (err) {
            if (err) {
              return cb(err);
            }
          });
        }

        fs.ensureDir(fqcPath, function (err) { // create fastqc folder
          if (err) {
            return cb(err);
          } else {
            fqcStuff();
          }
        });
      });
    });
    cb();
  });
}


/**
 * post new run
 * @param req {request}
 * @param res {response}
 */
Runs.newPost = function (req, res) {

  var projectSN = req.params.project;
  var sampleSN = req.params.sample;
  var groupSN = req.params.group;
  var name = req.body.name;

  var sequencingProvider = req.body.sequencingProvider;
  var sequencingTechnology = req.body.sequencingTechnology;
  var insertSize = req.body.insertSize;
  var libraryType = req.body.libraryType;
  var submissionToGalaxy = req.body.submissionToGalaxy === 'on';

  var librarySource = req.body.librarySource;
  var librarySelection = req.body.librarySelection;
  var libraryStrategy = req.body.libraryStrategy;


  Sample.filter({safeName: sampleSN}).getJoin({project: {group: true}}).filter({
    project: {
      safeName: projectSN,
      group: {safeName: groupSN}
    }
  }).run().then(function (results) {
    if (results.length > 1) {
      console.error('too many samples', results);
    }
    var sample = results[0];

    var run = new Run({
      name: name,
      sampleID: sample.id,
      librarySource: librarySource,
      librarySelection: librarySelection,
      libraryStrategy: libraryStrategy,
      sequencingProvider: sequencingProvider,
      sequencingTechnology: sequencingTechnology,
      insertSize: insertSize,
      submissionToGalaxy: submissionToGalaxy,
      libraryType: libraryType
    });

    //function fail(err) {
    //
    //  if (currentRun) {
    //    currentRun.delete().then(function () {
    //      console.warn('deleted run');
    //    });
    //  }
    //
    //  if (pathToNewRunFolder) {
    //    rimraf(pathToNewRunFolder, function (err) {
    //      if (err) {
    //        console.error(err);
    //      }
    //      console.warn('deleted run folder', pathToNewRunFolder);
    //    });
    //  }
    //
    //  savedReads.map(function (sr) {
    //    console.warn('deleted read');
    //    sr.delete();
    //  });
    //
    //  return res.render('error', {error: err});
    //}

    run.save().then(function (savedRun) {

      var pathToNewRunFolder = path.join(config.dataDir, sample.project.group.safeName, sample.project.safeName, sample.safeName, savedRun.safeName);

      function renderOK() {
        Run.get(savedRun.id).getJoin({sample: {project: {group: true}}, reads: true}).then(function (result) {
          var url = path.join('/', result.sample.project.group.safeName, result.sample.project.safeName, result.sample.safeName, result.safeName);
          return res.redirect(url);
        });
      }

      fs.ensureDir(pathToNewRunFolder, function (err) {
        if (err) {
          console.error(err);
        } else {
          addReadToRun(req, savedRun, pathToNewRunFolder, function () {
            console.log('done');
            renderOK();
          });
        }

      });


    });
  });
};


/**
 * render one run
 * @param req {request}
 * @param res {response}
 */
Runs.show = function (req, res) {
  var runSN = req.params.run;
  var sampleSN = req.params.sample;
  var projectSN = req.params.project;

  Run.filter({safeName: runSN}).getJoin({sample: {project: {group: true}}, reads: true}).filter({
    sample: {
      safeName: sampleSN,
      project: {safeName: projectSN}
    }
  }).then(function (results) {


    if (results.length > 1) {
      console.error('too many runs', results);
    }

    var run = results[0];


    return res.render('runs/show', {run: run});
  }).error(function () {
    return res.render('error', {error: 'could not find run'});
  });
};

/**
 *
 * @param req {request}
 * @param res {response}
 */
Runs.addPost = function (req, res) {

  var runSN = req.params.run;
  var sampleSN = req.params.sample;
  var projectSN = req.params.project;

  Run.filter({safeName: runSN}).getJoin({sample: {project: {group: true}}, reads: true}).filter({
    sample: {
      safeName: sampleSN,
      project: {safeName: projectSN}
    }
  }).then(function (results) {


    if (results.length > 1) {
      console.error('too many runs', results);
    }

    var run = results[0];

    //console.log('body', req.body);
    //console.log('files', req.files);

    return res.render('runs/show', {run: run});

  });
};


module.exports = Runs;
