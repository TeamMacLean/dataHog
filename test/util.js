var should = require('chai').should();
var util = require('../lib/util');

describe('util', function () {
  describe('.toSafeName', function () {
    it('should convert "this is not safe" to "this_is_not_safe"', function () {
      var safe = util.toSafeName('this is not safe');
      safe.should.equal('this_is_not_safe');
    })
  });
  describe('.generateSafeName', function () {
    it('should return "bob_2" when given "bob"', function (done) {

      var name = 'bob';
      var list = [{safeName: 'lucy'}, {safeName: 'bob'}, {safeName: 'tina'}, {safeName: 'alice'}];

      util.generateSafeName(name, list, function (safeName) {
        safeName.should.equal('bob_2');
        done();
      })

    })
  })
});
