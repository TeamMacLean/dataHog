var util = {};
var fs = require('fs');
var path = require('path');


util.toSafeName = function (unsafeName) {
  return unsafeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

util.generateSafeName = function (name, list, cb) { //$path, $filename
  var safeName = util.toSafeName(name, this.name);
  var canHave = false;
  var testName = safeName;
  var testCount = 1;

  while (!canHave) {

    var dupes = list.filter(function (res) {
      return res.safeName === testName;
    });

    if (dupes.length) {
      testCount += 1;
      testName = safeName + '_' + testCount
    } else {
      canHave = true;
      cb(testName);
    }
  }
};

util.safeMakeDir = function (fullPath, cb) {
  try {
    fs.mkdirSync(fullPath);
    return cb();
  } catch (e) {
    if (e.code != 'EEXIST') {
      console.log('EEXIST', e);
      return cb(e);
    }
  }
};


util.createFolder = function (fullPath, cb) {
  util.safeMakeDir(fullPath, function (err) {
    if (err) {
      return cb(err);
    } else {
      return cb();
    }
  });
};

util.unknownFolders = function (folder, knownFolders, cb) {
  fs.readdir(folder, function (err, files) {

    var unknownFolders = [];

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
    cb(unknownFolders);
  });
};


module.exports = util;