'use strict';

var thinky = require('./thinky');
//var r = thinky.r;

var fs = require('fs-extra');
var path = require('path');

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

module.exports = {
  run: function (rootImportFolder, cb) {

    var groups = getDirectories(rootImportFolder);

    var groupArray = [];

    groups.map(function (group) {
      var fullPath = path.join(rootImportFolder, group);
      var projects = getDirectories(fullPath);

      var projectArray = [];

      projects.map(function (project) {
        var fullPath = path.join(rootImportFolder, group, project);
        var samples = getDirectories(fullPath);

        var sampleArray = [];

        samples.map(function (sample) {
          var fullPath = path.join(rootImportFolder, group, project, sample);
          var runs = getDirectories(fullPath);

          var runArray = [];

          runs.map(function (run) {
            var fullPath = path.join(rootImportFolder, group, project, sample, run);
            var additionalPath = path.join(fullPath, 'additional');
            var rawPath = path.join(fullPath, 'raw');
            var processed = path.join(fullPath, 'processed');

            var additionalFiles = getFiles(additionalPath);
            var rawFiles = getFiles(rawPath);
            var processedFiles = getFiles(processed);

            runArray.push({
              name: run,
              additionalFiles: additionalFiles,
              rawFiles: rawFiles,
              processedFiles: processedFiles
            })

          }); //END runs map
          sampleArray.push({
            name: sample,
            runs: runArray
          })
        }); //END samples map
        projectArray.push({
          name: project,
          samples: sampleArray
        })
      }); //END projects map
      groupArray.push({
        name: group,
        projects: projectArray
      })
    }); //END groups map

    //var outputString = JSON.stringify(groupArray, null, '\t');
    //fs.writeFile(outputFile, outputString, function (err) {
    //  if (err) {
    //    throw err;
    //  }
    //
    cb(groupArray);
    //
    //});
  }
};
