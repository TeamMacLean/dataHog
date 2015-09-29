var should = require('chai').should();
var path = require('path');
var ena = require('../lib/ena');


describe('ENA', function () {
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
      //ena.submit(SUBMISSION, STUDY, SAMPLE, EXPERIMENT, RUN, ANALYSIS, DAC, POLICY, DATASET, PROJECT);
    })
  })
});