var fastQC = {};

var config = require('../config.json');
var command = config.fastQCCommand;

/**
 * create fastq report
 * @param filePath {path}
 * @param outPath {path}
 * @param cb {callback}
 */

fastQC.run = function (filePath, outPath, cb) {
  var exec = require('child_process').exec;
  var toRun = command + ' ' + filePath + ' --outdir=' + outPath;
  exec(toRun, function (err, stdout, stderr) {
    cb(err, stdout, stderr);
  });
};

module.exports = fastQC;

