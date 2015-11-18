"use strict";

var fs = require('fs-extra');
var path = require('path');

var util = require('./util');

var async = require('async');

var MD5 = require('md5');

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
    return [];
  }
}

function addAdditional(pathToFolder, parentModelInstance) {
  var additionalFiles = getFiles(pathToFolder);
  additionalFiles.map(function (af) {
    new AdditionalFile({parentID: parentModelInstance.id, name: af}).save().then(function (rAdditionalFile) {
    }).error(function (err) {
      throw err;
    });
  });
}

function getPairs(path, cb) {
  fs.readFile(path, 'utf8', function (err, data) {
    if (err) {
      console.log(path, 'has not pairs.txt');
    } else {
      //TODO process to array of arrays
      var array1 = data.split('\n');
      //console.log(array1);

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

  console.log('pairs!!', pairs);

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

  //async.eachSeries(groups, function iterator(group, nextGroup) {
  groups.map(function (group) {

    new Group({name: group}).save().then(function (rGroup) {


      var fullPath = path.join(rootImportFolder, group);
      var projects = getDirectories(fullPath);

      var projectArray = [];

      projects.map(function (project) {
        if (project === 'additional') {
          var fullPath = path.join(rootImportFolder, group, project);
          addAdditional(fullPath, rGroup);
          return;
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

          samples.map(function (sample) {
            if (sample === 'additional') {
              var fullPath = path.join(rootImportFolder, group, project);
              addAdditional(fullPath, rGroup);
              return;
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

              runs.map(function (run) {

                if (run === 'additional') {
                  var fullPath = path.join(rootImportFolder, group, project);
                  var additionalFiles = getFiles(fullPath);
                  addAdditional(fullPath, rGroup);
                  return;
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

                  //var runsObj = {
                  //  name: run,
                  //  additionalFiles: additionalFiles,
                  //  rawFiles: rawFiles,
                  //  processedFiles: processedFiles
                  //};

                  addAdditional(additionalPath, rRun);

                  //TODO get raw pairs.txt
                  getPairs(path.join(rawPath, 'pairs.txt'), function (err, pairs) {
                    rawFiles.filter(function (r) {
                      return r !== 'pairs.txt';
                    }).map(function (raw) {
                      var fullPath = path.join(rawPath, raw);
                      fs.readFile(fullPath, function (err, buf) {
                        if (err) {
                          throw err;
                        }
                        new Read({
                          processed: false,
                          runID: rRun.id,
                          name: raw,
                          MD5: MD5(buf),
                          fileName: raw,
                          siblingID: getSibling(pairs, raw)
                        }).save().then(function (rRead) {
                        }).error(function (err) {
                          throw err;
                        });
                      });
                    });
                  });


                  //TODO get processed pairs.txt
                  getPairs(path.join(processedPath, 'pairs.txt'), function (err, pairs) {
                    processedFiles.filter(function (p) {
                      return p !== 'pairs.txt';
                    }).map(function (processed) {
                      var fullPath = path.join(processedPath, processed);
                      fs.readFile(fullPath, function (err, buf) {
                        if (err) {
                          throw err;
                        }
                        new Read({
                          processed: true,
                          runID: rRun.id,
                          name: processed,
                          MD5: MD5(buf),
                          fileName: processed,
                          siblingID: getSibling(pairs, processed)
                        }).save().then(function (rRead) {
                        }).error(function (err) {
                          throw err;
                        });
                      });
                    });
                  });

                  //runArray.push(runsObj);

                }).error(function (err) {
                  throw err;
                });
              }); //END runs map
              sampleArray.push({
                name: sample,
                runs: runArray
              });
            }).error(function (err) {
              throw err;
            });
          }); //END samples map
          projectArray.push({
            name: project,
            samples: sampleArray
          });
        }).error(function (err) {
          throw err;
        });
      }); //END projects map
      groupArray.push({
        name: group,
        projects: projectArray
      });
    }).error(function (err) {
      throw err;
    });
  }); //END groups map
  cb(groupArray);
};


run('/Users/pagem/Documents/workspace/dataHog/reads', function (out) {
  //process.exit();
});




