var MD5 = {};

var config = require('../config.json');
var command = config.md5Command;

MD5.run = function (filePath, cb) {
  var exec = require('child_process').exec;


  var toRun = command + ' ' + filePath;
  console.log(toRun);
  exec(toRun, function (err, stdout, stderr) {

    if (err) {
      console.error('err', stderr);
      return cb(stderr);
    } else {
      console.log('out', stdout);

      var out = stdout.split(" ")[0];
      return cb(null, out);
    }
  });
};

module.exports = MD5;

