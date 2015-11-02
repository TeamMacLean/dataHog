var request = require('supertest');
var app = require('../app');
var rimraf = require('rimraf');
var path = require('path');
var async = require('async');
var Group = require('../models/group');
var Project = require('../models/project');
var Init = require('../lib/init');
var fs = require('fs-extra');
var config = require('../config');
var thinky = require('../lib/thinky');


describe('Server', function () {


  before(function (done) {
    this.timeout(10000);
    Init.ensureReadyDB(done);
  });

  describe('start', function () {
    it('should get the index page OK', function (done) {
      request(app)
        .get('/')
        .expect('Content-Type', "text/html; charset=utf-8")
        .expect(200, done)
    })
  });

  describe('404', function () {
    it('should get a 404', function (done) {
      request(app)
        .get('/gdagadfgsdfgsdfg')
        .expect(404, done)
    })
  });

  describe('new project', function () {

    var timestamp = Date.now();

    var testGroupName = 'hogTestGroup' + timestamp;
    var testGroupSafeName = undefined;
    var testGroupID = undefined;
    var testProjectName = 'hogTestProject ' + timestamp;

    before(function (done) {
      Init.ensureBaseFolders(function () {
        new Group({name: testGroupName}).save().then(function (result) {
          testGroupSafeName = result.safeName;
          testGroupID = result.id;
          done();
        })
      });
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

              var pathToCheck = config.dataDir;
              var files = fs.readdirSync(pathToCheck);

              async.each(files, function (file, cvv) {
                if (file.indexOf(timestamp) > -1) {
                  var deletePath = path.join(config.dataDir, file);
                  rimraf(deletePath, function (err) {
                    console.log('deleted', deletePath);
                    cvv(err);
                  })
                } else {
                  cvv();
                }
              }, function (err) {
                done(err);
              });
            })
          });
        });
      });
    });

    it('should show test group', function (done) {
      request(app)
        .get('/' + testGroupSafeName)
        .expect('Content-Type', "text/html; charset=utf-8")
        .expect(200, done)
    });

    it('should create a new project', function (done) {
      request(app)
        .post('/' + testGroupSafeName + '/new')
        .field('group', testGroupID)
        .field('responsiblePerson', 'example@example.org')
        .field('name', testProjectName)
        .field('shortDescription', 'this is a short description')
        .field('longDescription', 'this is a long description')
        .expect(302, done)
    });

  });

});
