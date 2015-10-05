var fastQC = {};

var config = require('../config.json');
var command = config.fastQCCommand;

fastQC.run = function (filePath, outPath, cb) {
  var exec = require('child_process').exec;
  var toRun = command + ' ' + filePath + ' --outdir=' + outPath;
  exec(toRun, function (err, stdout, stderr) {
    cb(err, stdout, stderr);
  });
};

module.exports = fastQC;

