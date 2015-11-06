"use strict";

var util = {};
var fs = require('fs');
var path = require('path');


util.toSafeName = function (unsafeName) {
  return unsafeName.replace('&', 'and').replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

util.generateSafeName = function (name, list, cb) { //$path, $filename
  var safeName = util.toSafeName(name, this.name);
  var canHave = false;
  var testName = safeName;
  var testCount = 1;

  var filter = function (res) {
    return res.safeName === testName;
  };

  while (!canHave) {

    var dupes = list.filter(filter);

    if (dupes.length) {
      testCount += 1;
      testName = safeName + '_' + testCount;
    } else {
      canHave = true;
      cb(testName);
    }
  }
};

/**
 *
 * @param fileName {string}
 * @param array [string]
 * @returns {*}
 */
util.getUniqueFileName = function (fileName, array) {

  if (array.indexOf(fileName) > -1) {
    var i = 0;
    var out = fileName;
    while (array.indexOf(out) > -1) {
      i++;

      var base = fileName.split('.')[0];
      var ext = fileName.substring(fileName.indexOf('.'));
      out = base + i + ext;
    }
    return out;
  } else {
    //its already fine
    return fileName;
  }

};

util.unknownFolders = function (folder, knownFolders, cb) {
  fs.readdir(folder, function (err, files) {

    var unknownFolders = [];

    if (err) {
      console.error(err);
    }

    if (files.length && files.length > 0) {
      files.map(function (file) {
        console.log(folder, file);
        var fullPath = path.join(folder, file);
        var stat = fs.lstatSync(fullPath);
        //skip files
        if (stat.isDirectory()) {

          var matches = knownFolders.filter(function (e) {
            return e.safeName === file;
          });

          if (matches.length < 1) {
            unknownFolders.push(file);
          }
        }
      });
    }


    return cb(unknownFolders);
  });
};


module.exports = util;