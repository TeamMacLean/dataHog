var util = require('../lib/util');

describe('util', function () {
  describe('.toSafeName', function () {
    it('should convert "this is not safe" to "this_is_not_safe"', function (done) {
      var safe = util.toSafeName('this is not safe');

      if (safe === 'this_is_not_safe') {
        done();
      } else {
        done(new Error(safe + ' != this_is_not_safe'))
      }
    })
  });
  describe('.generateSafeName', function () {
    it('should return "bob_2" when given "bob"', function (done) {

      var name = 'bob';
      var list = [{safeName: 'lucy'}, {safeName: 'bob'}, {safeName: 'tina'}, {safeName: 'alice'}];

      util.generateSafeName(name, list, function (safeName) {
        if (safeName === 'bob_2') {
          done();
        } else {
          done(new Error(safeName + ' != bob_2'));
        }

      })

    })
  })
});
