"use strict";
const fs = require('fs-extra');
const path = require('path');
const util = require('./lib/util');
const async = require('async');
const Group = require('./models/group');
const Project = require('./models/project');
const Sample = require('./models/sample');
const Run = require('./models/run');
const Read = require('./models/read');
const AdditionalFile = require('./models/additionalFile');
const fastqc = require('./lib/fastqc');
const config = require('./config.json');

var root;

var GROUP, PROJECT, SAMPLE, RUN, READ;

let run = function (rootImportFolder, cb) {
  let groups = getDirectories(rootImportFolder);

  if (groups.length < 1) {
    return cb('no group folders found, "' + rootImportFolder + '" is empty or does not exist');
  }

  root = rootImportFolder;


  async.eachSeries(groups, eachGroup, function done(err) {
    if (err) {
      throw err;
    }
    cb(err);
  })

};


function eachGroup(group, nextGroup) {
  var current;
  GROUP = group;

  Group.filter({name: group}).run().then(function (results) {
    if (results.length > 0) {
      current = results[0];
      resume();
    } else {
      new Group({name: group}).save().then(function (rGroup) {
          current = rGroup;
          resume();
        }
      ).error(function (err) {
        nextGroup(err);
      });
    }
  });

  function resume() {
    let fullPath = path.join(root, group);
    let projects = getDirectories(fullPath);

    async.eachSeries(projects, eachProject, function done(err) {
      if (err) {
        throw err;
      }
      nextGroup();
    })
  }
}

function eachProject(project, nextProject) {
  var current;
  PROJECT = project;

  if (project === 'additional') {
    addAdditional(rGroup, nextProject);
  } else {

    Project.filter({
      name: project,
      groupID: GROUP.id
    }).run().then(function (results) {

      if (results.length > 0) {
        current = results[0];
        resume();
      } else {
        new Project({
          name: project,
          responsiblePerson: 'unknown@tsl.ac.uk',
          secondaryContact: 'unknown@tsl.ac.uk',
          groupID: GROUP.id,
          shortDescription: 'none',
          longDescription: 'none'
        }).save().then(function (rProject) {
          current = rProject;
          resume();
        }).error(function (err) {
          nextProject(err);
        });
      }

    });
  }

  function resume() {
    let fullPath = path.join(root, GROUP, PROJECT);
    let samples = getDirectories(fullPath);

    async.eachSeries(samples, eachSample, function done(err) {
      if (err) {
        throw err;
      }
      nextProject();
    })
  }
}

function eachSample(sample, nextSample) {
  var current;
  SAMPLE = sample;

  if (sample === 'additional') {
    addAdditional(PROJECT, nextSample);
  } else {

    Sample.filter({
      projectID: PROJECT.id,
      name: sample
    }).run().then(function (results) {

      if (results.length > 0) {
        current = results[0];
        resume();
      } else {
        new Sample({
          projectID: PROJECT.id,
          name: sample,
          scientificName: 'unknown',
          commonName: 'unknown',
          ncbi: 'unknown',
          conditions: 'unknown',
          sampleGroup: 'unknown'
        }).save().then(function (rSample) {
          current = rSample;
          resume();
        });
      }

    });
  }

  function resume() {
    let fullPath = path.join(root, group, project, sample);
    let runs = getDirectories(fullPath);

    async.eachSeries(runs, eachRun, function done(err) {
      if (err) {
        throw err;
      }
      nextSample();
    });
  }

}

function eachRun(run, nextRun) {
  var current;
  RUN = run;

  if (run === 'additional') {
    addAdditional(SAMPLE, nextSample);
  } else {

    Run.filter({
      sampleID: SAMPLE.id,
      name: run
    }).run().then(function (results) {

      if (results.length > 0) {
        current = results[0];
        resume();
      } else {
        new Run({
          sampleID: SAMPLE.id,
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
          current = rRun;
          resume();
        })
      }

    });
  }

  function resume() {
    let fullPath = path.join(root, GROUP, PROJECT, SAMPLE, run);
    let rawPath = path.join(fullPath, 'raw');
    let processedPath = path.join(fullPath, 'processed');

    let rawFiles = getFiles(rawPath);
    let processedFiles = getFiles(processedPath);

    async.series([
      function (callback) {
        addAdditional(RUN, callback);
      },
      function (callback) {
        //RAW
        getPairs(path.join(rawPath, 'pairs.txt'), function (err, pairs) {
          if (err) {
            throw err;
          } else {

            console.log(pairs.length, 'pairs');

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
                //TODO check if exists
                new Read({
                  processed: false,
                  runID: RUN.id,
                  name: raw,
                  MD5: 'unknown',
                  fileName: raw,
                  siblingID: sibling,
                  fastQCLocation: fastqcPath(rawPath),
                  legacyPath: path.join(rawPath, raw)
                }).save(function (error) {

                  if (err) {
                    return nextRaw(error);
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

            console.log(pairs.length, 'pairs');

            async.eachSeries(processeds, function (processed, nextProcessed) {
              //let fullPath = path.join(processedPath, processed);
              console.log(GROUP, PROJECT, SAMPLE, run, processed);
              //util.md5Stream(fullPath, function (md5) {
              getSibling(pairs, processed, function (sibling) {
                console.log('sibling is', sibling);
                //TODO check if exists
                new Read({
                  processed: true,
                  runID: rRun.id,
                  name: processed,
                  MD5: 'unknown',
                  fileName: processed,
                  siblingID: sibling,
                  fastQCLocation: fastqcPath(processedPath),
                  legacyPath: path.join(processedPath, processed)
                }).save(function (error) {
                  return nextProcessed(error);
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
  }
}

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

      AdditionalFile.filter({path: path}).run().then(function (results) {
        if (results.length > 0) {
          new AdditionalFile({
            parentID: parentModelInstance.id,
            name: af,
            path: rel
          }).save().then(function () {
            next();
          }).error(function (err) {
            next(err); //TODO
          });
        }
      }).error(function (err) {
        next(err); //TODO
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
  let pairs = [];
  fs.readFile(path, 'utf8', function (err, data) {
    if (err) {
      return cb(null, pairs);
    } else {
      let array1 = data.split('\n');

      let filtered = array1.filter(function (d) {
        return d !== '';
      });


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

function getSibling(pairs, myFileName, cb) {

  var matchedPair;

  if (pairs && pairs.length) {
    pairs.forEach(function (p) {
      if (p[0] == myFileName) {
        matchedPair = {me: p[0], sib: p[1]};
      } else if (p[1] == myFileName) {
        matchedPair = {me: p[1], sib: p[0]};
      }
    });

    if (matchedPair) {
      Read.filter({name: matchedPair.sib}).run().then(function (reads) {
        if (reads.length > 0) {
          return cb(reads[0].id);
        } else {
          return cb();
        }
      });
    } else {
      return cb()
    }

  } else {
    return cb();
  }
}


if (process.argv.length == 3) {

  run(process.argv[2], function (err) {
    if (err) {
      console.error(err);
    }

    console.log('DONE!');

    process.exit();
  });
} else {
  console.error('should have been 1 arg to this command, found', process.argv.length - 2);
  process.exit();
}