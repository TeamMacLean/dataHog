var should = require('chai').should();
var path = require('path');
var ena = require('../lib/ena');
var config = require('../config').ena;

console.log(config.username.length, config.password.length);

var canLogIn = config.username.length > 0 && config.password.length > 0;


describe('ENA', function () {

  describe('.upload', function () {

    var fileToUpload = path.join(__dirname, '../hog.png');
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
  describe('.submit', function () {

    it('should upload ok', function (done) {
      if (!canLogIn) this.skip();
      done(); //TODO
      //ena.submit(SUBMISSION, STUDY, SAMPLE, EXPERIMENT, RUN, ANALYSIS, DAC, POLICY, DATASET, PROJECT);
    })
  })
});