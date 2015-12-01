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
    }, function (err) {
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

function getSibling(pairs, myFileName) {

  if (pairs && pairs.length > 0) {
    pairs.map(function (pair) {
      if (pair[0] == myFileName) {
        return pair[1];
      } else if (pair[1] == myFileName) {
        return pair[0];
      }
      return null;
    });
  } else {
    return null;
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
                responsiblePerson: 'UNKNOWN@tsl.ac.uk',
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
                    addAdditional(fullPath, rGroup, nextSample);
                  } else {

                    new Sample({
                      projectID: rProject.id,
                      name: sample,
                      organism: 'UNKNOWN',
                      ncbi: 'UNKNOWN',
                      conditions: 'UNKNOWN',
                      sampleGroup: 'UNKNOWN'
                    }).save().then(function (rSample) {

                      var fullPath = path.join(rootImportFolder, group, project, sample);
                      var runs = getDirectories(fullPath);


                      async.eachSeries(runs, function iterator(run, nextRun) {
                        console.log(group, project, sample, run);
                        if (run === 'additional') {
                          var fullPath = path.join(rootImportFolder, group, project, 'additional');
                          addAdditional(fullPath, rGroup, nextRun);
                        } else {

                          new Run({
                            sampleID: rSample.id,
                            name: run,
                            libraryType: 'UNKNOWN',
                            sequencingProvider: 'UNKNOWN',
                            sequencingTechnology: 'UNKNOWN',
                            librarySource: 'UNKNOWN',
                            librarySelection: 'UNKNOWN',
                            libraryStrategy: 'UNKNOWN',
                            insertSize: 'UNKNOWN',
                            submissionToGalaxy: false
                          }).save().then(function (rRun) {

                            var fullPath = path.join(rootImportFolder, group, project, sample, run);
                            var additionalPath = path.join(fullPath, 'additional');
                            var rawPath = path.join(fullPath, 'raw');
                            var processedPath = path.join(fullPath, 'processedPath');

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
                                      //.map(function (raw) {
                                      var fullPath = path.join(rawPath, raw);

                                      util.md5Stream(fullPath, function (md5) {

                                        if (err) {
                                          throw err;
                                        }
                                        new Read({
                                          processed: false,
                                          runID: rRun.id,
                                          name: raw,
                                          MD5: md5,
                                          fileName: raw,
                                          siblingID: getSibling(pairs, raw)
                                        }).save().then(function (rRead) {
                                          nextRaw();
                                        }).error(function (err) {
                                          nextRaw(err);
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
                                        new Read({
                                          processed: true,
                                          runID: rRun.id,
                                          name: processed,
                                          MD5: md5,
                                          fileName: processed,
                                          siblingID: getSibling(pairs, processed)
                                        }).save().then(function (rRead) {
                                          nextProcessed();
                                        }).error(function (err) {
                                          nextProcessed(err);
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
                              nextRun();
                            });


                          }).error(function (err) {
                            throw err;
                          });
                        }
                      }, function (err) {
                        if (err) {
                          throw err;
                        }
                        nextSample();
                      }); //END runs map
                    }).error(function (err) {
                      throw err;
                    });
                  }
                }, function (err) {
                  if (err) {
                    throw err;
                  }
                  nextProject();
                }); //END samples map
              }).error(function (err) {
                throw err;
              });
            }
          }, function (err) {
            if (err) {
              throw err;
            }
            nextGroup();
          }); //END projects map
        }
      ).error(function (err) {
        throw err;
      });
    },
    function (err) {
      if (err) {
        throw err;
      }
      return 'DONE!';
    }
  ); //END groups map
};


run('/mnt/reads', function (out) {
  console.log(out);
  //process.exit();
});




