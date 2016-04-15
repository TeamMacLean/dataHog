"use strict";

var Sample = require('../models/sample');
var Run = require('../models/run');
var Read = require('../models/read');
var Upload = require('../models/upload');
var fs = require('fs-extra');
var path = require('path');
var fastqc = require('../lib/fastqc');
var zlib = require('zlib');
var isGzip = require('is-gzip');
var isBzip2 = require('is-bzip2');
var readFileSync = require('fs').readFileSync;
var rimraf = require('rimraf');
var config = require('../config.json');
var util = require('../lib/util');
var thinky = require('../lib/thinky');
var async = require('async');
var email = require('../lib/email');
var Submission = require('../models/submission');


var Runs = {};

function deleteRun(run, cb) {

  if (run) {

    Run.get(run.id).getJoin({reads: true}).run().then(function (result) {

      Read.filter({runID: result.id}).run().then(function (reads) {
        reads.map(function (map) {
          map.delete().then(function () {
            console.warn('deleted read');
          });
        });
      });
      result.delete().then(function () {

        var absPath = path.resolve(path.join(config.dataDir, run.path));

        //TODO safety check this!!!
        rimraf(absPath, function (err) {
          if (err) {
            console.error(err);
            return cb(err);
          } else {
            console.warn('deleted run folder', absPath);
            return cb();
          }
        });
      });
    });
  } else {
    cb(new Error('you did not give me a run!'));
  }
}

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

  //var file = fileAndMD5.file;
  var md5er = fileAndMD5.md5;

  var fileBuff = readFileSync(fileAndMD5.path);

  var compressed = isBzip2(fileBuff) || isGzip(fileBuff);
  var fileExtention = path.extname(fileAndMD5.name);

  var name = fileAndMD5.name;

  if (!compressed && ['.fq', '.fastq'].indexOf(fileExtention) < 0) {
    var err = new Error('not compressed and not a fastq/fq file extention');

    return cb(err);

  } else if (!compressed) { //not compressed
    compressFile(fileAndMD5.path, function (compressedPath) {

      util.md5Stream(fileAndMD5.path, function (md5) {

        return cb(null, {md5: md5, path: path.resolve(compressedPath), name: name + '.gz'});
      });
    });
  } else { //is compressed already
    return cb(null, {md5: md5er, path: path.resolve(fileAndMD5.path), name: name});
  }
}


/**
 *
 * @param req {request} request
 * @param cb {function} callback
 */
