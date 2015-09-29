var http = require('https');
var url = require('url');
var querystring = require('querystring');
var Client = require('ftp');
var fs = require('fs');
var path = require('path');
var config = require('../config').ena;

var ena = {};


ena.submissionURL = function () {
  return url.parse(config.testMode ? config.testingURL : config.productionURL);
};

ena.submit = function (SUBMISSION, STUDY, SAMPLE, EXPERIMENT, RUN, ANALYSIS, DAC, POLICY, DATASET, PROJECT) {

  //if(!SUBMISSION || !STUDY || !SAMPLE || !EXPERIMENT || !RUN || !ANALYSIS || !DAC || !POLICY || !DATASET || !PROJECT){
  //}

  var parsedURL = ena.submissionURL();

  var data = querystring.stringify({
    SUBMISSION: SUBMISSION,
    STUDY: STUDY,
    SAMPLE: SAMPLE,
    EXPERIMENT: EXPERIMENT,
    RUN: RUN,
    ANALYSIS: ANALYSIS,
    DAC: DAC,
    POLICY: POLICY,
    DATASET: DATASET,
    PROJECT: PROJECT
  });

  var pathWithAuth = parsedURL.path + '?auth=ENA%20' + config.username + '%20' + config.password;

  var options = {
    strictSSL: false,//SUPER IMPORTANT!
    rejectUnauthorized: false, //SUPER IMPORTANT!
    host: parsedURL.hostname,
    port: 443,
    path: pathWithAuth,
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      'Content-Length': Buffer.byteLength(data)
    }
  };


  var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);
    res.on('data', function (chunk) {
      console.log("body: " + chunk);
    });
  });

  req.write(data);
  req.end();

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

//TODO TEST!

module.exports = ena;