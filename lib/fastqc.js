var fastQC = {};

var config = require('../config.json');
var command = config.fastQCCommand;

fastQC.run = function (filePath, outPath, cb) {
  var exec = require('child_process').exec;


  var toRun = command + ' ' + filePath + ' --outdir=' + outPath;
  console.log(toRun);
  exec(toRun, function (err, stdout, stderr) {

    if (err) {
      console.error('err', stderr);
    } else {
      console.log('out', stdout);
    }

    cb(err, stdout, stderr);
  });
};

module.exports = fastQC;

