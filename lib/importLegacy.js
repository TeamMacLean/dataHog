"use strict";

var fs = require('fs-extra');
var path = require('path');
var util = require('./util');
var async = require('async');
var Group = require('../models/group');
var Project = require('../models/project');
var Sample = require('../models/sample');
var Run = require('../models/run');
var Read = require('../models/read');
var AdditionalFile = require('../models/additionalFile');
var fastqc = require('../lib/fastqc');

function fastqcPath(filePath) {

  var qcPath = path.join(filePath, '.fastqc');
  if (exists(qcPath)) {
    console.log('has fqc report');
    return qcPath;
  } else {
    return null;
  }
}

function exists(srcpath) {
  try {
    fs.lstatSync(srcpath);
    return true;
  }
  catch (e) {
    return false;
  }
}

function getDirectories(srcpath) {
  if (exists(srcpath)) {
    return fs.readdirSync(srcpath).filter(function (file) {
      return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
  } else {
    return [];
  }
}

function getFiles(srcpath) {
  if (exists(srcpath)) {
    return fs.readdirSync(srcpath).filter(function (file) {
      return fs.statSync(path.join(srcpath, file)).isFile();
    });
  } else {
    console.error(srcpath, 'does not exist');
    return [];
  }
}

function addAdditional(pathToFolder, parentModelInstance, cb) {

  var additionalFiles = getFiles(pathToFolder);
  async.eachSeries(additionalFiles, function iterator(af, next) {
      console.log('additional', af, 'for', parentModelInstance.name);
      var afPath = path.join(pathToFolder, af);
      new AdditionalFile({
        parentID: parentModelInstance.id,
        name: af,
        path: afPath
      }).save().then(function () {
        next();
      }).error(function (err) {
        next(err);
      });
    }, function done(err) {
      if (err) {
        throw err;
      }
      if (cb) {
        cb(err);
      }
    }
  );
}

function getPairs(path, cb) {
  fs.readFile(path, 'utf8', function (err, data) {
    if (err) {
      cb(null, null);
    } else {
      var array1 = data.split('\n');

      var filtered = array1.filter(function (d) {
        return d !== '';
      });

      var pairs = [];
      var i = 1;
      var pair = [];
      filtered.map(function (f) {
        if (i === 1 || i === 2) {
          pair.push(f);
        }
        i++;
        if (i > 2) {
          pairs.push(pair);
          pair = [];
          i = 1;
        }
      });
      cb(err, pairs);
    }
  });
}

function getSibling(pairs, myFileName, cb) {

  if (pairs && pairs.length > 0) {
    pairs.map(function (pair) {
      if (pair[0] == myFileName) {
        Read.filter({name: pair[1]}).run().then(function (reads) {
          if (reads && reads.length == 1) {
            console.log('get sibling is', reads[0].id);
            return cb(reads[0].id);
          } else {
            console.log('returning null 1');
            return cb();
          }
        });

      } else if (pair[1] == myFileName) {
        Read.filter({name: pair[0]}).run().then(function (reads) {
          if (reads && reads.length == 1) {
            console.log('get sibling is', reads[0].id);
            return cb(reads[0].id);
          } else {
            console.log('returning null 2');
            return cb();
          }
        });
      } else {
        console.log('returning null 3');
        return cb();
      }
    });
  } else {
    console.log('returning null 4');
    return cb();
  }
}

var run = function (rootImportFolder, cb) {

  var groups = getDirectories(rootImportFolder);


  async.eachSeries(groups, function iterator(group, nextGroup) {

      console.log(group);

      new Group({name: group}).save().then(function (rGroup) {


          var fullPath = path.join(rootImportFolder, group);
          var projects = getDirectories(fullPath);


          async.eachSeries(projects, function iterator(project, nextProject) {
            console.log(group, project);
            if (project === 'additional') {
              var fullPath = path.join(rootImportFolder, group, project, 'additional');
              addAdditional(fullPath, rGroup, nextProject);
            } else {

              new Project({
                name: project,
                responsiblePerson: 'unknown@tsl.ac.uk',
                groupID: rGroup.id,
                shortDescription: 'none',
                longDescription: 'none'
              }).save().then(function (rProject) {

                var fullPath = path.join(rootImportFolder, group, project);
                var samples = getDirectories(fullPath);


                async.eachSeries(samples, function iterator(sample, nextSample) {
                  console.log(group, project, sample); //dying here
                  //samples.map(function (sample) {
                  if (sample === 'additional') {
                    var fullPath = path.join(rootImportFolder, group, project, 'additional');
                    addAdditional(fullPath, rProject, nextSample);
                  } else {

                    new Sample({
                      projectID: rProject.id,
                      name: sample,
                      organism: 'unknown',
                      ncbi: 'unknown',
                      conditions: 'unknown',
                      sampleGroup: 'unknown'
                    }).save().then(function (rSample) {

                      var fullPath = path.join(rootImportFolder, group, project, sample);
                      var runs = getDirectories(fullPath);


                      async.eachSeries(runs, function iterator(run, nextRun) {
                        console.log(group, project, sample, run);
                        if (run === 'additional') {
                          var fullPath = path.join(rootImportFolder, group, project, 'additional');
                          addAdditional(fullPath, rSample, nextRun);
                        } else {

                          new Run({
                            sampleID: rSample.id,
                            name: run,
                            libraryType: 'unknown',
                            sequencingProvider: 'unknown',
                            sequencingTechnology: 'unknown',
                            librarySource: 'unknown',
                            librarySelection: 'unknown',
                            libraryStrategy: 'unknown',
                            insertSize: 'unknown',
                            submissionToGalaxy: false
                          }).save().then(function (rRun) {

                            var fullPath = path.join(rootImportFolder, group, project, sample, run);
                            var additionalPath = path.join(fullPath, 'additional');
                            var rawPath = path.join(fullPath, 'raw');
                            var processedPath = path.join(fullPath, 'processed');

                            var rawFiles = getFiles(rawPath);
                            var processedFiles = getFiles(processedPath);

                            async.series([
                              function (callback) {
                                addAdditional(additionalPath, rRun, callback);
                              },
                              function (callback) {
                                //RAW
                                getPairs(path.join(rawPath, 'pairs.txt'), function (err, pairs) {
                                  if (err) {
                                    throw err;
                                  } else {
                                    var raws = rawFiles.filter(function (r) {
                                      return r !== 'pairs.txt';
                                    });
                                    async.eachSeries(raws, function iterator(raw, nextRaw) {
                                      console.log(group, project, sample, run, raw);
                                      var fullPath = path.join(rawPath, raw);
                                      util.md5Stream(fullPath, function (md5) {
                                        if (err) {
                                          throw err;
                                        }
                                        getSibling(pairs, raw, function (sibling) {
                                          console.log('sibling is', sibling);
                                          new Read({
                                            processed: false,
                                            runID: rRun.id,
                                            name: raw,
                                            MD5: md5,
                                            fileName: raw,
                                            siblingID: sibling,
                                            fastQCLocation: fastqcPath(rawPath)
                                          }).save(function (error, doc) {
                                            return nextRaw(error); //TODO return test
                                          });
                                        });
                                      });
                                    }, function (err) {
                                      if (err) {
                                        throw err;
                                      }
                                      callback(err);
                                    });
                                  }
                                });

                              }, function (callback) {
                                //PROCESSED
                                getPairs(path.join(processedPath, 'pairs.txt'), function (err, pairs) {
                                  if (err) {
                                    throw err;
                                  } else {
                                    var processeds = processedFiles.filter(function (p) {
                                      return p !== 'pairs.txt';
                                    });

                                    async.eachSeries(processeds, function iterator(processed, nextProcessed) {
                                      var fullPath = path.join(processedPath, processed);
                                      console.log(group, project, sample, run, processed);
                                      util.md5Stream(fullPath, function (md5) {
                                        getSibling(pairs, processed, function (sibling) {
                                          console.log('sibling is', sibling);
                                          new Read({
                                            processed: true,
                                            runID: rRun.id,
                                            name: processed,
                                            MD5: md5,
                                            fileName: processed,
                                            siblingID: sibling,
                                            fastQCLocation: fastqcPath(processedPath)
                                          }).save(function (error, doc) {
                                            return nextProcessed(error); //TODO return test
                                          });
                                        });
                                      });
                                    }, function (err) {
                                      if (err) {
                                        throw err;
                                      }
                                      callback(err);
                                    });
                                  }
                                });
                              }
                            ], function (err) {
                              if (err) {
                                throw err;
                              }
                              nextRun(err);
                            });


                          }).error(function (err) {
                            throw err;
                          });
                        }
                      }, function done(err) {
                        if (err) {
                          throw err;
                        }
                        nextSample(err);
                      }); //END runs map
                    }).error(function (err) {
                      throw err;
                    });
                  }
                }, function done(err) {
                  if (err) {
                    throw err;
                  }
                  nextProject(err);
                }); //END samples map
              }).error(function (err) {
                throw err;
              });
            }
          }, function done(err) {
            if (err) {
              throw err;
            }
            nextGroup(err);
          }); //END projects map
        }
      ).error(function (err) {
        throw err;
      });
    }, function done(err) {
      if (err) {
        throw err;
      }
      cb(err);
    }
  ); //END groups map
};


run('/Users/pagem/Documents/workspace/dataHog/reads', function (err) {
  if (err) {
    console.error(err);
  }
  process.exit();
});




