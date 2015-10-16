var should = require('chai').should();
var path = require('path');
var ena = require('../lib/ena');
var config = require('../config').ena;

var canLogIn = config.username.length > 0 && config.password.length > 0;


describe('ENA', function () {

  describe('.upload', function () {

    var fileToUpload = path.join(__dirname, 'data', 'test.fastq');
    var fileName = 'hog.png';

    it('should upload ok', function (done) {
      if (!canLogIn) this.skip();
      ena.upload(fileToUpload, fileName, function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    })
  });
  //describe('.submit', function () {
  //  it('should upload ok', function (done) {
  //    if (!canLogIn) this.skip('this is text');
  //
  //    var experiment = path.join(__dirname, './submitData/experiment.xml');
  //    var run = path.join(__dirname, './submitData/run.xml');
  //    var sample = path.join(__dirname, './submitData/sample.xml');
  //    var study = path.join(__dirname, './submitData/study.xml');
  //    var submission = path.join(__dirname, './submitData/submission.xml');
  //
  //    var end = function (err, result) {
  //
  //      done(err);
  //
  //      //if (err) {
  //      //  done(err);
  //      //} else {
  //      //  done();
  //      //}
  //    };
  //
  //    ena.submit(submission, study, sample, experiment, run, end);
  //  })
  //})
});