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

var crypto = require('crypto');

function myMD5(path, cb) {
  var hash = crypto.createHash('md5'),
    stream = fs.createReadStream(path);

  stream.on('data', function (data) {
    hash.update(data, 'utf8');
  });

  stream.on('end', function () {
    var out = hash.digest('hex'); // 34f7a3113803f8ed3b8fd7ce5656ebec
    cb(out);
  });
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
    //console.log(srcpath, 'does not exist');
    return [];
  }
}

function addAdditional(pathToFolder, parentModelInstance, cb) {

  var additionalFiles = getFiles(pathToFolder);
  //console.log(pathToFolder, additionalFiles);
  async.eachSeries(additionalFiles, function iterator(af, next) {
      //console.log('adding additional ---------------------', af);
      var afPath = path.join(pathToFolder, af);
      new AdditionalFile({
        parentID: parentModelInstance.id,
        name: af,
        path: afPath
      }).save().then(function () {
        //console.log('saved additional', af);
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
  console.log('reading pair', path);
  fs.readFile(path, 'utf8', function (err, data) {
    if (err) {
      //console.log('no pairs');
      cb(new Error('no pairs'), null);
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

    var groupArray = [];

    async.eachSeries(groups, function iterator(group, nextGroup) {

        console.log('group', group);
        //groups.map(function (group) {

        new Group({name: group}).save().then(function (rGroup) {


            var fullPath = path.join(rootImportFolder, group);
            var projects = getDirectories(fullPath);

            var projectArray = [];


            async.eachSeries(projects, function iterator(project, nextProject) {
              console.log('project', project);
              //projects.map(function (project) {
              if (project === 'additional') {
                var fullPath = path.join(rootImportFolder, group, project, 'additional');
                addAdditional(fullPath, rGroup);
                return nextProject();
              }

              new Project({
                name: project,
                responsiblePerson: 'UNKNOWN@tsl.ac.uk',
                groupID: rGroup.id,
                shortDescription: 'none',
                longDescription: 'none'
              }).save().then(function (rProject) {

                var fullPath = path.join(rootImportFolder, group, project);
                var samples = getDirectories(fullPath);

                var sampleArray = [];

                async.eachSeries(samples, function iterator(sample, nextSample) {
                  console.log('sample', sample); //dying here
                  //samples.map(function (sample) {
                  if (sample === 'additional') {
                    var fullPath = path.join(rootImportFolder, group, project, 'additional');
                    addAdditional(fullPath, rGroup);
                    return nextSample();
                  }

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

                    var runArray = [];

                    async.eachSeries(runs, function iterator(run, nextRun) {
                      console.log('run', run);
                      //runs.map(function (run) {
                      if (run === 'additional') {
                        var fullPath = path.join(rootImportFolder, group, project, 'additional');
                        //var additionalFiles = getFiles(fullPath);
                        addAdditional(fullPath, rGroup);
                        return nextRun();
                      }

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

                        addAdditional(additionalPath, rRun);

                        //RAW
                        getPairs(path.join(rawPath, 'pairs.txt'), function (err, pairs) {
                          if (err) {
                          } else {
                            rawFiles.filter(function (r) {
                              return r !== 'pairs.txt';
                            }).map(function (raw) {
                                var fullPath = path.join(rawPath, raw);
                                console.log('reading 1', fullPath);

                                myMD5(fullPath, function (md5) {

                                  console.log('done md5');

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
                                  }).error(function (err) {
                                    throw err;
                                  });
                                });
                              }
                            );
                          }
                        });


                        //PROCESSED
                        getPairs(path.join(processedPath, 'pairs.txt'), function (err, pairs) {
                          if (err) {

                          } else {
                            processedFiles.filter(function (p) {
                              return p !== 'pairs.txt';
                            }).map(function (processed) {
                              var fullPath = path.join(processedPath, processed);
                              console.log('reading 2', fullPath);
                              myMD5(fullPath, function (md5) {
                                new Read({
                                  processed: true,
                                  runID: rRun.id,
                                  name: processed,
                                  MD5: md5,
                                  fileName: processed,
                                  siblingID: getSibling(pairs, processed)
                                }).save().then(function (rRead) {
                                }).error(function (err) {
                                  throw err;
                                });
                              });
                            });
                          }
                        });

                        nextRun(); //TODO needs to check that reads have been created first

                      }).error(function (err) {
                        throw err;
                      });
                    }, function (err) {
                      if (err) {
                        throw err;
                      }
                      nextSample();
                    }); //END runs map
                    sampleArray.push({
                      name: sample,
                      runs: runArray
                    });
                  }).error(function (err) {
                    throw err;
                  });
                }, function (err) {
                  if (err) {
                    throw err;
                  }
                  nextProject();
                }); //END samples map
                projectArray.push({
                  name: project,
                  samples: sampleArray
                });
              }).error(function (err) {
                throw err;
              });
            }, function (err) {
              if (err) {
                throw err;
              }
              nextGroup();
            }); //END projects map
            groupArray.push({
              name: group,
              projects: projectArray
            });
          }
        ).
        error(function (err) {
          throw err;
        });
      },
      function (err) {
        if (err) {
          throw err;
        }
        console.log('done! but additional files might still be populating... '); //TODO
        return 'DONE!';
      }
    )
    ; //END groups map
    cb(groupArray);
  }
  ;


run('/mnt/reads', function (out) {
  console.log(out);
  //process.exit();
});




