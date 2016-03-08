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

var GROUP, PROJECT, SAMPLE, RUN;

var g_obj, p_obj, s_obj, r_obj;


function current(extra) {
  console.log(GROUP || '', PROJECT || '', SAMPLE || '', RUN || '', extra || '');
}

function dot() {
  process.stdout.write(".");
}

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
  GROUP = group;

  Group.filter({name: group}).run().then(function (results) {
    if (results.length > 0) {
      g_obj = results[0];
      dot();
      resume();
    } else {
      new Group({name: group}).save().then(function (rGroup) {
        g_obj = rGroup;
        current();
        resume();
      }).error(function (err) {
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
  PROJECT = project;

  if (project === 'additional') {
    addAdditional(g_obj, nextProject);
  } else {
    Project.filter({name: project, groupID: g_obj.id}).run().then(function (results) {
      if (results.length > 0) {
        p_obj = results[0];
        dot();
        resume();
      } else {
        new Project({
          name: project,
          responsiblePerson: 'unknown@tsl.ac.uk',
          secondaryContact: 'unknown@tsl.ac.uk',
          groupID: g_obj.id,
          shortDescription: 'none',
          longDescription: 'none'
        }).save().then(function (rProject) {
          p_obj = rProject;
          current();
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
  SAMPLE = sample;

  if (sample === 'additional') {
    addAdditional(p_obj, nextSample);
  } else {

    Sample.filter({projectID: p_obj.id, name: sample}).run().then(function (results) {

      if (results.length > 0) {
        s_obj = results[0];
        dot();
        resume();
      } else {
        new Sample({
          projectID: p_obj.id,
          name: sample,
          scientificName: 'unknown',
          commonName: 'unknown',
          ncbi: 'unknown',
          conditions: 'unknown',
          sampleGroup: 'unknown'
        }).save().then(function (rSample) {
          s_obj = rSample;
          current()
          resume();
        }).error(function (err) {
          nextSample(err);
        });
      }

    });
  }

  function resume() {
    let fullPath = path.join(root, GROUP, PROJECT, SAMPLE);
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
  RUN = run;

  if (run === 'additional') {
    addAdditional(s_obj, nextRun);
  } else {

    Run.filter({sampleID: s_obj.id, name: run}).run().then(function (results) {

      if (results.length > 0) {
        r_obj = results[0];
        dot();
        resume();
      } else {
        new Run({
          sampleID: s_obj.id,
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
          r_obj = rRun;
          current()
          resume();
        }).error(function (err) {
          nextRun(err);
        });
      }

    });
  }

  function resume() {
    let fullPath = path.join(root, GROUP, PROJECT, SAMPLE, RUN);
    let rawPath = path.join(fullPath, 'raw');
    let processedPath = path.join(fullPath, 'processed');

    let rawFiles = getFiles(rawPath);
    let processedFiles = getFiles(processedPath);

    async.series([
      function (callback) {
        addAdditional(r_obj, callback);
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

              getSibling(pairs, raw, function (sibling) {
                Read.filter({processed: false, runID: r_obj.id, fileName: raw}).run().then(function (results) {
                  if (results.length > 0) {
                    dot();
                    nextRaw();
                  } else {
                    new Read({
                      processed: false,
                      runID: r_obj.id,
                      name: raw,
                      MD5: 'unknown',
                      fileName: raw,
                      siblingID: sibling,
                      fastQCLocation: fastqcPath(rawPath),
                      legacyPath: path.join(rawPath, raw)
                    }).save().then(function () {
                      current(raw);
                      nextRaw();
                    }).error(function (err) {
                      return nextRaw(err);
                    })
                  }
                })
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
            let processeds = processedFiles.filter(function (p) {
              return p !== 'pairs.txt';
            });

            //console.log(pairs.length, 'pairs');

            async.eachSeries(processeds, function (processed, nextProcessed) {
              getSibling(pairs, processed, function (sibling) {
                //console.log('sibling is', sibling);

                Read.filter({processed: true, runID: r_obj.id, fileName: processed}).run().then(function (results) {
                  if (results.length > 0) {
                    dot();
                    nextProcessed();
                  } else {
                    new Read({
                      processed: true,
                      runID: r_obj.id,
                      name: processed,
                      MD5: 'unknown',
                      fileName: processed,
                      siblingID: sibling,
                      fastQCLocation: fastqcPath(processedPath),
                      legacyPath: path.join(processedPath, processed)
                    }).save().then(function (tmp) {
                      console.log('make', tmp);
                      process.exit();
                      current(processed);
                      nextProcessed();
                    }).error(function (err) {
                      return nextProcessed(err);
                    })
                  }
                })
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
  }
}

function fastqcPath(filePath) {
  let qcPath = path.join(filePath, '.fastqc');
  if (exists(qcPath)) {
    //console.log('has fqc report');
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
    //console.error(srcpath, 'does not exist');
    return [];
  }
}

function addAdditional(parentModelInstance, cb) {

  let additionalPath = path.join(config.dataDir, parentModelInstance.path, 'additional');

  let additionalFiles = getFiles(additionalPath);
  async.eachSeries(additionalFiles, function (af, next) {
      //console.log('additional:', af, 'for', parentModelInstance.name);
      //let afPath = path.join(pathToFolder, af);


      let rel = path.join(parentModelInstance.path, 'additional', af);

      //console.log('parent is', parentModelInstance.path, 'want to save to', rel);

      AdditionalFile.filter({name: af, path: rel}).run().then(function (results) {
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
        } else {
          next();
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