"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
var config = require('../config.json');
var util = require('../lib/util');

var fs = require('fs');
var path = require('path');

var Read = thinky.createModel('Read', {
  processed: type.boolean().required(),
  id: type.string(),
  runID: type.string().required(),
  name: type.string().required(),
  MD5: type.string().required(),
  fastQCLocation: type.string(),
  safeName: type.string().required(),
  fileName: type.string().required(),
  path: type.string().required(),
  siblingID: type.string(),
  legacyPath: type.string()
});

Read.define("hpcPath", function () {
  if (config.hpcRoot) {
    return config.hpcRoot + this.path;
  } else {
    return this.path;
  }
});

Read.define("areReports", function () {
  try {
    var files = fs.readdirSync(path.join(config.dataDir, this.fastQCLocation));
    return (files && files.length > 0);
  } catch (e) {
    return null;
  }
});

Read.pre('save', function (next) {
  var read = this;
  var unsafeName = read.name;
  if (!read.safeName) {
    Read.filter({runID: read.runID, processed: read.processed}).run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (name) {
        read.safeName = name;
        util.generateUniqueName(read.name, result, function (newName) {
          read.name = newName;
          //TODO set path
          Run.get(read.runID).run().then(function (run) {
            var myFolder = read.processed ? 'processed' : 'raw';
            read.path = run.path + '/' + myFolder + '/' + read.fileName;
            read.fastQCLocation = run.path + '/' + myFolder + '/' + '.fastqc';
            //read.fastQCLocation = run.path + '/' + myFolder + '/.fastqc'; //TODO check if exists
            next();
          }).error(function (err) {
            next(err);
          });
        });
      });
    }).error(function (err) {
      next(err);
    });
  }
});

Read.post('save', function (next) {
  //TODO THIS IS HORRIBLE CODE!!! FIXME
  var read = this;
  if (read.siblingID) {
    Read.get(read.siblingID).run().then(function (rResult) {
      if (!rResult.siblingID) {
        Read.get(read.siblingID)
          .update({siblingID: read.id})
          .run().then(function (updated) {
          next();
        }).error(function (err) {
          next();
        });
      } else {
        next();
      }
    }).error(function (err) {
      console.error(err);
      next();
    });

  } else {
    next();
  }
});

module.exports = Read;

var Run = require('./run.js');
Read.belongsTo(Run, 'run', 'runID', 'id');
Read.belongsTo(Read, "sibling", "siblingID", "id");