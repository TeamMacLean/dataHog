var should = require('chai').should();

describe('Legacy Data', function () {
  describe('run', function () {
    it('should get the index page OK', function (done) {

      var importer = require('../lib/importLegacy');

      importer.run('./', function (output) {
        if (output.length > 3) {
          done();
        } else {
          done(new Error('should have found folders in the app root'));
        }
      });
    })
  });
});