function processAllFiles(req, cb) {

  var filesAndSums = [];
  var additionalFiles = [];
  //var __filesAndSums = [];
  //var __additionalFiles = [];
  var absTmpPath = path.resolve(config.tmpDir);


  async.eachSeries(Object.keys(req.body), function iterator(key, theNextOne) {

    var val = req.body[key];
    var filePath = path.join(absTmpPath, val);

    if (key.indexOf('file') > -1) {
      var split = val.split('-');
      if (split.length === 3) {
        console.log('its paired');
      } else {
        console.log('its not paired');
      }

      var num = key.substring(key.indexOf('-') + 1);

      var md5Lookup = 'md5-' + num;


      Upload.filter({uuid: val}).run().then(function (foundFS) {
        var f = foundFS[0];
        filesAndSums.push({
          name: f.name,
          uuid: f.uuid,
          path: filePath,
          md5: req.body[md5Lookup],
          fieldname: key
        });
        theNextOne();
      })

    } else if (key.indexOf('additional') > -1) {
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

    //console.log('calling back', filesAndSums, additionalFiles);

    cb(filesAndSums, additionalFiles);
  });
}

/**
 *
 * @param req {request}
 * @param processed {boolean}
 * @param savedRun {run}
 * @param pathToNewRunFolder
 * @param cb {function}
 */
function addReadToRun(req, processed, savedRun, pathToNewRunFolder, cb) {
  var rootPath = pathToNewRunFolder;

  if (processed) {
    pathToNewRunFolder = path.join(pathToNewRunFolder, 'processed');
  } else {
    pathToNewRunFolder = path.join(pathToNewRunFolder, 'raw');
  }

  fs.ensureDir(pathToNewRunFolder, function (err) {
    if (err) {
      console.error(err);
      cb(err);
    } else {
      var savedReads = [];

      processAllFiles(req, function (filesAndSums, additionalFiles) {

        if (additionalFiles.length > 0) {
          console.log('processing additional');
          util.addAdditional(savedRun, additionalFiles, rootPath, function (err) {
            if (err) {
              console.error(err);
            }
          });
        }

        var happyFiles = [];
        var sadFiles = [];

        //TODO just changed this to process one md5 at a time
        async.eachSeries(filesAndSums, function iterator(fsum, hhnext) {

          //TODO after this async process
          util.md5Stream(fsum.path, function (sum) {
            if (sum === fsum.md5) {
              happyFiles.push(fsum);
            } else {
              sadFiles.push(fsum);
            }
            hhnext();
          });


        }, function done(err) {
          //cb(err); //IMPORTANT after all reads, run and fastaqc created!


          if (sadFiles.length > 0) {
            console.warn('some bad md5 sums');
            return cb(new Error('md5 sums do not match'));
          }

          if (happyFiles.length < 1) {
            //TODO
            //return cb(new Error('no read files attached'));
          }

          var usedFileNames = [];
          var previousID = '';
          async.eachSeries(happyFiles, function iterator(fileAndMD5, nextHappyFile) {

            //var file = fileAndMD5.path;

            var fileName = fileAndMD5.name;
            var testName = fileAndMD5.name;

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
            fileAndMD5.name = fileName;

            ensureCompressed(fileAndMD5, function (err, md5AndPath) {


              var newFullPath = path.join(pathToNewRunFolder, md5AndPath.name);

              util.safeMove(md5AndPath.path, newFullPath, function (err, newPath) {
                if (newPath) { //it may have found a new name!
                  newFullPath = newPath;
                }
                var fqcPath = path.join(pathToNewRunFolder, '.fastqc');

                var siblingID = null;
                var split = fileAndMD5.fieldname.split('-');
                if (split.length === 3) { //its paired/mated

                  var second = split[2] === '2';
                  if (second) {
                    siblingID = previousID;
                  }
                }

                fs.ensureDir(fqcPath, function (err) { // create fastqc folder
                  if (err) {
                    console.error(err);
                    return cb(err);
                  } else {

                    var fileName = path.basename(newPath);
                    var read = new Read({
                      name: md5AndPath.name,
                      runID: savedRun.id,
                      MD5: md5AndPath.md5,
                      processed: processed,
                      siblingID: siblingID,
                      fileName: fileName
                    });


                    //TODO FIXME fastqc.run(newFullPath, fqcPath, function () {
                    console.log('created fastqc report');
                    //read.fastQCLocation = fqcPath;
                    read.save().then(function (savedRead) {
                      previousID = read.id;
                      savedReads.push(savedRead);
                      return nextHappyFile(); //IMPORTANT!!

                    }).error(function (err) {
                      if (err) {
                        return cb(err);
                      }
                    });
                    //});
                  }
                });
              });
            });
          }, function done(err) {
            cb(err); //IMPORTANT after all reads, run and fastaqc created!
          });
        });
      });
    }
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


    run.save().then(function (savedRun) {

      var pathToNewRunFolder = path.join(config.dataDir, sample.project.group.safeName, sample.project.safeName, sample.safeName, savedRun.safeName);


      if (submissionToGalaxy) {

        //var project = savedRun.sample.project;

        //var p1 = project.responsiblePerson;
        //var p2 = project.secondaryContact;

        var hpcPath = path.join(config.hpcRoot, savedRun.path);
        var siteURL = req.protocol + '://' + req.headers.host + savedRun.path;

        var subject = "Request for data to be added to Galaxy";
        var text = "Please add " + hpcPath + " to Galaxy.\n\n" + siteURL + "\n\nThanks :D\nDataHog";
        email.emailAdmin(subject, text);
      }

      var processed = false;
      //TODO disabled for now

      addReadToRun(req, processed, savedRun, pathToNewRunFolder, function (err) {

        if (err) {
          console.error(err);
          deleteRun(savedRun, function () {
            return res.render('error', {error: err});
          });
        } else {
          return renderOK();
        }

      });

      //renderOK();

      function renderOK() {
        Run.get(savedRun.id).getJoin({sample: {project: {group: true}}, reads: true}).then(function (result) {

          var thisGroupConfig = config.groups.filter(function (g) {
            return g.name == result.sample.project.group.name;
          });

          if (thisGroupConfig.length > 0) {
            if (thisGroupConfig[0].sendToENA) {
              var submission = new Submission({
                runID: result.id
              });
              submission.save();

              submission.submit();
            }
          }

          var url = path.join('/', result.sample.project.group.safeName, result.sample.project.safeName, result.sample.safeName, result.safeName);
          return res.redirect(url);
        });
      }

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
  var groupSN = req.params.group;

  Run.filter({safeName: runSN}).getJoin({
    sample: {project: {group: true}},
    reads: {sibling: true},
    additionalFiles: true
  }).filter({
    sample: {
      safeName: sampleSN,
      project: {
        safeName: projectSN,
        group: {safeName: groupSN}
      }
    }
  }).then(function (results) {


    if (results.length === 0) {
      return res.render('error', {error: 'could not find run ' + runSN});
    }

    if (results.length > 1) {
      console.error('too many runs!', results);
    }

    var run = results[0];

    run.reads.sort(function (a, b) {
      var nameA = a.safeName.toLowerCase(), nameB = b.safeName.toLowerCase();
      if (nameA < nameB) //sort string ascending
        return -1;
      if (nameA > nameB)
        return 1;
      return 0; //default return value (no sorting)
    });

    var raw = [];
    var processed = [];

    if (run.reads && run.reads.length > 0) {
      var rawPRE = run.reads.filter(function (r) {
        return r.processed === false;
      });

      var processedPRE = run.reads.filter(function (r) {
        return r.processed === true;
      });


      var disposedRaw = [];
      rawPRE.map(function (r) {
        if (disposedRaw.filter(function (d) {
            if (r.sibling) {
              return d.id == r.sibling.id
            } else {
              return d.id == r.id
            }
          }).length < 1) {
          if (r.sibling) {
            disposedRaw.push(r);
            disposedRaw.push(r.sibling);
            raw.push([r, r.sibling]);
          } else {
            disposedRaw.push(r);
            raw.push([r]);
          }
        }
      });

      var disposedProcessed = [];
      processedPRE.map(function (r) {
        if (disposedProcessed.filter(function (d) {
            if (r.sibling) {
              return d.id == r.sibling.id
            } else {
              return d.id == r.id
            }
          }).length < 1) {
          if (r.sibling) {
            disposedProcessed.push(r);
            disposedProcessed.push(r.sibling);
            processed.push([r, r.sibling]);
          } else {
            disposedProcessed.push(r);
            processed.push([r]);
          }
        }
      });
    }


    var unknownRaw = [];
    var unknownProcessed = [];

    var rawPath = path.join(config.dataDir, run.path, 'raw');
    var processedPath = path.join(config.dataDir, run.path, 'processed');

    try {
      fs.accessSync(rawPath, fs.F_OK);
      var rawFiles = fs.readdirSync(rawPath);
      rawFiles.map(function (rf) {
        if (rf != '.fastqc') {
          if (raw.filter(function (r) {
              if (r.length === 2) {
                r.map(function (rrm) {
                  return rrm.name == rf;
                })
              } else {
                return r.name == rf;
              }
            }).length < 1) {
            unknownRaw.push(rf);
          }
        }
      });
    } catch (err) {
    }

    try {
      fs.accessSync(processedPath, fs.F_OK);
      var processedFiles = fs.readdirSync(processedPath);
      processedFiles.map(function (pf) {
        if (pf != '.fastqc') {
          if (processed.filter(function (p) {
              if (p.length === 2) {
                p.map(function (rrm) {
                  return rrm.name == pf;
                })
              } else {
                return r.name == pf;
              }
            }).length < 1) {
            unknownProcessed.push(pf);
          }
        }
      });
    } catch (err) {
    }


    return res.render('runs/show', {
      run: run,
      raw: raw,
      processed: processed,
      unknownRaw: unknownRaw,
      unknownProcessed: unknownProcessed
    });
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
    var pathToRunProcessedFolder = path.join(config.dataDir, run.sample.project.group.safeName, run.sample.project.safeName, run.sample.safeName, run.safeName);
    var processed = true;

    //processed!
    addReadToRun(req, processed, run, pathToRunProcessedFolder, function (err) {
      if (err) {
        deleteRun(run, function () {
          return res.render('error', {error: 'had to delete the run + reads'});
        });
      }
      var url = path.join('/', run.sample.project.group.safeName, run.sample.project.safeName, run.sample.safeName, run.safeName);
      return res.redirect(url);
    });

  });
};


module.exports = Runs;
