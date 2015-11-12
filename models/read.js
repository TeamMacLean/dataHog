"use strict";

var thinky = require('../lib/thinky.js');
var type = thinky.type;
//var r = thinky.r;

var util = require('../lib/util');

var Read = thinky.createModel('Read', {
  processed: type.boolean().required(),
  id: type.string(),
  runID: type.string().required(),
  name: type.string().required(),
  MD5: type.string().required(),
  fastQCLocation: type.string().required(),
  moreInfo: type.string().required(),
  safeName: type.string(),
  path: type.string(),
  siblingID: type.string()
});

Read.pre('save', function (next) {
  var read = this;
  var unsafeName = read.name;
  if (!read.safeName) {
    Read.run().then(function (result) {
      util.generateSafeName(unsafeName, result, function (name) {
        read.safeName = name;
        util.generateUniqueName(read.name, result, function (newName) {
          read.name = newName;
          next();
        });
      });
    });
  }
});

Read.post('save', function (next) {
  //TODO THIS IS HORRIBLE CODE!!! FIXME
  var read = this;
  if (read.siblingID) {
    Read.get(read.siblingID).run().then(function (rResult) {
      console.log('got 1');
      if (!rResult.siblingID) {
        console.log('no siblingID yet');
        Read.get(read.siblingID)
          .update({siblingID: read.id})
          .run().then(function (updated) {
          console.log('UPDATED!', updated);
          next();
        }).error(function (err) {
          console.error('ERROR!', err);
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

//var ReadModel = require('./read');
//Read.belongsTo(Read, 'sibling', 'siblingID', 'id');

Read.belongsTo(Read, "sibling", "siblingID", "id");