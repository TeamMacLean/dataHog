var should = require('chai').should();
var path = require('path');
var ena = require('../lib/ena');

//var SUBMISSION, STUDY, SAMPLE, EXPERIMENT, RUN, ANALYSIS, DAC, POLICY, DATASET, PROJECT;
//SUBMISSION = STUDY = SAMPLE = EXPERIMENT = RUN = ANALYSIS = DAC = POLICY = DATASET = PROJECT = '';


var fileToUpload = path.join(__dirname, '../hog.png');
var fileName = 'hog.png';

ena.upload(fileToUpload, fileName, function (err) {
  if (err) {
    throw err;
  } else {
    console.log('upload complete');
  }
});
ena.submit(SUBMISSION, STUDY, SAMPLE, EXPERIMENT, RUN, ANALYSIS, DAC, POLICY, DATASET, PROJECT);
