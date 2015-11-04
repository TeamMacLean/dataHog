"use strict";

var path = require('path');
var ena = require('../lib/ena');
var config = require('../config').ena;

var canLogIn = config.username.length > 0 && config.password.length > 0;


describe('ENA', function () {

  describe('.upload', function () {

    var fileToUpload = path.join(__dirname, 'data', 'test.fastq.gz');
    var fileName = 'test.fastq.gz';

    it('should upload ok', function (done) {
      if (!canLogIn) {
        this.skip();
      }

      ena.upload(fileToUpload, fileName, function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });
  });
  describe('.submit', function () {
    this.timeout(50000);
    it('should upload ok', function (done) {
      if (!canLogIn) {
        this.skip('this is text');
      }

      var experiment = path.join(__dirname, 'data', 'experiment.xml');
      var run = path.join(__dirname, 'data', 'run.xml');
      var sample = path.join(__dirname, 'data', 'sample.xml');
      var study = path.join(__dirname, 'data', 'study.xml');
      var submission = path.join(__dirname, 'data', 'submission.xml');

      var end = function (err, result) {
        console.log(result);
        done(err);
      };
      ena.submit(submission, study, sample, experiment, run, end);
    });
  });
});