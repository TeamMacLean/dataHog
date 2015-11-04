var url = require('url');
var Client = require('ftp');
var fs = require('fs');
var request = require('request');
var config = require('../config.json').ena;

var ena = {};


ena.submissionURL = function () {
  return url.parse(config.testMode ? config.testingURL : config.productionURL);
};

ena.submit = function (submission, study, sample, experiment, run, cb) {

  var parsedURL = ena.submissionURL();

  var options = {
    uri: parsedURL.href + '?auth=ENA%20' + config.username + '%20' + config.password,
    rejectUnauthorized: false,
    formData: {
      SUBMISSION: fs.createReadStream(submission),
      STUDY: fs.createReadStream(study),
      SAMPLE: fs.createReadStream(sample),
      RUN: fs.createReadStream(run),
      EXPERIMENT: fs.createReadStream(experiment)
    }
  };
  request.post(options, function (err, resp, body) {
    if (err) {
      cb(err);
    } else {
      cb(null, body);

    }
  });

};


ena.upload = function (file, fileName, cb) {

  fs.stat(file, function (err, stats) {
    if (!err && stats.isFile()) {
      var c = new Client();
      c.on('ready', function () {
        c.put(file, fileName, function (err) {
          if (err) {
            cb(err);
          } else {
            cb(null)
          }
          c.end();
        });
      });
      c.connect({
        host: config.ftpAddress,
        user: config.username,
        password: config.password
      });
    } else {
      cb(new Error('file does not exist'));
    }
  });

};

module.exports = ena;