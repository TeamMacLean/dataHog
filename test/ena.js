var should = require('chai').should();
var path = require('path');
var ena = require('../lib/ena');
var config = require('../config').ena;


describe('ENA', function () {

  if (config.username.length < 1 && config.password.length < 1) {
    this.skip();
  }

  describe('.upload', function () {

    var fileToUpload = path.join(__dirname, '../hog.png');
    var fileName = 'hog.png';

    it('should upload ok', function (done) {
      ena.upload(fileToUpload, fileName, function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    })
  });

  describe('.submit', function () {
    it('should upload ok', function (done) {
      done(); //TODO
      //ena.submit(SUBMISSION, STUDY, SAMPLE, EXPERIMENT, RUN, ANALYSIS, DAC, POLICY, DATASET, PROJECT);
    })
  })
});