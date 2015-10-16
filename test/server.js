var should = require('chai').should();
var request = require('supertest');
var app = require('../app');

var async = require('async');

var Group = require('../models/group');
var Project = require('../models/project');

describe('Server', function () {
  describe('start', function () {
    it('should get the index page OK', function (done) {
      request(app)
        .get('/')
        .expect('Content-Type', "text/html; charset=utf-8")
        .expect(200, done);
    })
  });

  describe('404', function () {
    it('should get 404', function (done) {
      request(app)
        .get('/gdagadfgsdfgsdfg')
        .expect('Content-Type', "text/html; charset=utf-8")
        .expect(404, done);
    })
  });

  describe('new project', function () {

    var testGroupName = 'Test Group';
    var testGroupSafeName = undefined;
    var testGroupID = undefined;


    var testProjectName = 'Test Project';

    before(function (done) {
      new Group({name: testGroupName}).save().then(function (result) {
        testGroupSafeName = result.safeName;
        testGroupID = result.id;
        done();
      })
    });

    it('should show test group', function (done) {

      request(app)
        .get('/' + testGroupSafeName)
        .expect('Content-Type', "text/html; charset=utf-8")
        .expect(200, done);
    });

    it('should create a new project', function (done) {
      request(app)
        .post('/' + testGroupSafeName + '/new')
        .field('group', testGroupID)
        .field('responsiblePerson', 'example@example.org')
        .field('name', testProjectName)
        .field('shortDescription', 'this is a short description')
        .field('longDescription', 'this is a long description')
        .expect(302, done);
      //.end(function (err, res) {
      //  console.log(err);
      //  console.log(res.body);
      //  done();
      //});

    });


    after(function (done) {
      Group.filter({name: testGroupName}).run().then(function (groups) {
        async.each(groups, function (group, cb) {
          group.delete().then(cb)
        }, function () {
          Project.filter({name: testProjectName}).run().then(function (projects) {
            async.each(projects, function (project, cb2) {
              project.delete().then(cb2)
            }, function () {
              done();
            })
          });
        });
      });
    })
  });

});
