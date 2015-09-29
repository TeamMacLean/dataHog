var MD5 = {};

var config = require('../config.json');
var command = config.md5Command;

MD5.run = function (filePath, cb) {
  var exec = require('child_process').exec;


  var toRun = command + ' ' + config.md5QuietOption + ' ' + filePath;
  console.log(toRun);
  exec(toRun, function (err, stdout, stderr) {

    if (err) {
      console.error('err', stderr);
      return cb(stderr);
    } else {
      console.log('out', stdout);

      var out = stdout.replace(' ', '');
      out = out.replace("\t",'');
      out = out.replace("\b",'');
      out = out.replace("\n",'');
      return cb(null, out);
    }
  });
};

module.exports = MD5;

