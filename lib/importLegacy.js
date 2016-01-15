"use strict";
const fs = require('fs-extra');
const path = require('path');
const util = require('./util');
const async = require('async');
const Group = require('../models/group');
const Project = require('../models/project');
const Sample = require('../models/sample');
const Run = require('../models/run');
const Read = require('../models/read');
const AdditionalFile = require('../models/additionalFile');
const fastqc = require('../lib/fastqc');
const config = require('../config.json');

function fastqcPath(filePath) {
  let qcPath = path.join(filePath, '.fastqc');
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

function addAdditional(parentModelInstance, cb) {

  let additionalPath = path.join(config.dataDir, parentModelInstance.path, 'additional');

  let additionalFiles = getFiles(additionalPath);
  async.eachSeries(additionalFiles, function (af, next) {
      console.log('additional:', af, 'for', parentModelInstance.name);
      //let afPath = path.join(pathToFolder, af);


      let rel = path.join(parentModelInstance.path, 'additional', af);

      console.log('parent is', parentModelInstance.path, 'want to save to', rel);

      new AdditionalFile({
        parentID: parentModelInstance.id,
        name: af,
        path: rel
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
      return cb(null, null);
    } else {
      let array1 = data.split('\n');

      let filtered = array1.filter(function (d) {
        return d !== '';
      });

      let pairs = [];
      let i = 1;
      let pair = [];
      filtered.forEach(function (f) {
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
      return cb(err, pairs);
    }
  });
}

function getSibling(pairs, myFileName, cb) { //TODO PUT ME BACK IN WHEN FIXED!!

  if (pairs && pairs.length > 0) {
    //return cb();

    pairs.forEach(function(pair){
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
    })

  } else {
    return cb();
  }


  //if (pairs && pairs.length > 0) {
  //  pairs.map(function (pair) {
  //    if (pair[0] == myFileName) {
  //      Read.filter({name: pair[1]}).run().then(function (reads) {
  //        if (reads && reads.length == 1) {
  //          console.log('get sibling is', reads[0].id);
  //          return cb(reads[0].id);
  //        } else {
  //          console.log('returning null 1');
  //          return cb();
  //        }
  //      });
  //
  //    } else if (pair[1] == myFileName) {
  //      Read.filter({name: pair[0]}).run().then(function (reads) {
  //        if (reads && reads.length == 1) {
  //          console.log('get sibling is', reads[0].id);
  //          return cb(reads[0].id);
  //        } else {
  //          console.log('returning null 2');
  //          return cb();
  //        }
  //      });
  //    } else {
  //      console.log('returning null 3');
  //      return cb();
  //    }
  //  });
  //} else {
  //  console.log('returning null 4');
  //  return cb();
  //}
}

let run = function (rootImportFolder, cb) {

  let groups = getDirectories(rootImportFolder);

  if (groups.length < 1) {
    return cb('no group folders found, "' + rootImportFolder + '" is empty or does not exist');
  }


  async.eachSeries(groups, function (group, nextGroup) {

      new Group({name: group}).save().then(function (rGroup) {


          let fullPath = path.join(rootImportFolder, group);
          let projects = getDirectories(fullPath);


          async.eachSeries(projects, function (project, nextProject) {
            console.log(group, project);
            if (project === 'additional') {
              addAdditional(rGroup, nextProject);
            } else {

              new Project({
                name: project,
                responsiblePerson: 'unknown@tsl.ac.uk',
                groupID: rGroup.id,
                shortDescription: 'none',
                longDescription: 'none'
              }).save().then(function (rProject) {

                let fullPath = path.join(rootImportFolder, group, project);
                let samples = getDirectories(fullPath);


                async.eachSeries(samples, function (sample, nextSample) {
                  console.log(group, project, sample); //dying here
                  //samples.map(function (sample) {
                  if (sample === 'additional') {
                    addAdditional(rProject, nextSample);
                  } else {

                    new Sample({
                      projectID: rProject.id,
                      name: sample,
                      organism: 'unknown',
                      ncbi: 'unknown',
                      conditions: 'unknown',
                      sampleGroup: 'unknown'
                    }).save().then(function (rSample) {

                      let fullPath = path.join(rootImportFolder, group, project, sample);
                      let runs = getDirectories(fullPath);


                      async.eachSeries(runs, function (run, nextRun) {
                        console.log(group, project, sample, run);
                        if (run === 'additional') {
                          addAdditional(rSample, nextRun);
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

                            let fullPath = path.join(rootImportFolder, group, project, sample, run);
                            let rawPath = path.join(fullPath, 'raw');
                            let processedPath = path.join(fullPath, 'processed');

                            let rawFiles = getFiles(rawPath);
                            let processedFiles = getFiles(processedPath);

                            async.series([
                              function (callback) {
                                addAdditional(rRun, callback);
                              },
                              function (callback) {
                                //RAW
                                getPairs(path.join(rawPath, 'pairs.txt'), function (err, pairs) {
                                  if (err) {
                                    throw err;
                                  } else {
                                    let raws = rawFiles.filter(function (r) {
                                      return r !== 'pairs.txt';
                                    });
                                    async.eachSeries(raws, function (raw, nextRaw) {
                                      console.log(group, project, sample, run, raw);
                                      //let fullPath = path.join(rawPath, raw);
                                      //util.md5Stream(fullPath, function (md5) {
                                      //  if (err) {
                                      //    throw err;
                                      //  }
                                      getSibling(pairs, raw, function (sibling) {
                                        console.log('-sibling is', sibling);
                                        new Read({
                                          processed: false,
                                          runID: rRun.id,
                                          name: raw,
                                          MD5: 'unknown',
                                          fileName: raw,
                                          siblingID: sibling,
                                          fastQCLocation: fastqcPath(rawPath)
                                        }).save(function (error) {

                                          if (err) {
                                            return nextRaw(error); //TODO return test
                                          } else {
                                            nextRaw();
                                          }
                                        });
                                      });
                                      //});
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
                                    let processeds = processedFiles.filter(function (p) {
                                      return p !== 'pairs.txt';
                                    });

                                    async.eachSeries(processeds, function (processed, nextProcessed) {
                                      //let fullPath = path.join(processedPath, processed);
                                      console.log(group, project, sample, run, processed);
                                      //util.md5Stream(fullPath, function (md5) {
                                      getSibling(pairs, processed, function (sibling) {
                                        console.log('sibling is', sibling);
                                        new Read({
                                          processed: true,
                                          runID: rRun.id,
                                          name: processed,
                                          MD5: 'unknown',
                                          fileName: processed,
                                          siblingID: sibling,
                                          fastQCLocation: fastqcPath(processedPath)
                                        }).save(function (error) {
                                          return nextProcessed(error); //TODO return test
                                        });
                                      });
                                      //});
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

if (process.argv.length == 3) {

  run(process.argv[2], function (err) {
    if (err) {
      console.error(err);
    }
    process.exit();
  });
} else {
  console.error('should have been 1 arg to this command, found', process.argv.length - 2);
  process.exit();
}






