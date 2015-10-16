var should = require('chai').should();
var request = require('supertest');
var app = require('../app');

describe('Server', function () {
  describe('start', function () {
    it('should get the index page OK', function (done) {
      request(app)
        .get('/')
        .expect('Content-Type', "text/html; charset=utf-8")
        .expect(200, done);
    })
  });
});
